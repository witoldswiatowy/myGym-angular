// jsdom nie dostarcza natywnego IndexedDB — `fake-indexeddb/auto` instaluje
// in-memory implementację, dzięki czemu testujemy repozytorium na realnym
// `StorageService` (zamiast atrapy), zachowując asynchroniczną semantykę 1:1.
import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { WorkoutRepository } from './workout-repository';
import { StorageService } from '../core/storage/storage';
import {
  SAMPLE_TRAINING_DAYS,
  SAMPLE_WORKOUT_EXERCISES,
  SAMPLE_WORKOUT_SETS,
} from '../data/training-days.data';
import { TrainingDay } from '../models/training-day';
import { WorkoutExercise } from '../models/workout-exercise';
import { WorkoutSet } from '../models/workout-set';

describe('WorkoutRepository', () => {
  let repository: WorkoutRepository;
  let storage: StorageService;

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    repository = TestBed.inject(WorkoutRepository);
    storage = TestBed.inject(StorageService);
    // Czysty magazyn przed każdym testem (globalne, współdzielone IndexedDB).
    await storage.clear();
  });

  it('getTrainingDays na pustym storage zwraca seed i go zapisuje', async () => {
    const result = await repository.getTrainingDays();
    expect(result).toEqual(SAMPLE_TRAINING_DAYS);

    // Po pierwszym odczycie seed jest utrwalony pod kluczem `training-days.v1`.
    const persisted = await storage.getItem<TrainingDay[]>('training-days.v1');
    expect(persisted).toEqual(SAMPLE_TRAINING_DAYS);
  });

  it('getTrainingDayById zwraca dzień po id, a dla nieznanego id null', async () => {
    const existing = await repository.getTrainingDayById('td_push_2026_04_14');
    expect(existing?.id).toBe('td_push_2026_04_14');

    const missing = await repository.getTrainingDayById('nope');
    expect(missing).toBeNull();
  });

  it('getExercisesForTrainingDay filtruje po trainingDayId i sortuje po order', async () => {
    const result = await repository.getExercisesForTrainingDay(
      'td_push_2026_04_14',
    );

    // Wszystkie należą do tego dnia.
    expect(result.every((e) => e.trainingDayId === 'td_push_2026_04_14')).toBe(
      true,
    );
    // Posortowane rosnąco po `order`.
    expect(result.map((e) => e.order)).toEqual([0, 1, 2, 3, 4]);
    expect(result.map((e) => e.id)).toEqual([
      'we_push_1',
      'we_push_2',
      'we_push_3',
      'we_push_4',
      'we_push_5',
    ]);
  });

  it('getSetsForWorkoutExercise filtruje po workoutExerciseId i sortuje po index', async () => {
    const result = await repository.getSetsForWorkoutExercise('we_push_1');

    expect(result.every((s) => s.workoutExerciseId === 'we_push_1')).toBe(true);
    // Indeksy rosnąco (źródło ma m.in. dwa warmupy o index 0).
    const indexes = result.map((s) => s.index);
    const sorted = [...indexes].sort((a, b) => a - b);
    expect(indexes).toEqual(sorted);
  });

  it('updateSet zamienia istniejącą serię po id (zapis całej listy)', async () => {
    // Inicjalizacja storage seedem.
    await repository.getSetsForWorkoutExercise('we_push_1');

    const updated: WorkoutSet = {
      id: 'ws_push_1_3',
      workoutExerciseId: 'we_push_1',
      index: 1,
      type: 'working',
      weight: 999,
      weightUnit: 'kg',
      reps: 5,
      done: true,
    };
    await repository.updateSet(updated);

    const sets = await storage.getItem<WorkoutSet[]>('workout-sets.v1');
    const stored = sets?.find((s) => s.id === 'ws_push_1_3');
    expect(stored).toEqual(updated);
    // Liczba serii bez zmian (zamiana, nie dodanie).
    expect(sets?.length).toBe(SAMPLE_WORKOUT_SETS.length);
  });

  it('updateSets robi upsert: zamienia istniejącą i dodaje nową po id', async () => {
    await repository.getSetsForWorkoutExercise('we_push_1');

    const replaced: WorkoutSet = {
      id: 'ws_push_1_3',
      workoutExerciseId: 'we_push_1',
      index: 1,
      type: 'working',
      weight: 100,
      weightUnit: 'kg',
      reps: 6,
      done: true,
    };
    const added: WorkoutSet = {
      id: 'ws_new_set',
      workoutExerciseId: 'we_push_1',
      index: 4,
      type: 'working',
      weight: 65,
      weightUnit: 'kg',
      reps: 8,
      done: false,
    };

    await repository.updateSets([replaced, added]);

    const sets = await storage.getItem<WorkoutSet[]>('workout-sets.v1');
    // Dodano dokładnie jeden nowy rekord.
    expect(sets?.length).toBe(SAMPLE_WORKOUT_SETS.length + 1);
    expect(sets?.find((s) => s.id === 'ws_push_1_3')).toEqual(replaced);
    expect(sets?.find((s) => s.id === 'ws_new_set')).toEqual(added);
  });

  it('getWorkoutDetails zwraca dzień, ćwiczenia i serie pogrupowane po workoutExerciseId', async () => {
    const details = await repository.getWorkoutDetails('td_push_2026_04_14');

    expect(details.day?.id).toBe('td_push_2026_04_14');
    expect(details.exercises.map((e) => e.id)).toEqual([
      'we_push_1',
      'we_push_2',
      'we_push_3',
      'we_push_4',
      'we_push_5',
    ]);

    // Grupowanie: klucze = id ćwiczeń tego dnia; serie posortowane po index.
    const group = details.setsByExerciseId['we_push_1'];
    expect(group.every((s) => s.workoutExerciseId === 'we_push_1')).toBe(true);
    const indexes = group.map((s) => s.index);
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
    // Brak serii spoza dnia (np. z dnia pull).
    expect(details.setsByExerciseId['we_pull_1']).toBeUndefined();
  });

  it('getWorkoutDetailsWithExerciseInfo dokleja name z ExerciseRepository, z fallbackiem do exerciseId', async () => {
    const details =
      await repository.getWorkoutDetailsWithExerciseInfo('td_push_2026_04_14');

    const first = details.exercises.find((e) => e.id === 'we_push_1');
    // overhead_press → nazwa ze słownika ćwiczeń.
    expect(first?.name).toBe('wyciskanie żołnierskie (szeroko)');

    // Fallback: ćwiczenie treningowe wskazujące na nieistniejący exerciseId
    // dostaje name = exerciseId.
    const orphan: WorkoutExercise = {
      id: 'we_orphan',
      trainingDayId: 'td_orphan',
      exerciseId: 'unknown_exercise',
      order: 0,
    };
    await storage.setItem('workout-exercises.v1', [
      ...SAMPLE_WORKOUT_EXERCISES,
      orphan,
    ]);
    await storage.setItem('training-days.v1', [
      ...SAMPLE_TRAINING_DAYS,
      {
        id: 'td_orphan',
        date: '2026-05-01',
        createdAt: '2026-05-01T09:00:00.000Z',
      },
    ]);

    const orphanDetails =
      await repository.getWorkoutDetailsWithExerciseInfo('td_orphan');
    expect(orphanDetails.exercises[0].name).toBe('unknown_exercise');
  });

  it('resetToSeed zapisuje wszystkie trzy klucze przez multiSet', async () => {
    // Zaburzamy stan, potem przywracamy seed.
    await storage.setItem('training-days.v1', []);
    await storage.setItem('workout-exercises.v1', []);
    await storage.setItem('workout-sets.v1', []);

    await repository.resetToSeed();

    expect(await storage.getItem<TrainingDay[]>('training-days.v1')).toEqual(
      SAMPLE_TRAINING_DAYS,
    );
    expect(
      await storage.getItem<WorkoutExercise[]>('workout-exercises.v1'),
    ).toEqual(SAMPLE_WORKOUT_EXERCISES);
    expect(await storage.getItem<WorkoutSet[]>('workout-sets.v1')).toEqual(
      SAMPLE_WORKOUT_SETS,
    );
  });
});
