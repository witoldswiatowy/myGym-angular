import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';

import { ScreenComponent } from '../../core/layout/screen/screen';
import { SetType, WeightUnit } from '../../models/workout-set';

import { WorkoutScreen } from './workout-screen';
import { WorkoutSetRow, WorkoutSetRowData } from './components/workout-set-row/workout-set-row';
import {
  WorkoutSetTypeModal,
  WorkoutSetTypeModalData,
} from './components/workout-set-type-modal/workout-set-type-modal';
import {
  WorkoutWeightUnitModal,
  WorkoutWeightUnitModalData,
} from './components/workout-weight-unit-modal/workout-weight-unit-modal';

// Etykiety typów serii — przeniesione 1:1 ze źródła RN (`SET_TYPE_LABEL` w
// `app/workout/index.tsx`). Liczone przez ekran i przekazywane do wiersza (krok 024).
const SET_TYPE_LABEL: Record<SetType, string> = {
  warmup: 'WarmUp',
  working: 'Normal',
  drop: 'Drop',
  failure: 'Upadek',
};

/**
 * Ekran treningu dnia — odpowiednik `WorkoutScreen` (RN, `app/workout/index.tsx`).
 *
 * W RN był to komponent funkcyjny czytający parametr `id` (`useLocalSearchParams`),
 * konsumujący hook `useWorkoutScreen(id)` i renderujący listę ćwiczeń z seriami oraz
 * dwa modale. Odwzorowanie:
 *   - logika stanu/efektów = serwis `WorkoutScreen` (krok 012) o ZASIĘGU KOMPONENTU
 *     (`providers: [WorkoutScreen]`) — instancja per-ekran, jak `useWorkoutScreen`
 *     (NIE `providedIn: 'root'`); ekran tylko KONSUMUJE serwis, nie duplikuje logiki,
 *   - odczyt `id` z `ActivatedRoute.queryParamMap` (D1 — query param `/workout?id=...`),
 *   - `router.back()` → `Location.back()`,
 *   - modale typu serii (025) i jednostki (026) → `MatDialog` (D2): ekran ustawia
 *     target w serwisie przed otwarciem, a po `afterClosed()` woła `selectSetType` /
 *     `selectWeightUnit` (gdy wynik zdefiniowany) lub czyści target (gdy `undefined`).
 *
 * Nazwa klasy `Workout` bez sufiksu (D9/A) — brak kolizji z typem DOM (D11).
 */
@Component({
  selector: 'app-workout',
  imports: [ScreenComponent, WorkoutSetRow],
  templateUrl: './workout.html',
  styleUrl: './workout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Serwis stanu w zasięgu KOMPONENTU — efemeryczny stan jednego ekranu (jak hook RN).
  providers: [WorkoutScreen],
})
export class Workout {
  // Serwis stanu ekranu (krok 012) — konsumowany, nie duplikowany.
  protected readonly workoutScreen = inject(WorkoutScreen);

  // DI: trasa (odczyt query param — D1), serwis dialogów Material (D2), nawigacja wstecz.
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly location = inject(Location);

  // Mapa etykiet typu serii — przekazywana do wiersza (krok 024) w szablonie.
  protected readonly setTypeLabel = SET_TYPE_LABEL;

  // Parametr `id` z query (D1) jako sygnał — odpowiednik `useLocalSearchParams<{id}>()`.
  private readonly queryParams = toSignal(this.route.queryParamMap);

  constructor() {
    // Synchronizacja `id` trasy → serwis (odpowiednik przekazania parametru do hooka).
    // Zmiana query param przeładowuje dane przez efekt ładowania wewnątrz serwisu.
    effect(() => {
      const id = this.queryParams()?.get('id') ?? undefined;
      this.workoutScreen.setTrainingDayId(id);
    });
  }

  // Powrót do poprzedniego ekranu (RN: `router.back()`).
  protected goBack(): void {
    this.location.back();
  }

  // Formatuje dzień tygodnia po polsku (RN: `toLocaleDateString('pl-PL', {weekday:'long'})`).
  protected weekday(dateIso: string): string {
    return new Date(dateIso).toLocaleDateString('pl-PL', { weekday: 'long' });
  }

  /**
   * Żądanie wyboru typu serii (RN: `onOpenTypeSelect` → `setTypeSelectTarget`).
   * Ustawia target w serwisie, otwiera modal 025 z aktualnym typem (highlight),
   * a po zamknięciu: wynik zdefiniowany → `selectSetType`, `undefined` → czyści target.
   */
  protected openTypeSelect(exerciseId: string, set: WorkoutSetRowData): void {
    this.workoutScreen.setTypeSelectTarget({ exerciseId, setId: set.id });

    const dialogRef = this.dialog.open<WorkoutSetTypeModal, WorkoutSetTypeModalData, SetType>(
      WorkoutSetTypeModal,
      { data: { selected: set.type } },
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.workoutScreen.selectSetType(result);
      } else {
        this.workoutScreen.setTypeSelectTarget(null);
      }
    });
  }

  /**
   * Żądanie wyboru jednostki ciężaru (RN: `onOpenWeightUnitSelect` →
   * `setWeightUnitSelectTarget`). Analogicznie do `openTypeSelect`, dla modalu 026.
   */
  protected openWeightUnitSelect(exerciseId: string, set: WorkoutSetRowData): void {
    this.workoutScreen.setWeightUnitSelectTarget({ exerciseId, setId: set.id });

    const dialogRef = this.dialog.open<
      WorkoutWeightUnitModal,
      WorkoutWeightUnitModalData,
      WeightUnit
    >(WorkoutWeightUnitModal, { data: { selected: set.weightUnit } });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.workoutScreen.selectWeightUnit(result);
      } else {
        this.workoutScreen.setWeightUnitSelectTarget(null);
      }
    });
  }

  // Zmiana ciężaru serii (RN: `onChangeWeight` → `updateSetField`).
  protected onChangeWeight(exerciseId: string, setId: string, weight: string): void {
    this.workoutScreen.updateSetField(exerciseId, setId, { weight });
  }

  // Zmiana powtórzeń serii (RN: `onChangeReps` → `updateSetField`).
  protected onChangeReps(exerciseId: string, setId: string, reps: string): void {
    this.workoutScreen.updateSetField(exerciseId, setId, { reps });
  }

  // Zmiana statusu „done" serii (RN: `onChangeDone` → `updateSetField`).
  protected onChangeDone(exerciseId: string, setId: string, done: boolean): void {
    this.workoutScreen.updateSetField(exerciseId, setId, { done });
  }
}
