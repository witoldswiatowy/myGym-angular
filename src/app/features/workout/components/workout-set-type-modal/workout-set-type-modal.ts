import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { SetType } from '../../../../models/workout-set';

// Etykiety typów serii — przeniesione 1:1 ze źródła RN (`SET_TYPE_LABEL` w
// `workout-set-type-modal.tsx`). Angielskie/PL etykiety wyświetlane użytkownikowi.
const SET_TYPE_LABEL: Record<SetType, string> = {
  warmup: 'WarmUp',
  working: 'Normal',
  drop: 'Drop',
  failure: 'Upadek',
};

// Kolejność opcji — 1:1 z RN (`SET_TYPE_OPTIONS`).
const SET_TYPE_OPTIONS: readonly SetType[] = ['warmup', 'working', 'drop', 'failure'];

/**
 * Dane wejściowe dialogu (`MAT_DIALOG_DATA`). `selected` to aktualnie wybrany typ
 * serii — służy WYŁĄCZNIE do podświetlenia aktywnej opcji. Pole opcjonalne: gdy brak,
 * żadna opcja nie jest podświetlona.
 *
 * UWAGA (rozbieżność wobec źródła): RN-owy modal NIE podświetlał aktywnej opcji —
 * jest to świadomy dodatek wprowadzony na polecenie (kontrakt DATA→wynik dla kroku 027).
 */
export interface WorkoutSetTypeModalData {
  selected?: SetType;
}

/**
 * Modal wyboru typu serii — odpowiednik `WorkoutSetTypeModal` (RN,
 * `workout-set-type-modal.tsx`). W RN był to `Modal` (Expo) sterowany propsami
 * (`typeSelectTarget` decydował o widoczności, `selectSetType` zwracał wybór,
 * `setTypeSelectTarget(null)` zamykał bez wyboru po kliknięciu w tło).
 *
 * Odwzorowanie (DECISIONS D2 — modale → `MatDialog`):
 *   - `Modal` (RN) → treść dialogu otwierana przez `MatDialog` (z ekranu treningu, krok 027),
 *   - prop `typeSelectTarget` (widoczność) → cykl życia dialogu — znika z kontraktu,
 *   - callback `selectSetType(type)` → `dialogRef.close(type)` (wynik = wybrany `SetType`),
 *   - zamknięcie w tło/ESC (`onRequestClose`) → natywne zamknięcie `MatDialog`
 *     (backdrop/escape) zwracające `undefined` — wołający (krok 027) nic nie zmienia.
 *
 * Lista opcji, etykiety i tekst pozycji (`Label (type)`) przeniesione 1:1 z RN.
 */
@Component({
  selector: 'app-workout-set-type-modal',
  imports: [],
  templateUrl: './workout-set-type-modal.html',
  styleUrl: './workout-set-type-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkoutSetTypeModal {
  // Opcje do wyrenderowania — para {type, label} (1:1 z RN: lista + mapa etykiet).
  protected readonly options = SET_TYPE_OPTIONS.map((type) => ({
    type,
    label: SET_TYPE_LABEL[type],
  }));

  // Aktualnie wybrany typ z danych dialogu — do podświetlenia aktywnej opcji.
  // `optional: true`, bo wołający może nie przekazać danych (wówczas `null`).
  protected readonly activeType =
    inject<WorkoutSetTypeModalData | null>(MAT_DIALOG_DATA, { optional: true })?.selected ?? null;

  // Referencja dialogu — zastępuje callback `selectSetType` z RN. Wynik to wybrany `SetType`.
  private readonly dialogRef = inject<MatDialogRef<WorkoutSetTypeModal, SetType>>(MatDialogRef);

  // Wybór opcji (RN: `selectSetType(type)`) → zamknięcie dialogu z wybranym typem.
  protected select(type: SetType): void {
    this.dialogRef.close(type);
  }
}
