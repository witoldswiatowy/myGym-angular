import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import { TrainingDay } from '../../models/training-day';
import { WorkoutRepository } from '../../repositories/workout-repository';
import { HistoryComponent } from './history';

// Atrapa repozytorium — izoluje komponent od warstwy storage (IndexedDB / D3).
// Zwraca deterministyczny zestaw dni: jeden z notatką, jeden bez (pokrycie `@if`).
const SAMPLE_DAYS: TrainingDay[] = [
  {
    id: 'day-1',
    date: '2026-08-26',
    note: 'Push day',
    createdAt: '2026-08-26T10:00:00.000Z',
  },
  {
    id: 'day-2',
    date: '2026-08-28',
    createdAt: '2026-08-28T10:00:00.000Z',
  },
];

describe('HistoryComponent', () => {
  let getTrainingDays: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getTrainingDays = vi.fn().mockResolvedValue(SAMPLE_DAYS);

    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        // Trasy globalne powstają w kroku 029 — pusty router wystarcza,
        // by dyrektywy `routerLink` mogły się powiązać.
        provideRouter([]),
        // Atrapa repozytorium zamiast realnego dostępu do storage.
        { provide: WorkoutRepository, useValue: { getTrainingDays } },
      ],
    }).compileComponents();
  });

  it('tworzy się', () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('opakowuje treść komponentem wspólnym app-screen z tytułem „Workout History"', async () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-screen')).not.toBeNull();
    const title = fixture.nativeElement.querySelector('.screen__title');
    expect(title).not.toBeNull();
    expect(title.textContent).toContain('Workout History');
  });

  it('ładuje dni treningowe z WorkoutRepository i renderuje je listą (@for)', async () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getTrainingDays).toHaveBeenCalledTimes(1);

    const items = fixture.nativeElement.querySelectorAll('.history__item');
    expect(items.length).toBe(2);

    // Data zawsze renderowana; notatka tylko gdy obecna (@if).
    expect(items[0].querySelector('.history__date').textContent).toContain('2026-08-26');
    expect(items[0].querySelector('.history__note')?.textContent).toContain('Push day');
    expect(items[1].querySelector('.history__date').textContent).toContain('2026-08-28');
    expect(items[1].querySelector('.history__note')).toBeNull();
  });

  it('każdy kafelek linkuje do /workout z query param { id } (D1)', async () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const routerLinks = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .map((debugEl) => debugEl.injector.get(RouterLink).href);

    // `href` zawiera ścieżkę i serializowany query param `id`.
    expect(routerLinks).toContain('/workout?id=day-1');
    expect(routerLinks).toContain('/workout?id=day-2');
  });
});
