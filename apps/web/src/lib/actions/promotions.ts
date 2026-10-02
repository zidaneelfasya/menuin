'use server';

import { db } from '@/lib/db';
import { promotions, tenants, products, transactions } from '@/lib/db/schema';
import { eq, and, desc, sql, ne, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from './auth';

const promotionSchema = z.object({
  code: z
    .string()
    .min(2, 'Kode promo minimal 2 karakter')
    .max(30, 'Kode promo maksimal 30 karakter')
    .regex(/^[A-Za-z0-9_-]+$/, 'Kode promo hanya boleh huruf, angka, strip (-), atau underscore (_)')
    .trim()
    .transform((v) => v.toUpperCase()),
  name: z.string().min(1, 'Nama promo wajib diisi').trim(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().min(0.01, 'Nilai potongan promo harus lebih dari 0'),
  minOrder: z.coerce.number().min(0, 'Minimal order tidak boleh negatif').optional().nullable(),
  maxDiscount: z.coerce.number().min(0).optional().nullable(),
  targetType: z.enum(['ALL', 'SPECIFIC_PRODUCTS']).default('ALL'),
  applicableProductIds: z.array(z.string()).optional().default([]),
  minProductQty: z.coerce.number().min(1, 'Minimal jumlah produk 1').default(1),
  isActive: z.boolean().default(true),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export type PromotionInput = z.infer<typeof promotionSchema>;

import { calculatePromoDiscount, type CartItemForPromo } from '@/lib/utils/promotions';

export type { CartItemForPromo };

export async function getPromotions() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }

    const data = await db
      .select()
      .from(promotions)
      .where(eq(promotions.tenantId, user.tenantId))
      .orderBy(desc(promotions.createdAt));

    // Fetch transactions stats for tenant
    const txs = await db
      .select({
        id: transactions.id,
        promoCode: transactions.promoCode,
        promotionId: transactions.promotionId,
        discount: transactions.discount,
        status: transactions.status,
      })
      .from(transactions)
      .where(and(
        eq(transactions.tenantId, user.tenantId),
        ne(transactions.status, 'CANCELED')
      ));

    const dataWithStats = data.map((promo) => {
      const matching = txs.filter((t) =>
        (t.promotionId && t.promotionId === promo.id) ||
        (t.promoCode && t.promoCode.toUpperCase() === promo.code.toUpperCase())
      );

      const totalUsage = matching.length;
      const totalDiscountValue = matching.reduce((sum, t) => sum + parseFloat(t.discount || '0'), 0);

      return {
        ...promo,
        totalUsage,
        totalDiscountValue,
      };
    });

    return { success: true, data: dataWithStats };
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return { success: false, error: 'Gagal mengambil data promo' };
  }
}

export async function getActivePromotions() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const data = await db
      .select()
      .from(promotions)
      .where(and(eq(promotions.tenantId, user.tenantId), eq(promotions.isActive, true)))
      .orderBy(promotions.name);

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching active promotions:', error);
    return { success: false, error: 'Gagal mengambil promo aktif' };
  }
}

export async function getTenantProductsForPromo() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const data = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        imageUrl: products.imageUrl,
        sku: products.sku,
        isActive: products.isActive,
      })
      .from(products)
      .where(and(eq(products.tenantId, user.tenantId), eq(products.isActive, true)))
      .orderBy(products.name);

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching products for promo:', error);
    return { success: false, error: 'Gagal mengambil daftar produk' };
  }
}

export async function getPublicPromotions(tenantSlug: string) {
  try {
    const tenantRows = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(or(eq(tenants.slug, tenantSlug), eq(tenants.outletKey, tenantSlug)))
      .limit(1);

    if (tenantRows.length === 0) {
      return { success: false, error: 'Toko tidak ditemukan' };
    }

    const tenantId = tenantRows[0].id;
    const now = new Date();

    const data = await db
      .select()
      .from(promotions)
      .where(and(eq(promotions.tenantId, tenantId), eq(promotions.isActive, true)))
      .orderBy(promotions.name);

    // Filter valid dates
    const validPromos = data.filter((p) => {
      if (p.startDate && new Date(p.startDate) > now) return false;
      if (p.endDate && new Date(p.endDate) < now) return false;
      return true;
    });

    return { success: true, data: validPromos };
  } catch (error) {
    console.error('Error fetching public promotions:', error);
    return { success: false, error: 'Gagal mengambil data promo toko' };
  }
}

export async function createPromotion(formData: z.infer<typeof promotionSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    const validatedData = promotionSchema.parse(formData);

    // Check unique code per tenant (case-insensitive)
    const existingPromo = await db
      .select({ id: promotions.id })
      .from(promotions)
      .where(and(
        eq(promotions.tenantId, user.tenantId),
        sql`UPPER(${promotions.code}) = ${validatedData.code}`
      ))
      .limit(1);

    if (existingPromo.length > 0) {
      return { success: false, error: `Kode promo "${validatedData.code}" sudah digunakan. Silakan gunakan kode lain.` };
    }

    await db.insert(promotions).values({
      tenantId: user.tenantId,
      code: validatedData.code,
      name: validatedData.name,
      type: validatedData.type,
      value: validatedData.value.toString(),
      minOrder: (validatedData.minOrder || 0).toString(),
      maxDiscount: validatedData.maxDiscount ? validatedData.maxDiscount.toString() : null,
      targetType: validatedData.targetType || 'ALL',
      applicableProductIds: validatedData.applicableProductIds || [],
      minProductQty: validatedData.minProductQty || 1,
      isActive: validatedData.isActive ?? true,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
    });

    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    return { success: true };
  } catch (error: any) {
    console.error('Error creating promotion:', error);
    return { success: false, error: error.message || 'Gagal membuat promo baru' };
  }
}

