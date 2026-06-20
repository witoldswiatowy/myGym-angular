import { Exercise } from '../models/exercise';

interface FilterOptions {
  query: string;
  muscleNameById: Record<string, string>;
  muscleNameEnById: Record<string, string>;
}

const CROSS_LANG_ALIASES: Record<string, string[]> = {
  barki: ['shoulders', 'delts', 'deltoids', 'naramienne'],
  shoulders: ['barki', 'naramienne', 'delty'],
  klatka: ['chest', 'pecs', 'pec'],
  chest: ['klatka', 'klatka piersiowa'],
  plecy: ['back', 'lats', 'grzbiet'],
  back: ['plecy', 'grzbiet', 'lats'],
  brzuch: ['abs', 'core'],
  abs: ['brzuch', 'core'],
  nogi: ['legs', 'lower body'],
  legs: ['nogi', 'dolne partie'],
  ramiona: ['arms'],
  arms: ['ramiona'],
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function expandQuery(normalizedQuery: string): string[] {
  if (!normalizedQuery) {
    return [];
  }

  const expanded = new Set<string>([normalizedQuery]);

  for (const [base, aliases] of Object.entries(CROSS_LANG_ALIASES)) {
    if (base.includes(normalizedQuery) || normalizedQuery.includes(base)) {
      expanded.add(base);
      for (const alias of aliases) {
        expanded.add(normalizeText(alias));
      }
    }
  }

  return [...expanded];
}

function buildSearchText(
  exercise: Exercise,
  muscleNameById: Record<string, string>,
  muscleNameEnById: Record<string, string>,
): string {
  const primaryMuscleName = muscleNameById[exercise.primaryMuscleId] ?? '';
  const primaryMuscleNameEn = muscleNameEnById[exercise.primaryMuscleId] ?? '';

  return normalizeText(
    [
      exercise.name,
      exercise.nameEn,
      ...(exercise.aliases ?? []),
      primaryMuscleName,
      primaryMuscleNameEn,
    ].join(' '),
  );
}

export function filterExercises(exercises: Exercise[], options: FilterOptions): Exercise[] {
  const normalizedQuery = normalizeText(options.query);

  if (!normalizedQuery) {
    return exercises;
  }

  const queryVariants = expandQuery(normalizedQuery);

  return exercises.filter((exercise) => {
    const searchableText = buildSearchText(
      exercise,
      options.muscleNameById,
      options.muscleNameEnById,
    );

    // Częściowe dopasowania po rozszerzonych wariantach zapytania PL/EN.
    return queryVariants.some((variant) => searchableText.includes(variant));
  });
}
