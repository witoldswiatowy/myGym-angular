# Code Review — myGym-angular

> Zakres: wyłącznie aplikacja Angularowa (`myGym-angular`). Review skupia się na jakości
> rozwiązań angularowych, architekturze, zasadach SOLID / DRY / Clean Code oraz zgodności
> z aktualnymi konwencjami Angulara (v22, standalone, signals, zoneless).
> Repozytorium źródłowe (React Native) celowo **nie** było analizowane.
>
> Konwencja oceny ważności: 🔴 krytyczne · 🟠 wysokie · 🟡 średnie · 🟢 niskie / kosmetyczne.

---

## 1. Ocena ogólna

Projekt jest **solidny i nowoczesny**. Widać dobrą znajomość najnowszego Angulara:
standalone components, `ChangeDetectionStrategy.OnPush` wszędzie, signal-based state
(`signal`, `computed`, `linkedSignal`, `input`, `output`), `inject()` zamiast konstruktorów,
lazy `loadComponent`, sensowna warstwa repozytoriów nad abstrakcją `StorageService`
(IndexedDB), oraz porządne testy (Vitest + fake timers + `ApplicationRef.tick()`).
TypeScript jest w trybie `strict` z dodatkowymi flagami — bardzo dobrze.

Główne obszary do poprawy dotyczą **rozkładu odpowiedzialności (SRP)**, **kilku realnych
naruszeń DRY**, **podejścia do formularzy**, **ładowania danych przez `effect()`** oraz
**nadmiarowych komentarzy „migracyjnych"**, które zaśmiecają kod produkcyjny.

**Mocne strony (warte utrzymania):**

- Konsekwentny OnPush + signals → przewidywalny, wydajny change detection.
- Czysta funkcja `filterExercises` wydzielona do `search/` i osobno testowana — wzorzec do naśladowania.
- Stan ekranu treningu wydzielony do serwisu `WorkoutScreen` o zasięgu komponentu (`providers: [WorkoutScreen]`) — dobry pattern „per-screen state".
- `StorageService` jako wymienialna abstrakcja trwałości (łatwa do podmiany/mockowania).
- Sensowne pokrycie testami logiki (repozytoria, filtr, debounce, stan ekranu).

---

## 2. Znaleziska krytyczne 🔴

### 2.1. Brak jawnej konfiguracji zoneless change detection

**Lokalizacja:** [src/app/app.config.ts](src/app/app.config.ts), [src/main.ts](src/main.ts)

Aplikacja działa w trybie zoneless (brak `zone.js` w zależnościach i w `polyfills`),
ale `app.config.ts` **nie zawiera** `provideZonelessChangeDetection()`. Tryb zoneless jest
więc wynikiem _braku_ zone.js, a nie świadomej, jawnej deklaracji. To kruche: każdy, kto
dołoży zone.js (np. tranzytywnie) albo przeczyta config, nie ma sygnału, że to celowa decyzja
architektoniczna. Brakuje też deklaracji intencji dla narzędzi i przyszłych deweloperów.

**Propozycje:**

1. **(Zalecane)** Dodać jawnie provider do `app.config.ts`:
   ```ts
   import { provideZonelessChangeDetection } from '@angular/core';
   // ...
   providers: [
     provideZonelessChangeDetection(),
     provideBrowserGlobalErrorListeners(),
     provideAnimationsAsync(),
     provideRouter(routes),
   ],
   ```
