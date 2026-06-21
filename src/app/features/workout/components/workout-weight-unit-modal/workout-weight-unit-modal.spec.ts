import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';

import { WorkoutWeightUnitModal, WorkoutWeightUnitModalData } from './workout-weight-unit-modal';

describe('WorkoutWeightUnitModal', () => {
  // Atrapa referencji dialogu — przechwytuje wynik zamknięcia (zamiast callbacka RN).
  const dialogRef = { close: vi.fn() };

  async function setup(
    data: WorkoutWeightUnitModalData | null = null,
  ): Promise<ComponentFixture<WorkoutWeightUnitModal>> {
    dialogRef.close.mockClear();
    await TestBed.configureTestingModule({
      imports: [WorkoutWeightUnitModal],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkoutWeightUnitModal);
    fixture.detectChanges();
    return fixture;
  }

  function getOptions(fixture: ComponentFixture<WorkoutWeightUnitModal>): HTMLButtonElement[] {
    return fixture.debugElement
      .queryAll(By.css('.workout-weight-unit-modal__option'))
      .map((d) => d.nativeElement as HTMLButtonElement);
  }

  it('renderuje obie opcje jednostek w kolejności (1:1 z RN: kg, lb)', async () => {
    const fixture = await setup();
    const texts = getOptions(fixture).map((b) => b.textContent?.trim());
    expect(texts).toEqual(['kg', 'lb']);
  });

  it('podświetla aktywną jednostkę przekazaną w DATA', async () => {
    const fixture = await setup({ selected: 'lb' });
    const active = getOptions(fixture).filter((b) =>
      b.classList.contains('workout-weight-unit-modal__option--active'),
    );
    expect(active).toHaveLength(1);
    expect(active[0].textContent?.trim()).toBe('lb');
  });

  it('bez DATA nie podświetla żadnej opcji', async () => {
    const fixture = await setup();
    const active = getOptions(fixture).filter((b) =>
      b.classList.contains('workout-weight-unit-modal__option--active'),
    );
    expect(active).toHaveLength(0);
  });

  it('klik opcji zamyka dialog z wybraną jednostką (RN: selectWeightUnit)', async () => {
    const fixture = await setup();
    getOptions(fixture)[1].click(); // 'lb'
    expect(dialogRef.close).toHaveBeenCalledWith('lb');
  });

  it('bez interakcji nie zamyka dialogu (zamknięcie bez wyboru = natywne MatDialog → undefined)', async () => {
    const fixture = await setup();
    // Brak kliknięcia opcji = brak wyniku. Zamknięcie w tło/ESC obsługuje natywnie
    // MatDialog (zwraca undefined), poza kodem komponentu — komponent nie woła close().
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
