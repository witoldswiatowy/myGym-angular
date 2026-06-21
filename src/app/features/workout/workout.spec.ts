import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { TrainingDay } from '../../models/training-day';
import { WorkoutSet } from '../../models/workout-set';
import {
  WorkoutDetails,
  WorkoutExerciseWithName,
  WorkoutRepository,
} from '../../repositories/workout-repository';
import { WorkoutSetRow } from './components/workout-set-row/workout-set-row';
import { WorkoutScreen } from './workout-screen';
import { Workout } from './workout';

describe('Workout', () => {
  // Dzień treningowy testowy.
  const day: TrainingDay = {
    id: 'd1',
    date: '2026-08-26',
    note: 'Push day',
    durationMin: 60,
    createdAt: '2026-08-26T08:00:00.000Z',
  };

  // Dwa ćwiczenia z nazwami (widok wzbogacony przez repozytorium).
  const exercises: WorkoutExerciseWithName[] = [
    { id: 'we1', trainingDayId: 'd1', exerciseId: 'ex1', order: 0, name: 'Bench press' },
    { id: 'we2', trainingDayId: 'd1', exerciseId: 'ex2', order: 1, name: 'Squat' },
  ];

  // Po jednej zapisanej serii na ćwiczenie (reszta dopełniana pustymi przez serwis).
  const setsByExerciseId: Record<string, WorkoutSet[]> = {
    we1: [
      { id: 's1', workoutExerciseId: 'we1', index: 0, type: 'working', weight: 80, weightUnit: 'kg', reps: 8, done: false },
    ],
    we2: [
      { id: 's2', workoutExerciseId: 'we2', index: 0, type: 'warmup', weight: 60, weightUnit: 'kg', reps: 10, done: false },
    ],
  };

  const details: WorkoutDetails = { day, exercises, setsByExerciseId };

  // Atrapa repozytorium (D3) — żaden test nie dotyka realnego storage/IndexedDB.
  const repository = {
    getWorkoutDetailsWithExerciseInfo: vi.fn(),
    updateSets: vi.fn(),
  };

  // Atrapa serwisu dialogów (D2) — `open()` zwraca obiekt z `afterClosed()`.
  const dialog = {
    open: vi.fn(),
  };

  // Atrapa trasy: query param `id` (D1) jako strumień emitujący synchronicznie.
  const activatedRoute = {
    queryParamMap: of(convertToParamMap({ id: 'd1' })),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    repository.getWorkoutDetailsWithExerciseInfo.mockResolvedValue(details);
    repository.updateSets.mockResolvedValue(undefined);
    dialog.open.mockReturnValue({ afterClosed: () => of(undefined) });

    await TestBed.configureTestingModule({
      imports: [Workout],
      providers: [
        provideNoopAnimations(),
        { provide: WorkoutRepository, useValue: repository },
        { provide: MatDialog, useValue: dialog },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();
  });

  // Tworzy komponent i czeka, aż serwis wczyta szczegóły dnia (Promise z repozytorium).
  async function createComponent(): Promise<ComponentFixture<Workout>> {
    const fixture = TestBed.createComponent(Workout);
    fixture.detectChanges();
    await settle(fixture);
    return fixture;
  }

  // Domyka mikrozadania (Promise) i odświeża widok — zoneless, brak strefy Angulara.
  async function settle(fixture: ComponentFixture<Workout>): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  // Instancje wierszy serii renderowane przez komponent (krok 024).
  function setRows(fixture: ComponentFixture<Workout>): WorkoutSetRow[] {
    return fixture.debugElement
      .queryAll(By.directive(WorkoutSetRow))
      .map((row) => row.componentInstance as WorkoutSetRow);
  }

  it('odczytuje id z query param, renderuje ćwiczenia i wiersze serii', async () => {
    const fixture = await createComponent();

    // Repozytorium zapytane o dzień z query param (D1).
    expect(repository.getWorkoutDetailsWithExerciseInfo).toHaveBeenCalledWith('d1');

    // Dwie karty ćwiczeń, po jednym wierszu serii każda.
    const cards = fixture.nativeElement.querySelectorAll('.workout__exercise-card');
    expect(cards.length).toBe(exercises.length);
    expect(setRows(fixture).length).toBe(2);
  });

  it('wyświetla komunikat, gdy brak dnia treningowego', async () => {
    repository.getWorkoutDetailsWithExerciseInfo.mockResolvedValue({
      day: null,
      exercises: [],
      setsByExerciseId: {},
    } satisfies WorkoutDetails);

    const fixture = await createComponent();

    const empty = fixture.nativeElement.querySelector('.workout__empty') as HTMLElement | null;
    expect(empty?.textContent).toContain('Nie znaleziono dnia treningowego.');
    expect(setRows(fixture).length).toBe(0);
  });

  it('output changeWeight wiersza wywołuje akcję serwisu (updateSetField)', async () => {
    const fixture = await createComponent();
    const service = fixture.debugElement.injector.get(WorkoutScreen);
    const spy = vi.spyOn(service, 'updateSetField');

    // Pierwszy wiersz należy do ćwiczenia `we1`, seria `s1`.
    setRows(fixture)[0].changeWeight.emit('100');

    expect(spy).toHaveBeenCalledWith('we1', 's1', { weight: '100' });
  });

  it('openTypeSelect otwiera dialog i po wyniku woła selectSetType', async () => {
    dialog.open.mockReturnValue({ afterClosed: () => of('drop') });

    const fixture = await createComponent();
    const service = fixture.debugElement.injector.get(WorkoutScreen);
    const selectSpy = vi.spyOn(service, 'selectSetType');
    const targetSpy = vi.spyOn(service, 'setTypeSelectTarget');

    setRows(fixture)[0].openTypeSelect.emit();

    // Ustawiono target serii przed otwarciem, otwarto dialog z aktualnym typem.
    expect(targetSpy).toHaveBeenCalledWith({ exerciseId: 'we1', setId: 's1' });
    expect(dialog.open).toHaveBeenCalled();
    // Wynik dialogu (zdefiniowany) → wybór typu przez serwis.
    expect(selectSpy).toHaveBeenCalledWith('drop');
  });

  it('openWeightUnitSelect: zamknięcie bez wyboru czyści target', async () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(undefined) });

    const fixture = await createComponent();
    const service = fixture.debugElement.injector.get(WorkoutScreen);
    const selectSpy = vi.spyOn(service, 'selectWeightUnit');
    const targetSpy = vi.spyOn(service, 'setWeightUnitSelectTarget');

    setRows(fixture)[0].openWeightUnitSelect.emit();

    // Otwarto, ale bez wyniku → brak wyboru, target wyczyszczony (null).
    expect(dialog.open).toHaveBeenCalled();
    expect(selectSpy).not.toHaveBeenCalled();
    expect(targetSpy).toHaveBeenLastCalledWith(null);
  });
});
