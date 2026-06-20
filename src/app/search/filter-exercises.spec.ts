import { Exercise } from '../models/exercise';
import { filterExercises } from './filter-exercises';

// Identyfikatory mięśni używane w słownikach testowych.
// Oddzielamy "tylko EN" od "tylko PL", by jednoznacznie sprawdzić aliasy między językami.
const muscleNameById: Record<string, string> = {
  quads: 'Czworogłowe ud',
  delts_en: '', // brak nazwy PL — tekst wyszukiwania ma tylko nazwę angielską mięśnia
  delts_pl: 'Barki', // brak nazwy EN — tekst wyszukiwania ma tylko nazwę polską mięśnia
  back: 'Plecy',
};

const muscleNameEnById: Record<string, string> = {
  quads: 'Quadriceps',
  delts_en: 'Shoulders',
  delts_pl: '',
  back: 'Back',
};

// Ćwiczenie z angielską nazwą mięśnia "Shoulders" w słowniku — do testów aliasów.
const exSoldier: Exercise = {
  id: 'ex_soldier',
  name: 'Wyciskanie żołnierskie',
  nameEn: 'Military Press',
  primaryMuscleId: 'delts_en',
  secondaryMuscleIds: [],
  equipmentIds: [],
  tagIds: [],
};

// Ćwiczenie, którego tekst wyszukiwania zawiera tylko angielską nazwę mięśnia "Shoulders".
const exLateralEn: Exercise = {
  id: 'ex_lateral_en',
  name: 'Lateral Raise',
  nameEn: 'Lateral Raise',
  primaryMuscleId: 'delts_en',
  secondaryMuscleIds: [],
  equipmentIds: [],
  tagIds: [],
};

// Ćwiczenie, którego tekst wyszukiwania zawiera tylko polską nazwę mięśnia "Barki".
const exArnoldPl: Exercise = {
  id: 'ex_arnold_pl',
  name: 'Wyciskanie Arnolda',
  nameEn: 'Arnold Movement',
  primaryMuscleId: 'delts_pl',
  secondaryMuscleIds: [],
  equipmentIds: [],
  tagIds: [],
};

// Ćwiczenie do testu dopasowania częściowego (po fragmencie nazwy).
const exSquat: Exercise = {
  id: 'ex_squat',
  name: 'Przysiad ze sztangą',
  nameEn: 'Barbell Squat',
  primaryMuscleId: 'quads',
  secondaryMuscleIds: [],
  equipmentIds: [],
  tagIds: [],
};

const exRow: Exercise = {
  id: 'ex_row',
  name: 'Wiosłowanie sztangą',
  nameEn: 'Barbell Row',
  primaryMuscleId: 'back',
  secondaryMuscleIds: [],
  equipmentIds: [],
  tagIds: [],
};

const allExercises: Exercise[] = [exSoldier, exLateralEn, exArnoldPl, exSquat, exRow];

const options = (query: string) => ({
  query,
  muscleNameById,
  muscleNameEnById,
});

describe('filterExercises', () => {
  it('zwraca całe wejście, gdy query jest puste lub tylko białe znaki', () => {
    // Pusty string — zwraca dokładnie tę samą referencję (brak kopiowania).
    expect(filterExercises(allExercises, options(''))).toBe(allExercises);
    // Same białe znaki — po trim też traktowane jako brak query.
    expect(filterExercises(allExercises, options('   '))).toBe(allExercises);
  });

  it('normalizuje diakrytyki (NFD) — query bez ogonków pasuje do nazwy z ogonkami', () => {
    // "sztangą" -> NFD rozkłada "ą" na "a" + ogonek (U+0328), który jest usuwany.
    // Uwaga 1:1 ze źródłem: NFD NIE rozkłada "ł" (U+0142), więc tu używamy "ą".
    const result = filterExercises(allExercises, options('sztanga'));

    // Oba ćwiczenia mają w nazwie "sztangą" — kolejność zachowana z wejścia.
    expect(result).toEqual([exSquat, exRow]);
  });

  it('dopasowuje po aliasie PL→EN — query "barki" trafia w angielskie "Shoulders"', () => {
    const result = filterExercises(allExercises, options('barki'));

    // Ćwiczenia, których tekst zawiera angielskie "Shoulders" (z aliasu barki→shoulders).
    expect(result).toContain(exSoldier);
    expect(result).toContain(exLateralEn);
    // Ćwiczenie bez nazwy mięśnia związanej z barkami nie pasuje.
    expect(result).not.toContain(exSquat);
    expect(result).not.toContain(exRow);
  });

  it('dopasowuje po aliasie EN→PL — query "shoulders" trafia w polskie "Barki"', () => {
    const result = filterExercises(allExercises, options('shoulders'));

    // Ćwiczenie z polską nazwą mięśnia "Barki" (z aliasu shoulders→barki).
    expect(result).toContain(exArnoldPl);
    // Oraz ćwiczenia z bezpośrednim angielskim "Shoulders".
    expect(result).toContain(exSoldier);
    expect(result).toContain(exLateralEn);
  });

  it('dopasowuje częściowo — fragment "przysi" trafia w "Przysiad"', () => {
    const result = filterExercises(allExercises, options('przysi'));

    expect(result).toEqual([exSquat]);
  });

  it('dopasowuje po nazwie angielskiej ćwiczenia (case-insensitive)', () => {
    const result = filterExercises(allExercises, options('BARBELL'));

    expect(result).toEqual([exSquat, exRow]);
  });

  it('jest czysta — te same wejścia dają identyczny wynik i nie mutują wejścia', () => {
    const snapshot = [...allExercises];

    const first = filterExercises(allExercises, options('przysi'));
    const second = filterExercises(allExercises, options('przysi'));

    expect(first).toEqual(second);
    // Wejściowa tablica nie została zmieniona.
    expect(allExercises).toEqual(snapshot);
  });
});
