"use server";

import { db } from "@/lib/db";
import { tenants, transactions, transactionItems, products, promotions } from "@/lib/db/schema";
import { eq, inArray, and, or, sql } from "drizzle-orm";
import { getAppOrigin } from "@/lib/utils/app-origin";
import { z } from "zod";
import { generateOrderNumber } from "@/lib/utils/order-number";
import { calculatePromoDiscount } from "@/lib/utils/promotions";
import { cancelActivePayments, startOrderPayment, syncOrderPayment } from "@/lib/payments/payment.service";

const orderSchema = z.object({
  tenantSlug: z.string(),
  orderType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  tableNumber: z.string().optional(),
  promoCode: z.string().optional(),
  promoName: z.string().optional(),
  promoId: z.string().optional(),
  discount: z.number().optional(),
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().min(1),
    modifiers: z.array(z.any()).optional(),
    notes: z.string().optional()
  })).min(1),
  paymentMethod: z.string().default('ONLINE'),
  returnUrl: z.string().optional()
});

export async function createOnlineOrder(formData: z.infer<typeof orderSchema>) {
  try {
    const data = orderSchema.parse(formData);
    
    // 1. Get tenant and settings
    const tenantResult = await db.select().from(tenants).where(eq(tenants.slug, data.tenantSlug)).limit(1);
    if (tenantResult.length === 0) return { error: "Toko tidak ditemukan" };
    const tenant = tenantResult[0];

    // Check for active shift
    const { shifts } = await import('@/lib/db/schema');
    const activeShifts = await db
      .select()
      .from(shifts)
      .where(
        and(
          eq(shifts.tenantId, tenant.id),
          eq(shifts.status, 'ACTIVE')
        )
      )
      .limit(1);
      
    if (activeShifts.length === 0) {
      return { error: "Toko belum dibuka, pesanan tidak dapat diproses saat ini." };
    }
    const shiftId = activeShifts[0].id;

    // 2. Validate products and calculate total
    const productIds = data.items.map(i => i.id);
    const dbProducts = await db.select().from(products).where(inArray(products.id, productIds));
    
    if (dbProducts.length !== productIds.length) {
      return { error: "Beberapa produk tidak tersedia" };
    }

    let subTotal = 0;
    const itemsToInsert = [];

    for (const item of data.items) {
      const dbProduct = dbProducts.find(p => p.id === item.id);
      if (!dbProduct) continue;
      
      let modifierExtraPrice = 0;
      if (item.modifiers && Array.isArray(item.modifiers)) {
        item.modifiers.forEach((m: any) => {
          modifierExtraPrice += Number(m.price || 0) * (Number(m.quantity) || 1);
        });
      }

      const productPotongan = Number(dbProduct.potongan || 0);
      const baseProductPrice = Math.max(0, Number(dbProduct.price) - productPotongan);
      const unitPrice = baseProductPrice + modifierExtraPrice;
      const total = unitPrice * item.quantity;
      subTotal += total;

      itemsToInsert.push({
        tenantId: tenant.id,
        productId: dbProduct.id,
        quantity: item.quantity,
        price: unitPrice.toString(),
        subtotal: total.toString(),
        modifiers: item.modifiers || [],
        notes: item.notes || null,
      });
    }

    // Apply promo discount if any
    let discount = 0;
    let validatedPromoId = data.promoId || null;
    let validatedPromoCode = data.promoCode || data.promoName || null;

    if (data.promoId || data.promoCode) {
      const codeOrName = (data.promoCode || data.promoName || '').trim().toUpperCase();
      const promoRows = await db
        .select()
        .from(promotions)
        .where(
          and(
            eq(promotions.tenantId, tenant.id),
            data.promoId
              ? eq(promotions.id, data.promoId)
              : sql`UPPER(${promotions.code}) = ${codeOrName}`,
            eq(promotions.isActive, true)
          )
        )
        .limit(1);

      if (promoRows.length > 0) {
        const promo = promoRows[0];
        const itemsForPromo = itemsToInsert.map((it) => ({
          productId: it.productId,
          price: Number(it.price),
          quantity: it.quantity,
        }));
        const calc = calculatePromoDiscount(promo, subTotal, itemsForPromo);
        if (calc.isValid) {
          discount = calc.discountAmount;
          validatedPromoId = promo.id;
          validatedPromoCode = promo.code;
        }
      }
    } else if (data.discount) {
      discount = Math.max(0, Math.min(data.discount, subTotal));
    }

    const taxableSubtotal = Math.max(0, subTotal - discount);

    // Calculate tax & service charge from tenant settings
    const taxRate = parseFloat(tenant.posTaxRate || '0');
    const serviceRate = parseFloat(tenant.serviceChargeRate || '0');
    const taxAmount = (taxableSubtotal * taxRate) / 100;
    const serviceChargeAmount = (taxableSubtotal * serviceRate) / 100;

    const grandTotal = Math.max(0, taxableSubtotal + taxAmount + serviceChargeAmount);

    const initialStatus = 'PENDING';
    
    // Always start online orders as PENDING so they wait in the "Menunggu Pembayaran" queue
    // until the customer pays at the counter or completes DOKU checkout.
    
    const orderNumber = generateOrderNumber(tenant);

    // Biaya gateway baru diketahui setelah pembayaran online sukses (diisi oleh
    // payment service). Saat order dibuat, belum ada potongan apa pun.
    const gatewayFeeNum = 0;
    const netAmountNum = grandTotal;

    // 3. Create Transaction
    const [newTransaction] = await db.insert(transactions).values({
      tenantId: tenant.id,
      cashierMembershipId: null, // Online order has no cashier user ID
      shiftId: shiftId,
      totalAmount: subTotal.toString(),
      discount: discount.toString(),
      promoCode: validatedPromoCode,
      promotionId: validatedPromoId,
      tax: taxAmount.toString(),
      serviceCharge: serviceChargeAmount.toString(),
      grandTotal: grandTotal.toString(),
      gatewayFee: gatewayFeeNum.toString(),
      netAmount: netAmountNum.toString(),
      paymentMethod: data.paymentMethod,
      status: initialStatus,
      source: 'ONLINE',
      orderType: data.orderType,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone || null,
      tableNumber: data.tableNumber || null,
      orderNumber,
    }).returning({ id: transactions.id, publicToken: transactions.publicToken, orderNumber: transactions.orderNumber });

    // 4. Create Transaction Items
    await db.insert(transactionItems).values(
      itemsToInsert.map(item => ({
        transactionId: newTransaction.id,
        ...item
      }))
    );

    return { 
      success: true, 
      transactionId: newTransaction.id, 
      publicToken: newTransaction.publicToken,
      orderNumber: newTransaction.orderNumber,
    };

  } catch (error: any) {
    console.error("Failed to create online order:", error);
    return { error: `Gagal membuat pesanan: ${error.message || String(error)}` };
  }
}

