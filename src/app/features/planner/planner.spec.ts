import { TestBed } from '@angular/core/testing';
import { Planner } from './planner';

describe('Planner', () => {
  it('tworzy się', () => {
    const fixture = TestBed.createComponent(Planner);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('opakowuje treść komponentem wspólnym app-screen z tytułem', () => {
    const fixture = TestBed.createComponent(Planner);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-screen')).not.toBeNull();
    // `app-screen` z tytułem renderuje nagłówek z tytułem (odpowiednik headerTitle w RN).
    const title = fixture.nativeElement.querySelector('.screen__title');
    expect(title).not.toBeNull();
    expect(title.textContent).toContain('Workout Planner');
  });

  it('renderuje tekst placeholdera „In progress..."', () => {
    const fixture = TestBed.createComponent(Planner);
    fixture.detectChanges();
    const placeholder = fixture.nativeElement.querySelector('.planner__placeholder');
    expect(placeholder).not.toBeNull();
    expect(placeholder.textContent).toContain('In progress...');
  });
});
