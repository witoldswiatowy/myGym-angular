import { TrainingDay } from '../models/training-day';
import { WorkoutExercise } from '../models/workout-exercise';
import { WorkoutSet } from '../models/workout-set';

// =============================================================
// TRAINING DAYS
// =============================================================

export const SAMPLE_TRAINING_DAYS: TrainingDay[] = [
  {
    id: 'td_push_2026_04_14',
    date: '2026-04-14',
    note: 'Push — ramiona, triceps',
    durationMin: 65,
    createdAt: '2026-04-14T09:00:00.000Z',
  },
  {
    id: 'td_pull_2026_04_16',
    date: '2026-04-16',
    note: 'Pull — plecy, biceps',
    durationMin: 70,
    createdAt: '2026-04-16T09:00:00.000Z',
  },
];

// =============================================================
// WORKOUT EXERCISES
// =============================================================
// Dzień 1 — Push
//   1. overhead_press          (2 warmup + 3 working)
//   2. db_lateral_raise_lean   (2 warmup + 3 working)
//   3. rear_delt_fly           (3 working)
//   4. french_press            (3 working)
//   5. triceps_pushdown        (3 working)
//
// Dzień 2 — Pull
//   1. barbell_row_overhand    (2 warmup + 3 working)
//   2. narrow_lat_pulldown     (2 warmup + 3 working)
//   3. cable_biceps_curl       (3 working)
//   4. db_biceps_curl_supinated(3 working)
//   5. hammer_curl             (3 working)
// =============================================================

export const SAMPLE_WORKOUT_EXERCISES: WorkoutExercise[] = [
  // --- Dzień 1 ---
  {
    id: 'we_push_1',
    trainingDayId: 'td_push_2026_04_14',
    exerciseId: 'overhead_press',
    order: 0,
  },
  {
    id: 'we_push_2',
    trainingDayId: 'td_push_2026_04_14',
    exerciseId: 'db_lateral_raise_lean',
    order: 1,
  },
  {
    id: 'we_push_3',
    trainingDayId: 'td_push_2026_04_14',
    exerciseId: 'rear_delt_fly',
    order: 2,
  },
  {
    id: 'we_push_4',
    trainingDayId: 'td_push_2026_04_14',
    exerciseId: 'french_press',
    order: 3,
  },
  {
    id: 'we_push_5',
    trainingDayId: 'td_push_2026_04_14',
    exerciseId: 'triceps_pushdown',
    order: 4,
  },

  // --- Dzień 2 ---
  {
    id: 'we_pull_1',
    trainingDayId: 'td_pull_2026_04_16',
    exerciseId: 'barbell_row_overhand',
    order: 0,
  },
  {
    id: 'we_pull_2',
    trainingDayId: 'td_pull_2026_04_16',
    exerciseId: 'narrow_lat_pulldown',
    order: 1,
  },
  {
    id: 'we_pull_3',
    trainingDayId: 'td_pull_2026_04_16',
    exerciseId: 'cable_biceps_curl',
    order: 2,
  },
  {
    id: 'we_pull_4',
    trainingDayId: 'td_pull_2026_04_16',
    exerciseId: 'db_biceps_curl_supinated',
    order: 3,
  },
  {
    id: 'we_pull_5',
    trainingDayId: 'td_pull_2026_04_16',
    exerciseId: 'hammer_curl',
    order: 4,
  },
];

// =============================================================
// WORKOUT SETS
// =============================================================

