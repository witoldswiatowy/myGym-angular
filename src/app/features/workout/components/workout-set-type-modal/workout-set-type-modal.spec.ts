import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';

import { WorkoutSetTypeModal, WorkoutSetTypeModalData } from './workout-set-type-modal';

describe('WorkoutSetTypeModal', () => {
  // Atrapa referencji dialogu — przechwytuje wynik zamknięcia (zamiast callbacka RN).
  const dialogRef = { close: vi.fn() };

  async function setup(
    data: WorkoutSetTypeModalData | null = null,
  ): Promise<ComponentFixture<WorkoutSetTypeModal>> {
    dialogRef.close.mockClear();
    await TestBed.configureTestingModule({
      imports: [WorkoutSetTypeModal],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkoutSetTypeModal);
    fixture.detectChanges();
    return fixture;
  }

  function getOptions(fixture: ComponentFixture<WorkoutSetTypeModal>): HTMLButtonElement[] {
    return fixture.debugElement
      .queryAll(By.css('.workout-set-type-modal__option'))
      .map((d) => d.nativeElement as HTMLButtonElement);
  }

  it('renderuje wszystkie 4 opcje z etykietami i typami (1:1 z RN)', async () => {
    const fixture = await setup();
    const texts = getOptions(fixture).map((b) => b.textContent?.trim());
    expect(texts).toEqual([
      'WarmUp (warmup)',
      'Normal (working)',
      'Drop (drop)',
      'Upadek (failure)',
    ]);
  });

  it('podświetla aktywny typ przekazany w DATA', async () => {
    const fixture = await setup({ selected: 'drop' });
    const active = getOptions(fixture).filter((b) =>
      b.classList.contains('workout-set-type-modal__option--active'),
    );
    expect(active).toHaveLength(1);
    expect(active[0].textContent?.trim()).toBe('Drop (drop)');
  });

  it('bez DATA nie podświetla żadnej opcji', async () => {
    const fixture = await setup();
    const active = getOptions(fixture).filter((b) =>
      b.classList.contains('workout-set-type-modal__option--active'),
    );
    expect(active).toHaveLength(0);
  });

  it('klik opcji zamyka dialog z wybranym typem (RN: selectSetType)', async () => {
    const fixture = await setup();
    getOptions(fixture)[2].click(); // 'drop'
    expect(dialogRef.close).toHaveBeenCalledWith('drop');
  });

  it('bez interakcji nie zamyka dialogu (zamknięcie bez wyboru = natywne MatDialog → undefined)', async () => {
    const fixture = await setup();
    // Brak kliknięcia opcji = brak wyniku. Zamknięcie w tło/ESC obsługuje natywnie
    // MatDialog (zwraca undefined), poza kodem komponentu — komponent nie woła close().
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
