import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { WeightUnit } from '../../../../models/workout-set';

// Kolejność i zestaw opcji — 1:1 z RN (`SET_WEIGHT_UNIT_OPTIONS` w
// `workout-weight-unit-modal.tsx`). Etykieta = sama jednostka (RN renderował `{unitOption}`,
// bez osobnej mapy etykiet i bez sufiksu „(type)" — inaczej niż modal typu serii).
const SET_WEIGHT_UNIT_OPTIONS: readonly WeightUnit[] = ['kg', 'lb'];

/**
 * Dane wejściowe dialogu (`MAT_DIALOG_DATA`). `selected` to aktualnie wybrana jednostka
 * — służy WYŁĄCZNIE do podświetlenia aktywnej opcji. Pole opcjonalne: gdy brak, żadna
 * opcja nie jest podświetlona.
 *
 * UWAGA (rozbieżność wobec źródła): RN-owy modal NIE podświetlał aktywnej opcji — jest
 * to świadomy dodatek (spójny z modalem typu serii, krok 025; kontrakt DATA→wynik dla 027).
 */
export interface WorkoutWeightUnitModalData {
  selected?: WeightUnit;
}

/**
 * Modal wyboru jednostki ciężaru — odpowiednik `WorkoutWeightUnitModal` (RN,
 * `workout-weight-unit-modal.tsx`). W RN był to `Modal` (Expo) sterowany propsami
 * (`weightUnitSelectTarget` decydował o widoczności, `selectWeightUnit` zwracał wybór,
 * `setWeightUnitSelectTarget(null)` zamykał bez wyboru po kliknięciu w tło).
 *
 * Odwzorowanie (DECISIONS D2 — modale → `MatDialog`):
 *   - `Modal` (RN) → treść dialogu otwierana przez `MatDialog` (z ekranu treningu, krok 027),
 *   - prop `weightUnitSelectTarget` (widoczność) → cykl życia dialogu — znika z kontraktu,
 *   - callback `selectWeightUnit(unit)` → `dialogRef.close(unit)` (wynik = wybrany `WeightUnit`),
 *   - zamknięcie w tło/ESC (`onRequestClose`) → natywne zamknięcie `MatDialog`
 *     (backdrop/escape) zwracające `undefined` — wołający (krok 027) nic nie zmienia.
 *
 * Lista opcji i etykiety (`kg`/`lb`) przeniesione 1:1 z RN.
 */
@Component({
  selector: 'app-workout-weight-unit-modal',
  imports: [],
  templateUrl: './workout-weight-unit-modal.html',
  styleUrl: './workout-weight-unit-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkoutWeightUnitModal {
  // Opcje do wyrenderowania — surowe jednostki (1:1 z RN: lista bez osobnej mapy etykiet).
  protected readonly options = SET_WEIGHT_UNIT_OPTIONS;

  // Aktualnie wybrana jednostka z danych dialogu — do podświetlenia aktywnej opcji.
  // `optional: true`, bo wołający może nie przekazać danych (wówczas `null`).
  protected readonly activeUnit =
    inject<WorkoutWeightUnitModalData | null>(MAT_DIALOG_DATA, { optional: true })?.selected ??
    null;

  // Referencja dialogu — zastępuje callback `selectWeightUnit` z RN. Wynik to wybrany `WeightUnit`.
  private readonly dialogRef =
    inject<MatDialogRef<WorkoutWeightUnitModal, WeightUnit>>(MatDialogRef);

  // Wybór opcji (RN: `selectWeightUnit(unit)`) → zamknięcie dialogu z wybraną jednostką.
  protected select(unit: WeightUnit): void {
    this.dialogRef.close(unit);
  }
}
