import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScreenComponent } from '../../core/layout/screen/screen';

// Statyczny ekran „About Me" — odpowiednik `app/about-me/index.tsx` z RN.
// Bez logiki: opakowany komponentem wspólnym `app-screen` (z tytułem),
// renderuje pojedynczą statyczną treść (imię i nazwisko autora).
// Nazwa klasy `AboutMe` bez sufiksu (D9/A) — brak kolizji z typem DOM (D11).
@Component({
  selector: 'app-about-me',
  imports: [ScreenComponent],
  templateUrl: './about-me.html',
  styleUrl: './about-me.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutMe {}