async function findPublicOrder(orderNumber: string, tenantSlug: string) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug)).limit(1);
  if (!tenant) return { tenant: null, order: null };

  const cleanOrderNumber = orderNumber.replace(/^#/, '').trim().toUpperCase();
  const hashOrderNumber = '#' + cleanOrderNumber;

  const [order] = await db.select().from(transactions).where(
    and(
      eq(transactions.tenantId, tenant.id),
      or(
        eq(transactions.orderNumber, cleanOrderNumber),
        eq(transactions.orderNumber, hashOrderNumber),
        eq(transactions.orderNumber, orderNumber)
      )
    )
  ).limit(1);

  return { tenant, order: order ?? null };
}

/**
 * Membuat sesi pembayaran DOKU Checkout untuk pesanan storefront dan
 * mengembalikan URL halaman pembayaran DOKU.
 */
export async function startOnlinePayment(orderNumber: string, tenantSlug: string) {
  try {
    const { tenant, order } = await findPublicOrder(orderNumber, tenantSlug);
    if (!tenant) return { error: "Toko tidak ditemukan" };
    if (!order) return { error: "Pesanan tidak ditemukan" };

    const origin = await getAppOrigin();
    const callbackUrl = origin && tenant.slug
      ? `${origin}/store/${encodeURIComponent(tenant.slug)}/status?order=${encodeURIComponent(order.orderNumber || '')}&from=payment`
      : undefined;

    const result = await startOrderPayment({ tenantId: tenant.id, transactionId: order.id, callbackUrl });
    if (!result.ok) {
      return { error: result.message, code: result.code };
    }
    return { success: true, paymentUrl: result.paymentUrl, expiresAt: result.expiresAt?.toISOString() ?? null };
  } catch (error) {
    console.error("Failed to start online payment:", error);
    return { error: "Gagal memproses pembayaran online. Silakan coba lagi." };
  }
}

export async function updateOrderPaymentToCash(orderNumber: string, tenantSlug: string) {
  try {
    const { tenant, order } = await findPublicOrder(orderNumber, tenantSlug);
    if (!tenant) return { error: "Toko tidak ditemukan" };
    if (!order) return { error: "Pesanan tidak ditemukan" };
    if (order.paymentStatus === 'PAID') return { error: "Pesanan ini sudah lunas." };

    // Tutup sesi pembayaran online yang masih aktif. Jika pelanggan ternyata tetap
    // membayar online, notifikasinya tetap tercatat dan ditandai untuk direview.
    await cancelActivePayments({ tenantId: tenant.id, transactionId: order.id });
    await db.update(transactions)
      .set({ paymentMethod: 'CASH' })
      .where(and(eq(transactions.id, order.id), eq(transactions.tenantId, tenant.id)));

    return { success: true };
  } catch (error) {
    console.error("Failed to update payment to cash:", error);
    return { error: "Gagal memproses pilihan pembayaran" };
  }
}

/**
 * Status pembayaran terkini sebuah pesanan. Sumber kebenaran adalah DB (diisi
 * webhook); cek ke DOKU hanya sebagai fallback dan dibatasi frekuensinya.
 */
export async function verifyOnlinePaymentStatus(orderNumber: string, tenantSlug: string) {
  try {
    const { tenant, order } = await findPublicOrder(orderNumber, tenantSlug);
    if (!tenant) return { error: "Toko tidak ditemukan" };
    if (!order) return { error: "Pesanan tidak ditemukan" };

    if (order.paymentStatus === 'PAID' || order.paymentMethod !== 'ONLINE') {
      return { success: true, paymentStatus: order.paymentStatus, status: order.status };
    }

    const synced = await syncOrderPayment({ tenantId: tenant.id, transactionId: order.id });
    return {
      success: true,
      paymentStatus: synced?.paymentStatus ?? order.paymentStatus,
      status: synced?.status ?? order.status,
    };
  } catch (error) {
    console.error("Failed to verify payment status:", error);
    return { error: "Gagal memverifikasi status pembayaran" };
  }
}
