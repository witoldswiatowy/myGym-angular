import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Exercise } from '../../../../models/exercise';

// Badge mięśnia: rozwiązana nazwa + kolor tła (odpowiednik resolveName + resolveColor w RN).
interface MuscleBadge {
  id: string;
  name: string;
  color: string;
}

// Wiersz tabeli ćwiczeń — odpowiednik `ExerciseTableRow` (RN, `exercise-table-row.tsx`).
// W RN był to komponent funkcyjny z propsami: `exercise` oraz cztery słowniki ID→nazwa/kolor
// (`muscleNameById`, `muscleColorById`, `equipmentNameById`, `tagNameById`), które rodzic
// wyliczał wcześniej. Odwzorowanie (MAPPING §2.1 — signals-first):
//   - wszystkie propsy → wejścia sygnałowe `input.required()` (były obowiązkowe),
//   - pochodne wartości prezentacyjne (rozwiązane nazwy/kolory) → `computed()` (≈ useMemo),
//   - czyste helpery `resolveName`/`resolveMany`/`resolveColor` przeniesione 1:1.
// Wiersz NIE jest klikalny w źródle (brak `onPress`/callbacku) — nie dodajemy `output()`.
@Component({
  selector: 'app-exercise-table-row',
  templateUrl: './exercise-table-row.html',
  styleUrl: './exercise-table-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExerciseTableRow {
  // Ćwiczenie prezentowane w wierszu (odpowiednik propsa `exercise`).
  readonly exercise = input.required<Exercise>();

  // Słowniki ID→nazwa/kolor przekazywane z rodzica (1:1 z propsami RN — komponent tylko
  // prezentuje, mapy są wyliczane wyżej, w ekranie biblioteki ćwiczeń).
  readonly muscleNameById = input.required<Record<string, string>>();
  readonly muscleColorById = input.required<Record<string, string>>();
  readonly equipmentNameById = input.required<Record<string, string>>();
  readonly tagNameById = input.required<Record<string, string>>();

  // Badge mięśnia głównego (rozwiązana nazwa + kolor) — odpowiednik renderu `colPrimary` (RN).
  protected readonly primaryMuscle = computed<MuscleBadge>(() => ({
    id: this.exercise().primaryMuscleId,
    name: this.resolveName(this.exercise().primaryMuscleId, this.muscleNameById()),
    color: this.resolveColor(this.exercise().primaryMuscleId),
  }));

  // Lista badge'y mięśni dodatkowych; pusta gdy brak (w szablonie pokazujemy wtedy „-").
  protected readonly secondaryMuscles = computed<MuscleBadge[]>(() =>
    this.exercise().secondaryMuscleIds.map((id) => ({
      id,
      name: this.resolveName(id, this.muscleNameById()),
      color: this.resolveColor(id),
    })),
  );

  // Sprzęt jako tekst rozdzielony przecinkami (odpowiednik resolveMany).
  protected readonly equipmentText = computed(() =>
    this.resolveMany(this.exercise().equipmentIds, this.equipmentNameById()),
  );

  // Tagi jako tekst rozdzielony przecinkami (odpowiednik resolveMany).
  protected readonly tagsText = computed(() =>
    this.resolveMany(this.exercise().tagIds, this.tagNameById()),
  );

  // Rozwiązuje ID na nazwę ze słownika; fallback „Unknown (id)" — 1:1 ze źródłem RN.
  private resolveName(id: string, dictionary: Record<string, string>): string {
    return dictionary[id] ?? `Unknown (${id})`;
  }

  // Łączy wiele ID w tekst po przecinku; „-" gdy lista pusta — 1:1 ze źródłem RN.
  private resolveMany(ids: string[], dictionary: Record<string, string>): string {
    if (ids.length === 0) {
      return '-';
    }
    return ids.map((id) => this.resolveName(id, dictionary)).join(', ');
  }

  // Kolor tła badge'a mięśnia; fallback „#F2F4F7" — 1:1 ze źródłem RN.
  private resolveColor(id: string): string {
    return this.muscleColorById()[id] ?? '#F2F4F7';
  }
}
