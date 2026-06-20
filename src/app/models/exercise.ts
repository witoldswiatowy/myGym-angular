export type MuscleId = string;
export type EquipmentId = string;
export type TagId = string;

export interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  aliases?: string[];

  primaryMuscleId: MuscleId;
  secondaryMuscleIds: MuscleId[];

  equipmentIds: EquipmentId[];
  tagIds: TagId[];
}