2. Dodać ten sam provider w `TestBed` konfiguracjach testów, aby środowisko testowe odzwierciedlało produkcję (część testów już ręcznie woła `appRef.tick()` — jawny provider to ujednolici).
3. Udokumentować decyzję jednym zdaniem w configu (zamiast polegać na „braku zone.js jako sygnale").

---

### 2.2. Ładowanie danych przez `effect()` zamiast `resource()` — anty-wzorzec + potencjalny bug

**Lokalizacja:** [src/app/features/workout/workout-screen.ts](src/app/features/workout/workout-screen.ts)

Serwis stanu używa `effect()` zarówno do **pobierania danych** (efekt ładujący woła
`repository.getWorkoutDetailsWithExerciseInfo(...).then(...)` i ustawia kilka sygnałów),
jak i do **autozapisu**. Zespół Angulara wprost odradza używanie `effect()` do
pobierania danych / orkiestracji asynchronicznej — od tego jest `resource()` / `rxResource()`.

Dodatkowo w efekcie autozapisu jest realne ryzyko **race / zapisu nie do tego dnia**: efekt
zależy od `trainingDayIdState` **i** `debouncedSetsByExerciseId`. Po zmianie dnia treningowego
zdebounce'owane serie z poprzedniego dnia mogą jeszcze „dojechać" i zostać zapisane już po
przeładowaniu — kolejność emisji nie jest tu chroniona.

**Propozycje:**

1. **(Zalecane)** Zamienić efekt ładujący na `resource()` z parametrem `trainingDayId`:
   ```ts
   private readonly details = resource({
     params: () => this.trainingDayIdState(),
     loader: ({ params: id }) =>
       id ? this.repository.getWorkoutDetailsWithExerciseInfo(id) : Promise.resolve(null),
   });
   ```
   a `exercises`/`setsByExerciseId` wyliczać jako `computed` z `details.value()`. Eliminuje ręczne `effect` + `.then` + `set`.
2. Autozapis zostawić jako efekt, ale „zamrozić" kontekst: zapisywać tylko gdy `trainingDayId` zgadza się z dniem, dla którego dane były załadowane (np. trzymać `loadedDayId` i porównywać), albo przenieść zapis do jawnej akcji wyzwalanej zmianą pola.
3. Minimum: dodać guard porównujący id, dla którego zbudowano `allSets`, z aktualnym `trainingDayId()` tuż przed `updateSets`.

---

## 3. Znaleziska wysokie 🟠

### 3.1. Komponent `Exercises` łamie SRP — robi zbyt wiele

**Lokalizacja:** [src/app/features/exercises/exercises.ts](src/app/features/exercises/exercises.ts)

Komponent jednocześnie: buduje 6 słowników `*ById` z danych seed, filtruje, **implementuje
złożony algorytm sortowania** (po grupach mięśniowych + locale `pl`), generuje ID nowego
ćwiczenia (`Date.now().toString(36)`), oraz orkiestruje zapis przez repozytorium. To 4–5
odrębnych odpowiedzialności w jednym komponencie prezentacyjnym. Dla porównania — filtrowanie
zostało ładnie wydzielone do czystej funkcji `filterExercises`, ale sortowanie i generacja ID
już nie. Niespójność i trudność testowania (stąd `sortedExercises` jest sztucznie `public`
„dla testów").

**Propozycje:**

1. **(Zalecane)** Wydzielić sortowanie do czystej funkcji `sortExercises(list, { key, dir, ...lookups })` w `search/` — analogicznie do `filterExercises`. Testowalna bez komponentu, znika potrzeba publicznego `sortedExercises`.
2. Generację ID przenieść do `ExerciseRepository.add()` lub osobnej fabryki `createExercise(values)` — to logika domenowa, nie prezentacyjna. Komponent powinien tylko przekazać `ExerciseFormValues`.
3. Budowę słowników `*ById` zamknąć w lookup-serwisie (`ExerciseLookups`) z `providedIn: 'root'`, współdzielonym między komponentem a `filter/sort` — patrz też 3.3 (DRY).

---

### 3.2. Formularz pisany „ręcznie" zamiast Angular Forms

**Lokalizacja:** [src/app/features/exercises/components/exercise-form/exercise-form.ts](src/app/features/exercises/components/exercise-form/exercise-form.ts), [src/app/features/exercises/components/exercise-form/exercise-form.html](src/app/features/exercises/components/exercise-form/exercise-form.html)

Formularz odtwarza stan ręcznie: osobne sygnały na każde pole, ręczne handlery
`(event.target as HTMLInputElement).value`, ręczna walidacja `isValid` jako `computed`.
To dużo boilerplate'u i ominięcie integracji Material (brak `mat-error`, stanów
`touched`/`dirty`, walidatorów). Dodatkowo flaga `submitting` jest **martwą złożonością** —
komentarz sam przyznaje, że `output.emit()` jest synchroniczny, więc zabezpieczenie przed
podwójnym zapisem nigdy się nie aktywuje (narusza YAGNI / Clean Code).

**Propozycje:**

1. **(Zalecane)** Przepisać na **Reactive Forms** (`FormGroup` + `Validators`): deklaratywna walidacja, `mat-error`, mniej kodu, natywne wsparcie Material. Rzutowania `event.target` znikają.
2. Alternatywnie — jeśli celem jest pozostanie przy signalach — rozważyć Angular **Signal Forms** (eksperymentalne w v22) lub minimalnie: jeden sygnał obiektu `formValue` zamiast pięciu osobnych.
3. Niezależnie od wyboru — **usunąć `submitting`** i blok `try/finally`; to skomplikowanie bez efektu.

---

### 3.3. Powtarzalne budowanie słowników `*ById` (DRY)

**Lokalizacja:** [src/app/features/exercises/exercises.ts](src/app/features/exercises/exercises.ts) (6×), [src/app/repositories/workout-repository.ts](src/app/repositories/workout-repository.ts) (`exerciseNameById` przez `reduce`)

Wzorzec `Object.fromEntries(ITEMS.map((x) => [x.id, x.coś]))` powtarza się sześciokrotnie
w `Exercises` i raz (w innej formie, `reduce`) w repozytorium. Identyczna intencja, różne
zapisy — klasyczne naruszenie DRY i okazja do pomyłki.

**Propozycje:**

1. **(Zalecane)** Dodać generyczny helper w `shared/utils`:
   ```ts
   export const indexBy = <T, V>(
     items: readonly T[],
     key: (t: T) => string,
     val: (t: T) => V,
   ): Record<string, V> => Object.fromEntries(items.map((i) => [key(i), val(i)] as const));
   ```
   i używać `indexBy(MUSCLES, m => m.id, m => m.name)`.
2. Stałe słowniki (zależne tylko od danych seed) przenieść do jednego `LookupService` liczącego je raz i udostępniającego wszystkim konsumentom (komponent, filter, sort).
3. Ujednolicić styl w repozytorium — użyć tego samego `indexBy` zamiast osobnego `reduce`.

---

### 3.4. Duplikacja typu `WeightUnit` i mapy `SET_TYPE_LABEL` (DRY)

**Lokalizacja:**

- Typ `WeightUnit`: zdefiniowany w [src/app/models/workout-set.ts](src/app/models/workout-set.ts) i **ponownie** zadeklarowany w [src/app/features/workout/components/workout-set-row/workout-set-row.ts](src/app/features/workout/components/workout-set-row/workout-set-row.ts).
- Mapa `SET_TYPE_LABEL`: zduplikowana 1:1 w [src/app/features/workout/workout.ts](src/app/features/workout/workout.ts) i [src/app/features/workout/components/workout-set-type-modal/workout-set-type-modal.ts](src/app/features/workout/components/workout-set-type-modal/workout-set-type-modal.ts).

Dwie kopie tej samej prawdy → ryzyko rozjechania się (np. zmiana etykiety w jednym miejscu).

**Propozycje:**

1. **(Zalecane)** `WeightUnit` importować z modelu (`workout-set.ts`) zamiast deklarować lokalnie w wierszu.
2. `SET_TYPE_LABEL` (oraz `SET_TYPE_OPTIONS`) wynieść do jednego pliku domenowego, np. `models/workout-set.ts` lub `features/workout/workout-set.constants.ts`, i importować w obu miejscach.
3. Rozważyć enuma/union + pojedyncze źródło etykiet jako `Record<SetType, string>` eksportowane raz; testy mogą wtedy weryfikować kompletność mapy.

---

### 3.5. Nadmiarowe komentarze „migracyjne" w kodzie produkcyjnym

**Lokalizacja:** praktycznie każdy plik (np. [exercises.ts](src/app/features/exercises/exercises.ts), [workout.ts](src/app/features/workout/workout.ts), [tab-bar.ts](src/app/core/layout/tab-bar/tab-bar.ts))

Komentarze opisują _proces migracji_ („krok 024", „D1/D2/D9", „MAPPING §2.1", „odpowiednik
RN", „1:1 ze źródłem"), a nie _intencję kodu_. To zaśmieca pliki, wiąże kod z historią
migracji (która po jej zakończeniu jest nieistotna) i utrudnia czytanie. Clean Code: komentarz
ma tłumaczyć „dlaczego tak", a nie narrację skąd kod pochodzi.

**Propozycje:**

1. **(Zalecane)** Usunąć referencje do kroków/decyzji migracji; zostawić wyłącznie komentarze wyjaśniające nieoczywiste decyzje techniczne (np. dlaczego query param zamiast path param).
2. Przenieść wiedzę o decyzjach (D1/D2/...) do jednego pliku `docs/decisions.md` (ADR), a w kodzie zostawić zwięzłe „dlaczego".
3. Jeśli komentarze mają wartość onboardingową — skrócić je do 1 linii i odlinkować do ADR zamiast powielać kontekst w każdym pliku.

---

## 4. Znaleziska średnie 🟡

### 4.1. Niespójna i cicha obsługa błędów w repozytoriach

**Lokalizacja:** [src/app/repositories/workout-repository.ts](src/app/repositories/workout-repository.ts), [src/app/repositories/exercise-repository.ts](src/app/repositories/exercise-repository.ts)

Część metod **połyka** błędy i zwraca dane seed (`getOrSeed`, `getAll` w `catch` → `return seed`),
a część **rzuca** dalej (`add`, `resetToSeed`). Po cichym fallbacku do seed użytkownik może
nieświadomie pracować na danych zalążkowych i nadpisać realny zapis. Brak też jednolitej
strategii zgłaszania awarii do UI.

**Propozycje:**

1. Ujednolicić politykę: albo wszędzie propagować błąd i obsłużyć go w warstwie UI, albo zwracać `Result<T>`/sygnał błędu, który ekran może pokazać.
2. Wprowadzić `ErrorHandler` / serwis logowania zamiast `console.error` i cichych fallbacków (patrz 4.2).
3. Rozróżnić „brak danych" (legalny → seed) od „błąd storage" (nie powinien po cichu seedować) — to dwie różne ścieżki.

---

### 4.2. `console.log` / `console.error` w kodzie produkcyjnym

**Lokalizacja:** [exercise-repository.ts](src/app/repositories/exercise-repository.ts) (`console.log('Exercise added to storage:', ...)`), [workout-repository.ts](src/app/repositories/workout-repository.ts), [workout-screen.ts](src/app/features/workout/workout-screen.ts), [workout.ts](src/app/features/workout/workout.ts)

Logi debugowe (`console.log`) i bezpośrednie `console.error` w warstwie danych — szum w
produkcji i brak kontroli nad poziomem logowania.

**Propozycje:**

1. **(Zalecane)** Wprowadzić `LoggerService` (z `providedIn: 'root'`) z poziomami i wyciszeniem w produkcji.
2. Podpiąć globalny `ErrorHandler` Angulara dla błędów krytycznych zamiast lokalnych `console.error`.
3. Minimum: usunąć `console.log` debugowe; błędy zgłaszać jednym, spójnym kanałem.

---

### 4.3. Powielony wzorzec „get-or-seed" między repozytoriami (DRY)

**Lokalizacja:** [workout-repository.ts](src/app/repositories/workout-repository.ts) (`getOrSeed<T>`) vs [exercise-repository.ts](src/app/repositories/exercise-repository.ts) (`getAll` ma własną kopię tej samej logiki try/get/seed/catch)

Ta sama logika „odczytaj; jeśli pusto — zasiej i zapisz; w błędzie — zwróć seed" istnieje w
dwóch miejscach w dwóch nieco różnych formach.

**Propozycje:**

1. **(Zalecane)** Wynieść `getOrSeed` do bazowej klasy/utilsa repozytorium albo do samego `StorageService` jako `getOrSeed(key, seedFactory)`.
2. Przekazywać `seed` jako **fabrykę** (`() => T`), by uniknąć współdzielenia referencji do stałych (patrz 4.4).
3. `ExerciseRepository.getAll` przepiąć na ten wspólny helper.

---

### 4.4. Zwracanie referencji do stałych seed (ryzyko współdzielonej mutowalności)

**Lokalizacja:** [exercise-repository.ts](src/app/repositories/exercise-repository.ts) (`return EXERCISES`), [workout-repository.ts](src/app/repositories/workout-repository.ts) (`return seed`)

Przy pustym storage metody zwracają **bezpośrednio** zaimportowaną stałą (`EXERCISES`,
`SAMPLE_*`). Konsument, który zmodyfikuje tablicę/obiekt w miejscu, mógłby zmutować globalny
seed na czas życia aplikacji. Obecni konsumenci tworzą nowe tablice (spread/map), więc bug się
nie ujawnia, ale to pułapka czekająca na pierwszego nieuważnego użytkownika.

**Propozycje:**

1. **(Zalecane)** Zwracać kopie: `structuredClone(seed)` lub `[...seed]` przy seedowaniu.
2. Oznaczyć stałe jako `readonly`/`as const` i typować zwroty jako `readonly T[]`, by kompilator blokował mutacje.
3. Wariant z fabryką seed (`() => structuredClone(SEED)`) — łączy się z 4.3.

---

### 4.5. Routing: parametr w query zamiast w ścieżce + brak prawdziwego 404

**Lokalizacja:** [src/app/app.routes.ts](src/app/app.routes.ts), [workout.ts](src/app/features/workout/workout.ts)

Identyfikator treningu jest przekazywany jako `?id=...` zamiast segmentu `workout/:id`.
Ścieżka `**` przekierowuje na Home zamiast pokazać ekran „nie znaleziono", co maskuje błędne
URL-e. Dodatkowo odczyt `id` jest realizowany ręcznie (`toSignal(queryParamMap)` + `effect`
przepychający wartość do serwisu) — sporo plumbingu.

**Propozycje:**

1. **(Zalecane)** Użyć `provideRouter(routes, withComponentInputBinding())` i przyjmować `id` jako `input()` komponentu — znika `ActivatedRoute` + `effect` + `toSignal`. (Działa też z query paramami.)
2. Rozważyć `workout/:id` jako bardziej „linkowalny"/RESTowy adres; wtedy `id` mapuje się wprost na input.
3. Dodać dedykowany komponent `NotFound` dla `**` zamiast cichego redirectu na Home.

---

### 4.6. „Tabela" zbudowana z `<div>` zamiast semantycznego `<table>` (dostępność)

**Lokalizacja:** [src/app/features/exercises/exercises.html](src/app/features/exercises/exercises.html), [exercise-table-row.html](src/app/features/exercises/components/exercise-table-row/exercise-table-row.html), [exercise-table-header](src/app/features/exercises/components/exercise-table-header)

Nazwy sugerują tabelę (`exercises__table`, `*-table-row`, `*-table-header`), ale to `div`-y.
Czytniki ekranu nie zinterpretują tego jako tabeli (brak `role`, powiązań nagłówek–komórka),
a sortowanie nagłówków nie ma `aria-sort`.

**Propozycje:**

1. **(Zalecane)** Użyć semantycznego `<table>`/`<thead>`/`<tbody>` lub Angular Material `MatTable` (`mat-table` z `matSort` daje `aria-sort` „za darmo").
2. Jeśli `div` muszą zostać — dodać `role="table"/"row"/"columnheader"/"cell"` oraz `aria-sort` na klikalnych nagłówkach.
3. Klikalne nagłówki zrobić `<button>`/dodać obsługę klawiatury (Enter/Space) i widoczny focus.

---

### 4.7. Brak etykiet/aria dla pól w wierszu serii

**Lokalizacja:** [workout-set-row.html](src/app/features/workout/components/workout-set-row/workout-set-row.html)

Inputy ciężaru i powtórzeń (`type="text"`, `inputmode`) nie mają `<label>` ani `aria-label`;
przyciski typu serii / jednostki też nie informują czytnika ekranu o swojej roli/stanie.

**Propozycje:**

1. Dodać `aria-label` (np. „Ciężar", „Powtórzenia") do inputów oraz przycisków.
2. Powiązać pola z etykietami (`mat-form-field` + `mat-label`) dla spójności z resztą UI.
3. Dla przycisków-selektorów dodać `aria-haspopup="dialog"` i `aria-label` opisujący aktualną wartość.

---

## 5. Znaleziska niskie / kosmetyczne 🟢

### 5.1. Niespójna konwencja nazw klas komponentów

`Home`, `Workout`, `Menu`, `Planner`, `AboutMe`, `Exercises` (bez sufiksu) kontra
`HistoryComponent`, `ScreenComponent` (z sufiksem, z powodu kolizji z typami DOM `History`/
`Screen`). Efekt: w jednym projekcie dwie konwencje nazewnicze klas.

**Propozycje:** (1) przyjąć jedną regułę i ją udokumentować (np. _zawsze_ sufiks `Component`,
spójnie z `Service`/`Repository`); (2) albo zostawić bez sufiksu i unikać kolizji innym
przedrostkiem (np. `HistoryScreen`, `AppScreen`); (3) opisać wyjątek w `docs/` raz, zamiast
tłumaczyć go komentarzem w kodzie.

### 5.2. Głębokie ścieżki importów `../../../../`

**Lokalizacja:** m.in. [exercise-form.ts](src/app/features/exercises/components/exercise-form/exercise-form.ts) (`../../../../models/...`)

Cztery poziomy „w górę" są kruche przy przenoszeniu plików.

**Propozycje:** (1) skonfigurować `paths` w `tsconfig.json` (np. `@models/*`, `@core/*`,
`@shared/*`); (2) dodać barrel `index.ts` w `models/`; (3) rozważyć przejście na strukturę
typu Nx z aliasami bibliotek.

### 5.3. Magiczne wartości i literały

Rozsiane stałe: kolor fallback `'#F2F4F7'`, indeks grupy `999`, debounce `500`/`200` ms,
sufiks kluczy `.v1`, etykiety UI po polsku/angielsku.

**Propozycje:** (1) wyciągnąć do nazwanych stałych/tokenów (`DEFAULT_MUSCLE_COLOR`,
`SEARCH_DEBOUNCE_MS`); (2) klucze storage trzymać w jednym module; (3) jeśli aplikacja ma być
wielojęzyczna — wprowadzić `@angular/localize` zamiast hardkodowanych stringów.

### 5.4. Wywołania metod w szablonie (`weekday(day.date)`)

**Lokalizacja:** [workout.html](src/app/features/workout/workout.html)

Metoda liczona przy każdym cyklu CD (przy OnPush/zoneless ryzyko małe, ale to nie zero).

**Propozycje:** (1) policzyć w `computed`; (2) użyć `DatePipe` z opcją `weekday`/`pure pipe`;
(3) wzbogacić model dnia o gotowe pole prezentacyjne przy mapowaniu.

### 5.5. `StorageService` eksponuje szerokie API (`clear`, `keys`) nieużywane przez konsumentów

Drobne naruszenie ISP — interfejs szerszy niż potrzeby repozytoriów.

**Propozycje:** (1) zawęzić publiczny kontrakt do faktycznie używanych metod; (2) wydzielić
interfejs `KeyValueStore` konsumowany przez repozytoria; (3) zostawić, jeśli `clear/keys`
są świadomie pod przyszłe „reset/diagnostykę" — wtedy oznaczyć to w nazwie/komentarzu.

### 5.6. Brak abstrakcji (tokenu/interfejsu) dla repozytoriów (DIP)

Komponenty/serwisy zależą od **konkretnych** klas repozytoriów. Testy mockują przez
`useValue`, więc działa, ale to zależność od implementacji, nie abstrakcji.

**Propozycje:** (1) zdefiniować interfejs + `InjectionToken` (`EXERCISE_REPOSITORY`);
(2) albo pozostawić klasy, jeśli nie przewiduje się alternatywnych implementacji (pragmatyzm);
(3) przy rozbudowie (np. backend zamiast IndexedDB) — wtedy abstrakcja się zwróci.

---

## 6. Podsumowanie tabelaryczne

| #   | Obszar                                                             | Ważność | Zasada                              |
| --- | ------------------------------------------------------------------ | ------- | ----------------------------------- |
| 2.1 | Brak jawnego `provideZonelessChangeDetection()`                    | 🔴      | Konwencje Angular                   |
| 2.2 | Ładowanie danych przez `effect()` + ryzyko zapisu nie do tego dnia | 🔴      | Angular best practices / poprawność |
| 3.1 | `Exercises` łamie SRP (słowniki + sort + ID + zapis)               | 🟠      | SOLID (SRP)                         |
| 3.2 | Formularz ręczny zamiast Angular Forms; martwy `submitting`        | 🟠      | Clean Code / YAGNI                  |
| 3.3 | Powtarzalne budowanie słowników `*ById`                            | 🟠      | DRY                                 |
| 3.4 | Duplikacja typu `WeightUnit` i mapy `SET_TYPE_LABEL`               | 🟠      | DRY                                 |
| 3.5 | Komentarze „migracyjne" w kodzie produkcyjnym                      | 🟠      | Clean Code                          |
| 4.1 | Niespójna, cicha obsługa błędów w repozytoriach                    | 🟡      | Poprawność / Clean Code             |
| 4.2 | `console.log`/`console.error` w produkcji                          | 🟡      | Clean Code                          |
| 4.3 | Powielony wzorzec „get-or-seed"                                    | 🟡      | DRY                                 |
| 4.4 | Zwracanie referencji do stałych seed                               | 🟡      | Bezpieczeństwo danych               |
| 4.5 | Query param + brak 404 + ręczny odczyt trasy                       | 🟡      | Konwencje Angular                   |
| 4.6 | „Tabela" z `div` (dostępność)                                      | 🟡      | A11y                                |
| 4.7 | Brak aria/label w wierszu serii                                    | 🟡      | A11y                                |
| 5.1 | Niespójne nazewnictwo klas                                         | 🟢      | Konwencje                           |
| 5.2 | Głębokie ścieżki importów                                          | 🟢      | Maintainability                     |
| 5.3 | Magiczne wartości/literały                                         | 🟢      | Clean Code                          |
| 5.4 | Wywołania metod w szablonie                                        | 🟢      | Wydajność                           |
| 5.5 | Zbyt szerokie API `StorageService`                                 | 🟢      | SOLID (ISP)                         |
| 5.6 | Brak abstrakcji repozytoriów                                       | 🟢      | SOLID (DIP)                         |

---

## 7. Rekomendowana kolejność prac

1. **Najpierw (tanie, duży zysk):** 2.1 (jawny zoneless), 3.4 (deduplikacja typu/mapy), 3.5 (czyszczenie komentarzy), 4.2 (logi).
2. **Następnie (architektura):** 2.2 (`resource()` + guard zapisu), 3.1 (wydzielenie sortowania i generacji ID), 3.3/4.3 (helper `indexBy` + wspólny `getOrSeed`).
3. **Potem (jakość/UX):** 3.2 (Angular Forms), 4.1/4.4 (błędy + kopie seed), 4.5 (`withComponentInputBinding` + 404), 4.6/4.7 (dostępność).
4. **Na końcu (kosmetyka):** 5.1–5.6.

> Uwaga: niniejszy dokument jest wyłącznie analizą — w kodzie nie wprowadzono żadnych zmian.

```

```
