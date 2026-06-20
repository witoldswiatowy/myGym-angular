import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

// Klucz kolumny, po której sortowana jest tabela ćwiczeń — odpowiednik lokalnego
// typu `SortKey` ze źródła RN (`exercise-table-header.tsx`).
export type SortKey = 'name' | 'primaryMuscle' | 'equipment' | 'tags';

// Kierunek sortowania — odpowiednik lokalnego typu `SortDir` ze źródła RN.
export type SortDir = 'asc' | 'desc';

// Nagłówek tabeli ćwiczeń z sortowaniem — odpowiednik `ExerciseTableHeader` (RN).
// W RN był to komponent funkcyjny z propsami `sortKey`, `sortDir`, `onSort`:
//   - `sortKey` / `sortDir` → wejścia sygnałowe `input.required()` (MAPPING §2.1 —
//     signals-first; props były obowiązkowe, więc `required`),
//   - callback `onSort(key)` → wyjście `output<SortKey>()` (idiomatyczny odpowiednik
//     przekazywania zdarzenia w górę przez props-funkcję w Reakcie).
// Kolumny „Exercise", „Primary muscle", „Equipment", „Tags" są klikalne (sortowanie);
// „Secondary muscles" to statyczny nagłówek bez sortowania (1:1 ze źródłem).
@Component({
  selector: 'app-exercise-table-header',
  templateUrl: './exercise-table-header.html',
  styleUrl: './exercise-table-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExerciseTableHeader {
  // Aktualny klucz sortowania (odpowiednik propsa `sortKey`).
  readonly sortKey = input.required<SortKey>();

  // Aktualny kierunek sortowania (odpowiednik propsa `sortDir`).
  readonly sortDir = input.required<SortDir>();

  // Zdarzenie zmiany sortowania (odpowiednik callbacku `onSort`). Emituje klucz
  // klikniętej kolumny — to rodzic decyduje, jak zmienić stan (jak w RN).
  readonly sort = output<SortKey>();

  // Strzałka kierunku: ▲ dla rosnąco, ▼ dla malejąco (odpowiednik `arrow` w RN).
  // Wyświetlana tylko przy aktywnej kolumnie — warunek w szablonie.
  protected readonly arrow = computed(() => (this.sortDir() === 'asc' ? ' ▲' : ' ▼'));

  // Emituje zdarzenie sortowania dla danej kolumny (odpowiednik `onPress` → `onSort`).
  protected emitSort(key: SortKey): void {
    this.sort.emit(key);
  }
}
