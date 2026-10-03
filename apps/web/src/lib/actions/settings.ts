'use server';

import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { and, eq, isNull, lt, ne, or } from 'drizzle-orm';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';
import { DokuApiError } from '@/lib/payments/doku/client';
import { getDokuConfig } from '@/lib/payments/doku/config';
import { getSnapConfig } from '@/lib/payments/doku/snap/config';
import { createSubAccount } from '@/lib/payments/doku/sub-account';

function getPaymentGatewayInfo(tenant: typeof tenants.$inferSelect) {
  let config: ReturnType<typeof getDokuConfig> | null = null;
  try {
    config = getDokuConfig();
  } catch {
    config = null;
  }
  return {
    provider: 'DOKU' as const,
    platformConfigured: config !== null,
    environment: config?.environment ?? null,
    subAccountRequired: config?.requireSubAccount ?? true,
    subAccountId: tenant.dokuSubAccountId,
    subAccountStatus: tenant.dokuSubAccountStatus,
  };
}

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

    // Kolom kredensial tidak pernah dikirim ke browser.
    const {
      midtransServerKey: _midtransServerKey,
      midtransClientKey: _midtransClientKey,
      dokuClientId: _dokuClientId,
      dokuSecretKey: _dokuSecretKey,
      ...safeTenant
    } = tenant;

    return { success: true, data: { ...safeTenant, paymentGateway: getPaymentGatewayInfo(tenant) } };
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
    const storeLogoUrl = formData.get('storeLogoUrl') as string | null;
    const storeBannerUrl = formData.get('storeBannerUrl') as string | null;
    const slug = formData.get('slug') as string | null;
    const primaryColor = (formData.get('primaryColor') as string) || '#2563EB';
    const orderPrefixRaw = formData.get('orderPrefix') as string;

    if (!name || name.trim() === '') {
      return { success: false, error: 'Nama toko tidak boleh kosong' };
    }

    const updatePayload: any = {
      name: name.trim(),
      storeDescription: storeDescription ? storeDescription.trim() : null,
      primaryColor,
      updatedAt: new Date(),
    };
    if (storeLogoUrl !== undefined) {
      updatePayload.storeLogoUrl = storeLogoUrl ? storeLogoUrl.trim() : null;
    }
    if (storeBannerUrl !== undefined) {
      updatePayload.storeBannerUrl = storeBannerUrl ? storeBannerUrl.trim() : null;
    }
    if (slug !== undefined && slug !== null) {
      const sanitizedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      if (sanitizedSlug) {
        updatePayload.slug = sanitizedSlug;
      }
    }

    const orderPrefix = orderPrefixRaw ? orderPrefixRaw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : null;
    if (orderPrefixRaw !== undefined) {
      updatePayload.orderPrefix = orderPrefix || null;
    }

    await db.update(tenants)
      .set(updatePayload)
      .where(eq(tenants.id, user.tenantId));

    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    revalidatePath('/store/[slug]', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error updating store settings:', error);
    return { success: false, error: 'Gagal menyimpan informasi toko' };
  }
}

const SUB_ACCOUNT_PROVISIONING = 'PROVISIONING';
const PROVISIONING_STALE_MS = 2 * 60_000;

/**
 * Membuat DOKU Sub Account untuk outlet ini (Model Platform). Hanya OWNER.
 * Dijaga agar klik ganda tidak membuat dua Sub Account.
 */
export async function activateDokuSubAccount() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };
    if (user.role !== 'OWNER' && (user.role as string) !== 'SYSTEM_ADMIN') {
      return { success: false, error: 'Hanya OWNER yang dapat mengaktifkan akun pembayaran.' };
    }

    try {
      // Sub Account V2 memakai SNAP, jadi kredensial SNAP (RSA key) juga wajib.
      getSnapConfig();
    } catch (error) {
      console.error(JSON.stringify({
        scope: 'payments',
        event: 'sub_account_config_missing',
        error: error instanceof Error ? error.message : String(error),
      }));
      return { success: false, error: 'Payment gateway platform belum dikonfigurasi. Hubungi tim Menuin.' };
    }

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
    if (!tenant) return { success: false, error: 'Tenant tidak ditemukan' };
    if (tenant.dokuSubAccountId) return { success: true, subAccountId: tenant.dokuSubAccountId };

    // Klaim "lock" di DB: hanya satu request yang boleh membuat Sub Account.
    const staleBefore = new Date(Date.now() - PROVISIONING_STALE_MS);
    const claimed = await db
      .update(tenants)
      .set({ dokuSubAccountStatus: SUB_ACCOUNT_PROVISIONING, updatedAt: new Date() })
      .where(
        and(
          eq(tenants.id, tenant.id),
          isNull(tenants.dokuSubAccountId),
          or(
            isNull(tenants.dokuSubAccountStatus),
            ne(tenants.dokuSubAccountStatus, SUB_ACCOUNT_PROVISIONING),
            lt(tenants.updatedAt, staleBefore)
          )
        )
      )
      .returning({ id: tenants.id });

    if (claimed.length === 0) {
      return { success: false, error: 'Aktivasi sedang diproses. Muat ulang halaman dalam beberapa saat.' };
    }

    try {
      const result = await createSubAccount({
        name: tenant.name,
        email: user.email,
      });

      await db
        .update(tenants)
        .set({
          dokuSubAccountId: result.accountId,
          dokuSubAccountStatus: result.status ?? 'ACTIVE',
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenant.id));

      if (user && typeof user === 'object' && 'outletKey' in user) { revalidatePath(`/outlet/${user.outletKey}`, 'layout'); }
      return { success: true, subAccountId: result.accountId };
    } catch (error) {
      await db
        .update(tenants)
        .set({ dokuSubAccountStatus: 'FAILED', updatedAt: new Date() })
        .where(eq(tenants.id, tenant.id));

      console.error(JSON.stringify({
        scope: 'payments',
        event: 'sub_account_create_failed',
        tenantId: tenant.id,
        status: error instanceof DokuApiError ? error.status : null,
        response: error instanceof DokuApiError ? error.responseBody : null,
        error: error instanceof Error ? error.message : String(error),
      }));
      return { success: false, error: 'Gagal membuat akun pembayaran di DOKU. Silakan coba lagi.' };
    }
  } catch (error) {
    console.error('Error activating DOKU sub account:', error);
    return { success: false, error: 'Gagal mengaktifkan akun pembayaran' };
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