export async function updatePromotion(id: string, formData: z.infer<typeof promotionSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    const validatedData = promotionSchema.parse(formData);

    // Check unique code excluding current promotion
    const existingPromo = await db
      .select({ id: promotions.id })
      .from(promotions)
      .where(and(
        eq(promotions.tenantId, user.tenantId),
        sql`UPPER(${promotions.code}) = ${validatedData.code}`,
        ne(promotions.id, id)
      ))
      .limit(1);

    if (existingPromo.length > 0) {
      return { success: false, error: `Kode promo "${validatedData.code}" sudah digunakan oleh promo lain.` };
    }

    await db
      .update(promotions)
      .set({
        code: validatedData.code,
        name: validatedData.name,
        type: validatedData.type,
        value: validatedData.value.toString(),
        minOrder: (validatedData.minOrder || 0).toString(),
        maxDiscount: validatedData.maxDiscount ? validatedData.maxDiscount.toString() : null,
        targetType: validatedData.targetType || 'ALL',
        applicableProductIds: validatedData.applicableProductIds || [],
        minProductQty: validatedData.minProductQty || 1,
        isActive: validatedData.isActive ?? true,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        updatedAt: new Date(),
      })
      .where(and(eq(promotions.id, id), eq(promotions.tenantId, user.tenantId)));

    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    return { success: true };
  } catch (error: any) {
    console.error('Error updating promotion:', error);
    return { success: false, error: error.message || 'Gagal memperbarui promo' };
  }
}

export async function togglePromotionStatus(id: string, isActive: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    await db
      .update(promotions)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(promotions.id, id), eq(promotions.tenantId, user.tenantId)));

    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    return { success: true };
  } catch (error) {
    console.error('Error toggling promotion status:', error);
    return { success: false, error: 'Gagal mengubah status promo' };
  }
}

export async function deletePromotion(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    await db.delete(promotions).where(and(eq(promotions.id, id), eq(promotions.tenantId, user.tenantId)));

    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    return { success: true };
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return { success: false, error: 'Gagal menghapus promo' };
  }
}


export async function validatePromotion(promoId: string, subtotal: number, items?: CartItemForPromo[]) {
  try {
    const promoRows = await db
      .select()
      .from(promotions)
      .where(and(eq(promotions.id, promoId), eq(promotions.isActive, true)))
      .limit(1);

    if (promoRows.length === 0) {
      return { success: false, error: 'Promo tidak valid atau sudah tidak aktif.' };
    }

    const promo = promoRows[0];
    const now = new Date();
    if (promo.startDate && new Date(promo.startDate) > now) {
      return { success: false, error: 'Promo ini belum mulai berlaku.' };
    }
    if (promo.endDate && new Date(promo.endDate) < now) {
      return { success: false, error: 'Promo ini sudah berakhir/kadaluwarsa.' };
    }

    const calc = calculatePromoDiscount(promo, subtotal, items);
    if (!calc.isValid) {
      return { success: false, error: calc.error };
    }

    return {
      success: true,
      data: {
        id: promo.id,
        code: promo.code,
        name: promo.name,
        type: promo.type,
        value: parseFloat(promo.value),
        discountAmount: calc.discountAmount,
        minOrder: parseFloat(promo.minOrder || '0'),
        maxDiscount: promo.maxDiscount ? parseFloat(promo.maxDiscount) : null,
        targetType: promo.targetType,
        applicableProductIds: calc.applicableProductIds,
        itemDiscounts: calc.itemDiscounts,
        eligibleSubtotal: calc.eligibleSubtotal,
      },
    };
  } catch (error) {
    console.error('Error validating promotion:', error);
    return { success: false, error: 'Gagal memvalidasi promo' };
  }
}

