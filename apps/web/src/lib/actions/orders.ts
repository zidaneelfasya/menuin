"use server";

import { db } from "@/lib/db";
import { transactions, transactionItems, products, tenants } from "@/lib/db/schema";
import { eq, and, or, desc, inArray, ilike } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";
import { isOnlinePaymentAvailable } from "@/lib/payments/availability";
import { syncOrderPayment } from "@/lib/payments/payment.service";

import { OrderDto } from "@menuin/types";

export async function getActiveOrders(): Promise<OrderDto[]> {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) throw new Error("Unauthorized");

  // Get active orders (NEW, PROCESSING, READY)
  const activeTransactions = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.tenantId, user.tenantId),
        inArray(transactions.status, ['PENDING', 'NEW', 'PROCESSING', 'READY'])
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
      productId: transactionItems.productId,
      quantity: transactionItems.quantity,
      price: transactionItems.price,
      productName: products.name,
      subtotal: transactionItems.subtotal,
      modifiers: transactionItems.modifiers,
      notes: transactionItems.notes,
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

export async function syncOrderPaymentStatus(orderId: string) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) throw new Error("Unauthorized");

  try {
    // Tombol "Cek Status" kasir: interval minimum lebih pendek dari polling pelanggan.
    const synced = await syncOrderPayment({ tenantId: user.tenantId, transactionId: orderId, minIntervalMs: 5_000 });
    if (!synced) return { error: "Pesanan tidak ditemukan." };

    if (user?.outletKey) {
      revalidatePath(`/outlet/${user.outletKey}/orders`, "page");
      revalidatePath(`/outlet/${user.outletKey}`, "layout");
    }

    return {
      success: true,
      paymentStatus: synced.paymentStatus,
      status: synced.status,
      isPaid: synced.paymentStatus === 'PAID'
    };
  } catch (error: any) {
    console.error("Failed to sync payment status:", error);
    return { error: "Gagal sinkronisasi status pembayaran." };
  }
}

export async function updateOrderStatus(transactionId: string, newStatus: string) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) throw new Error("Unauthorized");

  try {
    const [tx] = await db.select().from(transactions).where(and(eq(transactions.id, transactionId), eq(transactions.tenantId, user.tenantId)));
    if (!tx) return { error: "Pesanan tidak ditemukan." };

    const updates: any = { status: newStatus };
    
    // If confirming a PENDING order, mark it as PAID (cashier has received the money)
    if (tx.status === 'PENDING' && newStatus === 'NEW') {
      updates.paymentStatus = 'PAID';
    }

    await db.update(transactions)
      .set(updates)
      .where(and(eq(transactions.id, transactionId), eq(transactions.tenantId, user.tenantId)));
    
    // Auto-complete all items if order is marked ready or completed
    if (newStatus === 'READY' || newStatus === 'COMPLETED') {
      await db.update(transactionItems)
        .set({ isCompleted: true })
        .where(eq(transactionItems.transactionId, transactionId));
    }

    if (user?.outletKey) revalidatePath(`/outlet/${user.outletKey}`, "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return { error: "Gagal memperbarui status pesanan." };
  }
}

export async function bulkUpdateOrderStatus(orderIds: string[], newStatus: string) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) throw new Error("Unauthorized");
  if (!orderIds || orderIds.length === 0) return { success: true, count: 0 };

  try {
    const updates: any = { status: newStatus };

    // If confirming PENDING orders to NEW, mark paymentStatus as PAID
    if (newStatus === 'NEW') {
      await db.update(transactions)
        .set({ status: newStatus, paymentStatus: 'PAID' })
        .where(
          and(
            inArray(transactions.id, orderIds),
            eq(transactions.tenantId, user.tenantId),
            eq(transactions.status, 'PENDING')
          )
        );
    }

    // Update all matching transactions
    await db.update(transactions)
      .set(updates)
      .where(
        and(
          inArray(transactions.id, orderIds),
          eq(transactions.tenantId, user.tenantId)
        )
      );

    // Auto-complete all items if orders are marked ready or completed
    if (newStatus === 'READY' || newStatus === 'COMPLETED') {
      await db.update(transactionItems)
        .set({ isCompleted: true })
        .where(inArray(transactionItems.transactionId, orderIds));
    }

    if (user?.outletKey) revalidatePath(`/outlet/${user.outletKey}`, "layout");
    return { success: true, count: orderIds.length };
  } catch (error: any) {
    console.error("Failed to bulk update order status:", error);
    return { error: error.message || "Gagal memperbarui status seluruh pesanan." };
  }
}

