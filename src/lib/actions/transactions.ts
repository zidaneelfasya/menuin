'use server';

import { db } from '@/lib/db';
import { transactions, transactionItems, products } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

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

      // 1. Create Transaction record
      const [newTx] = await tx.insert(transactions).values({
        tenantId,
        userId,
        totalAmount: payload.totalAmount.toString(),
        discount: (payload.discount || 0).toString(),
        tax: (payload.tax || 0).toString(),
        serviceCharge: (payload.serviceCharge || 0).toString(),
        platformFee: (payload.platformFee || 0).toString(),
        grandTotal: payload.grandTotal.toString(),
        promoCode: payload.promoCode || null,
        paymentMethod: payload.paymentMethod,
        status: payload.posKitchenSync ? 'PENDING' : 'COMPLETED',
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
    
    revalidatePath('/tenants/transactions');
    revalidatePath('/tenants/inventory');
    revalidatePath('/tenants/items');
    revalidatePath('/tenants/dashboard');
    revalidatePath('/tenants/orders');
    
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
