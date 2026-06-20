import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScreenComponent } from '../../core/layout/screen/screen';

// Placeholder ekranu „Workout Planner" — odpowiednik `app/planner/index.tsx` z RN (D6).
// Bez logiki: opakowany komponentem wspólnym `app-screen` (z tytułem),
// renderuje pojedynczy tekst „In progress..." (1:1 ze źródłem).
// Nazwa klasy `Planner` bez sufiksu (D9/A) — brak kolizji z typem DOM (D11).
@Component({
  selector: 'app-planner',
  imports: [ScreenComponent],
  templateUrl: './planner.html',
  styleUrl: './planner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Planner {}
