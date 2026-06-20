import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScreenComponent } from '../../core/layout/screen/screen';

// Ekran startowy (Home) — odpowiednik `app/index.tsx` z RN.
// Bez logiki: pokazuje logo „myGym" (małe w pasku górnym + duże wyśrodkowane).
// Opakowany komponentem wspólnym `app-screen` (bez tytułu → renderuje tylko treść).
@Component({
  selector: 'app-home',
  imports: [ScreenComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
