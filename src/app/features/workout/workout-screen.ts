import { Injectable, Signal, effect, inject, signal } from '@angular/core';

import { TrainingDay } from '../../models/training-day';
import { WorkoutSet } from '../../models/workout-set';
import { WorkoutExerciseWithName, WorkoutRepository } from '../../repositories/workout-repository';
import { debouncedSignal } from '../../shared/utils/debounce';

/**
 * Formularzowy odpowiednik serii: wartości liczbowe trzymane jako stringi,
 * bo pochodzą z pól tekstowych (`<input>`). Mapowane na `WorkoutSet` dopiero
 * przy zapisie. Odpowiednik typu `SetForm` ze źródła RN (1:1).
 */
type SetForm = {
  id: string;
  workoutExerciseId: string;
  index: number;
  type: 'warmup' | 'working' | 'drop' | 'failure';
  weight: string;
  weightUnit: 'kg' | 'lb';
  reps: string;
  done: boolean;
};

/** Wskazanie serii, dla której otwarto modal (typ serii lub jednostka ciężaru). */
type SetSelectTarget = {
  exerciseId: string;
  setId: string;
};

// --- Czyste helpery (przeniesione 1:1 ze źródła RN) ---------------------------

/** Mapuje zapisaną serię (`WorkoutSet`) na formularz (`SetForm`, wartości jako stringi). */
function mapSet(set: WorkoutSet): SetForm {
  return {
    id: set.id,
    workoutExerciseId: set.workoutExerciseId,
    index: set.index,
    type: set.type,
    weight: set.weight != null ? set.weight.toString() : '',
    weightUnit: set.weightUnit ?? 'kg',
    reps: set.reps != null ? set.reps.toString() : '',
    done: set.done,
  };
}

/**
 * Zwraca formularz istniejącej serii albo tworzy pustą (domyślny typ `working`,
 * jednostka `kg`) — używane do uzupełnienia ćwiczeń bez serii trzema pustymi seriami.
 */
function mapSetOrCreate(
  set: WorkoutSet | undefined,
  workoutExerciseId: string,
  index: number,
): SetForm {
  if (set) return mapSet(set);
  return {
    id: `new-${workoutExerciseId}-${index}`,
    workoutExerciseId,
    index,
    type: 'working',
    weightUnit: 'kg',
    weight: '',
    reps: '',
    done: false,
  };
}

/** Konwertuje `SetForm` (stringi) na `WorkoutSet` (liczby) do zapisu. */
function toWorkoutSet(formSet: SetForm): WorkoutSet {
  return {
    id: formSet.id,
    workoutExerciseId: formSet.workoutExerciseId,
    index: formSet.index,
    type: formSet.type,
    weight: formSet.weight ? parseFloat(formSet.weight) : undefined,
    weightUnit: formSet.weightUnit,
    reps: formSet.reps ? parseInt(formSet.reps) : undefined,
    done: formSet.done,
  };
}

/**
 * Stan ekranu treningu — odpowiednik hooka `useWorkoutScreen` ze źródła RN.
 *
 * W RN był to custom hook (`useState`/`useEffect` + `useDebouncedValue`); tutaj to
 * serwis `@Injectable()` o zasięgu KOMPONENTU (NIE `providedIn: 'root'`), bo trzyma
 * efemeryczny stan jednego ekranu. Stan = signals (`useState`→`signal`), efekty
 * uboczne = `effect` (`useEffect`→`effect`), debounce 500 ms = `debouncedSignal`
 * (krok 011, jedyny wyjątek „signals first" — MAPPING §2.1).
 */
@Injectable()
export class WorkoutScreen {
  private readonly repository = inject(WorkoutRepository);

  // Wejście: id dnia treningowego (w RN parametr hooka). Zmiana → przeładowanie.
  private readonly trainingDayIdState = signal<string | undefined>(undefined);

  // Stan wewnętrzny (writable) — odpowiedniki `useState`.
  private readonly dayState = signal<TrainingDay | null>(null);
  private readonly exercisesState = signal<WorkoutExerciseWithName[]>([]);
  private readonly setsByExerciseIdState = signal<Record<string, SetForm[]>>({});
  private readonly typeSelectTargetState = signal<SetSelectTarget | null>(null);
  private readonly weightUnitSelectTargetState = signal<SetSelectTarget | null>(null);

