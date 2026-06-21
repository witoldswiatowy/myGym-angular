import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { EQUIPMENT } from '../../data/equipment.data';
import { MUSCLE_GROUPS } from '../../data/muscle-groups.data';
import { MUSCLES } from '../../data/muscles.data';
import { TAGS } from '../../data/tags.data';
import { Exercise } from '../../models/exercise';
import { ExerciseRepository } from '../../repositories/exercise-repository';
import { filterExercises } from '../../search/filter-exercises';
import { debouncedSignal } from '../../shared/utils/debounce';
import { ScreenComponent } from '../../core/layout/screen/screen';

import { AddExerciseModal } from './components/add-exercise-modal/add-exercise-modal';
import { ExerciseFormValues } from './components/exercise-form/exercise-form';
import { ExerciseTableHeader, SortDir, SortKey } from './components/exercise-table-header/exercise-table-header';
import { ExerciseTableRow } from './components/exercise-table-row/exercise-table-row';

// Ekran biblioteki ćwiczeń — odpowiednik `ExercisesScreen` (RN, `app/exercises/index.tsx`).
// W RN był to komponent funkcyjny ze stanem (`useState`), efektem ładowania (`useEffect`),
// wartościami pochodnymi (`useMemo`) i debounce (`useDebouncedValue`). Odwzorowanie
// (MAPPING §2.1 — signals-first):
//   - `useState` → `signal` (lista, query, klucz/kierunek sortowania),
//   - `useEffect([], getAll)` → jednorazowe ładowanie w konstruktorze (kontekst wstrzykiwania),
//   - `useMemo` → `computed` dla list pochodnych (przefiltrowana/posortowana),
//   - `useMemo([] , map)` (słowniki stałe) → zwykłe `readonly` pola liczone RAZ (nie zależą
//     od żadnego sygnału — odpowiednik useMemo z pustą listą zależności),
//   - `useDebouncedValue(query, 200)` → `debouncedSignal(query, 200)` (krok 011, RxJS).
// Dane WYŁĄCZNIE przez `ExerciseRepository` (D3). Modal dodawania przez `MatDialog` (D2).
// Lista renderowana zwykłym `@for` (D12 — rezygnacja z CDK Virtual Scroll: wiersze mają
// zmienną wysokość, a biblioteka to ~57 ćwiczeń; wirtualizacja przycinała treść).
// Nazwa klasy `Exercises` bez sufiksu (D9/A) — brak kolizji z typem DOM (D11).
@Component({
  selector: 'app-exercises',
  imports: [
    ScreenComponent,
    ExerciseTableHeader,
    ExerciseTableRow,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './exercises.html',
  styleUrl: './exercises.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Exercises {
  // DI: repozytorium ćwiczeń (D3) oraz serwis dialogów Material (D2).
  private readonly exerciseRepository = inject(ExerciseRepository);
  private readonly dialog = inject(MatDialog);

  // Stan ekranu (odpowiednik `useState`) — sygnały.
  protected readonly exercises = signal<Exercise[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly sortKey = signal<SortKey>('name');
  protected readonly sortDir = signal<SortDir>('asc');

  // Zapytanie po debounce 200 ms (odpowiednik `useDebouncedValue(searchQuery, 200)`).
  private readonly debouncedSearchQuery = debouncedSignal(this.searchQuery, 200);

  // Słowniki ID→nazwa/kolor/indeks — stałe (zależą tylko od danych seed, nie od stanu),
  // więc liczone RAZ jak `useMemo` z pustą listą zależności (nie jako sygnały).
  // Mapy `*ById` przekazywane do wierszy mają nazwy 1:1 z wejściami `app-exercise-table-row`.
  protected readonly muscleNameById: Record<string, string> = Object.fromEntries(
    MUSCLES.map((m): [string, string] => [m.id, m.name]),
  );
  protected readonly muscleColorById: Record<string, string> = Object.fromEntries(
    MUSCLES.map((m): [string, string] => [m.id, m.colorHex]),
  );
  protected readonly equipmentNameById: Record<string, string> = Object.fromEntries(
    EQUIPMENT.map((e): [string, string] => [e.id, e.name]),
  );
  protected readonly tagNameById: Record<string, string> = Object.fromEntries(
    TAGS.map((t): [string, string] => [t.id, t.name]),
  );

  // Słowniki używane tylko wewnętrznie (filtr/sortowanie), nieprzekazywane do wierszy.
  private readonly muscleNameEnById: Record<string, string> = Object.fromEntries(
    MUSCLES.map((m): [string, string] => [m.id, m.nameEn]),
  );
  private readonly muscleGroupIndexById: Record<string, number> = Object.fromEntries(
    MUSCLE_GROUPS.map((g, i): [string, number] => [g.id, i]),
  );
  private readonly muscleGroupIdByMuscleId: Record<string, string> = Object.fromEntries(
    MUSCLES.map((m): [string, string] => [m.id, m.muscleGroupId]),
  );

  // Lista przefiltrowana (odpowiednik `filteredExercises` useMemo): czysta funkcja
  // `filterExercises` (krok 007) na liście + zdebouncowanym zapytaniu.
  private readonly filteredExercises = computed(() =>
    filterExercises(this.exercises(), {
      query: this.debouncedSearchQuery(),
      muscleNameById: this.muscleNameById,
      muscleNameEnById: this.muscleNameEnById,
    }),
  );

  // Lista posortowana (odpowiednik `sortedExercises` useMemo) — algorytm 1:1 ze źródłem RN:
  // sortowanie po `primaryMuscle` najpierw po kolejności grup mięśniowych, potem po nazwie
  // mięśnia (locale 'pl'); pozostałe klucze po nazwie/sprzęcie/tagu (pierwszy element).
  // Publiczne — poza szablonem czyta je też test (weryfikacja stanu sortowania).
  readonly sortedExercises = computed<Exercise[]>(() => {
    const key = this.sortKey();
    const dir = this.sortDir();

    return [...this.filteredExercises()].sort((a, b) => {
      if (key === 'primaryMuscle') {
        const groupIdA = this.muscleGroupIdByMuscleId[a.primaryMuscleId] ?? '';
        const groupIdB = this.muscleGroupIdByMuscleId[b.primaryMuscleId] ?? '';

        const groupIndexA = this.muscleGroupIndexById[groupIdA] ?? 999;
        const groupIndexB = this.muscleGroupIndexById[groupIdB] ?? 999;

        if (groupIndexA !== groupIndexB) {
          const groupCmp = groupIndexA - groupIndexB;
          return dir === 'asc' ? groupCmp : -groupCmp;
        }

        const muscleNameA = this.muscleNameById[a.primaryMuscleId] ?? '';
        const muscleNameB = this.muscleNameById[b.primaryMuscleId] ?? '';
        const muscleCmp = muscleNameA.localeCompare(muscleNameB, 'pl');
        return dir === 'asc' ? muscleCmp : -muscleCmp;
      }

      let valA: string;
      let valB: string;

      if (key === 'equipment') {
        valA = this.equipmentNameById[a.equipmentIds[0]] ?? '';
        valB = this.equipmentNameById[b.equipmentIds[0]] ?? '';
      } else if (key === 'tags') {
        valA = this.tagNameById[a.tagIds[0]] ?? '';
        valB = this.tagNameById[b.tagIds[0]] ?? '';
      } else {
        valA = a.name;
        valB = b.name;
      }

      const cmp = valA.localeCompare(valB, 'pl');
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  constructor() {
    // Pierwsze załadowanie listy — odpowiednik `useEffect([], getAll().then(setExercises))`.
    this.loadExercises();
  }

  // Odczyt całej listy z repozytorium i zapis do sygnału (get-or-seed po stronie repo).
  private loadExercises(): void {
    this.exerciseRepository.getAll().then((list) => this.exercises.set(list));
  }

  // Aktualizacja zapytania wyszukiwania z pola tekstowego (odpowiednik `onChangeText`).
  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  // Zmiana sortowania (odpowiednik `handleSort` RN): ten sam klucz → odwróć kierunek,
  // inny klucz → ustaw klucz i kierunek rosnący.
  protected handleSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  // Otwiera modal dodawania (D2: `MatDialog`). Po zamknięciu z wartościami formularza
  // tworzy ćwiczenie (generacja ID + zapis przez repozytorium) — odpowiednik
  // pary `setIsAddModalVisible(true)` + `onSave` (RN).
  protected openAddModal(): void {
    const dialogRef = this.dialog.open<AddExerciseModal, unknown, ExerciseFormValues>(
      AddExerciseModal,
    );
    dialogRef.afterClosed().subscribe((values) => {
      if (values) {
        this.saveExercise(values);
      }
    });
  }

  // Tworzy i zapisuje nowe ćwiczenie — algorytm generacji ID 1:1 ze źródłem RN:
  // baza = `nameEn` (trim, lowercase, spacje→`_`), sufiks = `Date.now().toString(36)`.
  // Mięsień główny jest usuwany z mięśni dodatkowych (jak w RN). Po zapisie dopisujemy
  // ćwiczenie do listy lokalnej (1:1 z `setExercises(prev => [...prev, newExercise])`).
  private saveExercise(values: ExerciseFormValues): void {
    const baseId = values.nameEn.trim().toLowerCase().replace(/\s+/g, '_');
    const uniqueSuffix = Date.now().toString(36);

    const newExercise: Exercise = {
      id: baseId ? `${baseId}_${uniqueSuffix}` : `exercise_${uniqueSuffix}`,
      name: values.name.trim(),
      nameEn: values.nameEn.trim(),
      primaryMuscleId: values.primaryMuscleId,
      secondaryMuscleIds: values.secondaryMuscleIds.filter((id) => id !== values.primaryMuscleId),
      equipmentIds: values.equipmentIds,
      tagIds: values.tagIds,
    };

    this.exerciseRepository.add(newExercise).then(() => {
      this.exercises.update((prev) => [...prev, newExercise]);
    });
  }

  // Przywraca listę do danych seed (odpowiednik „Reset do seed" RN): reset w repo,
  // a następnie ponowne pełne załadowanie z repozytorium.
  protected resetToSeed(): void {
    this.exerciseRepository.resetToSeed().then(() => this.loadExercises());
  }
}
