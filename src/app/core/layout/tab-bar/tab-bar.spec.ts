import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { TabBar } from './tab-bar';

// Komponent-zaślepka dla tras testowych (renderuje pustą treść).
@Component({ template: '' })
class Dummy {}

// Host osadzający pasek wraz z <router-outlet> — pozwala testować stan aktywny
// po nawigacji routerem (routerLinkActive aktualizuje się przy zmianie URL).
@Component({
  imports: [TabBar, RouterOutlet],
  template: '<app-tab-bar /><router-outlet />',
})
class Host {}

describe('TabBar', () => {
  describe('renderowanie pozycji', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TabBar],
        providers: [provideRouter([])],
      }).compileComponents();
    });

    it('tworzy się', () => {
      const fixture = TestBed.createComponent(TabBar);
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('renderuje 5 pozycji z poprawnymi etykietami i routerLink', () => {
      const fixture = TestBed.createComponent(TabBar);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const links = el.querySelectorAll<HTMLAnchorElement>('a.tab-bar__item');
      expect(links.length).toBe(5);

      const expected = [
        { label: 'Home', href: '/' },
        { label: 'Workout', href: '/workout' },
        { label: 'History', href: '/history' },
        { label: 'Planner', href: '/planner' },
        { label: 'Menu', href: '/menu' },
      ];
      expected.forEach((exp, i) => {
        expect(links[i].textContent).toContain(exp.label);
        expect(links[i].getAttribute('href')).toBe(exp.href);
      });
    });

    it('renderuje 5 ikon Material (mat-icon) z poprawnymi ligaturami', () => {
      const fixture = TestBed.createComponent(TabBar);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const icons = el.querySelectorAll<HTMLElement>('mat-icon');
      expect(icons.length).toBe(5);

      // Mapowanie ikon wg D13: Ionicons → Material Icons.
      const expectedIcons = ['home', 'fitness_center', 'history', 'calendar_month', 'menu'];
      expectedIcons.forEach((name, i) => {
        expect(icons[i].textContent?.trim()).toBe(name);
      });
    });

    it('nie zawiera w pasku pozycji Exercises ani About Me', () => {
      const fixture = TestBed.createComponent(TabBar);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const text = el.textContent ?? '';
      expect(text).not.toContain('Exercises');
      expect(text).not.toContain('About Me');
    });
  });

  describe('stan aktywny (routerLinkActive)', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [Host],
        providers: [
          provideRouter([
            { path: '', component: Dummy },
            { path: 'workout', component: Dummy },
          ]),
        ],
      }).compileComponents();
    });

    it('na trasie /workout aktywny jest Workout, a Home (exact) — NIE', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();

      await router.navigate(['/workout']);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('a.tab-bar__item'));
      const home = links.find((l) => (l.textContent ?? '').includes('Home'));
      const workout = links.find((l) => (l.textContent ?? '').includes('Workout'));

      expect(workout?.classList.contains('tab-bar__item--active')).toBe(true);
      expect(home?.classList.contains('tab-bar__item--active')).toBe(false);
    });
  });
});
