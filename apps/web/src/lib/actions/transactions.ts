'use server';

import { db } from '@/lib/db';
import { transactions, transactionItems, products, shifts, tenants, memberships } from '@/lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import { insertPosTransaction, type PosCheckoutPayload } from '@/lib/pos/create-pos-transaction';

export async function createTransaction(payload: PosCheckoutPayload) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized or no dashboard' };

    // QRIS dinamis tidak boleh dicatat lunas oleh kasir: harus lewat konfirmasi DOKU.
    if ((payload.paymentMethod || '').toUpperCase() === 'QRIS_DYNAMIC') {
      return { success: false, error: 'QRIS dinamis harus dibayar lewat kode QR DOKU.' };
    }

    const created = await insertPosTransaction({
      tenantId: user.tenantId,
      cashierMembershipId: user.id,
      payload,
      mode: 'PAID',
    });

    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    return { success: true, transactionId: created.id };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { success: false, error: 'Gagal memproses transaksi.' };
  }
}

export async function getTransactions() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }

    // This fetches the list of transactions for this specific store
    const data = await db
      .select()
      .from(transactions)
      .where(eq(transactions.tenantId, user.tenantId))
      .orderBy(desc(transactions.createdAt));
      
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return { success: false, error: 'Gagal mengambil data transaksi.' };
  }
}

export async function getTransactionDetails(transactionId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const [trx] = await db
      .select({
        id: transactions.id,
        totalAmount: transactions.totalAmount,
        discount: transactions.discount,
        tax: transactions.tax,
        serviceCharge: transactions.serviceCharge,
        platformFee: transactions.platformFee,
        gatewayFee: transactions.gatewayFee,
        netAmount: transactions.netAmount,
        grandTotal: transactions.grandTotal,
        promoCode: transactions.promoCode,
        paymentMethod: transactions.paymentMethod,
        paymentStatus: transactions.paymentStatus,
        status: transactions.status,
        orderType: transactions.orderType,
        customerName: transactions.customerName,
        customerPhone: transactions.customerPhone,
        tableNumber: transactions.tableNumber,
        orderNumber: transactions.orderNumber,
        createdAt: transactions.createdAt,
        cashierName: memberships.displayName,
      })
      .from(transactions)
      .leftJoin(memberships, eq(transactions.cashierMembershipId, memberships.id))
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.tenantId, user.tenantId)
        )
      )
      .limit(1);

    if (!trx) {
      return { success: false, error: 'Transaksi tidak ditemukan.' };
    }

    const items = await db
      .select({
        id: transactionItems.id,
        productId: transactionItems.productId,
        productName: products.name,
        quantity: transactionItems.quantity,
        price: transactionItems.price,
        subtotal: transactionItems.subtotal,
        modifiers: transactionItems.modifiers,
        notes: transactionItems.notes,
      })
      .from(transactionItems)
      .leftJoin(products, eq(transactionItems.productId, products.id))
      .where(
        and(
          eq(transactionItems.transactionId, trx.id),
          eq(transactionItems.tenantId, user.tenantId)
        )
      );

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, user.tenantId))
      .limit(1);

    return {
      success: true,
      data: {
        transaction: trx,
        items: items.map(it => ({
          name: it.productName || 'Item Menu',
          quantity: it.quantity,
          price: parseFloat(it.price || '0'),
          subtotal: parseFloat(it.subtotal || '0'),
          modifiers: it.modifiers,
          notes: it.notes,
        })),
        settings: tenant,
      },
    };
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return { success: false, error: 'Gagal mengambil detail transaksi.' };
  }
}

export async function voidTransaction(payload: { transactionId: string; reason: string; restock?: boolean }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized: Sesi tidak ditemukan.' };
    }

    const tenantId = user.tenantId;

    if (user.role !== 'OWNER' && user.role !== 'MANAGER' && (user.role as string) !== 'SYSTEM_ADMIN') {
      return { success: false, error: 'Hanya OWNER atau MANAGER yang memiliki otorisasi untuk membatalkan (void) transaksi.' };
    }

    if (!payload.reason || payload.reason.trim().length < 3) {
      return { success: false, error: 'Wajib menyertakan alasan pembatalan transaksi secara jelas.' };
    }

    const [trx] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, payload.transactionId),
          eq(transactions.tenantId, tenantId)
        )
      )
      .limit(1);

    if (!trx) {
      return { success: false, error: 'Transaksi tidak ditemukan.' };
    }

    if (trx.status === 'CANCELLED' || trx.paymentStatus === 'CANCELED') {
      return { success: false, error: 'Transaksi ini sudah pernah dibatalkan sebelumnya.' };
    }

    await db.transaction(async (tx) => {
      // 1. Update status to CANCELLED with immutable audit fields
      await tx
        .update(transactions)
        .set({
          status: 'CANCELLED',
          paymentStatus: 'CANCELED',
          voidReason: payload.reason.trim(),
          voidedAt: new Date(),
          voidedByMembershipId: user.id,
        })
        .where(eq(transactions.id, trx.id));

      // 2. Optional restock of items
      if (payload.restock !== false) {
        const items = await tx
          .select()
          .from(transactionItems)
          .where(eq(transactionItems.transactionId, trx.id));

        for (const item of items) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(products.id, item.productId),
                eq(products.tenantId, tenantId),
                eq(products.trackStock, true)
              )
            );
        }
      }
    });

    if (user && typeof user === 'object' && 'outletKey' in user) {
      revalidatePath(`/outlet/${user.outletKey}/transactions`, 'page');
      revalidatePath(`/outlet/${user.outletKey}/reports`, 'page');
      revalidatePath(`/outlet/${user.outletKey}/orders`, 'page');
    }

    return {
      success: true,
      message: `Transaksi ${trx.orderNumber || trx.id.slice(0, 8)} berhasil dibatalkan dan tercatat dalam log audit anti-fraud.`,
    };
  } catch (error: any) {
    console.error('Error voiding transaction:', error);
    return { success: false, error: error.message || 'Gagal membatalkan transaksi.' };
  }
}

