"use server";

import { db } from "@/lib/db";
import { tenants, transactions, transactionItems, products } from "@/lib/db/schema";
import { eq, inArray, and, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateOrderNumber } from "@/lib/utils/order-number";

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

      const unitPrice = Number(dbProduct.price) + modifierExtraPrice;
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
    const discount = Math.max(0, Math.min(data.discount || 0, subTotal));
    const taxableSubtotal = Math.max(0, subTotal - discount);

    // Calculate tax & service charge from tenant settings
    const taxRate = parseFloat(tenant.posTaxRate || '0');
    const serviceRate = parseFloat(tenant.serviceChargeRate || '0');
    const taxAmount = (taxableSubtotal * taxRate) / 100;
    const serviceChargeAmount = (taxableSubtotal * serviceRate) / 100;

    const grandTotal = Math.max(0, taxableSubtotal + taxAmount + serviceChargeAmount);

    const initialStatus = 'PENDING';
    
    // Always start online orders as PENDING so they wait in the "Menunggu Pembayaran" queue
    // until the customer pays at the counter or completes Midtrans checkout.
    
    const orderNumber = generateOrderNumber(tenant);

    // 3. Create Transaction
    const [newTransaction] = await db.insert(transactions).values({
      tenantId: tenant.id,
      cashierMembershipId: null, // Online order has no cashier user ID
      shiftId: shiftId,
      totalAmount: subTotal.toString(),
      discount: discount.toString(),
      promoCode: data.promoCode || data.promoName || null,
      tax: taxAmount.toString(),
      serviceCharge: serviceChargeAmount.toString(),
      grandTotal: grandTotal.toString(),
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
      snapToken: null 
    };

  } catch (error: any) {
    console.error("Failed to create online order:", error);
    return { error: `Gagal membuat pesanan: ${error.message || String(error)}` };
  }
}

export async function generatePaymentToken(orderNumber: string, tenantSlug: string, returnUrl?: string) {
  try {
    const tenantResult = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug)).limit(1);
    if (tenantResult.length === 0) return { error: "Toko tidak ditemukan" };
    const tenant = tenantResult[0];

    const cleanOrderNumber = orderNumber.replace(/^#/, '').trim().toUpperCase();
    const hashOrderNumber = '#' + cleanOrderNumber;

    const orderResult = await db.select().from(transactions).where(
      and(
        eq(transactions.tenantId, tenant.id),
        or(
          eq(transactions.orderNumber, cleanOrderNumber),
          eq(transactions.orderNumber, hashOrderNumber),
          eq(transactions.orderNumber, orderNumber)
        )
      )
    ).limit(1);

    if (orderResult.length === 0) return { error: "Pesanan tidak ditemukan" };
    const order = orderResult[0];

    if (order.snapToken) {
      return { success: true, snapToken: order.snapToken };
    }

    if (!tenant.midtransServerKey || !tenant.onlinePaymentEnabled) {
      return { error: "Metode pembayaran online belum dikonfigurasi atau belum diaktifkan oleh toko ini" };
    }

    // Set method to ONLINE since they clicked Bayar Online
    await db.update(transactions)
      .set({ paymentMethod: 'ONLINE' })
      .where(eq(transactions.id, order.id));

    const authString = Buffer.from(`${tenant.midtransServerKey}:`).toString('base64');
    const apiUrl = tenant.midtransEnvironment === 'production' 
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
    
    const midtransPayload: any = {
      transaction_details: {
        order_id: order.id,
        gross_amount: Math.round(Number(order.grandTotal))
      },
      customer_details: {
        first_name: order.customerName || "Customer",
        phone: order.customerPhone || ""
      }
    };

    if (returnUrl) {
      midtransPayload.callbacks = {
        finish: returnUrl,
        error: returnUrl,
        unfinish: returnUrl
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(midtransPayload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const midtransData = await response.json();
    if (midtransData.token) {
      const snapToken = midtransData.token;
      await db.update(transactions)
        .set({ snapToken })
        .where(eq(transactions.id, order.id));
      return { success: true, snapToken };
    } else {
      console.error("Midtrans Error:", midtransData);
      return { error: "Gagal membuat token pembayaran dari Midtrans" };
    }
  } catch (error: any) {
    console.error("Failed to generate payment token:", error);
    return { error: `Gagal memproses pembayaran: ${error.message || String(error)}` };
  }
}

export async function updateOrderPaymentToCash(orderNumber: string, tenantSlug: string) {
  try {
    const tenantResult = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug)).limit(1);
    if (tenantResult.length === 0) return { error: "Toko tidak ditemukan" };
    
    const cleanOrderNumber = orderNumber.replace(/^#/, '').trim().toUpperCase();
    const hashOrderNumber = '#' + cleanOrderNumber;
    
    await db.update(transactions)
      .set({ paymentMethod: 'CASH' })
      .where(
        and(
          eq(transactions.tenantId, tenantResult[0].id),
          or(
            eq(transactions.orderNumber, cleanOrderNumber),
            eq(transactions.orderNumber, hashOrderNumber),
            eq(transactions.orderNumber, orderNumber)
          )
        )
      );
      
    return { success: true };
  } catch (error) {
    console.error("Failed to update payment to cash:", error);
    return { error: "Gagal memproses pilihan pembayaran" };
  }
}

export async function verifyOnlinePaymentStatus(orderNumber: string, tenantSlug: string) {
  try {
    const tenantResult = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug)).limit(1);
    if (tenantResult.length === 0) return { error: "Toko tidak ditemukan" };
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
    if (txs.length === 0) return { error: "Pesanan tidak ditemukan" };
    const order = txs[0];
    
    if (order.paymentStatus === 'PAID') {
       return { success: true, paymentStatus: 'PAID' };
    }

    if (!tenant.midtransServerKey) {
       return { error: "Konfigurasi pembayaran tidak lengkap" };
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
       return { error: "Gagal menghubungi server pembayaran" };
    }
    
    const midtransData = await response.json();
    
    const transactionStatus = midtransData.transaction_status;
    const fraudStatus = midtransData.fraud_status;

    let newStatus = order.status;
    let newPaymentStatus = order.paymentStatus || 'PENDING';

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        newPaymentStatus = 'PENDING';
      } else if (fraudStatus === 'accept') {
        newPaymentStatus = 'PAID';
        newStatus = tenant.orderProcessType === 'AUTO' ? 'COMPLETED' : 'NEW';
      }
    } else if (transactionStatus === 'settlement') {
      newPaymentStatus = 'PAID';
      newStatus = tenant.orderProcessType === 'AUTO' ? 'COMPLETED' : 'NEW';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      newPaymentStatus = 'CANCELED';
      newStatus = 'FAILED';
    }

    if (newStatus !== order.status || newPaymentStatus !== order.paymentStatus) {
      await db.update(transactions)
        .set({ status: newStatus, paymentStatus: newPaymentStatus })
        .where(eq(transactions.id, order.id));

      if (tenant.outletKey) {
        revalidatePath(`/outlet/${tenant.outletKey}`, "layout");
        revalidatePath(`/outlet/${tenant.outletKey}/orders`, "page");
      }
    }

    return { success: true, paymentStatus: newPaymentStatus, status: newStatus };
  } catch (error) {
    console.error("Failed to verify payment status:", error);
    return { error: "Gagal memverifikasi status pembayaran" };
  }
}