  // Publiczne API tylko-do-odczytu (szablon konsumuje, nie mutuje bezpośrednio).
  readonly day = this.dayState.asReadonly();
  readonly exercises = this.exercisesState.asReadonly();
  readonly setsByExerciseId = this.setsByExerciseIdState.asReadonly();
  readonly typeSelectTarget = this.typeSelectTargetState.asReadonly();
  readonly weightUnitSelectTarget = this.weightUnitSelectTargetState.asReadonly();

  // By nie zapisywać przy każdym szybkim tapnięciu — dopiero po „uspokojeniu" zmian.
  private readonly debouncedSetsByExerciseId: Signal<Record<string, SetForm[]>> = debouncedSignal(
    this.setsByExerciseIdState,
    500,
  );

  constructor() {
    // Efekt ładowania danych (odpowiednik `useEffect` z zależnością [trainingDayId]).
    effect(() => {
      const trainingDayId = this.trainingDayIdState();
      if (!trainingDayId) return;

      this.repository.getWorkoutDetailsWithExerciseInfo(trainingDayId).then((details) => {
        this.dayState.set(details.day);
        this.exercisesState.set(details.exercises);
        this.setsByExerciseIdState.set(
          Object.fromEntries(
            details.exercises.map((exercise) => {
              const rawSets = details.setsByExerciseId[exercise.id] ?? [];
              const mappedSets = rawSets.length
                ? rawSets.map(mapSet)
                : [0, 1, 2].map((index) => mapSetOrCreate(undefined, exercise.id, index));
              return [exercise.id, mappedSets];
            }),
          ),
        );
      });
    });

    // Efekt autozapisu po debounce (odpowiednik `useEffect`
    // z zależnościami [debouncedSetsByExerciseId, trainingDayId]).
    effect(() => {
      const trainingDayId = this.trainingDayIdState();
      const debounced = this.debouncedSetsByExerciseId();
      if (!trainingDayId) return; // ← nie zapisuj, jeśli brak ID

      // Spłaszcz wszystkie serie ze wszystkich ćwiczeń do jednej tablicy.
      const allSets = Object.values(debounced).flat().map(toWorkoutSet);
      if (allSets.length === 0) return;

      // Jeden zapis dla wszystkich serii — brak race condition.
      this.repository
        .updateSets(allSets)
        .catch((error) => console.error('Error saving sets:', error));
    });
  }

  /** Ustawia id dnia treningowego (w RN: parametr hooka) — wyzwala przeładowanie. */
  setTrainingDayId(trainingDayId: string | undefined): void {
    this.trainingDayIdState.set(trainingDayId);
  }

  /** Otwiera/zamyka modal wyboru typu serii (target = `null` zamyka). */
  setTypeSelectTarget(target: SetSelectTarget | null): void {
    this.typeSelectTargetState.set(target);
  }

  /** Otwiera/zamyka modal wyboru jednostki ciężaru (target = `null` zamyka). */
  setWeightUnitSelectTarget(target: SetSelectTarget | null): void {
    this.weightUnitSelectTargetState.set(target);
  }

  /** Mutuje (immutowalnie) tylko wskazaną serię danego ćwiczenia, nakładając `patch`. */
  updateSetField(exerciseId: string, setId: string, patch: Partial<SetForm>): void {
    this.setsByExerciseIdState.update((prev) => {
      const currentSets = prev[exerciseId] ?? [];
      return {
        ...prev,
        [exerciseId]: currentSets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
      };
    });
  }

  /** Ustawia typ aktywnej serii i zamyka modal (target → `null`). */
  selectSetType(nextType: SetForm['type']): void {
    const target = this.typeSelectTargetState();
    if (!target) return;
    this.updateSetField(target.exerciseId, target.setId, { type: nextType });
    // Zamyka modal — widoczność zależy od targetu, `null` go ukrywa.
    this.typeSelectTargetState.set(null);
  }

  /** Ustawia jednostkę ciężaru aktywnej serii i zamyka modal (target → `null`). */
  selectWeightUnit(nextUnit: SetForm['weightUnit']): void {
    const target = this.weightUnitSelectTargetState();
    if (!target) return;
    this.updateSetField(target.exerciseId, target.setId, { weightUnit: nextUnit });
    this.weightUnitSelectTargetState.set(null);
  }
}
