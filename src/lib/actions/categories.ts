'use server';

import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from './auth';

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
});

export async function getCategories() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.dashboardId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }
    
    const data = await db.select().from(categories).where(eq(categories.dashboardId, user.dashboardId)).orderBy(categories.name);
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: 'Gagal mengambil data kategori' };
  }
}

export async function createCategory(formData: z.infer<typeof categorySchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.dashboardId) return { success: false, error: 'Unauthorized or no dashboard' };
    
    const validatedData = categorySchema.parse(formData);
    const slug = validatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    await db.insert(categories).values({
      dashboardId: user.dashboardId,
      name: validatedData.name,
      slug,
    });
    
    revalidatePath('/categories');
    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: 'Gagal membuat kategori' };
  }
}

export async function updateCategory(id: string, formData: z.infer<typeof categorySchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.dashboardId) return { success: false, error: 'Unauthorized or no dashboard' };
    
    const validatedData = categorySchema.parse(formData);
    const slug = validatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    await db.update(categories)
      .set({
        name: validatedData.name,
        slug,
        updatedAt: new Date(),
      })
      .where(and(eq(categories.id, id), eq(categories.dashboardId, user.dashboardId)));
    
    revalidatePath('/categories');
    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: 'Gagal memperbarui kategori' };
  }
}

export async function deleteCategory(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.dashboardId) return { success: false, error: 'Unauthorized or no dashboard' };
    
    await db.delete(categories).where(and(eq(categories.id, id), eq(categories.dashboardId, user.dashboardId)));
    
    revalidatePath('/categories');
    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Gagal menghapus kategori. Pastikan tidak ada produk yang menggunakan kategori ini.' };
  }
}
