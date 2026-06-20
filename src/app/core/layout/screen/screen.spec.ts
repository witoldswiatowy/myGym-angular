import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScreenComponent } from './screen';

// Host testowy: projektuje treść do <ng-content> i steruje opcjonalnym title.
@Component({
  imports: [ScreenComponent],
  template: `
    <app-screen [title]="title">
      <p class="projected">Treść dziecka</p>
    </app-screen>
  `,
})
class TestHost {
  title?: string;
}

describe('ScreenComponent', () => {
  it('tworzy się', () => {
    const fixture = TestBed.createComponent(ScreenComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderuje treść projektowaną przez <ng-content>', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const projected = fixture.nativeElement.querySelector('.projected');
    expect(projected?.textContent).toContain('Treść dziecka');
  });

  it('bez title nie renderuje nagłówka', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.screen__header-logo')).toBeNull();
    expect(fixture.nativeElement.querySelector('.screen__title')).toBeNull();
  });

  it('z title renderuje nagłówek z logo „myGym" i tytułem', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.title = 'Trening';
    fixture.detectChanges();
    const logo = fixture.nativeElement.querySelector('.screen__logo');
    const heading = fixture.nativeElement.querySelector('.screen__title');
    expect(logo?.textContent).toContain('myGym');
    expect(heading?.textContent).toContain('Trening');
  });
});
