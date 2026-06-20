import { Injectable, inject } from '@angular/core';
import {
  SAMPLE_TRAINING_DAYS,
  SAMPLE_WORKOUT_EXERCISES,
  SAMPLE_WORKOUT_SETS,
} from '../data/training-days.data';
import { TrainingDay } from '../models/training-day';
import { WorkoutExercise } from '../models/workout-exercise';
import { WorkoutSet } from '../models/workout-set';
import { StorageService } from '../core/storage/storage';
import { ExerciseRepository } from './exercise-repository';

// Klucze storage — identyczne jak w źródle RN (1:1, zapewniają ciągłość danych).
const STORAGE_KEYS = {
  trainingDays: 'training-days.v1',
  workoutExercises: 'workout-exercises.v1',
  workoutSets: 'workout-sets.v1',
} as const;

// Złożony widok jednego dnia treningowego (odpowiednik typu ze źródła RN).
export type WorkoutDetails = {
  day: TrainingDay | null;
  exercises: WorkoutExercise[];
  setsByExerciseId: Record<string, WorkoutSet[]>;
};

// WorkoutExercise wzbogacone o nazwę ćwiczenia (doklejaną z ExerciseRepository).
export type WorkoutExerciseWithName = WorkoutExercise & { name: string };

/**
 * Repozytorium treningów (odpowiednik `WorkoutRepository` ze źródła RN).
 *
 * W RN był to obiekt-singleton korzystający z `AsyncStorage`; tutaj to serwis
 * `@Injectable({ providedIn: 'root' })` (singleton aplikacji) z dostępem do
 * trwałego storage przez `StorageService` (decyzja D3 — IndexedDB).
 *
 * Różnica względem źródła: `StorageService` przechowuje wartości strukturalnie
 * (structured clone), więc NIE serializujemy ręcznie przez `JSON.stringify/parse`
 * — przekazujemy i odbieramy obiekty bezpośrednio. Logika, klucze storage i
 * zachowanie (wzorzec „get-or-seed", upsert serii, `multiSet` w `resetToSeed`)
 * pozostają 1:1.
 */
@Injectable({ providedIn: 'root' })
export class WorkoutRepository {
  // DI przez funkcję `inject` (idiomatyczne dla Angulara, odpowiednik
  // wstrzyknięcia zależności do konstruktora — tu bez jawnego konstruktora).
  private readonly storage = inject(StorageService);
  private readonly exerciseRepository = inject(ExerciseRepository);

  /**
   * Prywatny helper „get-or-seed": zwraca wartość spod klucza, a gdy storage jest
   * pusty — seeduje danymi i je zapisuje. Odpowiednik `getOrSeed<T>` ze źródła RN
   * (bez ręcznej serializacji JSON — wartości idą bezpośrednio przez StorageService).
   */
  private async getOrSeed<T>(key: string, seed: T): Promise<T> {
    try {
      const stored = await this.storage.getItem<T>(key);
      if (stored) {
        return stored;
      }
      await this.storage.setItem(key, seed);
      return seed;
    } catch (error) {
      console.error(`Error reading key ${key}:`, error);
      return seed;
    }
  }

  /** Zwraca wszystkie dni treningowe (get-or-seed pod kluczem `training-days.v1`). */
  async getTrainingDays(): Promise<TrainingDay[]> {
    return this.getOrSeed(STORAGE_KEYS.trainingDays, SAMPLE_TRAINING_DAYS);
  }

  /** Zwraca dzień treningowy po `id` lub `null`, gdy nie istnieje. */
  async getTrainingDayById(id: string): Promise<TrainingDay | null> {
    const days = await this.getTrainingDays();
    return days.find((d) => d.id === id) ?? null;
  }

  /** Zwraca ćwiczenia danego dnia, posortowane rosnąco po `order`. */
  async getExercisesForTrainingDay(trainingDayId: string): Promise<WorkoutExercise[]> {
    const exercises = await this.getOrSeed(STORAGE_KEYS.workoutExercises, SAMPLE_WORKOUT_EXERCISES);
    return exercises
      .filter((e) => e.trainingDayId === trainingDayId)
      .sort((a, b) => a.order - b.order);
  }

