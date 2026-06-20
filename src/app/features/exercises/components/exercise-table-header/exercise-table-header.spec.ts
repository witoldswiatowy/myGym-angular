import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseTableHeader, SortDir, SortKey } from './exercise-table-header';

describe('ExerciseTableHeader', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseTableHeader],
    }).compileComponents();
  });

  // Tworzy komponent z ustawionymi wejściami sygnałowymi (input.required).
  function createComponent(
    sortKey: SortKey = 'name',
    sortDir: SortDir = 'asc',
  ): ComponentFixture<ExerciseTableHeader> {
    const fixture = TestBed.createComponent(ExerciseTableHeader);
    fixture.componentRef.setInput('sortKey', sortKey);
    fixture.componentRef.setInput('sortDir', sortDir);
    fixture.detectChanges();
    return fixture;
  }

  it('tworzy się', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderuje wszystkie etykiety kolumn (1:1 ze źródłem RN)', () => {
    const fixture = createComponent();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Exercise');
    expect(text).toContain('Primary muscle');
    expect(text).toContain('Secondary muscles');
    expect(text).toContain('Equipment');
    expect(text).toContain('Tags');
  });

  it('kolumny sortowalne to przyciski, a „Secondary muscles" jest statyczne', () => {
    const fixture = createComponent();
    // 4 klikalne kolumny: Exercise, Primary muscle, Equipment, Tags.
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(4);

    const secondary = fixture.nativeElement.querySelector(
      '.exercise-table-header__col-secondary',
    ) as HTMLElement;
    expect(secondary.tagName.toLowerCase()).toBe('span');
  });

  it('emituje zdarzenie sort z kluczem klikniętej kolumny', () => {
    const fixture = createComponent();
    const emitted: SortKey[] = [];
    fixture.componentInstance.sort.subscribe((key) => emitted.push(key));

    (
      fixture.nativeElement.querySelector('.exercise-table-header__col-equipment') as HTMLElement
    ).click();

    expect(emitted).toEqual(['equipment']);
  });

  it('pokazuje strzałkę ▲ przy aktywnej kolumnie dla kierunku rosnącego', () => {
    const fixture = createComponent('equipment', 'asc');
    const equipment = fixture.nativeElement.querySelector(
      '.exercise-table-header__col-equipment',
    ) as HTMLElement;
    expect(equipment.textContent).toContain('▲');

    // Kolumna nieaktywna nie ma żadnej strzałki.
    const name = fixture.nativeElement.querySelector(
      '.exercise-table-header__col-name',
    ) as HTMLElement;
    expect(name.textContent).not.toContain('▲');
    expect(name.textContent).not.toContain('▼');
  });

  it('pokazuje strzałkę ▼ przy aktywnej kolumnie dla kierunku malejącego', () => {
    const fixture = createComponent('tags', 'desc');
    const tags = fixture.nativeElement.querySelector(
      '.exercise-table-header__col-tags',
    ) as HTMLElement;
    expect(tags.textContent).toContain('▼');
  });
});
