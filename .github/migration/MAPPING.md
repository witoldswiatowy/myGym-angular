# MAPPING.md — Kontrakt mapowania myGym (React Native + Expo → Angular)

> Autor: Analityk. Pisany RAZ, potem stały (źródło prawdy o konwencjach i mapowaniu).
> Czytany przez Plannera, Implementatora, Reviewer-Fixera i Final Reviewera.
> Repo źródłowe jest READ-ONLY. Repo docelowe: `../myGym-angular`.

---

## 1. Inwentarz źródła

Wersje źródła (z `package.json` / `app.json`): Expo SDK ~54, expo-router ~6,
React 19.1, React Native 0.81, TypeScript ~5.9, `strict: true`, alias `@/*` → root.

### 1.1. Ekrany (Expo Router, `app/`, file-based)

| Plik źródłowy                                            | Trasa          | Opis / stan                                                                                                                                        |
| -------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| [app/\_layout.tsx](../../app/_layout.tsx)                | layout (Tabs)  | Dolna nawigacja (Tabs): Home, Workout, History, Planner, Menu. Menu otwiera `Modal` zamiast trasy. `exercises` i `about-me` ukryte (`href: null`). |
| [app/index.tsx](../../app/index.tsx)                     | `/`            | Home — logo, brak logiki.                                                                                                                          |
| [app/workout/index.tsx](../../app/workout/index.tsx)     | `/workout?id=` | Ekran treningu dnia. Param `id`. Używa `useWorkoutScreen`, listy serii, 2 modale.                                                                  |
| [app/exercises/index.tsx](../../app/exercises/index.tsx) | `/exercises`   | Biblioteka ćwiczeń: szukaj (debounce 200 ms), sortowanie, `FlatList`, modal dodawania.                                                             |
| [app/history/index.tsx](../../app/history/index.tsx)     | `/history`     | Lista dni treningowych → nawigacja do `/workout?id=`.                                                                                              |
| [app/menu/index.tsx](../../app/menu/index.tsx)           | `/menu`        | Placeholder (link do `/exercises`); realne menu to modal w layoucie.                                                                               |
| [app/planner/index.tsx](../../app/planner/index.tsx)     | `/planner`     | Placeholder „In progress...".                                                                                                                      |
| [app/about-me/index.tsx](../../app/about-me/index.tsx)   | `/about-me`    | Statyczny ekran.                                                                                                                                   |

### 1.2. Modele (`src/models/`) — czyste interfejsy TS

| Plik                                                                 | Typy / kluczowe pola                                                                    |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [src/models/Exercise.ts](../../src/models/Exercise.ts)               | `Exercise` + aliasy typów `MuscleId`, `EquipmentId`, `TagId`. Relacje przez ID.         |
| [src/models/Muscle.ts](../../src/models/Muscle.ts)                   | `Muscle` (`colorHex`, `muscleGroupId`).                                                 |
| [src/models/MuscleGroup.ts](../../src/models/MuscleGroup.ts)         | `MuscleGroup`.                                                                          |
| [src/models/Equipment.ts](../../src/models/Equipment.ts)             | `Equipment`.                                                                            |
| [src/models/Tag.ts](../../src/models/Tag.ts)                         | `Tag`.                                                                                  |
| [src/models/TrainingDay.ts](../../src/models/TrainingDay.ts)         | `TrainingDay` (`date` ISO, `createdAt`).                                                |
| [src/models/WorkoutExercise.ts](../../src/models/WorkoutExercise.ts) | `WorkoutExercise` (`trainingDayId`, `exerciseId`, `order`, `supersetGroupId?`).         |
| [src/models/WorkoutSet.ts](../../src/models/WorkoutSet.ts)           | `WorkoutSet` + `SetType` (`warmup\|working\|drop\|failure`), jednostki, `done`, `rpe?`. |
| [src/models/Superset.ts](../../src/models/Superset.ts)               | `Superset` (zdefiniowany, jeszcze nieużywany w UI).                                     |

Wszystkie modele to czyste `interface`/`type` — mapują się 1:1 (bez DI, bez zmian logiki).

### 1.3. Dane seed (`src/data/`)

