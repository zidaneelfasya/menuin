import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products, shifts, tenants, transactionItems, transactions } from '@/lib/db/schema';
import { generateOrderNumber } from '@/lib/utils/order-number';

export type PosCheckoutPayload = {
  totalAmount: number;
  discount: number;
  tax: number;
  serviceCharge?: number;
  platformFee?: number;
  grandTotal: number;
  promoCode?: string;
  promotionId?: string;
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

/**
 * Menyimpan transaksi POS + item + potong stok dalam satu DB transaction.
 *
 * - `PAID`: metode yang diverifikasi kasir (tunai, QRIS statis, EDC, transfer) → langsung lunas.
 * - `AWAITING_GATEWAY`: QRIS dinamis → PENDING sampai DOKU mengonfirmasi pembayaran.
 *   Biaya gateway baru diisi saat lunas (oleh payment service).
 */
export async function insertPosTransaction(params: {
  tenantId: string;
  cashierMembershipId: string;
  payload: PosCheckoutPayload;
  mode: 'PAID' | 'AWAITING_GATEWAY';
}) {
  const { tenantId, payload, mode } = params;

  return db.transaction(async (tx) => {
    const [currentTenant] = await tx
      .select({ name: tenants.name, orderPrefix: tenants.orderPrefix })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const orderNumber = generateOrderNumber(currentTenant);

    const activeShifts = await tx
      .select()
      .from(shifts)
      .where(and(eq(shifts.tenantId, tenantId), eq(shifts.status, 'ACTIVE')))
      .limit(1);
    const shiftId = activeShifts.length > 0 ? activeShifts[0].id : null;

    const gTotal = parseFloat(payload.grandTotal.toString()) || 0;
    const payMethod = (payload.paymentMethod || 'CASH').toUpperCase();

    const [newTx] = await tx.insert(transactions).values({
      tenantId,
      cashierMembershipId: params.cashierMembershipId,
      shiftId,
      totalAmount: payload.totalAmount.toString(),
      discount: (payload.discount || 0).toString(),
      tax: (payload.tax || 0).toString(),
      serviceCharge: (payload.serviceCharge || 0).toString(),
      platformFee: (payload.platformFee || 0).toString(),
      grandTotal: payload.grandTotal.toString(),
      gatewayFee: '0',
      netAmount: gTotal.toString(),
      promoCode: payload.promoCode || null,
      promotionId: payload.promotionId || null,
      paymentMethod: payMethod,
      paymentStatus: mode === 'PAID' ? 'PAID' : 'PENDING',
      // PAID: langsung ke dapur. AWAITING_GATEWAY: menunggu konfirmasi DOKU dulu.
      status: mode === 'PAID' ? 'PROCESSING' : 'PENDING',
      source: 'POS',
      orderType: payload.orderType || 'DINE_IN',
      customerName: payload.customerName || null,
      customerPhone: payload.customerPhone || null,
      tableNumber: payload.tableNumber || null,
      orderNumber,
    }).returning({ id: transactions.id, orderNumber: transactions.orderNumber });

    for (const item of payload.items) {
      await tx.insert(transactionItems).values({
        tenantId,
        transactionId: newTx.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price.toString(),
        subtotal: item.subtotal.toString(),
        modifiers: item.modifiers || [],
        notes: item.notes || null,
      });

      // Stok dipotong saat transaksi dibuat; QRIS yang dibatalkan mengembalikannya.
      await tx
        .update(products)
        .set({ stock: sql`GREATEST(0, ${products.stock} - ${item.quantity})`, updatedAt: new Date() })
        .where(and(eq(products.id, item.productId), eq(products.tenantId, tenantId), eq(products.trackStock, true)));
    }

    return newTx;
  });
}

/** Kembalikan stok item sebuah transaksi (dipanggil di dalam DB transaction). */
export async function restockTransactionItems(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tenantId: string,
  transactionId: string
) {
  const items = await tx.select().from(transactionItems).where(eq(transactionItems.transactionId, transactionId));
  for (const item of items) {
    await tx
      .update(products)
      .set({ stock: sql`${products.stock} + ${item.quantity}`, updatedAt: new Date() })
      .where(and(eq(products.id, item.productId), eq(products.tenantId, tenantId), eq(products.trackStock, true)));
  }
}
