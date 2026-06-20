import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseTableRow } from './exercise-table-row';
import { Exercise } from '../../../../models/exercise';

describe('ExerciseTableRow', () => {
  // Przykładowe ćwiczenie z relacjami przez ID (2 mięśnie dodatkowe, 2 sprzęty, 1 tag).
  const exercise: Exercise = {
    id: 'ex_bench',
    name: 'Bench Press',
    nameEn: 'Bench Press',
    primaryMuscleId: 'm_chest',
    secondaryMuscleIds: ['m_triceps', 'm_front_delts'],
    equipmentIds: ['eq_barbell', 'eq_bench'],
    tagIds: ['tag_push'],
  };

  const muscleNameById: Record<string, string> = {
    m_chest: 'Chest',
    m_triceps: 'Triceps',
    m_front_delts: 'Front delts',
  };
  const muscleColorById: Record<string, string> = {
    m_chest: '#FF0000',
    m_triceps: '#00FF00',
    m_front_delts: '#0000FF',
  };
  const equipmentNameById: Record<string, string> = {
    eq_barbell: 'Barbell',
    eq_bench: 'Bench',
  };
  const tagNameById: Record<string, string> = { tag_push: 'Push' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseTableRow],
    }).compileComponents();
  });

  // Tworzy komponent z ustawionymi wejściami sygnałowymi (input.required).
  function createComponent(ex: Exercise = exercise): ComponentFixture<ExerciseTableRow> {
    const fixture = TestBed.createComponent(ExerciseTableRow);
    fixture.componentRef.setInput('exercise', ex);
    fixture.componentRef.setInput('muscleNameById', muscleNameById);
    fixture.componentRef.setInput('muscleColorById', muscleColorById);
    fixture.componentRef.setInput('equipmentNameById', equipmentNameById);
    fixture.componentRef.setInput('tagNameById', tagNameById);
    fixture.detectChanges();
    return fixture;
  }

  it('tworzy się', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderuje nazwę ćwiczenia w kolumnie name', () => {
    const fixture = createComponent();
    const name = fixture.nativeElement.querySelector(
      '.exercise-table-row__col-name',
    ) as HTMLElement;
    expect(name.textContent?.trim()).toBe('Bench Press');
  });

  it('rozwiązuje mięsień główny na nazwę i ustawia kolor badge', () => {
    const fixture = createComponent();
    const primary = fixture.nativeElement.querySelector(
      '.exercise-table-row__col-primary .exercise-table-row__muscle-badge',
    ) as HTMLElement;
    expect(primary.textContent?.trim()).toBe('Chest');
    // #FF0000 jest normalizowane przez przeglądarkę do rgb(255, 0, 0).
    expect(primary.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('rozwiązuje wszystkie mięśnie dodatkowe na nazwy (osobne badge)', () => {
    const fixture = createComponent();
    const badges = fixture.nativeElement.querySelectorAll(
      '.exercise-table-row__col-secondary .exercise-table-row__muscle-badge',
    );
    expect(badges.length).toBe(2);
    const texts = Array.from(badges).map((b) => (b as HTMLElement).textContent?.trim());
    expect(texts).toEqual(['Triceps', 'Front delts']);
  });

  it('pokazuje „-" gdy brak mięśni dodatkowych', () => {
    const fixture = createComponent({ ...exercise, secondaryMuscleIds: [] });
    const secondary = fixture.nativeElement.querySelector(
      '.exercise-table-row__col-secondary',
    ) as HTMLElement;
    expect(secondary.textContent?.trim()).toBe('-');
    expect(
      secondary.querySelectorAll('.exercise-table-row__muscle-badge').length,
    ).toBe(0);
  });

  it('łączy nazwy sprzętu i tagów przecinkami (resolveMany 1:1)', () => {
    const fixture = createComponent();
    const equipment = fixture.nativeElement.querySelector(
      '.exercise-table-row__col-equipment',
    ) as HTMLElement;
    const tags = fixture.nativeElement.querySelector(
      '.exercise-table-row__col-tags',
    ) as HTMLElement;
    expect(equipment.textContent?.trim()).toBe('Barbell, Bench');
    expect(tags.textContent?.trim()).toBe('Push');
  });

  it('pokazuje „-" gdy brak sprzętu i tagów', () => {
    const fixture = createComponent({ ...exercise, equipmentIds: [], tagIds: [] });
    const equipment = fixture.nativeElement.querySelector(
      '.exercise-table-row__col-equipment',
    ) as HTMLElement;
    const tags = fixture.nativeElement.querySelector(
      '.exercise-table-row__col-tags',
    ) as HTMLElement;
    expect(equipment.textContent?.trim()).toBe('-');
    expect(tags.textContent?.trim()).toBe('-');
  });

  it('stosuje fallback „Unknown (id)" gdy ID brak w słowniku', () => {
    const fixture = createComponent({
      ...exercise,
      primaryMuscleId: 'm_missing',
      equipmentIds: ['eq_missing'],
    });
    const primary = fixture.nativeElement.querySelector(
      '.exercise-table-row__col-primary .exercise-table-row__muscle-badge',
    ) as HTMLElement;
    const equipment = fixture.nativeElement.querySelector(
      '.exercise-table-row__col-equipment',
    ) as HTMLElement;
    expect(primary.textContent?.trim()).toBe('Unknown (m_missing)');
    // Brak koloru w słowniku → fallback #F2F4F7 = rgb(242, 244, 247).
    expect(primary.style.backgroundColor).toBe('rgb(242, 244, 247)');
    expect(equipment.textContent?.trim()).toBe('Unknown (eq_missing)');
  });
});
