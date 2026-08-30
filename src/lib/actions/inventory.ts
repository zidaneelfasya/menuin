'use server';

import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from './auth';

const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().min(1, 'Kuantitas minimal 1'),
  reason: z.string().optional(),
  costPrice: z.coerce.number().optional(),
});

export async function adjustStock(formData: z.infer<typeof adjustStockSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }

    const { productId, type, quantity } = adjustStockSchema.parse(formData);
    
    const modifier = type === 'IN' ? quantity : -quantity;
    
    // Using atomic update for stock with tenant check
    await db.update(products)
      .set({
        stock: sql`${products.stock} + ${modifier}`,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, productId), eq(products.tenantId, user.tenantId)));
      

    revalidatePath('/tenants/inventory');
    revalidatePath('/tenants/products');
    revalidatePath('/tenants/pos');

    return { success: true };
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return { success: false, error: 'Gagal menyesuaikan stok.' };
  }
}
