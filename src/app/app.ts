import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TabBar } from './core/layout/tab-bar/tab-bar';

// Powłoka aplikacji (root): treść aktywnej trasy nad dolnym paskiem nawigacji.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TabBar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
