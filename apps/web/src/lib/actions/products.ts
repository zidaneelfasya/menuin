'use server';

import { db } from '@/lib/db';
import { products, categories, productModifierGroups, modifierGroups } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from './auth';
import { AuditService } from '@/lib/services/audit.service';

import { productSchema } from '@menuin/validation';
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
        stock: products.stock,
        minStock: products.minStock,
        trackStock: products.trackStock,
        categoryName: categories.name,
        categoryId: products.categoryId,
        imageUrl: products.imageUrl,
        barcode: products.barcode,
        isAvailableOnline: products.isAvailableOnline,
        isFeatured: products.isFeatured,
        status: sql<string>`CASE WHEN ${products.trackStock} = false THEN 'active' WHEN ${products.stock} > 0 THEN 'active' ELSE 'inactive' END`,
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
    
    const insertedProduct = await db.insert(products).values({
      tenantId: user.tenantId,
      name: validatedData.name,
      categoryId: validatedData.categoryId,
      price: validatedData.price.toString(),
      costPrice: validatedData.costPrice.toString(),
      stock: validatedData.stock,
      minStock: validatedData.minStock,
      trackStock: validatedData.trackStock ?? true,
      imageUrl: validatedData.imageUrl,
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
    return { success: false, error: 'Gagal membuat produk.' };
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
        categoryId: validatedData.categoryId,
        price: validatedData.price.toString(),
        costPrice: validatedData.costPrice.toString(),
        stock: validatedData.stock,
        minStock: validatedData.minStock,
        trackStock: validatedData.trackStock ?? true,
        imageUrl: validatedData.imageUrl,
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
