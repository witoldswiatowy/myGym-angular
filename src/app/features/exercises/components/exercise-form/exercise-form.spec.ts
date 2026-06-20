import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSelectChange } from '@angular/material/select';
import { Equipment } from '../../../../models/equipment';
import { Muscle } from '../../../../models/muscle';
import { Tag } from '../../../../models/tag';
import { ExerciseForm, ExerciseFormValues, toggleSelection } from './exercise-form';

describe('ExerciseForm', () => {
  // Minimalne słowniki opcji (jak propsy RN przekazywane przez modal).
  const muscles: Muscle[] = [
    { id: 'chest', name: 'klatka', nameEn: 'Chest', colorHex: '#FF0000', muscleGroupId: 'chest' },
    { id: 'back', name: 'plecy', nameEn: 'Back', colorHex: '#00FF00', muscleGroupId: 'back' },
    { id: 'triceps', name: 'triceps', nameEn: 'Triceps', colorHex: '#0000FF', muscleGroupId: 'arms' },
  ];
  const equipment: Equipment[] = [
    { id: 'barbell', name: 'sztanga', nameEn: 'Barbell' },
    { id: 'dumbbell', name: 'hantle', nameEn: 'Dumbbell' },
  ];
  const tags: Tag[] = [{ id: 'push', name: 'pchanie', nameEn: 'Push' }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseForm],
      providers: [provideNoopAnimations()],
    }).compileComponents();
  });

  // Tworzy komponent z ustawionymi słownikami (wejścia `input.required`).
  function createComponent(): ComponentFixture<ExerciseForm> {
    const fixture = TestBed.createComponent(ExerciseForm);
    fixture.componentRef.setInput('muscles', muscles);
    fixture.componentRef.setInput('equipment', equipment);
    fixture.componentRef.setInput('tags', tags);
    fixture.detectChanges();
    return fixture;
  }

  // Wpisuje wartość do pola tekstowego (0 = nazwa PL, 1 = nazwa EN) przez zdarzenie `input`.
  function typeIntoInput(
    fixture: ComponentFixture<ExerciseForm>,
    index: number,
    value: string,
  ): void {
    const inputs = fixture.nativeElement.querySelectorAll(
      'input[matInput]',
    ) as NodeListOf<HTMLInputElement>;
    inputs[index].value = value;
    inputs[index].dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  // Zwraca przycisk po widocznym tekście („Save" / „Cancel").
  function buttonByText(
    fixture: ComponentFixture<ExerciseForm>,
    text: string,
  ): HTMLButtonElement {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const button = buttons.find((b) => b.textContent?.trim() === text);
    if (!button) {
      throw new Error(`Brak przycisku o tekście „${text}".`);
    }
    return button;
  }

  it('tworzy się', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('toggleSelection dodaje i usuwa ID', () => {
    expect(toggleSelection([], 'a')).toEqual(['a']);
    expect(toggleSelection(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleSelection(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('blokuje zapis, dopóki nazwa PL/EN nie są wypełnione', () => {
    const fixture = createComponent();
    let emitted: ExerciseFormValues | undefined;
    fixture.componentInstance.save.subscribe((v) => (emitted = v));

    const saveButton = buttonByText(fixture, 'Save');
    expect(saveButton.disabled).toBe(true);

    // Sama nazwa PL nie wystarcza (brak EN).
    typeIntoInput(fixture, 0, 'wyciskanie');
    expect(buttonByText(fixture, 'Save').disabled).toBe(true);

    saveButton.click();
    expect(emitted).toBeUndefined();
  });

  it('emituje poprawny obiekt po wypełnieniu pól i zapisie', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    let emitted: ExerciseFormValues | undefined;
    component.save.subscribe((v) => (emitted = v));

    typeIntoInput(fixture, 0, 'wyciskanie hantli');
    typeIntoInput(fixture, 1, 'dumbbell press');
    component.toggleSecondaryMuscle('triceps');
    component.toggleEquipment('dumbbell');
    component.toggleTag('push');
    fixture.detectChanges();

    expect(buttonByText(fixture, 'Save').disabled).toBe(false);
    component.handleSave();

    expect(emitted).toEqual({
      name: 'wyciskanie hantli',
      nameEn: 'dumbbell press',
      primaryMuscleId: 'chest', // domyślnie pierwszy mięsień
      secondaryMuscleIds: ['triceps'],
      equipmentIds: ['dumbbell'],
      tagIds: ['push'],
    });
  });

  it('wybór mięśnia głównego usuwa go z mięśni dodatkowych', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    let emitted: ExerciseFormValues | undefined;
    component.save.subscribe((v) => (emitted = v));

    // Dodaj „back" do dodatkowych, potem ustaw „back" jako główny.
    component.toggleSecondaryMuscle('back');
    component.onPrimaryMuscleChange({ value: 'back' } as MatSelectChange);

    typeIntoInput(fixture, 0, 'X');
    typeIntoInput(fixture, 1, 'Y');
    component.handleSave();

    expect(emitted?.primaryMuscleId).toBe('back');
    expect(emitted?.secondaryMuscleIds).not.toContain('back');
  });

  it('emituje zdarzenie cancel po kliknięciu Cancel', () => {
    const fixture = createComponent();
    let cancelled = false;
    fixture.componentInstance.cancel.subscribe(() => (cancelled = true));

    buttonByText(fixture, 'Cancel').click();
    expect(cancelled).toBe(true);
  });
});