export const SAMPLE_WORKOUT_SETS: WorkoutSet[] = [
  // ── overhead_press (we_push_1) ──────────────────────────────
  // 2 warmup
  {
    id: 'ws_push_1_1',
    workoutExerciseId: 'we_push_1',
    index: 0,
    type: 'warmup',
    weight: 40,
    weightUnit: 'kg',
    reps: 8,
    done: false,
  },
  {
    id: 'ws_push_1_2',
    workoutExerciseId: 'we_push_1',
    index: 0,
    type: 'warmup',
    weight: 50,
    weightUnit: 'kg',
    reps: 6,
    done: false,
  },
  // 3 working
  {
    id: 'ws_push_1_3',
    workoutExerciseId: 'we_push_1',
    index: 1,
    type: 'working',
    weight: 60,
    weightUnit: 'kg',
    reps: 8,
    done: false,
  },
  {
    id: 'ws_push_1_4',
    workoutExerciseId: 'we_push_1',
    index: 2,
    type: 'working',
    weight: 60,
    weightUnit: 'kg',
    reps: 8,
    done: false,
  },
  {
    id: 'ws_push_1_5',
    workoutExerciseId: 'we_push_1',
    index: 3,
    type: 'working',
    weight: 60,
    weightUnit: 'kg',
    reps: 7,
    done: false,
  },

  // ── db_lateral_raise_lean (we_push_2) ──────────────────────
  // 2 warmup
  {
    id: 'ws_push_2_1',
    workoutExerciseId: 'we_push_2',
    index: 0,
    type: 'warmup',
    weight: 6,
    weightUnit: 'kg',
    reps: 12,
    done: true,
  },
  {
    id: 'ws_push_2_2',
    workoutExerciseId: 'we_push_2',
    index: 0,
    type: 'warmup',
    weight: 8,
    weightUnit: 'kg',
    reps: 10,
    done: true,
  },
  // 3 working
  {
    id: 'ws_push_2_3',
    workoutExerciseId: 'we_push_2',
    index: 1,
    type: 'working',
    weight: 12,
    weightUnit: 'kg',
    reps: 12,
    done: true,
  },
  {
    id: 'ws_push_2_4',
    workoutExerciseId: 'we_push_2',
    index: 2,
    type: 'working',
    weight: 12,
    weightUnit: 'kg',
    reps: 12,
    done: true,
  },
  {
    id: 'ws_push_2_5',
    workoutExerciseId: 'we_push_2',
    index: 3,
    type: 'working',
    weight: 12,
    weightUnit: 'kg',
    reps: 11,
    done: true,
  },

  // ── rear_delt_fly (we_push_3) ───────────────────────────────
  // 3 working
  {
    id: 'ws_push_3_1',
    workoutExerciseId: 'we_push_3',
    index: 0,
    type: 'working',
    weight: 8,
    weightUnit: 'kg',
    reps: 15,
    done: true,
  },
  {
    id: 'ws_push_3_2',
    workoutExerciseId: 'we_push_3',
    index: 1,
    type: 'working',
    weight: 8,
    weightUnit: 'kg',
    reps: 14,
    done: true,
  },
  {
    id: 'ws_push_3_3',
    workoutExerciseId: 'we_push_3',
    index: 2,
    type: 'working',
    weight: 8,
    weightUnit: 'kg',
    reps: 13,
    done: true,
  },

  // ── french_press (we_push_4) ────────────────────────────────
  // 3 working
  {
    id: 'ws_push_4_1',
    workoutExerciseId: 'we_push_4',
    index: 0,
    type: 'working',
    weight: 30,
    weightUnit: 'kg',
    reps: 10,
    done: true,
  },
  {
    id: 'ws_push_4_2',
    workoutExerciseId: 'we_push_4',
    index: 1,
    type: 'working',
    weight: 30,
    weightUnit: 'kg',
    reps: 10,
    done: true,
  },
  {
    id: 'ws_push_4_3',
    workoutExerciseId: 'we_push_4',
    index: 2,
    type: 'working',
    weight: 30,
    weightUnit: 'kg',
    reps: 9,
    done: true,
  },

  // ── triceps_pushdown (we_push_5) ────────────────────────────
  // 3 working
  {
    id: 'ws_push_5_1',
    workoutExerciseId: 'we_push_5',
    index: 0,
    type: 'working',
    weight: 25,
    weightUnit: 'kg',
    reps: 12,
    done: true,
  },
  {
    id: 'ws_push_5_2',
    workoutExerciseId: 'we_push_5',
    index: 1,
    type: 'working',
    weight: 25,
    weightUnit: 'kg',
    reps: 12,
    done: true,
  },
  {
    id: 'ws_push_5_3',
    workoutExerciseId: 'we_push_5',
    index: 2,
    type: 'working',
    weight: 25,
    weightUnit: 'kg',
    reps: 11,
    done: true,
  },

  // ── barbell_row_overhand (we_pull_1) ────────────────────────
  // 2 warmup
  {
    id: 'ws_pull_1_1',
    workoutExerciseId: 'we_pull_1',
    index: 0,
    type: 'warmup',
    weight: 40,
    weightUnit: 'kg',
    reps: 8,
    done: true,
  },
  {
    id: 'ws_pull_1_2',
    workoutExerciseId: 'we_pull_1',
    index: 1,
    type: 'warmup',
    weight: 55,
    weightUnit: 'kg',
    reps: 6,
    done: true,
  },
  // 3 working
  {
    id: 'ws_pull_1_3',
    workoutExerciseId: 'we_pull_1',
    index: 2,
    type: 'working',
    weight: 70,
    weightUnit: 'kg',
    reps: 8,
    done: true,
  },
  {
    id: 'ws_pull_1_4',
    workoutExerciseId: 'we_pull_1',
    index: 3,
    type: 'working',
    weight: 70,
    weightUnit: 'kg',
    reps: 8,
    done: true,
  },
  {
    id: 'ws_pull_1_5',
    workoutExerciseId: 'we_pull_1',
    index: 4,
    type: 'working',
    weight: 70,
    weightUnit: 'kg',
    reps: 7,
    done: true,
  },

  // ── narrow_lat_pulldown (we_pull_2) ─────────────────────────
  // 2 warmup
  {
    id: 'ws_pull_2_1',
    workoutExerciseId: 'we_pull_2',
    index: 0,
    type: 'warmup',
    weight: 40,
    weightUnit: 'kg',
    reps: 10,
    done: true,
  },
  {
    id: 'ws_pull_2_2',
    workoutExerciseId: 'we_pull_2',
    index: 1,
    type: 'warmup',
    weight: 55,
    weightUnit: 'kg',
    reps: 8,
    done: true,
  },
  // 3 working
  {
    id: 'ws_pull_2_3',
    workoutExerciseId: 'we_pull_2',
    index: 2,
    type: 'working',
    weight: 65,
    weightUnit: 'kg',
    reps: 10,
    done: true,
  },
  {
    id: 'ws_pull_2_4',
    workoutExerciseId: 'we_pull_2',
    index: 3,
    type: 'working',
    weight: 65,
    weightUnit: 'kg',
    reps: 10,
    done: true,
  },
  {
    id: 'ws_pull_2_5',
    workoutExerciseId: 'we_pull_2',
    index: 4,
    type: 'working',
    weight: 65,
    weightUnit: 'kg',
    reps: 9,
    done: true,
  },

  // ── cable_biceps_curl (we_pull_3) ───────────────────────────
  // 3 working
  {
    id: 'ws_pull_3_1',
    workoutExerciseId: 'we_pull_3',
    index: 0,
    type: 'working',
    weight: 20,
    weightUnit: 'kg',
    reps: 12,
    done: true,
  },
  {
    id: 'ws_pull_3_2',
    workoutExerciseId: 'we_pull_3',
    index: 1,
    type: 'working',
    weight: 20,
    weightUnit: 'kg',
    reps: 12,
    done: true,
  },
  {
    id: 'ws_pull_3_3',
    workoutExerciseId: 'we_pull_3',
    index: 2,
    type: 'working',
    weight: 20,
    weightUnit: 'kg',
    reps: 11,
    done: true,
  },

  // ── db_biceps_curl_supinated (we_pull_4) ────────────────────
  // 3 working
  {
    id: 'ws_pull_4_1',
    workoutExerciseId: 'we_pull_4',
    index: 0,
    type: 'working',
    weight: 14,
    weightUnit: 'kg',
    reps: 10,
    done: true,
  },
  {
    id: 'ws_pull_4_2',
    workoutExerciseId: 'we_pull_4',
    index: 1,
    type: 'working',
    weight: 14,
    weightUnit: 'kg',
    reps: 10,
    done: true,
  },
  {
    id: 'ws_pull_4_3',
    workoutExerciseId: 'we_pull_4',
    index: 2,
    type: 'working',
    weight: 14,
    weightUnit: 'kg',
    reps: 9,
    done: true,
  },

  // ── hammer_curl (we_pull_5) ─────────────────────────────────
  // 3 working
  {
    id: 'ws_pull_5_1',
    workoutExerciseId: 'we_pull_5',
    index: 0,
    type: 'working',
    weight: 14,
    weightUnit: 'kg',
    reps: 12,
    done: true,
  },
  {
    id: 'ws_pull_5_2',
    workoutExerciseId: 'we_pull_5',
    index: 1,
    type: 'working',
    weight: 14,
    weightUnit: 'kg',
    reps: 12,
    done: true,
  },
  {
    id: 'ws_pull_5_3',
    workoutExerciseId: 'we_pull_5',
    index: 2,
    type: 'working',
    weight: 14,
    weightUnit: 'kg',
    reps: 11,
    done: true,
  },
];
