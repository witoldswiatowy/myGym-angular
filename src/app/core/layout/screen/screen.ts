import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Komponent wspólny layoutu ekranu — odpowiednik `Screen.tsx` z RN.
// Opakowuje treść dziecka (projekcja przez <ng-content>, odpowiednik `children`)
// i opcjonalnie pokazuje nagłówek z logo „myGym" oraz tytułem.
// Safe-area (useSafeAreaInsets) pomijamy świadomie — decyzja D4 (cel = web/SPA).
@Component({
  selector: 'app-screen',
  templateUrl: './screen.html',
  styleUrl: './screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreenComponent {
  // Opcjonalny tytuł ekranu. Gdy podany → renderuje nagłówek (logo + tytuł);
  // gdy pominięty → renderowana jest wyłącznie treść projektowana.
  readonly title = input<string>();
}
