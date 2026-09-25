'use server';

import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from './auth';

import { categorySchema } from '@menuin/validation';
import { CategoryDto } from '@menuin/types';

export async function getCategories(): Promise<{ success: boolean, data?: CategoryDto[], error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }
    
    const data = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        productCount: sql<number>`cast(count(${products.id}) as integer)`,
      })
      .from(categories)
      .leftJoin(products, eq(products.categoryId, categories.id))
      .where(eq(categories.tenantId, user.tenantId))
      .groupBy(categories.id)
      .orderBy(categories.name);

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: 'Gagal mengambil data kategori' };
  }
}

export async function createCategory(formData: z.infer<typeof categorySchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized or no dashboard' };
    
    const validatedData = categorySchema.parse(formData);
    const slug = validatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    await db.insert(categories).values({
      tenantId: user.tenantId,
      name: validatedData.name,
      slug,
      icon: validatedData.icon || null,
    });
    
    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    return { success: true };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: 'Gagal membuat kategori' };
  }
}

export async function updateCategory(id: string, formData: z.infer<typeof categorySchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized or no dashboard' };
    
    const validatedData = categorySchema.parse(formData);
    const slug = validatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    await db.update(categories)
      .set({
        name: validatedData.name,
        slug,
        icon: validatedData.icon || null,
        updatedAt: new Date(),
      })
      .where(and(eq(categories.id, id), eq(categories.tenantId, user.tenantId)));
    
    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: 'Gagal memperbarui kategori' };
  }
}

export async function deleteCategory(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized or no dashboard' };
    
    await db.delete(categories).where(and(eq(categories.id, id), eq(categories.tenantId, user.tenantId)));
    
    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Gagal menghapus kategori. Pastikan tidak ada produk yang menggunakan kategori ini.' };
  }
}

export type CategoryProductItem = {
  id: string;
  name: string;
  sku: string;
  price: string | number;
  stock: number;
  trackStock: boolean;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
};

export async function getCategoryProducts(categoryId: string): Promise<{
  success: boolean;
  data?: CategoryProductItem[];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }

    const data = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        price: products.price,
        stock: products.stock,
        trackStock: products.trackStock,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        isFeatured: products.isFeatured,
      })
      .from(products)
      .where(and(eq(products.categoryId, categoryId), eq(products.tenantId, user.tenantId)))
      .orderBy(desc(products.isFeatured), products.name);

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching category products:', error);
    return { success: false, error: 'Gagal mengambil menu produk kategori' };
  }
}
