import { db } from '../db';
import { transactions, transactionItems, products } from '../db/schema';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';

export async function getDashboardMetrics(startDate: Date, endDate: Date) {
  try {
    const dateFilter = and(
      gte(transactions.createdAt, startDate),
      lte(transactions.createdAt, endDate)
    );

    // 1. Total Transaksi & Omzet
    const txResult = await db.select({
      totalTransactions: sql<number>`count(${transactions.id})::int`,
      totalOmzet: sql<number>`sum(${transactions.grandTotal})::numeric`,
    }).from(transactions)
    .where(dateFilter);

    const totalTransactions = txResult[0]?.totalTransactions || 0;
    const totalOmzet = txResult[0]?.totalOmzet || 0;

    // 2. Laba (Profit)
    const profitResult = await db.select({
      totalRevenue: sql<number>`sum(${transactionItems.subtotal})::numeric`,
      totalCost: sql<number>`sum(${transactionItems.quantity} * ${products.costPrice})::numeric`,
    })
    .from(transactionItems)
    .innerJoin(products, eq(transactionItems.productId, products.id))
    .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
    .where(dateFilter);

    const revenue = profitResult[0]?.totalRevenue || 0;
    const cost = profitResult[0]?.totalCost || 0;
    const totalLaba = Number(revenue) - Number(cost);

    // 3. Total Produk
    const prodResult = await db.select({ count: sql<number>`count(${products.id})::int` }).from(products);
    const totalProduk = prodResult[0]?.count || 0;

    return {
      success: true,
      data: {
        totalTransactions,
        totalOmzet: Number(totalOmzet),
        totalLaba,
        totalProduk
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return { success: false, error: 'Gagal mengambil metrik dashboard' };
  }
}

export async function getTopSellingProducts(startDate: Date, endDate: Date) {
  try {
    const dateFilter = and(
      gte(transactions.createdAt, startDate),
      lte(transactions.createdAt, endDate)
    );

    const result = await db.select({
      name: products.name,
      totalSold: sql<number>`sum(${transactionItems.quantity})::int`
    })
    .from(transactionItems)
    .innerJoin(products, eq(transactionItems.productId, products.id))
    .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
    .where(dateFilter)
    .groupBy(products.id, products.name)
    .orderBy(desc(sql`sum(${transactionItems.quantity})`))
    .limit(5);

    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    return { success: false, error: 'Gagal mengambil data produk terlaris' };
  }
}

export async function getLowStockProducts() {
  try {
    const result = await db.select({
      name: products.name,
      stock: products.stock,
      minStock: products.minStock
    })
    .from(products)
    .where(sql`${products.stock} <= ${products.minStock}`)
    .orderBy(products.stock)
    .limit(5);

    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    return { success: false, error: 'Gagal mengambil data stok menipis' };
  }
}

export async function getSalesChartData(startDate: Date, endDate: Date, groupBy: 'day' | 'month' | 'year' = 'day') {
  try {
    const dateFilter = and(
      gte(transactions.createdAt, startDate),
      lte(transactions.createdAt, endDate)
    );

    let groupBySql;
    if (groupBy === 'day') {
      groupBySql = sql`to_char(${transactions.createdAt}, 'YYYY-MM-DD')`;
    } else if (groupBy === 'month') {
      groupBySql = sql`to_char(${transactions.createdAt}, 'YYYY-MM')`;
    } else {
      groupBySql = sql`to_char(${transactions.createdAt}, 'YYYY')`;
    }

    const result = await db.select({
      date: sql<string>`${groupBySql}`,
      omzet: sql<number>`sum(${transactions.grandTotal})::numeric`
    })
    .from(transactions)
    .where(dateFilter)
    .groupBy(groupBySql)
    .orderBy(groupBySql);

    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching sales chart data:', error);
    return { success: false, error: 'Gagal mengambil data grafik' };
  }
}

export async function getRecentTransactions(limitCount = 5) {
  try {
    const result = await db.select({
      id: transactions.id,
      date: transactions.createdAt,
      totalAmount: transactions.grandTotal,
      paymentMethod: transactions.paymentMethod,
      status: transactions.status
    })
    .from(transactions)
    .orderBy(desc(transactions.createdAt))
    .limit(limitCount);

    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return { success: false, error: 'Gagal mengambil transaksi terbaru' };
  }
}
