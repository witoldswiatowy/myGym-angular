import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { EQUIPMENT } from '../../../../data/equipment.data';
import { MUSCLES } from '../../../../data/muscles.data';
import { TAGS } from '../../../../data/tags.data';
import { ExerciseForm, ExerciseFormValues } from '../exercise-form/exercise-form';

// Modal dodawania ćwiczenia — odpowiednik `AddExerciseModal` (RN, `add-exercise-modal.tsx`).
// W RN był to komponent opakowujący `Modal` (Expo) wokół `ExerciseForm`; sterowany propsami
// `visible`/`onClose`/`onSave` (rodzic — ekran biblioteki — decydował o widoczności i zapisie).
// Odwzorowanie (DECISIONS D2 — modale → `MatDialog`):
//   - `Modal` (RN) → treść dialogu otwierana przez `MatDialog` (otwarcie z ekranu 023),
//   - prop `visible` → cykl życia dialogu (otwarty póki niezamknięty) — znika z kontraktu,
//   - callback `onClose` → `dialogRef.close()` (bez wyniku),
//   - callback `onSave(values)` → `dialogRef.close(values)` (rodzic robi faktyczny zapis,
//     tak jak w RN, gdzie `onSave` pochodził od ekranu biblioteki).
// Słowniki MUSCLES/EQUIPMENT/TAGS importujemy i przekazujemy do formularza 1:1 z RN
// (tam modal sam dostarczał je `ExerciseForm`).
@Component({
  selector: 'app-add-exercise-modal',
  imports: [MatDialogModule, ExerciseForm],
  templateUrl: './add-exercise-modal.html',
  styleUrl: './add-exercise-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddExerciseModal {
  // Słowniki opcji podawane formularzowi (1:1 z RN — modal importuje je z `data/`).
  protected readonly muscles = MUSCLES;
  protected readonly equipment = EQUIPMENT;
  protected readonly tags = TAGS;

  // Referencja dialogu — zastępuje callbacki `onSave`/`onClose` z RN. Typ wyniku to
  // `ExerciseFormValues`, dzięki czemu wołający (ekran 023) odbierze go z `afterClosed()`.
  private readonly dialogRef =
    inject<MatDialogRef<AddExerciseModal, ExerciseFormValues>>(MatDialogRef);

  // Zapis (RN: `onSave`): zamknięcie dialogu z wartościami formularza. Faktyczne utworzenie
  // ćwiczenia (generacja ID, zapis przez repozytorium) realizuje wołający — krok 023.
  protected onSave(values: ExerciseFormValues): void {
    this.dialogRef.close(values);
  }

  // Anulowanie/zamknięcie (RN: `onClose`): zamknięcie dialogu bez wyniku.
  protected onCancel(): void {
    this.dialogRef.close();
  }
}
