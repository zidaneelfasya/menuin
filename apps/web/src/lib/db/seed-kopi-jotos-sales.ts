import { db } from './index';
import { transactions, transactionItems, products, tenants } from './schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function seedKopiJotosSales() {
  const tenantId = 'ba498eeb-ce3c-4bf7-bdbe-beb0f256d227';
  console.log('--- Seeding Sales Data for KOPI JOTOS ---');

  // Verify tenant
  const tenantResult = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (tenantResult.length === 0) {
    console.error('Tenant KOPI JOTOS not found!');
    process.exit(1);
  }
  console.log(`Outlet found: ${tenantResult[0].name} (${tenantResult[0].slug})`);

  // Get products
  const prods = await db.select().from(products).where(eq(products.tenantId, tenantId));
  console.log(`Found ${prods.length} products to seed.`);

  // Target sales count map for each product name
  const targetSalesByName: Record<string, number> = {
    'Nasi Goreng Kampung': 2450,       // -> 2,4rb+
    'Kopi Susu Gula Aren': 1820,       // -> 1,8rb+
    'Spaghetti Carbonara': 1250,       // -> 1,2rb+
    'Matcha Latte': 850,               // -> 850+
    'New York Cheesecake': 520,        // -> 520+
    'Mix Platter': 340,                // -> 340+
    'Chicken Cordon Bleu': 280,        // -> 280+
    'Thai Tea': 210,                   // -> 210+
    'Americano': 180,                  // -> 180+
    'Truffle French Fries': 160,       // -> 160+
    'Rice Bowl Chicken Teriyaki': 140, // -> 140+
    'Caffe Latte': 120,                // -> 120+
    'Mocha Frappe': 95,                // -> 95+
    'Caramel Macchiato': 80,           // -> 80+
    'Cookies & Cream Frappe': 65,      // -> 65+
    'Lychee Tea': 55,                  // -> 55+
    'Taro Latte': 45,                  // -> 45+
    'Butter Croissant': 35,            // -> 35+
  };

  // Clean old transactions for KOPI JOTOS
  console.log('Cleaning existing transaction items for KOPI JOTOS...');
  await db.delete(transactionItems).where(eq(transactionItems.tenantId, tenantId));
  console.log('Cleaning existing transactions for KOPI JOTOS...');
  await db.delete(transactions).where(eq(transactions.tenantId, tenantId));

  const newTransactions: any[] = [];
  const newTransactionItems: any[] = [];

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const prod of prods) {
    const targetCount = targetSalesByName[prod.name] || 50;
    const priceNum = Number(prod.price) || 25000;

    // We can distribute targetCount across multiple transactions
    // Average 2-5 items per order
    let remaining = targetCount;
    let orderIndex = 1;

    while (remaining > 0) {
      const qty = Math.min(remaining, Math.floor(Math.random() * 4) + 1);
      remaining -= qty;

      const randomDaysAgo = Math.floor(Math.random() * 45); // last 45 days
      const createdAt = new Date(now - randomDaysAgo * dayMs - Math.floor(Math.random() * dayMs));

      const txId = uuidv4();
      const subtotal = priceNum * qty;
      const orderNum = `#KP-${uuidv4().substring(0, 8).toUpperCase()}`;

      newTransactions.push({
        id: txId,
        tenantId,
        source: Math.random() > 0.4 ? 'WEB_ORDER' : 'POS',
        totalAmount: String(subtotal),
        grandTotal: String(subtotal),
        paymentMethod: Math.random() > 0.5 ? 'QRIS' : 'CASH',
        paymentStatus: 'PAID',
        status: 'COMPLETED',
        orderType: 'DINE_IN',
        orderNumber: orderNum,
        createdAt,
      });

      newTransactionItems.push({
        id: uuidv4(),
        tenantId,
        transactionId: txId,
        productId: prod.id,
        quantity: qty,
        price: String(priceNum),
        subtotal: String(subtotal),
        isCompleted: true,
        createdAt,
      });

      orderIndex++;
    }
  }

  console.log(`Inserting ${newTransactions.length} transactions...`);
  // Insert in batches of 400
  for (let i = 0; i < newTransactions.length; i += 400) {
    await db.insert(transactions).values(newTransactions.slice(i, i + 400));
  }

  console.log(`Inserting ${newTransactionItems.length} transaction items...`);
  for (let i = 0; i < newTransactionItems.length; i += 400) {
    await db.insert(transactionItems).values(newTransactionItems.slice(i, i + 400));
  }

  console.log('--- SEEDING COMPLETED SUCCESSFULLY! ---');
  console.log('Top 5 Best Sellers generated:');
  const summary = prods
    .map(p => ({ name: p.name, target: targetSalesByName[p.name] || 50 }))
    .sort((a, b) => b.target - a.target);

  summary.slice(0, 5).forEach((p, idx) => {
    console.log(` ${idx + 1}. ${p.name}: ${p.target} terjual`);
  });

  process.exit(0);
}

seedKopiJotosSales().catch((err) => {
  console.error(err);
  process.exit(1);
});
