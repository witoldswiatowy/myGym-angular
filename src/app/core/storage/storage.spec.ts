// jsdom nie dostarcza natywnego IndexedDB — `fake-indexeddb/auto` instaluje
// w pełni funkcjonalną, in-memory implementację jako globalne `indexedDB`.
import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, it } from 'vitest';
import { StorageService } from './storage';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    // Świeży serwis (nowe połączenie) + czysty magazyn przed każdym testem,
    // by testy były niezależne mimo współdzielonego globalnego IndexedDB.
    service = new StorageService();
    await service.clear();
  });

  it('round-trip: setItem → getItem zwraca tę samą wartość', async () => {
    await service.setItem('greeting', 'hello');
    const result = await service.getItem<string>('greeting');
    expect(result).toBe('hello');
  });

  it('round-trip: zachowuje strukturę obiektu (structured clone)', async () => {
    const value = { id: 'ex_1', tags: ['a', 'b'], nested: { reps: 5 } };
    await service.setItem('exercise', value);
    const result = await service.getItem<typeof value>('exercise');
    expect(result).toEqual(value);
  });

  it('getItem nieistniejącego klucza zwraca null', async () => {
    const result = await service.getItem<string>('missing');
    expect(result).toBeNull();
  });

  it('removeItem usuwa wpis (kolejne getItem → null)', async () => {
    await service.setItem('temp', 42);
    await service.removeItem('temp');
    const result = await service.getItem<number>('temp');
    expect(result).toBeNull();
  });

  it('setItem nadpisuje istniejącą wartość', async () => {
    await service.setItem('counter', 1);
    await service.setItem('counter', 2);
    const result = await service.getItem<number>('counter');
    expect(result).toBe(2);
  });

  it('multiSet zapisuje wiele par w jednej transakcji', async () => {
    await service.multiSet([
      ['a', 1],
      ['b', 2],
    ]);
    expect(await service.getItem<number>('a')).toBe(1);
    expect(await service.getItem<number>('b')).toBe(2);
  });

  it('clear usuwa wszystkie wpisy', async () => {
    await service.setItem('x', 'foo');
    await service.setItem('y', 'bar');
    await service.clear();
    expect(await service.getItem<string>('x')).toBeNull();
    expect(await service.keys()).toEqual([]);
  });

  it('keys zwraca listę zapisanych kluczy', async () => {
    await service.setItem('k1', 1);
    await service.setItem('k2', 2);
    const keys = await service.keys();
    expect(keys.sort()).toEqual(['k1', 'k2']);
  });
});
