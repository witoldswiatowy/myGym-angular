import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import { Menu } from './menu';

describe('Menu', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Menu],
      // Trasy globalne powstają w kroku 029 — w teście wystarczy pusty router,
      // by dyrektywy `routerLink` mogły się powiązać.
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('tworzy się', () => {
    const fixture = TestBed.createComponent(Menu);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('opakowuje treść komponentem wspólnym app-screen z tytułem „Menu"', () => {
    const fixture = TestBed.createComponent(Menu);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-screen')).not.toBeNull();
    const title = fixture.nativeElement.querySelector('.screen__title');
    expect(title).not.toBeNull();
    expect(title.textContent).toContain('Menu');
  });

  it('renderuje linki nawigacyjne do /exercises i /about-me (D5)', () => {
    const fixture = TestBed.createComponent(Menu);
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('.menu__link');
    expect(links.length).toBe(2);
    expect(links[0].textContent).toContain('Exercises');
    expect(links[1].textContent).toContain('About Me');

    // Weryfikacja powiązanych tras przez dyrektywę RouterLink (a nie tylko tekst).
    const routerLinks = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .map((debugEl) => debugEl.injector.get(RouterLink).href);
    expect(routerLinks).toContain('/exercises');
    expect(routerLinks).toContain('/about-me');
  });
});
