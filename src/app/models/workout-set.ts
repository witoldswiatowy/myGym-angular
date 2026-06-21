export type SetType = 'warmup' | 'working' | 'drop' | 'failure';

// Jednostka ciężaru — wyniesiona 1:1 ze źródła RN (`WeightUnit` w
// `workout-weight-unit-modal.tsx`). Eksportowany alias spójny ze stylem `SetType`,
// reużywany przez modal wyboru jednostki (krok 026).
export type WeightUnit = 'kg' | 'lb';

//warmup - rozgrzewkowe, lekkie
//working - docelowe, ciężkie
//drop - drop set, czyli zmniejszamy ciężar i robimy kolejną serię, bez odpoczynku, aż do kolejnego upadku mięśniowego
//failure - seria do upadku mięśniowego, czyli wykonujemy tyle powtórzeń, ile jesteśmy w stanie, aż do całkowitego zmęczenia mięśni

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;

  index: number; // 0,1,2,3...
  type: SetType;

  weight?: number;
  weightUnit?: WeightUnit;
  distance?: number;
  distanceUnit?: 'm' | 'km' | 'ft' | 'yd';
  durationSec?: number; // czas trwania, np. dla cardio
  reps?: number;

  done: boolean;
  rpe?: number; // future-proof
  note?: string;
}