| Plik                                                                   | Eksport                                                                   |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [src/data/muscles.data.ts](../../src/data/muscles.data.ts)             | `MUSCLES: Muscle[]`                                                       |
| [src/data/muscle-groups.data.ts](../../src/data/muscle-groups.data.ts) | `MUSCLE_GROUPS: MuscleGroup[]`                                            |
| [src/data/equipment.data.ts](../../src/data/equipment.data.ts)         | `EQUIPMENT: Equipment[]`                                                  |
| [src/data/tags.data.ts](../../src/data/tags.data.ts)                   | `TAGS: Tag[]`                                                             |
| [src/data/exercises.data.ts](../../src/data/exercises.data.ts)         | `EXERCISES: Exercise[]`                                                   |
| [src/data/training-days.data.ts](../../src/data/training-days.data.ts) | `SAMPLE_TRAINING_DAYS`, `SAMPLE_WORKOUT_EXERCISES`, `SAMPLE_WORKOUT_SETS` |

Dane seed to stałe tablice — mapują się 1:1 jako stałe TS w repo docelowym.

### 1.4. Repozytoria (`src/repositories/`) — warstwa danych (AsyncStorage)

| Plik                                                                                     | API publiczne                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [src/repositories/exercise.repository.ts](../../src/repositories/exercise.repository.ts) | `ExerciseRepository` (obiekt-singleton): `getAll`, `add`, `resetToSeed`. Klucz `exercises.v1`. Wzorzec „get-or-seed".                                                                                                                                                                                                                                           |
| [src/repositories/workout.repository.ts](../../src/repositories/workout.repository.ts)   | `WorkoutRepository`: `getTrainingDays`, `getTrainingDayById`, `getExercisesForTrainingDay`, `getSetsForWorkoutExercise`, `updateSet`, `updateSets`, `getWorkoutDetails`, `getWorkoutDetailsWithExerciseInfo`, `resetToSeed`. Klucze `training-days.v1`, `workout-exercises.v1`, `workout-sets.v1`. Typy pomocnicze `WorkoutDetails`, `WorkoutExerciseWithName`. |

Cechy: wszystkie metody `async` (Promise), `try/catch` z fallbackiem do seed, prywatny helper `getOrSeed<T>`.

### 1.5. Hooki (`src/hooks/`)

| Plik                                                                       | Rola                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [src/hooks/use-debounced-value.ts](../../src/hooks/use-debounced-value.ts) | Generyczny debounce `useDebouncedValue<T>(value, delayMs)` na `setTimeout` + cleanup.                                                                                                                                                            |
| [src/hooks/use-workout-screen.ts](../../src/hooks/use-workout-screen.ts)   | Hook-stan ekranu treningu: ładuje dane, trzyma formularz serii (`SetForm` jako stringi), debounce 500 ms i autosave przez `updateSets`, zarządza targetami modali. Zawiera czyste funkcje pomocnicze `mapSet`, `mapSetOrCreate`, `toWorkoutSet`. |

### 1.6. Czyste funkcje (`src/search/`)

| Plik                                                                   | Eksport / logika                                                                                                                                                   |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [src/search/filter-exercises.ts](../../src/search/filter-exercises.ts) | `filterExercises(exercises, options)` — bez stanu. Normalizacja diakrytyków (NFD), słownik aliasów PL/EN (`CROSS_LANG_ALIASES`), `expandQuery`, `buildSearchText`. |

### 1.7. Komponenty (`src/components/`)

| Plik                                                                                                               | Rola                                                                        |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| [src/components/common/Screen.tsx](../../src/components/common/Screen.tsx)                                         | Wrapper layoutu + opcjonalny nagłówek; używa `useSafeAreaInsets`.           |
| [src/components/exercises/add-exercise-modal.tsx](../../src/components/exercises/add-exercise-modal.tsx)           | Modal opakowujący formularz; eksportuje typ `ExerciseFormValues`.           |
| [src/components/exercises/exercise-form.tsx](../../src/components/exercises/exercise-form.tsx)                     | Formularz dodawania ćwiczenia (stan lokalny, walidacja, `toggleSelection`). |
| [src/components/exercises/exercise-table-header.tsx](../../src/components/exercises/exercise-table-header.tsx)     | Nagłówek tabeli z sortowaniem.                                              |
| [src/components/exercises/exercise-table-row.tsx](../../src/components/exercises/exercise-table-row.tsx)           | Wiersz tabeli; resolvuje ID→nazwa ze słowników.                             |
| [src/components/exercises/exercises.style.ts](../../src/components/exercises/exercises.style.ts)                   | Style ekranu ćwiczeń.                                                       |
| [src/components/workout/workout-set-row.tsx](../../src/components/workout/workout-set-row.tsx)                     | Wiersz serii (typ, ciężar, jednostka, powtórzenia, checkbox done).          |
| [src/components/workout/workout-set-type-modal.tsx](../../src/components/workout/workout-set-type-modal.tsx)       | Modal wyboru typu serii.                                                    |
| [src/components/workout/workout-weight-unit-modal.tsx](../../src/components/workout/workout-weight-unit-modal.tsx) | Modal wyboru jednostki (kg/lb).                                             |
| [src/components/workout/workout.style.ts](../../src/components/workout/workout.style.ts)                           | Style ekranu treningu.                                                      |

