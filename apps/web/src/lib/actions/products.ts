'use server';

import { db } from '@/lib/db';
import { products, categories, productModifierGroups, modifierGroups } from '@/lib/db/schema';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from './auth';
import { AuditService } from '@/lib/services/audit.service';

import { productSchema } from '@menuin/validation';

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

import { ProductDto } from '@menuin/types';

export async function getProducts(): Promise<{ success: boolean, data?: ProductDto[], error?: string }> {
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
        costPrice: products.costPrice,
        stock: products.stock,
        minStock: products.minStock,
        trackStock: products.trackStock,
        categoryName: categories.name,
        categoryId: products.categoryId,
        imageUrl: products.imageUrl,
        description: products.description,
        barcode: products.barcode,
        isAvailableOnline: products.isAvailableOnline,
        isFeatured: products.isFeatured,
        isActive: products.isActive,
        status: sql<string>`CASE WHEN ${products.isActive} = false THEN 'inactive' WHEN ${products.trackStock} = false THEN 'active' WHEN ${products.stock} > 0 THEN 'active' ELSE 'out_of_stock' END`,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.tenantId, user.tenantId))
      .orderBy(desc(products.isFeatured), products.name);
      
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

export async function toggleProductBestSeller(productId: string, isFeatured: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    await db.update(products)
      .set({ isFeatured, updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.tenantId, user.tenantId)));

    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    return { success: true };
  } catch (error) {
    console.error('Error toggling best seller status:', error);
    return { success: false, error: 'Gagal mengubah status Best Seller' };
  }
}

export async function toggleTrackStock(productId: string, trackStock: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    await db.update(products)
      .set({ trackStock, updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.tenantId, user.tenantId)));

    if (user && typeof user === "object" && "outletKey" in user) { 
      revalidatePath(`/outlet/${user.outletKey}`, "layout"); 
      revalidatePath(`/outlet/${user.outletKey}/items`, "page"); 
      revalidatePath(`/outlet/${user.outletKey}/inventory`, "page"); 
    }
    return { success: true };
  } catch (error) {
    console.error('Error toggling track stock status:', error);
    return { success: false, error: 'Gagal mengubah status pelacakan stok' };
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
    
    const insertedProduct = await db.insert(products).values({
      tenantId: user.tenantId,
      name: validatedData.name,
      sku: validatedData.sku,
      categoryId: validatedData.categoryId,
      price: validatedData.price.toString(),
      costPrice: validatedData.costPrice.toString(),
      stock: validatedData.stock,
      minStock: validatedData.minStock,
      trackStock: validatedData.trackStock ?? true,
      isActive: validatedData.isActive ?? true,
      imageUrl: validatedData.imageUrl,
      description: validatedData.description || null,
      barcode: finalBarcode,
    }).returning({ id: products.id });
    
    const newProductId = insertedProduct[0].id;
    if (validatedData.modifierGroupIds && validatedData.modifierGroupIds.length > 0) {
      await db.insert(productModifierGroups).values(
        validatedData.modifierGroupIds.map(groupId => ({
          tenantId: user.tenantId as string,
          productId: newProductId,
          modifierGroupId: groupId
        }))
      );
    }
    
    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
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
        trackStock: validatedData.trackStock ?? true,
        ...(validatedData.isActive !== undefined ? { isActive: validatedData.isActive } : {}),
        imageUrl: validatedData.imageUrl,
        description: validatedData.description || null,
        barcode: validatedData.barcode,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, id), eq(products.tenantId, user.tenantId)));
    
    // Update modifiers
    await db.delete(productModifierGroups).where(eq(productModifierGroups.productId, id));
    if (validatedData.modifierGroupIds && validatedData.modifierGroupIds.length > 0) {
      await db.insert(productModifierGroups).values(
        validatedData.modifierGroupIds.map(groupId => ({
          tenantId: user.tenantId as string,
          productId: id,
          modifierGroupId: groupId
        }))
      );
    }
    
    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
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
    
    // Non-blocking audit log
    AuditService.log('DELETE', 'products', id).catch(console.error);
    
    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: 'Gagal menghapus produk. Pastikan produk ini belum memiliki riwayat transaksi.' };
  }
}

export async function bulkToggleProductBestSeller(productIds: string[], isFeatured: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };
    if (!productIds || productIds.length === 0) return { success: true, count: 0 };

    await db.update(products)
      .set({ isFeatured, updatedAt: new Date() })
      .where(and(inArray(products.id, productIds), eq(products.tenantId, user.tenantId)));

    if (user && typeof user === "object" && "outletKey" in user) { 
      revalidatePath(`/outlet/${user.outletKey}`, "layout"); 
      revalidatePath(`/outlet/${user.outletKey}/items`, "page"); 
    }
    return { success: true, count: productIds.length };
  } catch (error) {
    console.error('Error bulk toggling best seller status:', error);
    return { success: false, error: 'Gagal mengubah status Best Seller produk terpilih' };
  }
}

export async function bulkDeleteProducts(productIds: string[]) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };
    if (!productIds || productIds.length === 0) return { success: true, count: 0 };

    await db.delete(productModifierGroups).where(inArray(productModifierGroups.productId, productIds));
    await db.delete(products).where(and(inArray(products.id, productIds), eq(products.tenantId, user.tenantId)));

    // Non-blocking audit logs
    for (const id of productIds) {
      AuditService.log('DELETE', 'products', id).catch(console.error);
    }

    if (user && typeof user === "object" && "outletKey" in user) { 
      revalidatePath(`/outlet/${user.outletKey}`, "layout"); 
      revalidatePath(`/outlet/${user.outletKey}/items`, "page"); 
    }
    return { success: true, count: productIds.length };
  } catch (error) {
    console.error('Error bulk deleting products:', error);
    return { success: false, error: 'Gagal menghapus beberapa produk. Pastikan produk tidak memiliki riwayat transaksi aktif.' };
  }
}

export async function toggleProductActiveStatus(productId: string, isActive: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    await db.update(products)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.tenantId, user.tenantId)));

    if (user && typeof user === "object" && "outletKey" in user) { 
      revalidatePath(`/outlet/${user.outletKey}`, "layout"); 
      revalidatePath(`/outlet/${user.outletKey}/items`, "page"); 
      revalidatePath(`/outlet/${user.outletKey}/pos`, "page"); 
    }
    revalidatePath("/store/[slug]", "layout");
    return { success: true };
  } catch (error) {
    console.error('Error toggling product active status:', error);
    return { success: false, error: 'Gagal mengubah status ketersediaan item' };
  }
}

export async function bulkToggleProductActiveStatus(productIds: string[], isActive: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };
    if (!productIds || productIds.length === 0) return { success: true, count: 0 };

    await db.update(products)
      .set({ isActive, updatedAt: new Date() })
      .where(and(inArray(products.id, productIds), eq(products.tenantId, user.tenantId)));

    if (user && typeof user === "object" && "outletKey" in user) { 
      revalidatePath(`/outlet/${user.outletKey}`, "layout"); 
      revalidatePath(`/outlet/${user.outletKey}/items`, "page"); 
      revalidatePath(`/outlet/${user.outletKey}/pos`, "page"); 
    }
    revalidatePath("/store/[slug]", "layout");
    return { success: true, count: productIds.length };
  } catch (error) {
    console.error('Error bulk toggling product active status:', error);
    return { success: false, error: 'Gagal mengubah status ketersediaan beberapa produk' };
  }
}

