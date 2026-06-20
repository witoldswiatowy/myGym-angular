export interface WorkoutExercise {
  id: string;
  trainingDayId: string;
  exerciseId: string; // referencja do Exercise
  order: number; // kolejność w dniu
  note?: string;

  supersetGroupId?: string; // null = nie w superset
}
