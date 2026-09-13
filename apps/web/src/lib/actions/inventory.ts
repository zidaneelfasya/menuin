'use server';

import { db } from '@/lib/db';
import { products, categories, stockMovements } from '@/lib/db/schema';
import { eq, and, sql, desc, gte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from './auth';

const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().min(1, 'Kuantitas minimal 1'),
  reason: z.string().optional(),
});

export type StockMovementDto = {
  id: string;
  productId: string;
  productName: string;
  categoryName: string | null;
  imageUrl: string | null;
  type: 'IN' | 'OUT' | 'SALE' | 'ADJUSTMENT' | string;
  quantity: number;
  previousStock: number;
  currentStock: number;
  reason: string | null;
  referenceId: string | null;
  actorName: string | null;
  createdAt: Date;
};

export async function adjustStock(formData: z.infer<typeof adjustStockSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Sesi tidak valid atau tidak memiliki akses.' };
    }

    const { productId, type, quantity, reason } = adjustStockSchema.parse(formData);
    const tenantId = user.tenantId;

    const result = await db.transaction(async (tx) => {
      // 1. Get current product stock
      const [product] = await tx
        .select({ id: products.id, stock: products.stock, name: products.name })
        .from(products)
        .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
        .limit(1);

      if (!product) {
        throw new Error('Produk tidak ditemukan');
      }

      const previousStock = product.stock ?? 0;
      const modifier = type === 'IN' ? quantity : -quantity;
      const currentStock = Math.max(0, previousStock + modifier);

      // 2. Update product stock
      await tx
        .update(products)
        .set({
          stock: currentStock,
          updatedAt: new Date(),
        })
        .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)));

      // 3. Insert stock movement log
      const defaultReason = type === 'IN' ? 'Stok Masuk / Pembelian' : 'Stok Keluar / Koreksi';
      await tx.insert(stockMovements).values({
        tenantId,
        productId,
        type,
        quantity,
        previousStock,
        currentStock,
        reason: reason?.trim() || defaultReason,
        actorName: user.name || 'Admin',
      });

      return { previousStock, currentStock, name: product.name };
    });

    if (user.outletKey) {
      revalidatePath(`/outlet/${user.outletKey}`, 'layout');
      revalidatePath(`/outlet/${user.outletKey}/inventory`, 'page');
      revalidatePath(`/outlet/${user.outletKey}/items`, 'page');
    }

    return {
      success: true,
      data: result,
      message: `${formData.type === 'IN' ? 'Stok masuk' : 'Stok keluar'} berhasil dicatat. Sisa stok: ${result.currentStock}`,
    };
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    return { success: false, error: error.message || 'Gagal menyesuaikan stok.' };
  }
}

export async function getStockMovements(filters?: {
  productId?: string;
  type?: string;
  limit?: number;
}): Promise<{ success: boolean; data?: StockMovementDto[]; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    let conditions = [eq(stockMovements.tenantId, user.tenantId)];

    if (filters?.productId) {
      conditions.push(eq(stockMovements.productId, filters.productId));
    }

    if (filters?.type && filters.type !== 'ALL') {
      conditions.push(eq(stockMovements.type, filters.type));
    }

    const rows = await db
      .select({
        id: stockMovements.id,
        productId: stockMovements.productId,
        productName: products.name,
        categoryName: categories.name,
        imageUrl: products.imageUrl,
        type: stockMovements.type,
        quantity: stockMovements.quantity,
        previousStock: stockMovements.previousStock,
        currentStock: stockMovements.currentStock,
        reason: stockMovements.reason,
        referenceId: stockMovements.referenceId,
        actorName: stockMovements.actorName,
        createdAt: stockMovements.createdAt,
      })
      .from(stockMovements)
      .innerJoin(products, eq(stockMovements.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(stockMovements.createdAt))
      .limit(filters?.limit || 200);

    return { success: true, data: rows };
  } catch (error: any) {
    console.error('Error fetching stock movements:', error);
    return { success: false, error: 'Gagal mengambil riwayat mutasi stok.' };
  }
}

export async function getStockDistributionSummary() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const tenantId = user.tenantId;

    // Fetch product stock stats
    const productList = await db
      .select({
        id: products.id,
        stock: products.stock,
        minStock: products.minStock,
        trackStock: products.trackStock,
      })
      .from(products)
      .where(eq(products.tenantId, tenantId));

    const totalTracked = productList.filter((p) => p.trackStock !== false).length;
    const lowStockCount = productList.filter(
      (p) => p.trackStock !== false && p.stock <= p.minStock && p.stock > 0
    ).length;
    const outOfStockCount = productList.filter(
      (p) => p.trackStock !== false && p.stock <= 0
    ).length;

    // Fetch this month movements
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const movements = await db
      .select({
        type: stockMovements.type,
        quantity: stockMovements.quantity,
      })
      .from(stockMovements)
      .where(
        and(
          eq(stockMovements.tenantId, tenantId),
          gte(stockMovements.createdAt, startOfMonth)
        )
      );

    let totalInThisMonth = 0;
    let totalOutThisMonth = 0;
    let totalSaleThisMonth = 0;

    movements.forEach((m) => {
      if (m.type === 'IN') totalInThisMonth += m.quantity;
      else if (m.type === 'OUT') totalOutThisMonth += m.quantity;
      else if (m.type === 'SALE') totalSaleThisMonth += m.quantity;
    });

    return {
      success: true,
      data: {
        totalTracked,
        lowStockCount,
        outOfStockCount,
        totalInThisMonth,
        totalOutThisMonth,
        totalSaleThisMonth,
      },
    };
  } catch (error: any) {
    console.error('Error fetching stock summary:', error);
    return { success: false, error: 'Gagal memuat ringkasan stok' };
  }
}