### 1.8. Theme i konfiguracja

- [src/theme/spacing.ts](../../src/theme/spacing.ts) — `spacing` (`xs/sm/md/lg`) → tokeny SCSS.
- Style ekranowe: [app/app.style.ts](../../app/app.style.ts), [app/layout.style.ts](../../app/layout.style.ts) (`StyleSheet.create`).
- `tsconfig.json`: `strict: true`, alias `@/*`. `app.json`: typed routes, react compiler.

### 1.9. Kontekst produktu (z `docs/product-context.md`)

Offline-first, prosty start dla początkujących + opcjonalna analityka. Wyraźny
podział **plan vs wykonany trening**, pola zaawansowane opcjonalne. Implikacja
dla migracji: warstwa storage musi działać lokalnie (bez backendu).

---

## 2. Tabela mapowania koncepcji RN → Angular

| RN / Expo (źródło)                           | Angular (cel)                                                                  | Uwagi                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Expo Router (file-based, `app/`)             | Angular Router (deklaratywny, `app.routes.ts`, `Routes[]`)                     | Każdy `*/index.tsx` → trasa z `loadComponent` (lazy standalone). Param `?id=` → `:id` lub query param. |
| `Tabs` + `Tabs.Screen` (dolna nawigacja)     | Komponent layoutu z `<router-outlet>` + pasek zakładek (linki `routerLink`)    | `href: null` (exercises, about-me) → trasy istnieją, ale bez pozycji w pasku.                          |
| Komponent funkcyjny + hooki                  | Standalone component (`standalone: true`) + serwisy (`@Injectable`, DI)        | Domyślnie `ChangeDetectionStrategy.OnPush`.                                                            |
| `useState` / `useEffect`                     | **Signals** (`signal`, `computed`, `effect`) — DOMYŚLNE                        | Patrz uzasadnienie niżej. RxJS tylko dla strumieni czasu/zdarzeń (np. debounce).                       |
| `useMemo`                                    | `computed()`                                                                   | Wartości pochodne (np. słowniki ID→nazwa, lista sortowana).                                            |
| Custom hook `useWorkoutScreen`               | `@Injectable()` serwis ze stanem (signals) zasięgu komponentu                  | Stan + akcje (`updateSetField`, `selectSetType`, `selectWeightUnit`) jako metody serwisu.              |
| Custom hook `useDebouncedValue`              | Operator RxJS `debounceTime` lub util na signalach (`toObservable`/`toSignal`) | Jeden wyjątek od „signals first" — debounce naturalnie pasuje do RxJS.                                 |
| Czysta funkcja `filterExercises`             | Czysta funkcja TS (`search/filter-exercises.ts`)                               | Bez DI, mapuje się 1:1.                                                                                |
| Repozytoria (obiekt + AsyncStorage)          | `@Injectable({ providedIn: 'root' })` serwisy domenowe                         | Async pozostaje (Promise) — patrz decyzja D3 dot. silnika storage.                                     |
| `AsyncStorage`                               | Serwis `StorageService` (abstrakcja) nad localStorage **lub** IndexedDB        | Patrz decyzja **D3**.                                                                                  |
| `StyleSheet.create`                          | Pliki `*.scss` (style komponentu) + tokeny SCSS z `spacing.ts`                 | Wartości liczbowe RN → px; kolory inline → zmienne SCSS.                                               |
| `FlatList`                                   | `*ngFor` (`@for`) + CDK `cdk-virtual-scroll-viewport`                          | Tylko ekran ćwiczeń realnie listuje dużo elementów.                                                    |
| `Modal` (RN)                                 | Angular CDK Overlay / Dialog (`@angular/cdk/dialog`) lub `*ngIf` + overlay     | 3 modale: typ serii, jednostka, dodawanie ćwiczenia.                                                   |
| `TextInput` + `onChangeText`                 | `<input>` + Reactive Forms / `[(ngModel)]` + signal                            | Walidacja liczb (regex) zostaje w warstwie logiki.                                                     |
| `Pressable` / `Link` / `router.push`         | `(click)` + `Router.navigate` / `routerLink`                                   | `router.back()` → `Location.back()`.                                                                   |
| `useLocalSearchParams` / `useSafeAreaInsets` | `ActivatedRoute` (params) / brak odpowiednika (safe-area to natywne)           | Safe-area pomijamy w web (decyzja D4).                                                                 |
| `Checkbox`, `Picker` (expo)                  | `<input type="checkbox">` / `<select>` lub Angular Material                    | Patrz decyzja **D2** (Material vs własne).                                                             |
| `Image` / `require(...)`                     | `<img src="assets/...">`                                                       | Assety do `public/` lub `assets/`.                                                                     |

