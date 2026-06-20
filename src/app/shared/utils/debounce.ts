import { Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

/**
 * Zwraca sygnał, który podąża za `source`, ale emituje nową wartość dopiero
 * po `delayMs` od OSTATNIEJ zmiany. Szybkie kolejne zmiany są „kolapsowane"
 * do ostatniej wartości — odpowiednik hooka RN `useDebouncedValue<T>`
 * (tam: `setTimeout` + cleanup; tu: strumień RxJS `debounceTime`).
 *
 * Wyjątek od reguły „signals first" (MAPPING.md §2.1): debounce to strumień
 * w czasie, więc mostkujemy signal → observable (`toObservable`) → `debounceTime`
 * → signal (`toSignal`).
 *
 * Wymaga kontekstu wstrzykiwania (konstruktor komponentu/serwisu albo
 * `runInInjectionContext`), ponieważ `toObservable`/`toSignal` potrzebują
 * `Injector` (rejestrują sprzątanie przez `DestroyRef`).
 *
 * @typeParam T typ wartości źródłowej (bez stanu domenowego)
 * @param source sygnał wejściowy obserwowany w czasie
 * @param delayMs opóźnienie debounce w milisekundach
 * @returns sygnał z opóźnioną, ostatnią wartością (na starcie = `source()`)
 */
export function debouncedSignal<T>(source: Signal<T>, delayMs: number): Signal<T> {
  const debounced$ = toObservable(source).pipe(debounceTime(delayMs));
  // initialValue = bieżąca wartość źródła, by sygnał miał sens od pierwszego odczytu
  return toSignal(debounced$, { initialValue: source() });
}
