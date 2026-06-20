import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScreenComponent } from '../../core/layout/screen/screen';

// Pojedyncza pozycja menu: etykieta + docelowa trasa (routerLink).
interface MenuLink {
  readonly label: string;
  readonly path: string;
}

// Ekran „Menu" — odpowiednik `app/menu/index.tsx` + logiki Modal z `app/_layout.tsx` (RN).
// W RN „Menu" otwierało Modal z opcjami „Exercises"/„About Me"; wg D5 zamieniamy
// wzorzec Modal-jako-nawigacja na zwykłą nawigację `routerLink` (lista linków do tras).
// Trasy globalne powstają dopiero w kroku 029 (CP4) — tu używamy samych `routerLink`.
// Nazwa klasy `Menu` bez sufiksu (D9/A) — brak kolizji z typem DOM (D11).
@Component({
  selector: 'app-menu',
  imports: [RouterLink, ScreenComponent],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Menu {
  // Lista linków odwzorowuje opcje Modala ze źródła (Exercises → /exercises,
  // About Me → /about-me). Renderowana w szablonie przez nowy control flow `@for`.
  protected readonly links: readonly MenuLink[] = [
    { label: 'Exercises', path: '/exercises' },
    { label: 'About Me', path: '/about-me' },
  ];
}
