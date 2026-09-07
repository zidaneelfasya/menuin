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

    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
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

    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
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

    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
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

    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
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

    if (user.role !== 'OWNER' && (user.role as string) !== 'SYSTEM_ADMIN') {
      return { success: false, error: 'Hanya OWNER yang memiliki izin untuk mengubah kredensial pembayaran Midtrans.' };
    }

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

    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    revalidatePath('/store/[slug]', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error updating payment integration settings:', error);
    return { success: false, error: 'Gagal menyimpan integrasi pembayaran' };
  }
}

export async function updateReceiptSettings(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    if (user.role !== 'OWNER' && user.role !== 'MANAGER' && (user.role as string) !== 'SYSTEM_ADMIN') {
      return { success: false, error: 'Hanya OWNER atau MANAGER yang dapat mengubah pengaturan struk.' };
    }

    const receiptHeader = (formData.get('receiptHeader') as string) || '';
    const receiptFooter = (formData.get('receiptFooter') as string) || '';
    const receiptLogoUrl = (formData.get('receiptLogoUrl') as string) || '';
    const receiptShowLogo = formData.get('receiptShowLogo') === 'true';
    const receiptShowCustomer = formData.get('receiptShowCustomer') === 'true';
    const receiptShowCashier = formData.get('receiptShowCashier') === 'true';
    const receiptShowTable = formData.get('receiptShowTable') === 'true';
    const receiptShowNotes = formData.get('receiptShowNotes') === 'true';
    const receiptCustomNote = (formData.get('receiptCustomNote') as string) || '';

    await db.update(tenants)
      .set({
        receiptHeader: receiptHeader.trim() || null,
        receiptFooter: receiptFooter.trim() || null,
        receiptLogoUrl: receiptLogoUrl.trim() || null,
        receiptShowLogo,
        receiptShowCustomer,
        receiptShowCashier,
        receiptShowTable,
        receiptShowNotes,
        receiptCustomNote: receiptCustomNote.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, user.tenantId));

    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    return { success: true };
  } catch (error) {
    console.error('Error updating receipt settings:', error);
    return { success: false, error: 'Gagal menyimpan pengaturan kustomisasi struk' };
  }
}

export async function updateKitchenTicketSettings(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    if (user.role !== 'OWNER' && user.role !== 'MANAGER' && (user.role as string) !== 'SYSTEM_ADMIN') {
      return { success: false, error: 'Hanya OWNER atau MANAGER yang dapat mengubah pengaturan tiket dapur.' };
    }

    const kitchenPrintEnabled = formData.get('kitchenPrintEnabled') === 'true';
    const kitchenTicketTitle = (formData.get('kitchenTicketTitle') as string) || 'TIKET DAPUR';
    const kitchenTicketNotes = (formData.get('kitchenTicketNotes') as string) || '';
    const kitchenShowCustomer = formData.get('kitchenShowCustomer') === 'true';
    const kitchenShowCashier = formData.get('kitchenShowCashier') === 'true';
    const kitchenShowTable = formData.get('kitchenShowTable') === 'true';
    const kitchenShowNotes = formData.get('kitchenShowNotes') === 'true';
    const kitchenAutoCut = formData.get('kitchenAutoCut') === 'true';

    await db.update(tenants)
      .set({
        kitchenPrintEnabled,
        kitchenTicketTitle: kitchenTicketTitle.trim() || 'TIKET DAPUR',
        kitchenTicketNotes: kitchenTicketNotes.trim() || null,
        kitchenShowCustomer,
        kitchenShowCashier,
        kitchenShowTable,
        kitchenShowNotes,
        kitchenAutoCut,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, user.tenantId));

    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    return { success: true };
  } catch (error) {
    console.error('Error updating kitchen ticket settings:', error);
    return { success: false, error: 'Gagal menyimpan pengaturan tiket dapur' };
  }
}


