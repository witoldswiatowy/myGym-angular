import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScreenComponent } from '../../core/layout/screen/screen';
import { TrainingDay } from '../../models/training-day';
import { WorkoutRepository } from '../../repositories/workout-repository';

// Ekran „Workout History" — odpowiednik `app/history/index.tsx` (RN).
// W RN: `useState` na liście dni + `useEffect([])` ładujący dane z
// `WorkoutRepository.getTrainingDays()`, a kafelki nawigowały do
// `/workout?id=...` (D1 — query param). Tutaj:
//   - stan listy trzyma `signal` (MAPPING §2.1 — signals-first, odpowiednik useState),
//   - jednorazowe ładowanie danych odbywa się w konstruktorze (odpowiednik
//     useEffect z pustą tablicą zależności) — async przez repozytorium (DI `inject`),
//   - nawigacja przez `routerLink` + `queryParams` w szablonie (D1, D5).
// Nazwa klasy `HistoryComponent` (a nie `History`) — świadomy wyjątek wg D11:
// `History` kolidowałoby z globalnym typem DOM (`window.history`). Plik `history.ts`
// i selektor `app-history` pozostają bez zmian (kebab-case, czysty selektor).
@Component({
  selector: 'app-history',
  imports: [RouterLink, ScreenComponent],
  templateUrl: './history.html',
  styleUrl: './history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent {
  // DI repozytorium przez funkcję `inject` (idiomatyczne dla Angulara).
  private readonly workoutRepository = inject(WorkoutRepository);

  // Reaktywny stan listy dni treningowych (odpowiednik useState<TrainingDay[]>([]));
  // `readonly` na zewnątrz — zapis tylko wewnątrz komponentu przez `set`.
  protected readonly trainingDays = signal<readonly TrainingDay[]>([]);

  constructor() {
    // Jednorazowe ładowanie danych (odpowiednik useEffect z [] w RN).
    // Publiczne API repozytorium jest Promise-owe (zachowanie 1:1 z AsyncStorage).
    void this.loadTrainingDays();
  }

  // Pobiera dni treningowe z repozytorium i aktualizuje sygnał.
  private async loadTrainingDays(): Promise<void> {
    const days = await this.workoutRepository.getTrainingDays();
    this.trainingDays.set(days);
  }
}