export async function updateOrderItemStatus(itemId: string, isCompleted: boolean) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) throw new Error("Unauthorized");

  try {
    await db.update(transactionItems)
      .set({ isCompleted })
      .where(eq(transactionItems.id, itemId));
    
    if (user?.outletKey) revalidatePath(`/outlet/${user.outletKey}`, "layout");
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

  const cleanOrderNumber = orderNumber.replace(/^#/, '').trim().toUpperCase();
  const hashOrderNumber = '#' + cleanOrderNumber;

  const txs = await db.select().from(transactions).where(
    and(
      eq(transactions.tenantId, tenant.id),
      or(
        eq(transactions.orderNumber, cleanOrderNumber),
        eq(transactions.orderNumber, hashOrderNumber),
        eq(transactions.orderNumber, orderNumber)
      )
    )
  ).limit(1);
  if (txs.length === 0) return null;
  const tx = txs[0];

  const items = await db
    .select({
      id: transactionItems.id,
      quantity: transactionItems.quantity,
      price: transactionItems.price,
      productName: products.name,
      imageUrl: products.imageUrl,
      subtotal: transactionItems.subtotal,
      modifiers: transactionItems.modifiers,
      notes: transactionItems.notes,
      isCompleted: transactionItems.isCompleted
    })
    .from(transactionItems)
    .innerJoin(products, eq(transactionItems.productId, products.id))
    .where(eq(transactionItems.transactionId, tx.id));

  return {
    ...tx,
    items,
    tenantSettings: {
      onlinePaymentEnabled: isOnlinePaymentAvailable(tenant),
      primaryColor: tenant.primaryColor,
    }
  };
}

export async function getOrderByNumberForOutlet(orderNumber: string) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) throw new Error("Unauthorized");

  const trimmed = orderNumber.trim();
  const cleanOrderNumber = trimmed.replace(/^#/, '').toUpperCase();
  const hashOrderNumber = '#' + cleanOrderNumber;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

  const searchConditions = [
    ilike(transactions.orderNumber, cleanOrderNumber),
    ilike(transactions.orderNumber, hashOrderNumber),
    ilike(transactions.orderNumber, trimmed),
  ];

  if (isUuid) {
    searchConditions.push(eq(transactions.id, trimmed));
  }

  const txs = await db.select().from(transactions).where(
    and(
      eq(transactions.tenantId, user.tenantId),
      or(...searchConditions)
    )
  ).limit(1);

  if (txs.length === 0) return null;
  const tx = txs[0];

  const items = await db
    .select({
      id: transactionItems.id,
      transactionId: transactionItems.transactionId,
      productId: transactionItems.productId,
      quantity: transactionItems.quantity,
      price: transactionItems.price,
      productName: products.name,
      subtotal: transactionItems.subtotal,
      modifiers: transactionItems.modifiers,
      notes: transactionItems.notes,
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

export async function getActiveOrderStatus(orderNumber: string, tenantSlug: string) {
  try {
    const cleanOrderNumber = orderNumber.replace(/^#/, '').trim().toUpperCase();
    const hashOrderNumber = '#' + cleanOrderNumber;

    const tenantResult = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, tenantSlug)).limit(1);
    if (tenantResult.length === 0) return { isActive: false, status: null, orderNumber: cleanOrderNumber };
    const tenant = tenantResult[0];

    const txs = await db
      .select({
        id: transactions.id,
        orderNumber: transactions.orderNumber,
        status: transactions.status,
        paymentStatus: transactions.paymentStatus,
        paymentMethod: transactions.paymentMethod,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenant.id),
          or(
            eq(transactions.orderNumber, cleanOrderNumber),
            eq(transactions.orderNumber, hashOrderNumber),
            eq(transactions.orderNumber, orderNumber)
          )
        )
      )
      .limit(1);

    if (txs.length === 0) return { isActive: false, status: null, orderNumber: cleanOrderNumber };
    const tx = txs[0];

    const terminalStatuses = ['COMPLETED', 'CANCELLED', 'CANCELED', 'REJECTED'];
    const isTerminal = terminalStatuses.includes((tx.status || '').toUpperCase());
    const isPaymentFailed = ['FAILED', 'DENIED', 'EXPIRED'].includes((tx.paymentStatus || '').toUpperCase());

    // Check TTL: orders older than 24 hours are considered no longer active
    const isTooOld = tx.createdAt && (Date.now() - new Date(tx.createdAt).getTime() > 24 * 60 * 60 * 1000);

    const isActive = !isTerminal && !isPaymentFailed && !isTooOld;

    return {
      isActive,
      status: tx.status,
      paymentStatus: tx.paymentStatus,
      paymentMethod: tx.paymentMethod,
      orderNumber: tx.orderNumber || cleanOrderNumber,
    };
  } catch (error) {
    console.error('Error fetching active order status:', error);
    return { isActive: false, status: null, orderNumber };
  }
}

