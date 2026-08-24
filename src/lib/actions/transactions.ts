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
  grandTotal: number;
  paymentMethod: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
};

export async function createTransaction(payload: CheckoutPayload) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.dashboardId) return { success: false, error: 'Unauthorized or no dashboard' };

    const dashboardId = user.dashboardId;
    const userId = user.id;

    // We run the transaction logic in a single DB transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create Transaction record
      const [newTx] = await tx.insert(transactions).values({
        dashboardId,
        userId,
        totalAmount: payload.totalAmount.toString(),
        discount: payload.discount.toString(),
        tax: payload.tax.toString(),
        grandTotal: payload.grandTotal.toString(),
        paymentMethod: payload.paymentMethod,
        status: 'COMPLETED',
      }).returning({ id: transactions.id });
      
      // 2. Insert Items and Update Stock
      for (const item of payload.items) {
        await tx.insert(transactionItems).values({
          transactionId: newTx.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price.toString(),
          subtotal: item.subtotal.toString(),
        });
        
        // 3. Deduct Stock atomically
        await tx.update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
          })
          .where(eq(products.id, item.productId));
      }
      
      return newTx.id;
    });
    
    revalidatePath('/transactions');
    revalidatePath('/inventory');
    revalidatePath('/products');
    revalidatePath('/dashboard');
    
    return { success: true, transactionId: result };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { success: false, error: 'Gagal memproses transaksi.' };
  }
}

export async function getTransactions() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.dashboardId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }

    // This fetches the list of transactions for this specific store
    const data = await db
      .select()
      .from(transactions)
      .where(eq(transactions.dashboardId, user.dashboardId))
      .orderBy(desc(transactions.createdAt));
      
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return { success: false, error: 'Gagal mengambil data transaksi.' };
  }
}
