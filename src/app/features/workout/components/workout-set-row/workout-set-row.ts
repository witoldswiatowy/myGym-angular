import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';

import { SetType } from '../../../../models/workout-set';

// Jednostka ciężaru — 1:1 z modelem `WorkoutSet.weightUnit` ('kg' | 'lb').
export type WeightUnit = 'kg' | 'lb';

/**
 * Dane pojedynczego wiersza serii prezentowane przez komponent — odpowiednik
 * `WorkoutSetRowData` ze źródła RN. Wartości liczbowe (`weight`, `reps`) są stringami,
 * bo pochodzą z pól tekstowych (zgodnie z formularzowym `SetForm` ekranu treningu).
 * To świadomie WĘŻSZY typ niż `SetForm` — wiersz dostaje tylko to, co renderuje
 * (bez `workoutExerciseId`/`index`, którymi zarządza rodzic).
 */
export interface WorkoutSetRowData {
  id: string;
  type: SetType;
  weight: string;
  weightUnit: WeightUnit;
  reps: string;
  done: boolean;
}

/**
 * Wiersz pojedynczej serii w treningu — odpowiednik `WorkoutSetRow` (RN,
 * `workout-set-row.tsx`). W RN był to komponent funkcyjny z propsami `set`/`typeLabel`
 * i siedmioma callbackami. Odwzorowanie (MAPPING §2.1 — signals-first):
 *   - propsy `set`, `typeLabel` → wejścia sygnałowe `input.required()`,
 *   - callbacki otwarcia selektorów (`onOpenTypeSelect`, `onOpenWeightUnitSelect`)
 *     → wyjścia `openTypeSelect` / `openWeightUnitSelect` (`output<void>()`),
 *   - callbacki zmian pól (`onChangeWeight`, `onChangeReps`, `onChangeDone`)
 *     → wyjścia `changeWeight` / `changeReps` / `changeDone`.
 *
 * Komponent jest „głupi" (presentational): NIE otwiera modali ani nie zapisuje stanu —
 * tylko emituje żądania. Modale typu serii (krok 025) i jednostki (krok 026) oraz
 * składanie całości (ekran treningu, krok 027) są poza zakresem tego kroku.
 */
@Component({
  selector: 'app-workout-set-row',
  imports: [MatCheckboxModule],
  templateUrl: './workout-set-row.html',
  styleUrl: './workout-set-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkoutSetRow {
  // Dane serii do wyświetlenia (odpowiednik propsa `set`).
  readonly set = input.required<WorkoutSetRowData>();

  // Etykieta typu serii liczona przez rodzica (odpowiednik propsa `typeLabel`).
  readonly typeLabel = input.required<string>();

  // Żądania otwarcia selektorów (1:1 z `onOpenTypeSelect` / `onOpenWeightUnitSelect`).
  readonly openTypeSelect = output<void>();
  readonly openWeightUnitSelect = output<void>();

  // Zmiany wartości pól (1:1 z `onChangeWeight` / `onChangeReps` / `onChangeDone`).
  readonly changeWeight = output<string>();
  readonly changeReps = output<string>();
  readonly changeDone = output<boolean>();

  /**
   * Zmiana pola ciężaru — sanityzacja 1:1 ze źródłem RN: zostawiamy cyfry, kropkę
   * i przecinek (`/[^0-9.,]/g`), resztę usuwamy, po czym emitujemy oczyszczony string.
   */
  protected onWeightInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.changeWeight.emit(raw.replace(/[^0-9.,]/g, ''));
  }

  /**
   * Zmiana pola powtórzeń — sanityzacja 1:1 ze źródłem RN: tylko cyfry (`/[^0-9]/g`).
   */
  protected onRepsInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.changeReps.emit(raw.replace(/[^0-9]/g, ''));
  }

  /** Przełączenie checkboxa „done" — emituje nowy stan (odpowiednik `onValueChange`). */
  protected onDoneChange(change: MatCheckboxChange): void {
    this.changeDone.emit(change.checked);
  }
}
