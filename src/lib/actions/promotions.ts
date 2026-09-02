'use server';

import { db } from '@/lib/db';
import { promotions, tenants } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from './auth';

const promotionSchema = z.object({
  name: z.string().min(1, 'Nama promo wajib diisi').trim(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().min(0.01, 'Nilai potongan promo harus lebih dari 0'),
  minOrder: z.coerce.number().min(0, 'Minimal order tidak boleh negatif').optional().nullable(),
  maxDiscount: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export type PromotionInput = z.infer<typeof promotionSchema>;

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

    return { success: true, data };
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

export async function getPublicPromotions(tenantSlug: string) {
  try {
    const tenantRows = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
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

    // Generate unique code fallback to satisfy legacy DB column
    const cleanName = validatedData.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    const generatedCode = `${cleanName || 'PROMO'}-${Date.now().toString(36).toUpperCase()}`;

    await db.insert(promotions).values({
      tenantId: user.tenantId,
      code: generatedCode,
      name: validatedData.name,
      type: validatedData.type,
      value: validatedData.value.toString(),
      minOrder: (validatedData.minOrder || 0).toString(),
      maxDiscount: validatedData.maxDiscount ? validatedData.maxDiscount.toString() : null,
      isActive: validatedData.isActive ?? true,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
    });

    revalidatePath('/tenants/promotions');
    revalidatePath('/tenants/pos');
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

    await db
      .update(promotions)
      .set({
        name: validatedData.name,
        type: validatedData.type,
        value: validatedData.value.toString(),
        minOrder: (validatedData.minOrder || 0).toString(),
        maxDiscount: validatedData.maxDiscount ? validatedData.maxDiscount.toString() : null,
        isActive: validatedData.isActive ?? true,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        updatedAt: new Date(),
      })
      .where(and(eq(promotions.id, id), eq(promotions.tenantId, user.tenantId)));

    revalidatePath('/tenants/promotions');
    revalidatePath('/tenants/pos');
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

    revalidatePath('/tenants/promotions');
    revalidatePath('/tenants/pos');
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

    revalidatePath('/tenants/promotions');
    revalidatePath('/tenants/pos');
    return { success: true };
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return { success: false, error: 'Gagal menghapus promo' };
  }
}

function calculatePromoDiscount(promo: any, subtotal: number) {
  const minOrder = parseFloat(promo.minOrder || '0');
  if (subtotal < minOrder) {
    return {
      isValid: false,
      error: `Minimal belanja Rp ${minOrder.toLocaleString('id-ID')} untuk menggunakan promo ini.`,
      discountAmount: 0,
    };
  }

  let discountAmount = 0;
  const promoValue = parseFloat(promo.value);
  if (promo.type === 'PERCENTAGE') {
    discountAmount = (subtotal * promoValue) / 100;
    if (promo.maxDiscount) {
      const maxDisc = parseFloat(promo.maxDiscount);
      if (discountAmount > maxDisc) {
        discountAmount = maxDisc;
      }
    }
  } else {
    discountAmount = promoValue;
  }

  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  return {
    isValid: true,
    discountAmount,
  };
}

export async function validatePromotion(promoId: string, subtotal: number) {
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

    const calc = calculatePromoDiscount(promo, subtotal);
    if (!calc.isValid) {
      return { success: false, error: calc.error };
    }

    return {
      success: true,
      data: {
        id: promo.id,
        name: promo.name,
        type: promo.type,
        value: parseFloat(promo.value),
        discountAmount: calc.discountAmount,
      },
    };
  } catch (error) {
    console.error('Error validating promotion:', error);
    return { success: false, error: 'Gagal memvalidasi promo' };
  }
}
