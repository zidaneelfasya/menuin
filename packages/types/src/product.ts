export interface ProductDto {
  id: string;
  sku: string;
  name: string;
  price: string;
  stock: number;
  minStock: number;
  categoryName: string | null;
  categoryId: string | null;
  imageUrl: string | null;
  barcode: string | null;
  isAvailableOnline?: boolean;
  isFeatured?: boolean;
  status: string;
  modifierGroupIds?: string[];
}
