import { Injectable, inject } from '@angular/core';
import { EXERCISES } from '../data/exercises.data';
import { Exercise } from '../models/exercise';
import { StorageService } from '../core/storage/storage';

// Klucz storage — identyczny jak w źródle RN (1:1, zapewnia ciągłość danych).
const STORAGE_KEY = 'exercises.v1';

/**
 * Repozytorium ćwiczeń (odpowiednik `ExerciseRepository` ze źródła RN).
 *
 * W RN był to obiekt-singleton korzystający z `AsyncStorage`; tutaj to serwis
 * `@Injectable({ providedIn: 'root' })` (singleton aplikacji) z dostępem do
 * trwałego storage przez `StorageService` (decyzja D3 — IndexedDB).
 *
 * Różnica względem źródła: `StorageService` przechowuje wartości strukturalnie
 * (structured clone), więc NIE serializujemy ręcznie przez `JSON.stringify/parse`
 * — przekazujemy i odbieramy obiekty bezpośrednio. Logika, klucz storage i
 * zachowanie (wzorzec „get-or-seed") pozostają 1:1.
 */
@Injectable({ providedIn: 'root' })
export class ExerciseRepository {
  // DI przez funkcję `inject` (idiomatyczne dla Angulara, odpowiednik wstrzyknięcia
  // zależności do konstruktora — tu bez jawnego konstruktora).
  private readonly storage = inject(StorageService);

  /** Zwraca wszystkie ćwiczenia; przy pustym storage seeduje danymi i je zapisuje. */
  async getAll(): Promise<Exercise[]> {
    try {
      const stored = await this.storage.getItem<Exercise[]>(STORAGE_KEY);
      if (stored) {
        return stored;
      }
      await this.storage.setItem(STORAGE_KEY, EXERCISES);
      return EXERCISES;
    } catch (error) {
      console.error('Error reading exercises from storage:', error);
      return EXERCISES;
    }
  }

  /** Dodaje ćwiczenie i zapisuje zaktualizowaną listę. */
  async add(exercise: Exercise): Promise<void> {
    try {
      const currentExercises = await this.getAll();
      const updatedExercises = [...currentExercises, exercise];
      await this.storage.setItem(STORAGE_KEY, updatedExercises);
      console.log('Exercise added to storage:', exercise);
    } catch (error) {
      console.error('Error adding exercise to storage:', error);
      throw error;
    }
  }

  /** Przywraca listę do stanu z danych seed. */
  async resetToSeed(): Promise<void> {
    try {
      await this.storage.removeItem(STORAGE_KEY);
      await this.storage.setItem(STORAGE_KEY, EXERCISES);
    } catch (error) {
      console.error('Error resetting exercises:', error);
      throw error;
    }
  }
}
