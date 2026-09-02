"use server";

import { db } from "@/lib/db";
import { tenants, transactions, transactionItems, products } from "@/lib/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { z } from "zod";

const orderSchema = z.object({
  tenantSlug: z.string(),
  orderType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  tableNumber: z.string().optional(),
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

function generateOrderNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '#';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createOnlineOrder(formData: z.infer<typeof orderSchema>) {
  try {
    const data = orderSchema.parse(formData);
    
    // 1. Get tenant and settings
    const tenantResult = await db.select().from(tenants).where(eq(tenants.slug, data.tenantSlug)).limit(1);
    if (tenantResult.length === 0) return { error: "Toko tidak ditemukan" };
    const tenant = tenantResult[0];

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
      
      const price = Number(dbProduct.price);
      const total = price * item.quantity;
      subTotal += total;

      itemsToInsert.push({
        productId: dbProduct.id,
        quantity: item.quantity,
        price: price.toString(),
        subtotal: total.toString(),
        modifiers: item.modifiers || [],
        notes: item.notes || null,
      });
    }

    // Apply promo discount if any
    const discount = Math.max(0, Math.min(data.discount || 0, subTotal));
    const grandTotal = Math.max(0, subTotal - discount);

    let initialStatus = 'PENDING';
    if (!tenant.midtransServerKey) {
      initialStatus = tenant.orderProcessType === 'AUTO' ? 'COMPLETED' : 'NEW';
    }

    const orderNumber = generateOrderNumber();

    // 3. Create Transaction
    const [newTransaction] = await db.insert(transactions).values({
      tenantId: tenant.id,
      userId: null, // Online order has no cashier user ID
      totalAmount: subTotal.toString(),
      discount: discount.toString(),
      promoCode: data.promoName || null,
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

    const orderResult = await db.select().from(transactions).where(
      and(
        eq(transactions.orderNumber, orderNumber),
        eq(transactions.tenantId, tenant.id)
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
    
    await db.update(transactions)
      .set({ paymentMethod: 'CASH' })
      .where(
        and(
          eq(transactions.orderNumber, orderNumber),
          eq(transactions.tenantId, tenantResult[0].id)
        )
      );
      
    return { success: true };
  } catch (error) {
    console.error("Failed to update payment to cash:", error);
    return { error: "Gagal memproses pilihan pembayaran" };
  }
}
