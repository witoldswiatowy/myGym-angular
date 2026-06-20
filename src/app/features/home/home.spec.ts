import { TestBed } from '@angular/core/testing';
import { Home } from './home';

describe('Home', () => {
  it('tworzy się', () => {
    const fixture = TestBed.createComponent(Home);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('opakowuje treść komponentem wspólnym app-screen', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-screen')).not.toBeNull();
  });

  it('renderuje małe logo w pasku górnym i duże wyśrodkowane', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const small = fixture.nativeElement.querySelector('.home__logo-small');
    const big = fixture.nativeElement.querySelector('.home__logo');
    expect(small).not.toBeNull();
    expect(big).not.toBeNull();
    expect(small.getAttribute('src')).toContain('myGym.png');
    expect(big.getAttribute('src')).toContain('myGym.png');
  });

  it('bez tytułu nie renderuje nagłówka app-screen', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    // Home używa <app-screen> bez `title` → pasek nagłówka Screen się nie renderuje.
    expect(fixture.nativeElement.querySelector('.screen__header-logo')).toBeNull();
    expect(fixture.nativeElement.querySelector('.screen__title')).toBeNull();
  });
});
