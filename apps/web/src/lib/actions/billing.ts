'use server';

import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { paymentAttempts, subscriptionInvoices } from '@/lib/db/schema';
import { getBillingPlan } from '@/lib/billing/plans';
import { startSubscriptionPayment, syncSubscriptionInvoicePayment } from '@/lib/payments/payment.service';
import { getAppOrigin } from '@/lib/utils/app-origin';
import { getCurrentContext } from './auth-context';

type BillingContext = NonNullable<Awaited<ReturnType<typeof getCurrentContext>>>;

async function requireBillingOwner(): Promise<{ context: BillingContext } | { error: string }> {
  const context = await getCurrentContext();
  if (!context) return { error: 'Silakan masuk terlebih dahulu.' };
  if (context.membership.role !== 'OWNER' && (context.membership.role as string) !== 'SYSTEM_ADMIN') {
    return { error: 'Hanya OWNER yang dapat membayar langganan.' };
  }
  return { context };
}

type Plan = NonNullable<ReturnType<typeof getBillingPlan>>;

/**
 * Tagihan PENDING tenant untuk paket ini: dipakai ulang bila cocok, diganti bila
 * paket/harga berubah. Klik paralel diserialisasi oleh unique index
 * "satu PENDING per tenant" (ON CONFLICT DO NOTHING lalu baca ulang), bukan oleh
 * lock baris tenant — urutan lock tetap invoice → attempt → tenant seperti di
 * payment service, sehingga tidak bisa deadlock dengan webhook.
 */
async function getOrCreateOpenInvoice(tenantId: string, plan: Plan, membershipId: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await db.transaction(async (tx) => {
      const [open] = await tx
        .select()
        .from(subscriptionInvoices)
        .where(and(eq(subscriptionInvoices.tenantId, tenantId), eq(subscriptionInvoices.status, 'PENDING')))
        .limit(1)
        .for('update');

      if (open && open.planCode === plan.code && open.amount === plan.amount && open.periodDays === plan.periodDays) {
        return open;
      }

      if (open) {
        // Ganti paket / harga berubah: tutup tagihan lama beserta sesi bayarnya.
        // Jika tagihan lama ternyata tetap dibayar, pembayaran tetap diproses
        // dan ditandai untuk direview (lihat decideSubscriptionOnPaid).
        await tx
          .update(subscriptionInvoices)
          .set({ status: 'CANCELED', updatedAt: new Date() })
          .where(eq(subscriptionInvoices.id, open.id));
        await tx
          .update(paymentAttempts)
          .set({ status: 'CANCELED', updatedAt: new Date() })
          .where(
            and(
              eq(paymentAttempts.subscriptionInvoiceId, open.id),
              inArray(paymentAttempts.status, ['CREATED', 'PENDING'])
            )
          );
      }

      const [created] = await tx
        .insert(subscriptionInvoices)
        .values({
          tenantId,
          planCode: plan.code,
          plan: plan.plan,
          amount: plan.amount,
          periodDays: plan.periodDays,
          status: 'PENDING',
          createdByMembershipId: membershipId,
        })
        .onConflictDoNothing()
        .returning();
      return created ?? null;
    });

    // null = request paralel lain baru saja membuat tagihan PENDING; ulangi untuk
    // membacanya (dan memakainya ulang bila paketnya sama).
    if (result) return result;
  }
  throw new Error('Gagal menyiapkan tagihan langganan setelah beberapa percobaan');
}

/**
 * Membuat (atau memakai ulang) tagihan langganan untuk paket yang dipilih lalu
 * mengembalikan URL halaman pembayaran DOKU. Client hanya mengirim kode paket;
 * harga & durasi selalu dari katalog server.
 */
export async function startSubscriptionCheckout(planCode: string) {
  try {
    const plan = getBillingPlan(planCode);
    if (!plan) return { error: 'Paket tidak dikenal.' };

    const auth = await requireBillingOwner();
    if ('error' in auth) return { error: auth.error };
    const { context } = auth;
    const tenantId = context.tenant.id;

    const invoice = await getOrCreateOpenInvoice(tenantId, plan, context.membership.id);

    const origin = await getAppOrigin();
    const callbackUrl = origin ? `${origin}/checkout/status?invoice=${encodeURIComponent(invoice.id)}` : undefined;

    const result = await startSubscriptionPayment({
      tenantId,
      subscriptionInvoiceId: invoice.id,
      callbackUrl,
      customer: { name: context.tenant.name, email: context.account.email },
    });

    if (!result.ok) return { error: result.message, code: result.code };
    return { success: true, paymentUrl: result.paymentUrl, invoiceId: invoice.id };
  } catch (error) {
    console.error('Failed to start subscription checkout:', error);
    return { error: 'Gagal memproses pembayaran langganan. Silakan coba lagi.' };
  }
}

/** Status tagihan langganan milik tenant yang sedang login (untuk halaman status checkout). */
export async function getSubscriptionCheckoutStatus(invoiceId: string) {
  try {
    const context = await getCurrentContext();
    if (!context) return { error: 'Silakan masuk terlebih dahulu.' };
    if (!/^[0-9a-f-]{36}$/i.test(invoiceId)) return { error: 'Tagihan tidak ditemukan.' };

    const invoice = await syncSubscriptionInvoicePayment({
      tenantId: context.tenant.id,
      subscriptionInvoiceId: invoiceId,
    });
    if (!invoice) return { error: 'Tagihan tidak ditemukan.' };

    return {
      success: true,
      status: invoice.status as 'PENDING' | 'PAID' | 'CANCELED',
      planCode: invoice.planCode,
      plan: invoice.plan,
      amount: invoice.amount,
      periodEnd: invoice.periodEnd?.toISOString() ?? null,
      outletKey: context.tenant.outletKey,
    };
  } catch (error) {
    console.error('Failed to get subscription checkout status:', error);
    return { error: 'Gagal memeriksa status pembayaran.' };
  }
}
