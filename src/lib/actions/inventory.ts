'use server';

import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().min(1, 'Kuantitas minimal 1'),
  reason: z.string().optional(),
});

export async function adjustStock(formData: z.infer<typeof adjustStockSchema>) {
  try {
    const { productId, type, quantity } = adjustStockSchema.parse(formData);
    
    const modifier = type === 'IN' ? quantity : -quantity;
    
    // Using atomic update for stock
    await db.update(products)
      .set({
        stock: sql`${products.stock} + ${modifier}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));
      
    revalidatePath('/inventory');
    revalidatePath('/products');
    revalidatePath('/pos');
    
    return { success: true };
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return { success: false, error: 'Gagal menyesuaikan stok.' };
  }
}
