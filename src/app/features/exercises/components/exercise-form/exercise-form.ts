import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Equipment } from '../../../../models/equipment';
import { Muscle } from '../../../../models/muscle';
import { Tag } from '../../../../models/tag';

// Wartości formularza dodawania ćwiczenia (odpowiednik `ExerciseFormValues` z RN,
// definiowanego w `add-exercise-modal.tsx`). To DTO bez `id` — pola identyczne jak
// w `Exercise`, ale bez identyfikatora (ten nadaje warstwa zapisu). Eksportowany,
// bo konsumuje go modal (krok 022).
export interface ExerciseFormValues {
  name: string;
  nameEn: string;
  primaryMuscleId: string;
  secondaryMuscleIds: string[];
  equipmentIds: string[];
  tagIds: string[];
}

// Czysty helper przełączania zaznaczenia — 1:1 ze źródłem RN (`toggleSelection`):
// jeśli ID jest na liście, usuwa je; w przeciwnym razie dokłada na koniec.
export function toggleSelection(currentValues: string[], targetId: string): string[] {
  if (currentValues.includes(targetId)) {
    return currentValues.filter((id) => id !== targetId);
  }

  return [...currentValues, targetId];
}

// Formularz dodawania ćwiczenia — odpowiednik `ExerciseForm` (RN, `exercise-form.tsx`).
// W RN był to komponent funkcyjny ze stanem `useState` i propsami: słowniki opcji
// (`muscles`, `equipment`, `tags`) oraz callbacki (`onCancel`, `onSave`).
// Odwzorowanie (MAPPING §2.1 — signals-first, spójnie z PLAN.md kroku 021:
// „isValid jako computed", „toggleSelection"):
//   - propsy-słowniki → wejścia sygnałowe `input.required()` (1:1 z propsami RN),
//   - `useState` → `signal`, wartość początkowa `primaryMuscleId` (RN: `muscles[0]?.id`)
//     → `linkedSignal` zależny od `muscles()` (zapisywalny, domyślnie pierwszy mięsień),
//   - `useMemo(isValid)` → `computed()`,
//   - callbacki `onSave`/`onCancel` → wyjścia `save`/`cancel` (`output()`).
@Component({
  selector: 'app-exercise-form',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  templateUrl: './exercise-form.html',
  styleUrl: './exercise-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExerciseForm {
  // Słowniki opcji przekazywane przez rodzica (1:1 z propsami RN — modal w kroku 022
  // dostarcza MUSCLES/EQUIPMENT/TAGS).
  readonly muscles = input.required<Muscle[]>();
  readonly equipment = input.required<Equipment[]>();
  readonly tags = input.required<Tag[]>();

  // Wyjścia odpowiadające callbackom RN: `onSave` (z wartościami formularza) i `onCancel`.
  readonly save = output<ExerciseFormValues>();
  readonly cancel = output<void>();

  // Stan pól tekstowych (RN: `useState("")`).
  protected readonly name = signal('');
  protected readonly nameEn = signal('');

  // Mięsień główny — wartość początkowa to pierwszy mięsień ze słownika (RN: `muscles[0]?.id`).
  // `linkedSignal` daje zapisywalny sygnał z domyślną wartością wyliczaną z `muscles()`.
  protected readonly primaryMuscleId = linkedSignal<string>(() => this.muscles()[0]?.id ?? '');

  // Wielokrotny wybór (RN: `useState<string[]>([])`).
  protected readonly secondaryMuscleIds = signal<string[]>([]);
  protected readonly equipmentIds = signal<string[]>([]);
  protected readonly tagIds = signal<string[]>([]);

  // Flaga trwającego zapisu (RN: `submitting`). UWAGA: w RN `onSave` mógł być async i
  // `submitting` pozostawał `true` do jego rozwiązania; w Angularze `output.emit()` jest
  // synchroniczne, więc flaga służy głównie jako zabezpieczenie przed podwójnym zapisem.
  protected readonly submitting = signal(false);

  // Walidacja (RN: `useMemo` → tu `computed`): nazwa PL, nazwa EN i mięsień główny niepuste.
  protected readonly isValid = computed(
    () =>
      this.name().trim().length > 0 &&
      this.nameEn().trim().length > 0 &&
      this.primaryMuscleId().length > 0,
  );

  // Aktualizacja pól tekstowych z natywnego zdarzenia `input`.
  protected setName(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  protected setNameEn(event: Event): void {
    this.nameEn.set((event.target as HTMLInputElement).value);
  }

  // Zmiana mięśnia głównego — ustawia ID i usuwa go z mięśni dodatkowych (zachowanie RN).
  onPrimaryMuscleChange(change: MatSelectChange): void {
    const muscleId = change.value as string;
    this.primaryMuscleId.set(muscleId);
    this.secondaryMuscleIds.update((current) => current.filter((id) => id !== muscleId));
  }

  // Przełączenie mięśnia dodatkowego — mięśnia głównego nie da się dodać (zachowanie RN).
  toggleSecondaryMuscle(muscleId: string): void {
    if (muscleId === this.primaryMuscleId()) {
      return;
    }

    this.secondaryMuscleIds.update((current) => toggleSelection(current, muscleId));
  }

  // Przełączenie sprzętu.
  toggleEquipment(equipmentId: string): void {
    this.equipmentIds.update((current) => toggleSelection(current, equipmentId));
  }

  // Przełączenie tagu.
  toggleTag(tagId: string): void {
    this.tagIds.update((current) => toggleSelection(current, tagId));
  }

  // Zapis — odpowiednik `handleSave` (RN): guard walidacji + braku trwającego zapisu,
  // emisja wartości, finalnie zdjęcie flagi `submitting`.
  handleSave(): void {
    if (!this.isValid() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    try {
      this.save.emit({
        name: this.name(),
        nameEn: this.nameEn(),
        primaryMuscleId: this.primaryMuscleId(),
        secondaryMuscleIds: this.secondaryMuscleIds(),
        equipmentIds: this.equipmentIds(),
        tagIds: this.tagIds(),
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
