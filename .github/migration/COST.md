# COST.md — Dziennik kosztów eksperymentu migracji

> Pół-ręczny. Po każdym uruchomieniu agenta dopisz wiersz.
> Liczby premium requests odczytaj z dashboardu Copilota
> (GitHub → Settings → Copilot → Usage) lub z licznika w VS Code.
>
> Modele (opcja A — mieszana):
>
> - Opus 4.8 (drogi): Analityk, Planner, Final Reviewer
> - Sonnet 4.5 (tańszy): Orchestrator, Implementator, Reviewer-Fixer
>   Budżet eksperymentu: ~250 000 kredytów.

## Log

| #   | data       | agent        | krok (id) | model                         | premium req. (z dashboardu) | iteracje                                   | uwagi | stan początkowy credytów | stan po logu |
| --- | ---------- | ------------ | --------- | ----------------------------- | --------------------------- | ------------------------------------------ | ----- | ------------------------ | ------------ |
| 0   | 19.06.2026 |              |           | Claude Opus 4.8               | około 200                   | przygotowanie agentów                      |       |                          | 800          |
| 1   | 20.06.2026 | Orchestrator |           | Claude Opus 4.8               |                             | stworzenie mapping                         |       | 800                      | 925          |
| 2   | 20.06.2026 |              |           | Claude Opus 4.8               | 36                          | ocena mappingu w innym oknie kontekstowym  |       |                          |              |
| 3   | 20.06.2026 | Orchestrator |           | Claude Opus 4.8               | 57                          | zapisanie mappingu i odpowiedzi na pytanie |       |                          | 1000         |
| 4   | 20.06.2026 | Orchestrator |           | Claude Opus 4.8               | 185                         |                                            |       | 1000                     | 1200         |
| 5   | 20.06.2026 | wszsystkie   |           |                               | 2600                        | CP1                                        |       |                          | 4196         |
| 6   | 20.06.2026 | wszystkie    |           |                               |                             |                                            |       |                          | 5426         |
| 7   | 20.06.2026 | wszsystkie   |           |                               | 2794                        | iteracja cp2 do decyzji d12                |       |                          | 8476         |
| 8   | 21.06.2026 | wszystkie    |           | stan na moment akceptacji CP3 | 1863                        |                                            |       | 8476                     | 10573        |
| 9   | 21.06.2026 | wszystkie    |           | stan na moment akceptacji CP4 | 832+713                     |                                            |       | 10573                    | 12119        |
| 10  | 21.06.2026 | wszystkie    |           | stan po zaplanowanej migracji |                             |                                            |       |                          | 12327        |
| 6   |            |              |           |                               |                             |                                            |       |                          |              |

## Podsumowania per checkpoint

| checkpoint | suma premium req. | liczba kroków | śr. na krok | wnioski |
| ---------- | ----------------- | ------------- | ----------- | ------- |
| CP1        | 2600              | 10            |             |         |
| CP2        | 948               |               |             |         |
| CP3        | 2794+1863         | 013–027       | 013–027     |         |
| CP4        | 832+713           | 028–031       |             |         |
| FINAL      | 207               | 028–031       |             |         |

## Wnioski końcowe

(uzupełnij po zakończeniu eksperymentu: czy migracja multi-agentem się udała,
całkowity koszt, gdzie mocny model był konieczny, gdzie wystarczył tańszy)
