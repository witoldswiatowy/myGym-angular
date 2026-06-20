import { Injectable } from '@angular/core';

// Nazwa bazy i magazynu IndexedDB (D3 — silnik storage za abstrakcją StorageService).
const DB_NAME = 'myGym';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

/**
 * Abstrakcja trwałego storage oparta o IndexedDB (decyzja D3).
 *
 * Odpowiednik `AsyncStorage` ze źródła RN: API jest w pełni Promise-owe, dzięki
 * czemu repozytoria (kroki 009/010) zachowują dotychczasowe, asynchroniczne
 * zachowanie 1:1. Nazwy metod (`getItem`/`setItem`/`removeItem`/`multiSet`)
 * odwzorowują `AsyncStorage`, by przepisanie repozytoriów było mechaniczne.
 *
 * Model danych: jeden magazyn typu klucz→wartość (`keyval`) z kluczami "out-of-line"
 * (klucz przekazywany osobno przy `put`). IndexedDB przechowuje wartości
 * strukturalnie (structured clone), więc trzymamy obiekty bezpośrednio — bez
 * ręcznej serializacji JSON, którą wymuszało API `AsyncStorage`.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  // Leniwie otwierane połączenie z bazą; współdzielone między wywołaniami.
  // (Odpowiednik "singletona połączenia" — otwieramy bazę raz.)
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Zwraca wartość spod klucza albo `null`, gdy klucz nie istnieje
   * (zachowanie zgodne z `AsyncStorage.getItem`).
   */
  async getItem<T>(key: string): Promise<T | null> {
    const db = await this.openDb();
    return new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => {
        const result = request.result as T | undefined;
        // IndexedDB zwraca `undefined` dla brakującego klucza — normalizujemy do `null`.
        resolve(result === undefined ? null : result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /** Zapisuje (lub nadpisuje) wartość pod kluczem. */
  async setItem<T>(key: string, value: T): Promise<void> {
    const db = await this.openDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      // Rozstrzygamy na poziomie transakcji — gwarantuje to trwałość zapisu.
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  /** Usuwa wpis spod klucza (no-op, gdy klucz nie istnieje). */
  async removeItem(key: string): Promise<void> {
    const db = await this.openDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  /**
   * Zapisuje wiele par klucz→wartość w jednej transakcji
   * (odpowiednik `AsyncStorage.multiSet`, używany przez `WorkoutRepository.resetToSeed`).
   */
  async multiSet(entries: readonly (readonly [string, unknown])[]): Promise<void> {
    const db = await this.openDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const [key, value] of entries) {
        store.put(value, key);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  /** Usuwa wszystkie wpisy z magazynu. */
  async clear(): Promise<void> {
    const db = await this.openDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  /** Zwraca listę wszystkich kluczy w magazynie. */
  async keys(): Promise<string[]> {
    const db = await this.openDb();
    return new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAllKeys();
      request.onsuccess = () => {
        const result = request.result as IDBValidKey[];
        resolve(result.map((key) => String(key)));
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Leniwie otwiera (i cache'uje) połączenie z bazą. Magazyn `keyval` tworzony
   * jest w `onupgradeneeded` — wywoływanym przy pierwszym otwarciu lub zmianie wersji.
   */
  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise === null) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            // Klucze "out-of-line" — przekazujemy je osobno przy put().
            db.createObjectStore(STORE_NAME);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }
}
