'use server';

import { db } from '@/lib/db';
import { transactions, transactionItems, products } from '@/lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import { shifts } from '@/lib/db/schema';

// We'll trust the checkout payload from the client to have this structure
type CheckoutPayload = {
  totalAmount: number;
  discount: number;
  tax: number;
  serviceCharge?: number;
  platformFee?: number;
  grandTotal: number;
  promoCode?: string;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  orderType?: string;
  posKitchenSync?: boolean;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    subtotal: number;
    modifiers?: any[];
    notes?: string;
  }>;
};

function generateOrderNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '#';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createTransaction(payload: CheckoutPayload) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized or no dashboard' };

    const tenantId = user.tenantId;
    const userId = user.id;

    // We run the transaction logic in a single DB transaction
    const result = await db.transaction(async (tx) => {
      const orderNumber = generateOrderNumber();

      // Find active shift
      const activeShifts = await tx
        .select()
        .from(shifts)
        .where(
          and(
            eq(shifts.tenantId, tenantId),
            eq(shifts.status, 'ACTIVE')
          )
        )
        .limit(1);
        
      const shiftId = activeShifts.length > 0 ? activeShifts[0].id : null;

      // 1. Create Transaction record
      const [newTx] = await tx.insert(transactions).values({
        tenantId,
        cashierMembershipId: userId,
        shiftId,
        totalAmount: payload.totalAmount.toString(),
        discount: (payload.discount || 0).toString(),
        tax: (payload.tax || 0).toString(),
        serviceCharge: (payload.serviceCharge || 0).toString(),
        platformFee: (payload.platformFee || 0).toString(),
        grandTotal: payload.grandTotal.toString(),
        promoCode: payload.promoCode || null,
        paymentMethod: (payload.paymentMethod || 'CASH').toUpperCase(),
        paymentStatus: 'PAID', // POS transactions are always paid immediately
        status: 'PROCESSING', // POS orders directly go to kitchen as PROCESSING
        source: 'POS',
        orderType: payload.orderType || 'DINE_IN',
        customerName: payload.customerName || null,
        customerPhone: payload.customerPhone || null,
        tableNumber: payload.tableNumber || null,
        orderNumber,
      }).returning({ id: transactions.id });
      
      // 2. Insert Items and Update Stock
      for (const item of payload.items) {
        await tx.insert(transactionItems).values({
          tenantId, // use narrowed tenantId
          transactionId: newTx.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price.toString(),
          subtotal: item.subtotal.toString(),
          modifiers: item.modifiers || [],
          notes: item.notes || null,
        });
      }
      
      return newTx.id;
    });
    
    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    return { success: true, transactionId: result };
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
                eq(products.tenantId, tenantId)
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

