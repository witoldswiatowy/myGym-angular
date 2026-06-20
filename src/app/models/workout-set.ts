export type SetType = 'warmup' | 'working' | 'drop' | 'failure';

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
  weightUnit?: 'kg' | 'lb';
  distance?: number;
  distanceUnit?: 'm' | 'km' | 'ft' | 'yd';
  durationSec?: number; // czas trwania, np. dla cardio
  reps?: number;

  done: boolean;
  rpe?: number; // future-proof
  note?: string;
}
