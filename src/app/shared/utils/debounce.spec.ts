import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { debouncedSignal } from './debounce';

describe('debouncedSignal', () => {
  beforeEach(() => {
    // Fałszywe timery sterują zarówno `debounceTime` (asyncScheduler → setTimeout),
    // jak i upływem czasu w teście. Projekt jest zoneless, więc nie używamy
    // `fakeAsync` (wymaga zone-testing) — czas kontrolujemy przez Vitest.
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Wymusza przepływ wartości z sygnału do `toObservable` (uruchamia jego efekt) —
  // odpowiednik cyklu detekcji zmian. W zoneless efekty flushuje `ApplicationRef.tick()`.
  function flushEffects(): void {
    TestBed.inject(ApplicationRef).tick();
  }

  it('emituje tylko OSTATNIĄ wartość po delayMs przy szybkich kolejnych zmianach', () => {
    const source = signal('a');
    const debounced = TestBed.runInInjectionContext(() => debouncedSignal(source, 200));

    // Na starcie sygnał ma wartość źródła.
    expect(debounced()).toBe('a');

    // Trzy szybkie zmiany w odstępach < delayMs — każda resetuje timer debounce.
    source.set('b');
    flushEffects();
    vi.advanceTimersByTime(50);

    source.set('c');
    flushEffects();
    vi.advanceTimersByTime(50);

    source.set('d');
    flushEffects();

    // Jeszcze przed upływem delayMs od ostatniej zmiany — stara wartość.
    expect(debounced()).toBe('a');
    vi.advanceTimersByTime(199);
    expect(debounced()).toBe('a');

    // Po pełnym delayMs od ostatniej zmiany — tylko ostatnia wartość („d").
    vi.advanceTimersByTime(1);
    expect(debounced()).toBe('d');

    // Pośrednie „b"/„c" nigdy nie zostały wyemitowane.
  });

  it('działa generycznie dla typu liczbowego', () => {
    const source = signal(0);
    const debounced = TestBed.runInInjectionContext(() => debouncedSignal(source, 100));

    source.set(1);
    flushEffects();
    vi.advanceTimersByTime(40);
    source.set(2);
    flushEffects();

    expect(debounced()).toBe(0);
    vi.advanceTimersByTime(100);
    expect(debounced()).toBe(2);
  });
});
