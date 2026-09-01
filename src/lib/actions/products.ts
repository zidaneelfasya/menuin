'use server';

import { db } from '@/lib/db';
import { products, categories, productModifierGroups, modifierGroups } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from './auth';

const productSchema = z.object({
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

// Helper untuk generate 13 digit barcode EAN-13 style dummy
function generateBarcode() {
  const prefix = '899'; // Indonesia GS1 prefix
  const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString(); // 9 digits
  const code = prefix + randomPart;
  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit.toString();
}

export async function getProducts() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }

    const data = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        price: products.price,
        stock: products.stock,
        minStock: products.minStock,
        categoryName: categories.name,
        categoryId: products.categoryId,
        imageUrl: products.imageUrl,
        barcode: products.barcode,
        isAvailableOnline: products.isAvailableOnline,
        isFeatured: products.isFeatured,
        status: sql<string>`CASE WHEN ${products.stock} > 0 THEN 'active' ELSE 'inactive' END`,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.tenantId, user.tenantId))
      .orderBy(products.name);
      
    // Fetch product modifiers
    const allProductModifiers = await db.select().from(productModifierGroups);
    const dataWithModifiers = data.map(p => ({
      ...p,
      modifierGroupIds: allProductModifiers.filter(pm => pm.productId === p.id).map(pm => pm.modifierGroupId)
    }));
      
    return { success: true, data: dataWithModifiers };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { success: false, error: 'Gagal mengambil data produk' };
  }
}

export async function createProduct(formData: z.infer<typeof productSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized or no dashboard' };

    const validatedData = productSchema.parse(formData);
    
    // Auto-generate barcode if empty
    const finalBarcode = validatedData.barcode && validatedData.barcode.trim() !== '' 
      ? validatedData.barcode 
      : generateBarcode();
    
    await db.insert(products).values({
      tenantId: user.tenantId,
      name: validatedData.name,
      sku: validatedData.sku,
      categoryId: validatedData.categoryId,
      price: validatedData.price.toString(),
      costPrice: validatedData.costPrice.toString(),
      stock: validatedData.stock,
      minStock: validatedData.minStock,
      imageUrl: validatedData.imageUrl,
      barcode: finalBarcode,
    }).returning({ id: products.id });
    
    const newProductId = insertedProduct[0].id;
    if (validatedData.modifierGroupIds && validatedData.modifierGroupIds.length > 0) {
      await db.insert(productModifierGroups).values(
        validatedData.modifierGroupIds.map(groupId => ({
          productId: newProductId,
          modifierGroupId: groupId
        }))
      );
    }
    
    revalidatePath('/tenants/products');
    revalidatePath('/tenants/pos');
    revalidatePath('/tenants/inventory');
    return { success: true };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error: 'Gagal membuat produk. Pastikan SKU unik.' };
  }
}

export async function updateProduct(id: string, formData: z.infer<typeof productSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    const validatedData = productSchema.parse(formData);
    
    await db.update(products)
      .set({
        name: validatedData.name,
        sku: validatedData.sku,
        categoryId: validatedData.categoryId,
        price: validatedData.price.toString(),
        costPrice: validatedData.costPrice.toString(),
        stock: validatedData.stock,
        minStock: validatedData.minStock,
        imageUrl: validatedData.imageUrl,
        barcode: validatedData.barcode,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, id), eq(products.tenantId, user.tenantId)));
    
    // Update modifiers
    await db.delete(productModifierGroups).where(eq(productModifierGroups.productId, id));
    if (validatedData.modifierGroupIds && validatedData.modifierGroupIds.length > 0) {
      await db.insert(productModifierGroups).values(
        validatedData.modifierGroupIds.map(groupId => ({
          productId: id,
          modifierGroupId: groupId
        }))
      );
    }
    
    revalidatePath('/tenants/products');
    revalidatePath('/tenants/pos');
    revalidatePath('/tenants/inventory');
    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: 'Gagal memperbarui produk' };
  }
}

export async function deleteProduct(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    await db.delete(productModifierGroups).where(eq(productModifierGroups.productId, id));
    await db.delete(products).where(and(eq(products.id, id), eq(products.tenantId, user.tenantId)));
    
    revalidatePath('/tenants/products');
    revalidatePath('/tenants/pos');
    revalidatePath('/tenants/inventory');
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: 'Gagal menghapus produk. Pastikan produk ini belum memiliki riwayat transaksi.' };
  }
}
