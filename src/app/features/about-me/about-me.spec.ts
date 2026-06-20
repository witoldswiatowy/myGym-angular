import { TestBed } from '@angular/core/testing';
import { AboutMe } from './about-me';

describe('AboutMe', () => {
  it('tworzy się', () => {
    const fixture = TestBed.createComponent(AboutMe);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('opakowuje treść komponentem wspólnym app-screen z tytułem', () => {
    const fixture = TestBed.createComponent(AboutMe);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-screen')).not.toBeNull();
    // `app-screen` z tytułem renderuje nagłówek z tytułem (odpowiednik headerTitle w RN).
    const title = fixture.nativeElement.querySelector('.screen__title');
    expect(title).not.toBeNull();
    expect(title.textContent).toContain('About Me');
  });

  it('renderuje statyczną treść (imię i nazwisko autora)', () => {
    const fixture = TestBed.createComponent(AboutMe);
    fixture.detectChanges();
    const name = fixture.nativeElement.querySelector('.about-me__name');
    expect(name).not.toBeNull();
    expect(name.textContent).toContain('Witold Światowy');
  });
});