### 2.1. DECYZJA DOMYŚLNA: Signals (nie RxJS) jako podstawowy model stanu

**Wybieram Angular Signals** jako domyślny mechanizm stanu (odpowiednik
`useState`/`useEffect`/`useMemo`). Uzasadnienie:

- Model mentalny signals jest bliski hookom Reacta (wartość + reaktywne pochodne),
  co ułatwia wierne tłumaczenie KONCEPCJI, nie linii.
- `computed()` ≈ `useMemo`, `effect()` ≈ `useEffect` — mapowanie 1:1, mniej boilerplate'u.
- Stan w tej aplikacji jest głównie synchroniczny i lokalny (formularze, sortowanie),
  gdzie RxJS byłby nadmiarowy.
- Wbudowana integracja z `OnPush` i szablonem (`@for`, `@if`).

**Wyjątek:** RxJS używamy tam, gdzie chodzi o strumień w czasie — przede wszystkim
`debounceTime` (odpowiednik `useDebouncedValue`). Mostek: `toSignal` / `toObservable`.

---

## 3. Docelowa struktura katalogów `../myGym-angular`

```text
myGym-angular/
├─ angular.json
├─ package.json
├─ tsconfig.json                 # strict: true
├─ public/
│  └─ assets/images/             # logo, ikony (z assets/ źródła)
└─ src/
   ├─ main.ts
   ├─ index.html
   ├─ styles.scss                # globalne style + import tokenów
   └─ app/
      ├─ app.ts                   # root (klasa App)
      ├─ app.routes.ts            # deklaratywny routing (odpowiednik file-based)
      ├─ app.config.ts            # providers (router, itp.)
      ├─ core/
      │  ├─ storage/
      │  │  └─ storage.ts           # klasa StorageService (wyjątek: kolizja z globalnym Storage), abstrakcja AsyncStorage (D3)
      │  └─ layout/
      │     └─ tab-bar/             # odpowiednik Tabs z _layout.tsx
      ├─ models/                  # 1:1 z src/models (interfejsy, bez suffiksu — D9/A)
      │  ├─ exercise.ts
      │  ├─ muscle.ts
      │  ├─ muscle-group.ts
      │  ├─ equipment.ts
      │  ├─ tag.ts
      │  ├─ training-day.ts
      │  ├─ workout-exercise.ts
      │  ├─ workout-set.ts
      │  └─ superset.ts
      ├─ data/                    # dane seed (stałe, suffiks .data zachowany)
      │  ├─ muscles.data.ts
      │  ├─ muscle-groups.data.ts
      │  ├─ equipment.data.ts
      │  ├─ tags.data.ts
      │  ├─ exercises.data.ts
      │  └─ training-days.data.ts
      ├─ repositories/            # @Injectable serwisy danych (wzorzec DDD)
      │  ├─ exercise-repository.ts
      │  └─ workout-repository.ts
      ├─ search/
      │  └─ filter-exercises.ts   # czysta funkcja (1:1)
      ├─ shared/
      │  └─ utils/
      │     └─ debounce.ts        # odpowiednik use-debounced-value (RxJS)
      ├─ theme/
      │  └─ _spacing.scss         # tokeny z spacing.ts
      └─ features/
         ├─ home/
         │  └─ home.{ts,html,scss}             # klasa Home
         ├─ workout/
         │  ├─ workout.{ts,html,scss}          # klasa Workout
         │  ├─ workout-screen.ts               # klasa WorkoutScreen (odpowiednik use-workout-screen)
         │  └─ components/
         │     ├─ workout-set-row/
         │     ├─ workout-set-type-modal/
         │     └─ workout-weight-unit-modal/
         ├─ exercises/
         │  ├─ exercises.{ts,html,scss}        # klasa Exercises
         │  └─ components/
         │     ├─ add-exercise-modal/
         │     ├─ exercise-form/
         │     ├─ exercise-table-header/
         │     └─ exercise-table-row/
         ├─ history/
         │  └─ history.{ts,html,scss}          # klasa History
         ├─ planner/
         │  └─ planner.{ts,html,scss}          # klasa Planner
         └─ about-me/
            └─ about-me.{ts,html,scss}         # klasa AboutMe
```

