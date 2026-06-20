import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkoutScreen } from './workout-screen';
import {
  WorkoutExerciseWithName,
  WorkoutRepository,
} from '../../repositories/workout-repository';
import { TrainingDay } from '../../models/training-day';
import { WorkoutSet } from '../../models/workout-set';

// --- Fixtury -----------------------------------------------------------------

const DAY: TrainingDay = {
  id: 'td1',
  date: '2026-06-20',
  createdAt: '2026-06-20T08:00:00.000Z',
};

// Ćwiczenie BEZ zapisanych serii (ma dostać 3 puste serie).
const EXERCISE_EMPTY: WorkoutExerciseWithName = {
  id: 'we_empty',
  trainingDayId: 'td1',
  exerciseId: 'ex_bench',
  order: 0,
  name: 'Bench Press',
};

// Ćwiczenie Z jedną zapisaną serią.
const EXERCISE_WITH_SET: WorkoutExerciseWithName = {
  id: 'we_filled',
  trainingDayId: 'td1',
  exerciseId: 'ex_squat',
  order: 1,
  name: 'Squat',
};

const EXISTING_SET: WorkoutSet = {
  id: 's1',
  workoutExerciseId: 'we_filled',
  index: 0,
  type: 'working',
  weight: 100,
  weightUnit: 'kg',
  reps: 5,
  done: false,
};

function buildDetails() {
  return {
    day: DAY,
    exercises: [EXERCISE_EMPTY, EXERCISE_WITH_SET],
    setsByExerciseId: { we_filled: [EXISTING_SET] } as Record<string, WorkoutSet[]>,
  };
}

