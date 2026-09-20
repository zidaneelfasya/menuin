"use server";

import { db } from "@/lib/db";
import { transactions, transactionItems, products, tenants } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

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
    const [order] = await db.select().from(transactions).where(and(eq(transactions.id, orderId), eq(transactions.tenantId, user.tenantId))).limit(1);
    if (!order) return { error: "Pesanan tidak ditemukan." };

    if (order.paymentStatus === 'PAID') {
      return { success: true, paymentStatus: 'PAID', status: order.status };
    }

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
    if (!tenant || !tenant.midtransServerKey) {
      return { error: "Midtrans Server Key belum dikonfigurasi pada Pengaturan Toko." };
    }

    const authString = Buffer.from(`${tenant.midtransServerKey}:`).toString('base64');
    const apiUrl = tenant.midtransEnvironment === 'production' 
      ? `https://api.midtrans.com/v2/${order.id}/status`
      : `https://api.sandbox.midtrans.com/v2/${order.id}/status`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return { error: "Pembayaran belum tercatat di Midtrans / belum dibayar oleh pelanggan." };
    }

    const midtransData = await response.json();
    const transactionStatus = midtransData.transaction_status;
    const fraudStatus = midtransData.fraud_status;

    let newStatus = order.status;
    let newPaymentStatus = order.paymentStatus || 'PENDING';

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        newPaymentStatus = 'PAID';
        if (order.status === 'PENDING') newStatus = 'NEW';
      }
    } else if (transactionStatus === 'settlement') {
      newPaymentStatus = 'PAID';
      if (order.status === 'PENDING') newStatus = 'NEW';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      newPaymentStatus = 'CANCELED';
      newStatus = 'FAILED';
    }

    if (newStatus !== order.status || newPaymentStatus !== order.paymentStatus) {
      await db.update(transactions)
        .set({ status: newStatus, paymentStatus: newPaymentStatus })
        .where(eq(transactions.id, order.id));
    }

    if (user?.outletKey) {
      revalidatePath(`/outlet/${user.outletKey}/orders`, "page");
      revalidatePath(`/outlet/${user.outletKey}`, "layout");
    }

    return { 
      success: true, 
      paymentStatus: newPaymentStatus, 
      status: newStatus,
      isPaid: newPaymentStatus === 'PAID'
    };
  } catch (error: any) {
    console.error("Failed to sync Midtrans payment status:", error);
    return { error: error.message || "Gagal sinkronisasi status pembayaran." };
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
    items,
    tenantSettings: {
      midtransClientKey: tenant.midtransClientKey,
      midtransEnvironment: tenant.midtransEnvironment,
      onlinePaymentEnabled: tenant.onlinePaymentEnabled,
      primaryColor: tenant.primaryColor,
    }
  };
}

export async function getActiveOrderStatus(orderNumber: string, tenantSlug: string) {
  try {
    let formattedOrderNum = orderNumber.trim().toUpperCase();
    if (!formattedOrderNum.startsWith('#')) {
      formattedOrderNum = '#' + formattedOrderNum;
    }

    const tenantResult = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, tenantSlug)).limit(1);
    if (tenantResult.length === 0) return { isActive: false, status: null, orderNumber: formattedOrderNum };
    const tenant = tenantResult[0];

    const txs = await db
      .select({
        id: transactions.id,
        status: transactions.status,
        paymentStatus: transactions.paymentStatus,
        paymentMethod: transactions.paymentMethod,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(and(eq(transactions.orderNumber, formattedOrderNum), eq(transactions.tenantId, tenant.id)))
      .limit(1);

    if (txs.length === 0) return { isActive: false, status: null, orderNumber: formattedOrderNum };
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
      orderNumber: formattedOrderNum,
    };
  } catch (error) {
    console.error('Error fetching active order status:', error);
    return { isActive: false, status: null, orderNumber };
  }
}
