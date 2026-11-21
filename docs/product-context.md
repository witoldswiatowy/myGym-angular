# Product Context

## Cel produktu

Aplikacja wspiera rejestrowanie i analizę treningu siłowego dla osób początkujących, średniozaawansowanych i zaawansowanych.
Powstała jako cyfrowa ewolucja rozbudowanego workflow opartego wcześniej o arkusz kalkulacyjny.

## Główne założenia

- Prosty start: użytkownik początkujący powinien móc szybko logować trening bez presji uzupełniania zaawansowanych metryk.
- Stopniowe odkrywanie złożoności: funkcje analityczne mają być opcjonalne i dostępne, gdy użytkownik ich potrzebuje.
- Offline-first: kluczowe funkcje i dane powinny działać lokalnie.
- Elastyczność: aplikacja ma adaptować się do stylu treningu użytkownika, bez wymuszania jednego systemu.

## Problemy, które rozwiązujemy

- Zbyt skomplikowane aplikacje treningowe zniechęcają początkujących.
- Proste aplikacje często nie skalują się do potrzeb zaawansowanej analityki.
- Ćwiczenia wielostawowe bywają modelowane zbyt uproszczenie.
- Zależność od stałego internetu obniża niezawodność i poczucie kontroli nad danymi.

## Zakres funkcjonalny

### Core

- baza ćwiczeń i mięśni
- logowanie treningu (serie, powtórzenia, ciężar)
- notatki treningowe
- historia treningów

### Rozszerzenia

- podsumowania tygodniowe
- śledzenie masy ciała
- analityka progresu i objętości
- wsparcie planów i szablonów
- opcjonalne metryki intensywności (RIR/RPE)

## Nongoals (MVP)

- funkcje społecznościowe
- auto-coaching oparty o AI
- rozbudowane śledzenie żywienia jako część core

## Implikacje techniczne

- Model danych powinien pozwalać na analitykę zaawansowaną bez obciążania początkujących.
- Pola zaawansowane powinny być opcjonalne.
- Należy utrzymywać wyraźny podział między planem a wykonanym treningiem.
- UX powinien promować odkrywalność funkcji, a nie wymuszanie ich użycia.