describe('WorkoutScreen', () => {
  let service: WorkoutScreen;
  let appRef: ApplicationRef;
  let getWorkoutDetailsWithExerciseInfo: ReturnType<typeof vi.fn>;
  let updateSets: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Zoneless: czasem (debounceTime → setTimeout) steruje Vitest, efekty
    // flushuje `ApplicationRef.tick()` — jak w `debounce.spec.ts`.
    vi.useFakeTimers();

    getWorkoutDetailsWithExerciseInfo = vi.fn().mockResolvedValue(buildDetails());
    updateSets = vi.fn().mockResolvedValue(undefined);

    // Atrapa repozytorium — serwis używa tylko tych dwóch metod.
    const repository = {
      getWorkoutDetailsWithExerciseInfo,
      updateSets,
    };

    TestBed.configureTestingModule({
      providers: [WorkoutScreen, { provide: WorkoutRepository, useValue: repository }],
    });

    service = TestBed.inject(WorkoutScreen);
    appRef = TestBed.inject(ApplicationRef);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Flushuje efekty (tick) i mikrozadania (Promise z atrapy repo).
  async function flushLoad(): Promise<void> {
    appRef.tick(); // uruchamia efekt ładowania → wywołuje repo
    await Promise.resolve(); // pozwala wykonać .then (zapis do signali)
    appRef.tick(); // propaguje zmiany signali (np. do toObservable debounce)
  }

  it('po załadowaniu nadaje ćwiczeniu bez serii 3 puste serie (working/kg)', async () => {
    service.setTrainingDayId('td1');
    await flushLoad();

    const sets = service.setsByExerciseId();
    const emptySets = sets['we_empty'];

    expect(emptySets).toHaveLength(3);
    expect(emptySets.map((s) => s.index)).toEqual([0, 1, 2]);
    expect(emptySets.every((s) => s.type === 'working')).toBe(true);
    expect(emptySets.every((s) => s.weightUnit === 'kg')).toBe(true);
    expect(emptySets.every((s) => s.weight === '' && s.reps === '')).toBe(true);

    // Ćwiczenie z zapisaną serią zachowuje swoją serię (zmapowaną na stringi).
    const filled = sets['we_filled'];
    expect(filled).toHaveLength(1);
    expect(filled[0]).toMatchObject({ id: 's1', weight: '100', reps: '5' });
  });

  it('updateSetField mutuje tylko wskazaną serię', async () => {
    service.setTrainingDayId('td1');
    await flushLoad();

    const before = service.setsByExerciseId()['we_empty'];
    const targetId = before[1].id; // środkowa pusta seria

    service.updateSetField('we_empty', targetId, { reps: '8' });

    const after = service.setsByExerciseId()['we_empty'];
    expect(after[1].reps).toBe('8');
    // Pozostałe serie nietknięte.
    expect(after[0].reps).toBe('');
    expect(after[2].reps).toBe('');
  });

  it('selectSetType ustawia typ aktywnej serii i zamyka modal (target → null)', async () => {
    service.setTrainingDayId('td1');
    await flushLoad();

    const targetId = service.setsByExerciseId()['we_empty'][0].id;
    service.setTypeSelectTarget({ exerciseId: 'we_empty', setId: targetId });

    service.selectSetType('warmup');

    expect(service.setsByExerciseId()['we_empty'][0].type).toBe('warmup');
    expect(service.typeSelectTarget()).toBeNull();
  });

  it('selectWeightUnit ustawia jednostkę aktywnej serii i zamyka modal (target → null)', async () => {
    service.setTrainingDayId('td1');
    await flushLoad();

    const targetId = service.setsByExerciseId()['we_empty'][0].id;
    service.setWeightUnitSelectTarget({ exerciseId: 'we_empty', setId: targetId });

    service.selectWeightUnit('lb');

    expect(service.setsByExerciseId()['we_empty'][0].weightUnit).toBe('lb');
    expect(service.weightUnitSelectTarget()).toBeNull();
  });

  it('po debounce zapisuje wszystkie zmiany JEDNYM wywołaniem updateSets', async () => {
    service.setTrainingDayId('td1');
    await flushLoad();

    // Szybkie kolejne zmiany w odstępach < 500 ms — każda resetuje debounce.
    service.updateSetField('we_empty', service.setsByExerciseId()['we_empty'][0].id, {
      reps: '5',
    });
    appRef.tick();
    vi.advanceTimersByTime(200);

    service.updateSetField('we_empty', service.setsByExerciseId()['we_empty'][1].id, {
      reps: '6',
    });
    appRef.tick();
    vi.advanceTimersByTime(200);

    service.updateSetField('we_filled', 's1', { reps: '7' });
    appRef.tick();

    // Przed upływem 500 ms od ostatniej zmiany — brak zapisu.
    vi.advanceTimersByTime(499);
    appRef.tick();
    await Promise.resolve();
    expect(updateSets).not.toHaveBeenCalled();

    // Po pełnym debounce — dokładnie JEDEN zapis ze WSZYSTKIMi seriami.
    vi.advanceTimersByTime(1);
    appRef.tick();
    await Promise.resolve();

    expect(updateSets).toHaveBeenCalledTimes(1);
    const savedSets = updateSets.mock.calls[0][0] as WorkoutSet[];
    // 3 puste (we_empty) + 1 (we_filled) = 4 serie w jednym zapisie.
    expect(savedSets).toHaveLength(4);
    // Zmiany odzwierciedlone i skonwertowane na liczby.
    const filledSaved = savedSets.find((s) => s.id === 's1');
    expect(filledSaved?.reps).toBe(7);
  });

  it('nie zapisuje, gdy brak trainingDayId (mimo zmian po debounce)', async () => {
    // Najpierw załaduj (by powstały serie), potem usuń trainingDayId.
    service.setTrainingDayId('td1');
    await flushLoad();

    service.setTrainingDayId(undefined);

    service.updateSetField('we_empty', service.setsByExerciseId()['we_empty'][0].id, {
      reps: '5',
    });
    appRef.tick();

    // Pełny debounce + flush — autozapis ma się NIE odpalić (guard !trainingDayId).
    vi.advanceTimersByTime(500);
    appRef.tick();
    await Promise.resolve();

    expect(updateSets).not.toHaveBeenCalled();
  });
});
