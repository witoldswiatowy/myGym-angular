# DECISIONS.md — Rejestr decyzji migracji myGym → Angular

> Wiążący rejestr decyzji architektonicznych (PROCESS.md §9, §11).
> Każda niejednoznaczność rozstrzygnięta przez człowieka lub uzgodniona z agentem
> trafia tutaj. Format: ID, data, status, kontekst, decyzja, konsekwencje.

## Status decyzji

`zaproponowana` → `zaakceptowana` (przez człowieka) → `zrealizowana` (w kodzie)

---

## D1 — Routing parametru treningu

- **Data:** 2026-06-20
- **Status:** zaakceptowana
- **Kontekst:** Źródło RN (Expo Router) używa query param: `/workout?id=...`.
- **Decyzja:** **Query param.** Zachowujemy `/workout?id=...`.
  Angular: `ActivatedRoute.queryParamMap` / `queryParams`.
- **Konsekwencje:** trasa `workout` bez segmentu parametrycznego; odczyt id z query.

## D2 — Biblioteka UI

- **Data:** 2026-06-20
- **Status:** zaakceptowana
- **Kontekst:** RN korzysta z komponentów Expo (Checkbox, Picker, Modal, FlatList).
- **Decyzja:** **Angular Material (+ CDK).** Dialog, Checkbox, Select z Material;
  Overlay i Virtual Scroll z CDK.
- **Konsekwencje:** zależność `@angular/material` + `@angular/cdk`; konfiguracja
  motywu Material; modale → `MatDialog`.

## D3 — Silnik storage

- **Data:** 2026-06-20
- **Status:** zaakceptowana
- **Kontekst:** Źródło używa `AsyncStorage` (async); product-context = offline-first.
- **Decyzja:** **IndexedDB** za abstrakcją `StorageService`.
- **Konsekwencje:** publiczne API repozytoriów pozostaje `Promise`-owe; dostęp do
  danych wyłącznie przez repozytoria → `StorageService`.

## D4 — Safe-area / layout mobilny

- **Data:** 2026-06-20
- **Status:** zaakceptowana
- **Kontekst:** `useSafeAreaInsets` (RN) nie ma odpowiednika w przeglądarce.
- **Decyzja:** **Pomijamy.** Cel = aplikacja webowa (SPA). Bez warstwy safe-area
  i bez dedykowanej responsywności mobilnej.
- **Konsekwencje:** usuwamy logikę insetów; layout zorientowany na web.

## D5 — Nawigacja (tab bar / menu)

- **Data:** 2026-06-20
- **Status:** zaakceptowana
- **Kontekst:** W RN „Menu" otwiera `Modal`, część ekranów jest poza paskiem zakładek.
- **Decyzja:** **Zwykła nawigacja `routerLink`** (trasy + linki). Bez wzorca
  Modal-jako-nawigacja.
- **Konsekwencje:** „Menu" staje się zwykłą trasą/listą linków; spójny Angular Router.

## D6 — Placeholdery (`planner`, `menu`)

