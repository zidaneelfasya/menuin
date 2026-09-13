export interface ProductDto {
  id: string;
  sku?: string | null;
  name: string;
  price: string;
  costPrice?: string | null;
  stock: number;
  minStock: number;
  categoryName: string | null;
  categoryId: string | null;
  imageUrl: string | null;
  barcode?: string | null;
  isAvailableOnline?: boolean;
  isFeatured?: boolean;
  trackStock?: boolean;
  status: string;
  modifierGroupIds?: string[];
}
