export interface ModifierDto {
  id: string;
  groupId: string;
  name: string;
  price: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ModifierGroupDto {
  id: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  modifiers: ModifierDto[];
  createdAt?: Date;
  updatedAt?: Date;
}
