export interface CategoryDto {
  id: string;
  name: string;
  slug?: string;
  icon?: string | null;
  productCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
