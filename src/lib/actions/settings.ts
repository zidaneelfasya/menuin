'use server';

import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';

export async function getTenantSettings() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, user.tenantId))
      .limit(1);

    if (!tenant) {
      return { success: false, error: 'Tenant tidak ditemukan' };
    }

    return { success: true, data: tenant };
  } catch (error) {
    console.error('Error fetching tenant settings:', error);
    return { success: false, error: 'Gagal mengambil data pengaturan' };
  }
}

export async function updateTaxAndFeeSettings(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    const taxName = (formData.get('taxName') as string) || 'Pajak (PB1)';
    const posTaxRate = parseFloat(formData.get('posTaxRate') as string) || 0;
    const serviceChargeRate = parseFloat(formData.get('serviceChargeRate') as string) || 0;

    await db.update(tenants)
      .set({
        taxName,
        posTaxRate: posTaxRate.toString(),
        serviceChargeRate: serviceChargeRate.toString(),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, user.tenantId));

    revalidatePath('/tenants/settings');
    revalidatePath('/tenants/pos/settings');
    revalidatePath('/tenants/pos');
    return { success: true };
  } catch (error) {
    console.error('Error updating tax and fee settings:', error);
    return { success: false, error: 'Gagal menyimpan pengaturan pajak' };
  }
}

export async function updatePlatformFeeSettings(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    const grabFoodFeeRate = parseFloat(formData.get('grabFoodFeeRate') as string) || 0;
    const shopeeFoodFeeRate = parseFloat(formData.get('shopeeFoodFeeRate') as string) || 0;
    const goFoodFeeRate = parseFloat(formData.get('goFoodFeeRate') as string) || 0;

    await db.update(tenants)
      .set({
        grabFoodFeeRate: grabFoodFeeRate.toString(),
        shopeeFoodFeeRate: shopeeFoodFeeRate.toString(),
        goFoodFeeRate: goFoodFeeRate.toString(),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, user.tenantId));

    revalidatePath('/tenants/settings');
    revalidatePath('/tenants/pos/settings');
    revalidatePath('/tenants/pos');
    return { success: true };
  } catch (error) {
    console.error('Error updating platform fees:', error);
    return { success: false, error: 'Gagal menyimpan potongan platform online food' };
  }
}

export async function updateDisplaySettings(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    const posPinBestSellers = formData.get('posPinBestSellers') === 'true';

    await db.update(tenants)
      .set({
        posPinBestSellers,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, user.tenantId));

    revalidatePath('/tenants/settings');
    revalidatePath('/tenants/pos');
    revalidatePath('/tenants/products');
    return { success: true };
  } catch (error) {
    console.error('Error updating display settings:', error);
    return { success: false, error: 'Gagal menyimpan pengaturan tampilan' };
  }
}

export async function updateStoreGeneralSettings(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    const name = formData.get('name') as string;
    const storeDescription = formData.get('storeDescription') as string;
    const primaryColor = (formData.get('primaryColor') as string) || '#2563EB';

    if (!name || name.trim() === '') {
      return { success: false, error: 'Nama toko tidak boleh kosong' };
    }

    await db.update(tenants)
      .set({
        name,
        storeDescription,
        primaryColor,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, user.tenantId));

    revalidatePath('/tenants/settings');
    revalidatePath('/tenants/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating store settings:', error);
    return { success: false, error: 'Gagal menyimpan informasi toko' };
  }
}

export async function updatePaymentIntegration(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    const midtransEnvironment = formData.get('midtransEnvironment') as string;
    const midtransServerKey = formData.get('midtransServerKey') as string;
    const midtransClientKey = formData.get('midtransClientKey') as string;

    await db.update(tenants)
      .set({
        midtransEnvironment: midtransEnvironment || 'sandbox',
        midtransServerKey: midtransServerKey || null,
        midtransClientKey: midtransClientKey || null,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, user.tenantId));

    revalidatePath('/tenants/settings');
    revalidatePath('/store/[slug]', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error updating payment integration settings:', error);
    return { success: false, error: 'Gagal menyimpan integrasi pembayaran' };
  }
}
