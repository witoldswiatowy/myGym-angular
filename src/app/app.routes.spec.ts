import { TestBed } from '@angular/core/testing';
import { Route, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { Home } from './features/home/home';
import { Workout } from './features/workout/workout';
import { Exercises } from './features/exercises/exercises';
import { HistoryComponent } from './features/history/history';
import { Planner } from './features/planner/planner';
import { Menu } from './features/menu/menu';
import { AboutMe } from './features/about-me/about-me';

// Pomocniczo: wyciąga trasę o danym path (bez wildcard).
function routeByPath(path: string): Route | undefined {
  return routes.find((r) => r.path === path);
}

// Pomocniczo: wykonuje loadComponent danej trasy i zwraca załadowaną klasę.
async function loadedComponent(path: string): Promise<unknown> {
  const route = routeByPath(path);
  if (!route?.loadComponent) {
    throw new Error(`Brak loadComponent dla trasy '${path}'`);
  }
  return route.loadComponent();
}

describe('app routes', () => {
  it('definiuje 7 tras leniwych + przekierowanie wildcard', () => {
    const lazyRoutes = routes.filter((r) => r.loadComponent);
    expect(lazyRoutes.length).toBe(7);

    const wildcard = routeByPath('**');
    expect(wildcard).toBeDefined();
    expect(wildcard?.redirectTo).toBe('');
    expect(wildcard?.loadComponent).toBeUndefined();
  });

  it('każda trasa lazy ma zdefiniowany loadComponent', () => {
    const expectedPaths = [
      '',
      'workout',
      'exercises',
      'history',
      'planner',
      'menu',
      'about-me',
    ];
    for (const path of expectedPaths) {
      const route = routeByPath(path);
      expect(route).toBeDefined();
      expect(route?.loadComponent).toBeDefined();
    }
  });

  it("trasa 'workout' nie ma segmentu parametrycznego (id przez query param, D1)", () => {
    const route = routeByPath('workout');
    expect(route?.path).toBe('workout');
    // Brak ':id' w ścieżce — parametr czytany z query param.
    expect(route?.path).not.toContain(':');
  });

  it('loadComponent ładuje właściwe klasy ekranów', async () => {
    expect(await loadedComponent('')).toBe(Home);
    expect(await loadedComponent('workout')).toBe(Workout);
    expect(await loadedComponent('exercises')).toBe(Exercises);
    expect(await loadedComponent('history')).toBe(HistoryComponent);
    expect(await loadedComponent('planner')).toBe(Planner);
    expect(await loadedComponent('menu')).toBe(Menu);
    expect(await loadedComponent('about-me')).toBe(AboutMe);
  });

  describe('nawigacja (RouterTestingHarness)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [provideRouter(routes)],
      });
    });

    it("trasa '' renderuje komponent Home", async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', Home);
      expect(instance).toBeInstanceOf(Home);
    });

    it('nieznana ścieżka przekierowuje na Home', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/nie-istnieje', Home);
      expect(instance).toBeInstanceOf(Home);

      const router = TestBed.inject(Router);
      expect(router.url).toBe('/');
    });
  });
});
