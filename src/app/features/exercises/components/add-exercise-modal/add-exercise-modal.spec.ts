import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ExerciseForm, ExerciseFormValues } from '../exercise-form/exercise-form';
import { AddExerciseModal } from './add-exercise-modal';

describe('AddExerciseModal', () => {
  // Atrapa referencji dialogu — przechwytuje wynik zamknięcia (zamiast callbacków RN).
  const dialogRef = { close: vi.fn() };

  beforeEach(async () => {
    dialogRef.close.mockClear();
    await TestBed.configureTestingModule({
      imports: [AddExerciseModal],
      providers: [provideNoopAnimations(), { provide: MatDialogRef, useValue: dialogRef }],
    }).compileComponents();
  });

  function createComponent(): ComponentFixture<AddExerciseModal> {
    const fixture = TestBed.createComponent(AddExerciseModal);
    fixture.detectChanges();
    return fixture;
  }

  // Pobiera osadzony komponent formularza (do wyzwalania jego wyjść).
  function getForm(fixture: ComponentFixture<AddExerciseModal>): ExerciseForm {
    return fixture.debugElement.query(By.directive(ExerciseForm)).componentInstance as ExerciseForm;
  }

  it('tworzy się i renderuje formularz', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(ExerciseForm))).toBeTruthy();
  });

  it('zapis z formularza zamyka dialog z wartościami', () => {
    const fixture = createComponent();
    const values: ExerciseFormValues = {
      name: 'wyciskanie hantli',
      nameEn: 'dumbbell press',
      primaryMuscleId: 'chest',
      secondaryMuscleIds: ['triceps'],
      equipmentIds: ['dumbbell'],
      tagIds: ['push'],
    };

    getForm(fixture).save.emit(values);

    expect(dialogRef.close).toHaveBeenCalledWith(values);
  });

  it('anulowanie z formularza zamyka dialog bez wyniku', () => {
    const fixture = createComponent();

    getForm(fixture).cancel.emit();

    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
