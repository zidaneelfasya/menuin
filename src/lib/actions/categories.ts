'use server';

import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
});

export async function getCategories() {
  try {
    const data = await db.select().from(categories).orderBy(categories.name);
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: 'Gagal mengambil data kategori' };
  }
}

export async function createCategory(formData: z.infer<typeof categorySchema>) {
  try {
    const validatedData = categorySchema.parse(formData);
    const slug = validatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    await db.insert(categories).values({
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
    const validatedData = categorySchema.parse(formData);
    const slug = validatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    await db.update(categories)
      .set({
        name: validatedData.name,
        slug,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id));
    
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
    await db.delete(categories).where(eq(categories.id, id));
    
    revalidatePath('/categories');
    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Gagal menghapus kategori. Pastikan tidak ada produk yang menggunakan kategori ini.' };
  }
}
