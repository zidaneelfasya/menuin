'use server';

import { db } from '@/lib/db';
import { products, auditLogs } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from './auth';

const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().min(1, 'Kuantitas minimal 1'),
  reasonCategory: z.enum([
    'RESTOCK_BATCH',
    'OPNAME_CORRECTION_ADD',
    'RETURN_CUSTOMER',
    'WASTE_EXPIRED',
    'STAFF_MEAL',
    'OPNAME_CORRECTION_SUB',
    'OTHER',
  ]).optional(),
  reason: z.string().optional(),
  costPrice: z.coerce.number().optional(),
});

export async function adjustStock(formData: z.infer<typeof adjustStockSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }

    if (user.role === 'CASHIER') {
      return { success: false, error: 'Kasir tidak memiliki akses untuk mengubah stok.' };
    }

    const { productId, type, quantity, reasonCategory, reason } = adjustStockSchema.parse(formData);
    
    // Check current product
    const currentProducts = await db
      .select({ id: products.id, name: products.name, stock: products.stock })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.tenantId, user.tenantId)))
      .limit(1);

    if (currentProducts.length === 0) {
      return { success: false, error: 'Produk tidak ditemukan' };
    }

    const currentProduct = currentProducts[0];
    const modifier = type === 'IN' ? quantity : -quantity;
    const oldStock = currentProduct.stock ?? 0;
    const newStock = Math.max(0, oldStock + modifier);

    // Using atomic update for stock with tenant check
    const updated = await db.update(products)
      .set({
        stock: newStock,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, productId), eq(products.tenantId, user.tenantId)))
      .returning({ id: products.id, stock: products.stock });

    // Record audit log
    try {
      await db.insert(auditLogs).values({
        tenantId: user.tenantId,
        actorMembershipId: user.id || null,
        action: 'STOCK_ADJUSTED',
        entityType: 'PRODUCT',
        entityId: productId,
        details: {
          productName: currentProduct.name,
          type,
          quantity,
          oldStock,
          newStock,
          reasonCategory: reasonCategory || 'OTHER',
          reason: reason || null,
        },
      });
    } catch (auditErr) {
      console.warn('Could not record stock audit log:', auditErr);
    }

    if (user && typeof user === "object" && "outletKey" in user && user.outletKey) {
      revalidatePath(`/outlet/${user.outletKey}/items`, "page");
    }
    return { success: true, newStock };
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return { success: false, error: 'Gagal menyesuaikan stok.' };
  }
}