- **Data:** 2026-06-20
- **Status:** zaakceptowana
- **Kontekst:** Ekrany `planner` („In progress...") i `menu` są szczątkowe.
- **Decyzja:** **Migrujemy jako puste ekrany** (komponenty-placeholdery, 1:1).
- **Konsekwencje:** powstają minimalne komponenty bez logiki, gotowe do rozbudowy.

## D7 — Model `Superset`

- **Data:** 2026-06-20
- **Status:** zaakceptowana
- **Kontekst:** Model `Superset` zdefiniowany, ale nieużywany w UI.
- **Decyzja:** **Przenosimy 1:1** bez logiki (wierność danych).
- **Konsekwencje:** powstaje `superset.model.ts`; brak komponentów/serwisów na razie.

## D8 — Wersja Angulara

- **Data:** 2026-06-20
- **Status:** zaakceptowana
- **Kontekst:** Trzeba ustalić wersję frameworka i zestaw nowoczesnych funkcji.
- **Decyzja:** **Najnowszy stabilny Angular** (min. v20+) pobrany przez `ng new`
  w chwili inicjalizacji repo docelowego `../myGym-angular`. Wymagane: standalone
  components, signals, nowy control flow (`@if` / `@for` / `@switch`),
  builder esbuild/vite.
- **Konsekwencje:** konkretny numer wersji zostaje „przypięty" w `package.json`
  repo docelowego przy inicjalizacji (krok inicjalizujący w PLAN.md). Wszyscy
  agenci stosują nowoczesną składnię (zakaz `*ngIf`/`*ngFor`, NgModules).

## D9 — Konwencja nazewnictwa plików (suffiksy typu)

- **Data:** 2026-06-20
- **Status:** zaakceptowana — **opcja A**
- **Kontekst:** Zainstalowany Angular 22 zmienił domyślną konwencję CLI: schematy
  `ng generate` generują pliki BEZ suffiksu typu (np. `home.ts` z klasą `Home`,
  `workout-screen.ts` z klasą `WorkoutScreen`), a root jako `app.ts` (klasa `App`)
  — zamiast historycznych `*.component.ts` / `*.service.ts`. MAPPING §4 mandatował
  wcześniej jawne suffiksy. To kolizja konwencji obejmująca całe repo.
- **Decyzja:** **A — nowa konwencja Angular 22 (bez suffiksów typu).** Nazwa pliku =
  kebab-case nazwy klasy; brak `.component`/`.service`/`.model`. Domyślne zachowanie
  `ng generate` (bez konfiguracji schematów). MAPPING §3/§4 zaktualizowane.
- **Zasady szczegółowe:**
  - Komponenty/serwisy/dyrektywy/pipe'y/guardy: bez suffiksu typu — `home.ts`,
    `workout-screen.ts` (klasy `Home`, `WorkoutScreen`).
  - Modele/interfejsy: bez suffiksu — `exercise.ts`, `muscle.ts` (w `models/`).
  - Repozytoria (wzorzec DDD, nie typ Angulara): `exercise-repository.ts`,
    `workout-repository.ts` (klasy `ExerciseRepository`, `WorkoutRepository`).
  - Storage: plik `storage.ts`; klasa **`StorageService`** — świadomy wyjątek, by
    uniknąć kolizji z globalnym `Storage` (DOM).
  - Dane seed: zachowujemy `*.data.ts` (to nie typ schematu Angulara, lecz dane).
  - Routing: `app.routes.ts`. Root: `app.ts` (klasa `App`).
- **Konsekwencje:** brak konfiguracji schematów w `angular.json` (opcja A = domyślna).
  Wszyscy Implementatorzy stosują nazwy bez suffiksów typu. Per-krok ścieżki docelowe
  w PLAN.md czyta się wg tej zasady (patrz notka w nagłówku PLAN.md).

## D10 — Wersja Node (notatka środowiskowa)

- **Data:** 2026-06-20
- **Status:** odnotowana (nie blokuje)
- **Kontekst:** Angular CLI 22 raportuje zainstalowany **Node v25.8.2 jako
  „Unsupported"** (wspierane: 22 / 24 / 26). `ng build` i `ng test` są zielone.
- **Decyzja:** Nie blokujemy migracji. Zalecane (do wykonania przez człowieka poza
  procesem AI): przejście na parzysty Node LTS (np. 24.x) dla środowiska docelowego.
- **Konsekwencje:** jeśli pojawią się błędy związane z Node, wraca jako blokada.

## D11 — Kolizje nazw klas z globalnymi typami DOM (rozszerzenie D9/A)

- **Data:** 2026-06-20
- **Status:** zaakceptowana — **opcja B**
- **Kontekst:** Komponent wspólny `app-screen` (krok 013) wg D9/A dałby klasę
  `Screen`, która koliduje z globalnym typem DOM `interface Screen` (`window.screen`).
  Kompiluje się czysto (klasa module-scoped przesłania typ globalny), ale powtarza
  się tu wzorzec rozwiązany wcześniej dla `StorageService` (uniknięcie kolizji z
  globalnym `Storage`).
- **Decyzja:** **B — minimalny dyskryminator nazwy klasy.** Gdy nazwa klasy wg D9/A
  kolidowałaby z globalnym typem DOM, dodajemy najmniejszy możliwy sufiks roli
  (np. `Component`), zachowując kebab-case nazwę pliku i czysty selektor `app-*`.
  Konkretnie: plik `screen.ts`, **klasa `ScreenComponent`**, selektor `app-screen`.
- **Zasada ogólna (rozszerza D9/A):** kolizja z globalnym typem DOM (`Screen`,
  `Storage`, `Document`, `Event`, `Location`, `History`, `Navigator`, itp.) →
  świadomy wyjątek: dodaj sufiks roli do KLASY (`*Component`/`*Service`), NIE zmieniaj
  nazwy pliku ani selektora. Spójne z wyjątkiem `StorageService` w D9.
- **Konsekwencje:** krok 013 — klasa `ScreenComponent` (plik `screen.ts`, selektor
  `app-screen`). Implementatorzy kolejnych kroków CP3+ stosują tę regułę przy
  ewentualnych kolizjach (np. `history` → jeśli kolizja z globalnym `History`,
  klasa `HistoryComponent`; w przeciwnym razie czyste D9/A bez sufiksu).

## D12 — Lista ćwiczeń: zwykłe `@for` zamiast CDK Virtual Scroll

- **Data:** 2026-06-21
- **Status:** zaakceptowana — **opcja B**
- **Kontekst:** PLAN.md kroku 023 nakazywał CDK Virtual Scroll (odpowiednik `FlatList`
  z RN). Wariant fixed-size (`itemSize`) zakłada jednolitą wysokość wiersza, a wiersze
  biblioteki ćwiczeń mają zmienną wysokość (pigułki mięśni dodatkowych zawijają się
  do >2 linii). Fixed-size + `overflow:hidden` przycinał treść wierszy = regresja
  zachowania względem RN (`FlatList` rośnie do treści). Biblioteka to 57 ćwiczeń
  (dane seed) — wirtualizacja daje marginalny zysk wydajności.
- **Decyzja:** **B — rezygnacja z CDK Virtual Scroll na rzecz zwykłego `@for`** w ekranie
  `exercises`. Pełna treść wierszy, zero przycięć. Zgodne z PROCESS §2 („zachowanie >
  wierność implementacji `FlatList`") oraz product-context (poprawność danych).
- **Konsekwencje:** krok 023 nie używa `ScrollingModule`/`cdk-virtual-scroll-viewport`/
  `*cdkVirtualFor` — zamiast tego `@for` z `track`. Usunięty sztywny `itemSize`/
  `overflow:hidden` przycinający wiersze. Przewijanie listy zwykłym kontenerem CSS.
  PLAN.md kroku 023 zaktualizowany. (Uwaga ogólna: gdyby w przyszłości pojawiła się
  bardzo długa lista o stałej wysokości wiersza, virtual scroll można rozważyć
  ponownie — ta decyzja dotyczy biblioteki ćwiczeń o zmiennej wysokości wiersza.)

## D13 — Ikony paska nawigacji (tab-bar): Material Symbols

- **Data:** 2026-06-21
- **Status:** zrealizowana — **opcja B** (krok 030, commit `86e7c51`)
- **Kontekst:** Źródło RN (`app/_layout.tsx`) używa ikon Ionicons z `@expo/vector-icons`
  w pasku zakładek (Home=`home`, Workout=`barbell`, History=`time`, Planner=`calendar`,
  Menu=`menu`) — ikona + etykieta pod spodem. Projekt docelowy Angular nie miał
  skonfigurowanej żadnej biblioteki ikon (grep `mat-icon`/Material Symbols/Ionicons = 0).
  Implementator kroku 030 zrealizował wariant minimalny (same etykiety tekstowe) i zgłosił
  niejednoznaczność do eskalacji (wprowadzenie biblioteki ikon = nowa decyzja architektoniczna).
- **Decyzja:** **B — wprowadzamy Material Symbols** (font ikon zgodny z Angular Material,
  D2) i mapujemy ikony paska 1:1 wg sensu źródła: Home→`home`, Workout→`fitness_center`,
  History→`history`, Planner→`calendar_month`, Menu→`menu`. Pasek pokazuje ikonę + etykietę
  (parytet wizualny z RN). Realizacja przez `<mat-icon>` (`MatIconModule`) z fontem Material
  Symbols/Material Icons skonfigurowanym w `index.html`/`styles.scss`.
- **Konsekwencje:** dodanie/konfiguracja fontu ikon (link w `index.html` lub import w
  `styles.scss`) + użycie `MatIconModule` w komponencie `TabBar`. Krok 030 przerobiony
  z wariantu tekstowego na ikona+etykieta. Mapowanie ikon dobrane na najbliższe odpowiedniki
  Material (źródłowe nazwy Ionicons nie istnieją 1:1 w Material). Pozostałe kryteria 030
  (5 pozycji, `routerLink`/`routerLinkActive` D5, Home `exact`, `/exercises`+`/about-me`
  poza paskiem, brak safe-area D4) bez zmian.
- **Realizacja (2026-06-21, krok 030, commit `86e7c51`):** komponent `TabBar`
  (`src/app/core/layout/tab-bar/`) z `MatIconModule` i `<mat-icon>` (ligatura) nad
  etykietą; font Material Icons z istniejącego linku w `src/index.html` (zasób zastany
  z `ng add @angular/material`, D2 — bez dublowania, bez nowej zależności). Mapowanie
  zrealizowane 1:1: home→`home`, fitness_center, history, calendar_month, menu.
  Zweryfikowano przez Reviewer-Fixera (1 iteracja): `tsc`=0, `ng build` zielone,
  `ng test` 122/122. UWAGA: link Material Icons to CDN Google Fonts — przy braku sieci
  ikony mogą się nie załadować (product-context offline-first); ewentualny self-host
  fontu jako temat do rozważenia w przyszłości (poza zakresem 030).
