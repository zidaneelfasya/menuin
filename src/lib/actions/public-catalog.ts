"use server";

import { db } from "@/lib/db";
import { tenants, transactions, transactionItems, products } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

const orderSchema = z.object({
  tenantSlug: z.string(),
  orderType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  tableNumber: z.string().optional(),
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().min(1),
    modifiers: z.array(z.any()).optional(),
    notes: z.string().optional()
  })).min(1),
  paymentMethod: z.string().default('ONLINE')
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

    // Taxes/Discounts could be applied here. For now, simple total.
    const grandTotal = subTotal;

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

    // 5. Generate Midtrans Snap Token if configured
    let snapToken = null;
    if (tenant.midtransServerKey) {
      const authString = Buffer.from(`${tenant.midtransServerKey}:`).toString('base64');
      const apiUrl = tenant.midtransEnvironment === 'production' 
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${authString}`
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: newTransaction.id,
            gross_amount: grandTotal
          },
          customer_details: {
            first_name: data.customerName || "Customer",
            phone: data.customerPhone || ""
          }
        })
      });

      const midtransData = await response.json();
      if (midtransData.token) {
        snapToken = midtransData.token;
      } else {
        console.error("Midtrans Error:", midtransData);
      }
    }

    return { 
      success: true, 
      transactionId: newTransaction.id, 
      publicToken: newTransaction.publicToken,
      orderNumber: newTransaction.orderNumber,
      snapToken 
    };

  } catch (error) {
    console.error("Failed to create online order:", error);
    return { error: "Gagal membuat pesanan. Silakan coba lagi." };
  }
}
