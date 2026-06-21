import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { WorkoutSetRow, WorkoutSetRowData } from './workout-set-row';

describe('WorkoutSetRow', () => {
  // Przykładowa seria (typ docelowy, ciężar 80 kg, 10 powtórzeń, niezaznaczona).
  const sampleSet: WorkoutSetRowData = {
    id: 'set_1',
    type: 'working',
    weight: '80',
    weightUnit: 'kg',
    reps: '10',
    done: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkoutSetRow],
      providers: [provideNoopAnimations()],
    }).compileComponents();
  });

  // Tworzy komponent z ustawionymi wejściami sygnałowymi (input.required).
  function createComponent(set: WorkoutSetRowData = sampleSet): ComponentFixture<WorkoutSetRow> {
    const fixture = TestBed.createComponent(WorkoutSetRow);
    fixture.componentRef.setInput('set', set);
    fixture.componentRef.setInput('typeLabel', 'W');
    fixture.detectChanges();
    return fixture;
  }

  // Zwraca przycisk po klasie modyfikatora (typ / jednostka).
  function selectButton(
    fixture: ComponentFixture<WorkoutSetRow>,
    modifier: 'type' | 'unit',
  ): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      `.workout-set-row__select-button--${modifier}`,
    ) as HTMLButtonElement;
  }

  // Zwraca pola liczbowe inline (0 = ciężar, 1 = powtórzenia).
  function numberInputs(fixture: ComponentFixture<WorkoutSetRow>): NodeListOf<HTMLInputElement> {
    return fixture.nativeElement.querySelectorAll(
      '.workout-set-row__number-input',
    ) as NodeListOf<HTMLInputElement>;
  }

  it('tworzy się z przykładową serią', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderuje etykietę typu, ciężar, jednostkę i powtórzenia', () => {
    const fixture = createComponent();
    expect(selectButton(fixture, 'type').textContent?.trim()).toBe('W');
    expect(selectButton(fixture, 'unit').textContent?.trim()).toBe('kg');

    const inputs = numberInputs(fixture);
    expect(inputs[0].value).toBe('80');
    expect(inputs[1].value).toBe('10');
  });

  it('odzwierciedla stan „done" na checkboxie', () => {
    const fixture = createComponent({ ...sampleSet, done: true });
    const checkbox = fixture.nativeElement.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('emituje changeWeight z oczyszczonej wartości (cyfry, kropka, przecinek)', () => {
    const fixture = createComponent();
    let emitted: string | undefined;
    fixture.componentInstance.changeWeight.subscribe((v) => (emitted = v));

    const weightInput = numberInputs(fixture)[0];
    weightInput.value = '8a0,5kg';
    weightInput.dispatchEvent(new Event('input'));

    expect(emitted).toBe('80,5');
  });

  it('emituje changeReps tylko z cyfr', () => {
    const fixture = createComponent();
    let emitted: string | undefined;
    fixture.componentInstance.changeReps.subscribe((v) => (emitted = v));

    const repsInput = numberInputs(fixture)[1];
    repsInput.value = '1x2.3';
    repsInput.dispatchEvent(new Event('input'));

    expect(emitted).toBe('123');
  });

  it('klik przycisku typu emituje żądanie openTypeSelect', () => {
    const fixture = createComponent();
    let opened = false;
    fixture.componentInstance.openTypeSelect.subscribe(() => (opened = true));

    selectButton(fixture, 'type').click();

    expect(opened).toBe(true);
  });

  it('klik przycisku jednostki emituje żądanie openWeightUnitSelect', () => {
    const fixture = createComponent();
    let opened = false;
    fixture.componentInstance.openWeightUnitSelect.subscribe(() => (opened = true));

    selectButton(fixture, 'unit').click();

    expect(opened).toBe(true);
  });

  it('toggle checkboxa „done" emituje changeDone z nowym stanem', () => {
    const fixture = createComponent();
    let emitted: boolean | undefined;
    fixture.componentInstance.changeDone.subscribe((v) => (emitted = v));

    const checkbox = fixture.nativeElement.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();

    expect(emitted).toBe(true);
  });
});
