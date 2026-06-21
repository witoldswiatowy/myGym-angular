import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { Exercise } from '../../models/exercise';
import { ExerciseRepository } from '../../repositories/exercise-repository';
import { ExerciseFormValues } from './components/exercise-form/exercise-form';
import { ExerciseTableHeader } from './components/exercise-table-header/exercise-table-header';
import { ExerciseTableRow } from './components/exercise-table-row/exercise-table-row';
import { Exercises } from './exercises';

describe('Exercises', () => {
  // Trzy ćwiczenia o różnych nazwach — pozwalają testować filtrowanie i sortowanie po nazwie.
  const sampleExercises: Exercise[] = [
    {
      id: 'a',
      name: 'Bench press',
      nameEn: 'Bench press',
      primaryMuscleId: 'm1',
      secondaryMuscleIds: [],
      equipmentIds: [],
      tagIds: [],
    },
    {
      id: 'b',
      name: 'Squat',
      nameEn: 'Squat',
      primaryMuscleId: 'm2',
      secondaryMuscleIds: [],
      equipmentIds: [],
      tagIds: [],
    },
    {
      id: 'c',
      name: 'Deadlift',
      nameEn: 'Deadlift',
      primaryMuscleId: 'm3',
      secondaryMuscleIds: [],
      equipmentIds: [],
      tagIds: [],
    },
  ];

  // Atrapa repozytorium (D3) — żaden test nie dotyka realnego storage/IndexedDB.
  const repository = {
    getAll: vi.fn(),
    add: vi.fn(),
    resetToSeed: vi.fn(),
  };

  // Atrapa serwisu dialogów (D2) — `open()` zwraca obiekt z `afterClosed()`.
  const dialog = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    repository.getAll.mockResolvedValue([...sampleExercises]);
    repository.add.mockResolvedValue(undefined);
    repository.resetToSeed.mockResolvedValue(undefined);
    dialog.open.mockReturnValue({ afterClosed: () => of(undefined) });

    await TestBed.configureTestingModule({
      imports: [Exercises],
      providers: [
        provideNoopAnimations(),
        { provide: ExerciseRepository, useValue: repository },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();
  });

  // Tworzy komponent i czeka, aż wczyta listę z repozytorium (Promise z getAll).
  async function createComponent(): Promise<ComponentFixture<Exercises>> {
    const fixture = TestBed.createComponent(Exercises);
    fixture.detectChanges();
    await settle(fixture);
    return fixture;
  }

  // Domyka mikrozadania (Promise) i odświeża widok — zoneless, brak strefy Angulara.
  async function settle(fixture: ComponentFixture<Exercises>): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  // Nazwy ćwiczeń w kolejności renderowanych wierszy (przez instancje komponentu wiersza).
  function renderedNames(fixture: ComponentFixture<Exercises>): string[] {
    return fixture.debugElement
      .queryAll(By.directive(ExerciseTableRow))
      .map((row) => (row.componentInstance as ExerciseTableRow).exercise().name);
  }

  it('ładuje ćwiczenia z repozytorium i renderuje wiersze', async () => {
    const fixture = await createComponent();

    expect(repository.getAll).toHaveBeenCalled();
    const rows = fixture.debugElement.queryAll(By.directive(ExerciseTableRow));
    expect(rows.length).toBe(sampleExercises.length);
  });

  it('wyszukiwanie filtruje listę po debouncie (filterExercises)', async () => {
    const fixture = await createComponent();

    const input = fixture.nativeElement.querySelector('input[matInput]') as HTMLInputElement;
    input.value = 'squat';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    // Debounce 200 ms (krok 011) — czekamy realnie ponad próg, potem odświeżamy.
    await new Promise((resolve) => setTimeout(resolve, 250));
    fixture.detectChanges();

    const names = renderedNames(fixture);
    expect(names).toEqual(['Squat']);
  });

  it('klik nagłówka „Exercise" przełącza kierunek sortowania', async () => {
    const fixture = await createComponent();

    // Domyślnie sortowanie po nazwie rosnąco.
    expect(renderedNames(fixture)).toEqual(['Bench press', 'Deadlift', 'Squat']);

    // Klik w kolumnę „Exercise" (ten sam klucz) → odwrócenie kierunku na malejący.
    const header = fixture.debugElement.query(By.directive(ExerciseTableHeader));
    const nameButton = (
      header.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    )[0];
    nameButton.click();
    fixture.detectChanges();

    expect(renderedNames(fixture)).toEqual(['Squat', 'Deadlift', 'Bench press']);
  });

  it('„Add exercise" otwiera dialog, a po wyniku zapisuje ćwiczenie i odświeża listę', async () => {
    const values: ExerciseFormValues = {
      name: '  Overhead press  ',
      nameEn: '  Overhead Press  ',
      primaryMuscleId: 'm1',
      secondaryMuscleIds: ['m1', 'm2'],
      equipmentIds: ['e1'],
      tagIds: ['t1'],
    };
    dialog.open.mockReturnValue({ afterClosed: () => of(values) });

    const fixture = await createComponent();

    const addButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Add exercise'));
    addButton?.click();
    await settle(fixture);

    expect(dialog.open).toHaveBeenCalled();
    expect(repository.add).toHaveBeenCalledTimes(1);

    const saved = repository.add.mock.calls[0][0] as Exercise;
    expect(saved.name).toBe('Overhead press');
    expect(saved.nameEn).toBe('Overhead Press');
    expect(saved.id.startsWith('overhead_press_')).toBe(true);
    // Mięsień główny usunięty z dodatkowych (1:1 ze źródłem RN).
    expect(saved.secondaryMuscleIds).toEqual(['m2']);

    // Nowe ćwiczenie dopisane do listy → o jeden element więcej (zwykłe @for renderuje
    // wszystkie wiersze, ale weryfikacja stanu komponentu jest najpewniejsza).
    const sorted = fixture.componentInstance.sortedExercises();
    expect(sorted.length).toBe(sampleExercises.length + 1);
    expect(sorted.some((exercise) => exercise.id.startsWith('overhead_press_'))).toBe(true);
  });

  it('„Reset do seed" resetuje repozytorium i przeładowuje listę', async () => {
    const fixture = await createComponent();

    const resetButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Reset do seed'));
    resetButton?.click();
    await settle(fixture);

    expect(repository.resetToSeed).toHaveBeenCalledTimes(1);
    // Po resecie ponownie czytamy całą listę (raz przy starcie + raz po resecie).
    expect(repository.getAll).toHaveBeenCalledTimes(2);
  });
});