  /** Zwraca serie danego ćwiczenia treningowego, posortowane rosnąco po `index`. */
  async getSetsForWorkoutExercise(workoutExerciseId: string): Promise<WorkoutSet[]> {
    const sets = await this.getOrSeed(STORAGE_KEYS.workoutSets, SAMPLE_WORKOUT_SETS);
    return sets
      .filter((s) => s.workoutExerciseId === workoutExerciseId)
      .sort((a, b) => a.index - b.index);
  }

  /** Aktualizuje pojedynczą serię (zamiana po `id`) i zapisuje całą listę. */
  async updateSet(updatedSet: WorkoutSet): Promise<void> {
    const sets = await this.getOrSeed(STORAGE_KEYS.workoutSets, SAMPLE_WORKOUT_SETS);
    const updated = sets.map((s) => (s.id === updatedSet.id ? updatedSet : s));
    await this.storage.setItem(STORAGE_KEYS.workoutSets, updated);
    // opcjonalnie można usprawnić i zamienić na aktualizację tylko tego jednego
    // seta, ale to wymagałoby bardziej złożonej logiki i nie jest konieczne
    // w tym przypadku, póki co trzymamy wszystko prosto.
  }

  /** Aktualizuje wiele serii (upsert po `id` — zamiana istniejącej LUB dodanie nowej). */
  async updateSets(updatedSets: WorkoutSet[]): Promise<void> {
    const sets = await this.getOrSeed(STORAGE_KEYS.workoutSets, SAMPLE_WORKOUT_SETS);

    const byId = new Map(sets.map((s) => [s.id, s]));
    for (const updated of updatedSets) {
      byId.set(updated.id, updated); // zamień istniejący LUB dodaj nowy
    }

    await this.storage.setItem(STORAGE_KEYS.workoutSets, [...byId.values()]);
  }

  /** Składa złożony widok dnia: dzień + ćwiczenia + serie pogrupowane po `workoutExerciseId`. */
  async getWorkoutDetails(trainingDayId: string): Promise<WorkoutDetails> {
    const [day, exercises, sets] = await Promise.all([
      this.getTrainingDayById(trainingDayId),
      this.getExercisesForTrainingDay(trainingDayId),
      this.getOrSeed(STORAGE_KEYS.workoutSets, SAMPLE_WORKOUT_SETS),
    ]);

    const exerciseIds = new Set(exercises.map((e) => e.id));
    const setsByExerciseId = sets
      .filter((s) => exerciseIds.has(s.workoutExerciseId))
      .sort((a, b) => a.index - b.index)
      .reduce<Record<string, WorkoutSet[]>>((acc, set) => {
        if (!acc[set.workoutExerciseId]) {
          acc[set.workoutExerciseId] = [];
        }
        acc[set.workoutExerciseId].push(set);
        return acc;
      }, {});

    return {
      day,
      exercises,
      setsByExerciseId,
    };
  }

  /**
   * Jak `getWorkoutDetails`, ale dokleja `name` do każdego ćwiczenia z
   * `ExerciseRepository`; fallback do `exerciseId`, gdy brak nazwy.
   */
  async getWorkoutDetailsWithExerciseInfo(
    trainingDayId: string,
  ): Promise<Omit<WorkoutDetails, 'exercises'> & { exercises: WorkoutExerciseWithName[] }> {
    const [details, allExercises] = await Promise.all([
      this.getWorkoutDetails(trainingDayId),
      this.exerciseRepository.getAll(),
    ]);

    const exerciseNameById = allExercises.reduce<Record<string, string>>((acc, exercise) => {
      acc[exercise.id] = exercise.name;
      return acc;
    }, {});

    const exercisesWithName = details.exercises.map((workoutExercise) => ({
      ...workoutExercise,
      name: exerciseNameById[workoutExercise.exerciseId] ?? workoutExercise.exerciseId,
    }));

    return {
      day: details.day,
      setsByExerciseId: details.setsByExerciseId,
      exercises: exercisesWithName,
    };
  }

  /** Przywraca dni, ćwiczenia i serie do stanu seed (jedna transakcja przez `multiSet`). */
  async resetToSeed(): Promise<void> {
    try {
      await this.storage.multiSet([
        [STORAGE_KEYS.trainingDays, SAMPLE_TRAINING_DAYS],
        [STORAGE_KEYS.workoutExercises, SAMPLE_WORKOUT_EXERCISES],
        [STORAGE_KEYS.workoutSets, SAMPLE_WORKOUT_SETS],
      ]);
    } catch (error) {
      console.error('Error resetting workouts:', error);
      throw error;
    }
  }
}
