"use server";

import { db } from "@/lib/db";
import { transactions, transactionItems, products, tenants } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export async function getActiveOrders() {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) throw new Error("Unauthorized");

  // Get active orders (NEW, PROCESSING, READY)
  const activeTransactions = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.tenantId, user.tenantId),
        inArray(transactions.status, ['NEW', 'PROCESSING', 'READY'])
      )
    )
    .orderBy(desc(transactions.createdAt));

  if (activeTransactions.length === 0) return [];

  const txIds = activeTransactions.map(t => t.id);

  // Get items for these transactions
  const items = await db
    .select({
      id: transactionItems.id,
      transactionId: transactionItems.transactionId,
      quantity: transactionItems.quantity,
      productName: products.name,
      subtotal: transactionItems.subtotal,
      isCompleted: transactionItems.isCompleted
    })
    .from(transactionItems)
    .innerJoin(products, eq(transactionItems.productId, products.id))
    .where(inArray(transactionItems.transactionId, txIds));

  // Group items by transactionId
  const itemsByTx = items.reduce((acc, item) => {
    if (!acc[item.transactionId]) acc[item.transactionId] = [];
    acc[item.transactionId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return activeTransactions.map(tx => ({
    ...tx,
    items: itemsByTx[tx.id] || []
  }));
}

export async function updateOrderStatus(transactionId: string, newStatus: string) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) throw new Error("Unauthorized");

  try {
    await db.update(transactions)
      .set({ status: newStatus })
      .where(and(eq(transactions.id, transactionId), eq(transactions.tenantId, user.tenantId)));
    
    // Auto-complete all items if order is marked ready or completed
    if (newStatus === 'READY' || newStatus === 'COMPLETED') {
      await db.update(transactionItems)
        .set({ isCompleted: true })
        .where(eq(transactionItems.transactionId, transactionId));
    }

    revalidatePath("/tenants/orders");
    return { success: true };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return { error: "Gagal memperbarui status pesanan." };
  }
}

export async function updateOrderItemStatus(itemId: string, isCompleted: boolean) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) throw new Error("Unauthorized");

  try {
    await db.update(transactionItems)
      .set({ isCompleted })
      .where(eq(transactionItems.id, itemId));
    
    revalidatePath("/tenants/orders");
    return { success: true };
  } catch (error) {
    console.error("Failed to update order item status:", error);
    return { error: "Gagal memperbarui status menu." };
  }
}

export async function getOrderById(transactionId: string) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) throw new Error("Unauthorized");

  const txs = await db.select().from(transactions).where(and(eq(transactions.id, transactionId), eq(transactions.tenantId, user.tenantId))).limit(1);
  if (txs.length === 0) return null;
  const tx = txs[0];

  const items = await db
    .select({
      transactionId: transactionItems.transactionId,
      quantity: transactionItems.quantity,
      productName: products.name,
      subtotal: transactionItems.subtotal
    })
    .from(transactionItems)
    .innerJoin(products, eq(transactionItems.productId, products.id))
    .where(eq(transactionItems.transactionId, tx.id));

  return {
    ...tx,
    items
  };
}

export async function getPublicOrderByNumber(orderNumber: string, tenantSlug: string) {
  const tenantResult = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug)).limit(1);
  if (tenantResult.length === 0) return null;
  const tenant = tenantResult[0];

  const txs = await db.select().from(transactions).where(and(eq(transactions.orderNumber, orderNumber), eq(transactions.tenantId, tenant.id))).limit(1);
  if (txs.length === 0) return null;
  const tx = txs[0];

  const items = await db
    .select({
      id: transactionItems.id,
      quantity: transactionItems.quantity,
      productName: products.name,
      subtotal: transactionItems.subtotal,
      isCompleted: transactionItems.isCompleted
    })
    .from(transactionItems)
    .innerJoin(products, eq(transactionItems.productId, products.id))
    .where(eq(transactionItems.transactionId, tx.id));

  return {
    ...tx,
    items
  };
}
