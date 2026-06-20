// jsdom nie dostarcza natywnego IndexedDB — `fake-indexeddb/auto` instaluje
// in-memory implementację, dzięki czemu testujemy repozytorium na realnym
// `StorageService` (zamiast atrapy), zachowując asynchroniczną semantykę 1:1.
import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ExerciseRepository } from './exercise-repository';
import { StorageService } from '../core/storage/storage';
import { EXERCISES } from '../data/exercises.data';
import { Exercise } from '../models/exercise';

describe('ExerciseRepository', () => {
  let repository: ExerciseRepository;
  let storage: StorageService;

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    repository = TestBed.inject(ExerciseRepository);
    storage = TestBed.inject(StorageService);
    // Czysty magazyn przed każdym testem (globalne, współdzielone IndexedDB).
    await storage.clear();
  });

  it('getAll na pustym storage zwraca seed i go zapisuje', async () => {
    const result = await repository.getAll();
    expect(result).toEqual(EXERCISES);

    // Po pierwszym odczycie seed jest utrwalony pod kluczem `exercises.v1`.
    const persisted = await storage.getItem<Exercise[]>('exercises.v1');
    expect(persisted).toEqual(EXERCISES);
  });

  it('getAll zwraca zapisaną wartość, gdy storage nie jest pusty (bez ponownego seedowania)', async () => {
    const custom: Exercise[] = [
      {
        id: 'custom_1',
        name: 'własne ćwiczenie',
        nameEn: 'Custom Exercise',
        primaryMuscleId: 'biceps',
        secondaryMuscleIds: [],
        equipmentIds: ['dumbbell'],
        tagIds: ['pull'],
      },
    ];
    await storage.setItem('exercises.v1', custom);

    const result = await repository.getAll();
    expect(result).toEqual(custom);
  });

  it('add zwraca seed + nowy rekord przy kolejnym getAll', async () => {
    const newExercise: Exercise = {
      id: 'new_ex',
      name: 'nowe ćwiczenie',
      nameEn: 'New Exercise',
      primaryMuscleId: 'biceps',
      secondaryMuscleIds: [],
      equipmentIds: ['dumbbell'],
      tagIds: ['pull'],
    };

    await repository.add(newExercise);

    const result = await repository.getAll();
    expect(result).toEqual([...EXERCISES, newExercise]);
  });

  it('resetToSeed przywraca listę do stanu seed', async () => {
    const extra: Exercise = {
      id: 'temp_ex',
      name: 'tymczasowe',
      nameEn: 'Temp',
      primaryMuscleId: 'biceps',
      secondaryMuscleIds: [],
      equipmentIds: ['dumbbell'],
      tagIds: ['pull'],
    };
    await repository.add(extra);

    await repository.resetToSeed();

    const result = await repository.getAll();
    expect(result).toEqual(EXERCISES);
  });
});
