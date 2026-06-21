import { Routes } from '@angular/router';

// Deklaratywny routing — odpowiednik file-based z Expo Router (app/*/index.tsx).
// Każdy ekran ładowany leniwie (lazy standalone) przez loadComponent.
// Trasa workout NIE ma segmentu parametrycznego — id treningu czytane z query
// param (?id=...), zgodnie z decyzją D1.
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'workout',
    loadComponent: () =>
      import('./features/workout/workout').then((m) => m.Workout),
  },
  {
    path: 'exercises',
    loadComponent: () =>
      import('./features/exercises/exercises').then((m) => m.Exercises),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/history/history').then((m) => m.HistoryComponent),
  },
  {
    path: 'planner',
    loadComponent: () =>
      import('./features/planner/planner').then((m) => m.Planner),
  },
  {
    path: 'menu',
    loadComponent: () => import('./features/menu/menu').then((m) => m.Menu),
  },
  {
    path: 'about-me',
    loadComponent: () =>
      import('./features/about-me/about-me').then((m) => m.AboutMe),
  },
  // Nieznane ścieżki → ekran Home (path pusty).
  { path: '**', redirectTo: '' },
];