export async function validatePublicPromoCode(tenantSlug: string, code: string, subtotal: number, items?: CartItemForPromo[]) {
  try {
    const cleanCode = (code || '').toUpperCase().trim();
    if (!cleanCode) {
      return { success: false, error: 'Silakan masukkan kode promo.' };
    }

    const tenantRows = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(or(eq(tenants.slug, tenantSlug), eq(tenants.outletKey, tenantSlug)))
      .limit(1);

    if (tenantRows.length === 0) {
      return { success: false, error: 'Toko tidak ditemukan.' };
    }

    const tenantId = tenantRows[0].id;
    const promoRows = await db
      .select()
      .from(promotions)
      .where(and(
        eq(promotions.tenantId, tenantId),
        sql`UPPER(${promotions.code}) = ${cleanCode}`,
        eq(promotions.isActive, true)
      ))
      .limit(1);

    if (promoRows.length === 0) {
      return { success: false, error: `Kode promo "${cleanCode}" tidak ditemukan atau sudah tidak aktif.` };
    }

    const promo = promoRows[0];
    const now = new Date();
    if (promo.startDate && new Date(promo.startDate) > now) {
      return { success: false, error: 'Kode promo ini belum mulai berlaku.' };
    }
    if (promo.endDate && new Date(promo.endDate) < now) {
      return { success: false, error: 'Kode promo ini sudah berakhir/kadaluwarsa.' };
    }

    const calc = calculatePromoDiscount(promo, subtotal, items);
    if (!calc.isValid) {
      return { success: false, error: calc.error };
    }

    return {
      success: true,
      data: {
        id: promo.id,
        code: promo.code,
        name: promo.name,
        type: promo.type,
        value: parseFloat(promo.value),
        discountAmount: calc.discountAmount,
        minOrder: parseFloat(promo.minOrder || '0'),
        maxDiscount: promo.maxDiscount ? parseFloat(promo.maxDiscount) : null,
        targetType: promo.targetType,
        applicableProductIds: calc.applicableProductIds,
        itemDiscounts: calc.itemDiscounts,
        eligibleSubtotal: calc.eligibleSubtotal,
      },
    };
  } catch (error) {
    console.error('Error validating public promo code:', error);
    return { success: false, error: 'Terjadi kesalahan saat memverifikasi kode promo.' };
  }
}

export async function validatePosPromoCode(code: string, subtotal: number, items?: CartItemForPromo[]) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const cleanCode = (code || '').toUpperCase().trim();
    if (!cleanCode) {
      return { success: false, error: 'Masukkan kode promo.' };
    }

    const promoRows = await db
      .select()
      .from(promotions)
      .where(and(
        eq(promotions.tenantId, user.tenantId),
        sql`UPPER(${promotions.code}) = ${cleanCode}`,
        eq(promotions.isActive, true)
      ))
      .limit(1);

    if (promoRows.length === 0) {
      return { success: false, error: `Kode promo "${cleanCode}" tidak ditemukan atau nonaktif.` };
    }

    const promo = promoRows[0];
    const now = new Date();
    if (promo.startDate && new Date(promo.startDate) > now) {
      return { success: false, error: 'Kode promo ini belum mulai berlaku.' };
    }
    if (promo.endDate && new Date(promo.endDate) < now) {
      return { success: false, error: 'Kode promo ini sudah kadaluwarsa.' };
    }

    const calc = calculatePromoDiscount(promo, subtotal, items);
    if (!calc.isValid) {
      return { success: false, error: calc.error };
    }

    return {
      success: true,
      data: {
        id: promo.id,
        code: promo.code,
        name: promo.name,
        type: promo.type,
        value: parseFloat(promo.value),
        discountAmount: calc.discountAmount,
        minOrder: parseFloat(promo.minOrder || '0'),
        maxDiscount: promo.maxDiscount ? parseFloat(promo.maxDiscount) : null,
        targetType: promo.targetType,
        applicableProductIds: calc.applicableProductIds,
        itemDiscounts: calc.itemDiscounts,
        eligibleSubtotal: calc.eligibleSubtotal,
      },
    };
  } catch (error) {
    console.error('Error validating POS promo code:', error);
    return { success: false, error: 'Gagal memvalidasi kode promo POS.' };
  }
}

export async function getPromotionTransactions(promoId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const promoRows = await db
      .select()
      .from(promotions)
      .where(and(eq(promotions.id, promoId), eq(promotions.tenantId, user.tenantId)))
      .limit(1);

    if (promoRows.length === 0) {
      return { success: false, error: 'Promo tidak ditemukan' };
    }

    const promo = promoRows[0];

    const data = await db
      .select({
        id: transactions.id,
        orderNumber: transactions.orderNumber,
        createdAt: transactions.createdAt,
        customerName: transactions.customerName,
        orderType: transactions.orderType,
        totalAmount: transactions.totalAmount,
        discount: transactions.discount,
        grandTotal: transactions.grandTotal,
        paymentMethod: transactions.paymentMethod,
        paymentStatus: transactions.paymentStatus,
        status: transactions.status,
      })
      .from(transactions)
      .where(and(
        eq(transactions.tenantId, user.tenantId),
        or(
          eq(transactions.promotionId, promoId),
          sql`UPPER(${transactions.promoCode}) = ${promo.code.toUpperCase()}`
        )
      ))
      .orderBy(desc(transactions.createdAt));

    const totalUsage = data.length;
    const totalDiscountValue = data
      .filter((t) => t.status !== 'CANCELED')
      .reduce((sum, t) => sum + parseFloat(t.discount || '0'), 0);

    return {
      success: true,
      promo,
      data,
      stats: {
        totalUsage,
        totalDiscountValue,
      },
    };
  } catch (error) {
    console.error('Error fetching promotion transactions:', error);
    return { success: false, error: 'Gagal mengambil transaksi promo' };
  }
}