> Struktura jest propozycją; ostateczny podział `features/` vs `core/` Planner może
> doprecyzować, ale nazewnictwo i kebab-case są wiążące (sekcja 4).

---

## 4. Konwencje (wiążące dla wszystkich agentów)

- **Nazewnictwo plików (Angular 22 — D9/A):** kebab-case, BEZ suffiksu typu.
  Nazwa pliku = kebab-case nazwy klasy. `home.ts` (klasa `Home`),
  `workout-screen.ts` (klasa `WorkoutScreen`), `exercise.ts` (interfejs `Exercise`).
  Wyjątki domenowe (nie będące typem schematu Angulara): repozytoria
  `*-repository.ts` (klasa `XxxRepository`), dane seed `*.data.ts`, routing
  `app.routes.ts`, root `app.ts`. Storage: plik `storage.ts`, klasa `StorageService`
  (świadomy wyjątek — kolizja z globalnym `Storage`).
- **Selektory komponentów:** prefiks `app-` (np. `app-workout-set-row`).
- **TypeScript:** `strict: true`, zakaz `any`, zakaz `// @ts-ignore` (zgodnie z PROCESS.md sek. 6).
- **Język:** identyfikatory i nazwy w kodzie po **angielsku**; komentarze po **polsku**;
  komunikacja z człowiekiem po polsku (PROCESS.md sek. 2).
- **Wersja Angulara:** najnowszy stabilny (min. v20+) pobrany przez `ng new`
  przy inicjalizacji repo docelowego — patrz decyzja **D8**.
- **Stan:** signals jako domyślne; RxJS tylko dla strumieni czasowych (debounce).
- **Komponenty:** `standalone: true`, `ChangeDetectionStrategy.OnPush`.
- **Control flow w szablonach:** nowy `@if` / `@for` / `@switch` (nie `*ngIf`/`*ngFor`).
- **Style:** SCSS per komponent; wspólne tokeny w `theme/_spacing.scss`;
  twarde kolory (np. `#ffc457`, `orange`) → zmienne SCSS, nie powtarzać inline.
- **Zachowanie funkcjonalne > wierność implementacji** — tłumaczymy koncepcje.
- **Storage:** dostęp do danych wyłącznie przez repozytoria; repozytoria przez `StorageService`.
- **Asynchroniczność:** publiczne API repozytoriów pozostaje `Promise`-owe (zachowanie 1:1).

---

## 5. Decyzje — ROZSTRZYGNIĘTE przez człowieka (2026-06-20)

> Rejestr wiążący w `DECISIONS.md`. Poniżej skrót dla kontekstu mapowania.

- **D1 — Routing parametru treningu → QUERY PARAM.** Zachowujemy `/workout?id=...`
  (jak w źródle). W Angularze: `ActivatedRoute.queryParamMap` / `queryParams`.
- **D2 — Biblioteka UI → ANGULAR MATERIAL (+ CDK).** Używamy Material (Dialog,
  Checkbox, Select) oraz CDK (Overlay, Virtual Scroll).
- **D3 — Silnik storage → IndexedDB** za abstrakcją `StorageService`
  (asynchroniczne, offline-first, bliskie modelowi `AsyncStorage`).
- **D4 — Safe-area / mobilny layout → POMIJAMY.** Cel = aplikacja webowa (SPA).
  `useSafeAreaInsets` bez odpowiednika; brak warstwy safe-area.
- **D5 — Tab bar vs menu → ZWYKŁA NAWIGACJA `routerLink`.** „Menu" i ekrany poza
  paskiem upraszczamy do tras + `routerLink` (bez wzorca Modal-jako-nawigacja).
- **D6 — Placeholdery → MIGRUJEMY JAKO PUSTE EKRANY.** `planner`, `menu` jako
  komponenty-placeholdery (1:1 zachowanie szczątkowe).
- **D7 — Model `Superset` → PRZENOSIMY (1:1)** bez logiki, zgodnie z wiernością danych.
- **D8 — Wersja Angulara → NAJNOWSZY STABILNY** pobrany przez `ng new` w chwili
  inicjalizacji repo docelowego (min. v20+). Wymaga: standalone components, signals,
  nowy control flow (`@if/@for/@switch`), builder esbuild/vite. Konkretny numer
  zostaje przypięty w `package.json` repo `../myGym-angular` przy inicjalizacji.
