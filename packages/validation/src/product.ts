import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  sku: z.string().min(1, 'SKU wajib diisi'),
  categoryId: z.string().uuid('Kategori tidak valid').nullable(),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  costPrice: z.coerce.number().min(0, 'Harga modal tidak boleh negatif'),
  stock: z.coerce.number().min(0, 'Stok awal tidak boleh negatif'),
  minStock: z.coerce.number().min(0, 'Batas minimum stok tidak boleh negatif'),
  imageUrl: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  modifierGroupIds: z.array(z.string()).optional(),
});
