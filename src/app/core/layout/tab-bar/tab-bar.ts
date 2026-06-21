import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

// Pojedyncza pozycja paska nawigacji: ikona + etykieta + docelowa trasa + tryb dopasowania.
interface TabItem {
  readonly label: string;
  readonly path: string;
  // Nazwa ligatury ikony Material Icons (font załadowany w index.html).
  readonly icon: string;
  // Dla Home ('/') wymagane dokładne dopasowanie (exact), by pozycja nie świeciła
  // na każdej trasie (każda ścieżka zaczyna się od '/').
  readonly exact: boolean;
}

// Dolny pasek nawigacji — odpowiednik komponentu <Tabs> z Expo Router (_layout.tsx).
// 5 pozycji w tej samej kolejności i z tymi samymi etykietami co w źródle:
// Home / Workout / History / Planner / Menu.
// Trasy exercises/about-me celowo POZA paskiem (w RN: options href:null) — pozostają
// osiągalne linkiem z innych ekranów. Nawigacja przez routerLink (decyzja D5),
// aktywna pozycja przez routerLinkActive. Bez safe-area (decyzja D4).
// Ikona + etykieta przez <mat-icon> z fontu Material Icons (decyzja D13/opcja B);
// nazwy Ionicons ze źródła zmapowane na najbliższe odpowiedniki Material.
@Component({
  selector: 'app-tab-bar',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './tab-bar.html',
  styleUrl: './tab-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabBar {
  // Kolejność i etykiety odwzorowane 1:1 z _layout.tsx (kolejne Tabs.Screen).
  // Mapowanie ikon Ionicons → Material Icons wg D13: home→home, barbell→fitness_center,
  // time→history, calendar→calendar_month, menu→menu.
  protected readonly tabs: readonly TabItem[] = [
    { label: 'Home', path: '/', icon: 'home', exact: true },
    { label: 'Workout', path: '/workout', icon: 'fitness_center', exact: false },
    { label: 'History', path: '/history', icon: 'history', exact: false },
    { label: 'Planner', path: '/planner', icon: 'calendar_month', exact: false },
    { label: 'Menu', path: '/menu', icon: 'menu', exact: false },
  ];
}
