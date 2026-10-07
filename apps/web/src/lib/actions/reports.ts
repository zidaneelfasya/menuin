'use server';

import { db } from '@/lib/db';
import { 
  transactions, 
  transactionItems, 
  products, 
  tenants, 
  shifts, 
  cashMovements,
  expenses,
  categories,
  memberships,
  accounts
} from '@/lib/db/schema';
import { eq, and, gte, lte, desc, inArray, sql } from 'drizzle-orm';
import { getCurrentUser } from './auth';

export type ReportPeriod = 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'last_month' | '3months' | '6months' | 'this_year' | 'daily' | 'monthly' | 'yearly' | 'custom';

export type DateFilterParams = {
  period?: ReportPeriod;
  startDate?: string;
  endDate?: string;
};

// Helper: Calculate start and end Date objects for current and previous comparison period
function resolveDateIntervals(params?: DateFilterParams) {
  const now = new Date();
  const period = params?.period || 'this_month';

  let currentStart = new Date();
  let currentEnd = new Date();
  let prevStart = new Date();
  let prevEnd = new Date();

  if (period === 'today' || period === 'daily') {
    const targetDate = params?.startDate ? new Date(params.startDate) : now;
    currentStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    currentEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - 1);
    prevEnd = new Date(currentEnd);
    prevEnd.setDate(prevEnd.getDate() - 1);
  } else if (period === 'yesterday') {
    currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

    prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - 1);
    prevEnd = new Date(currentEnd);
    prevEnd.setDate(prevEnd.getDate() - 1);
  } else if (period === '7days') {
    currentStart = new Date(now);
    currentStart.setDate(now.getDate() - 6);
    currentStart.setHours(0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - 7);
    prevEnd = new Date(currentStart);
    prevEnd.setMilliseconds(-1);
  } else if (period === '30days') {
    currentStart = new Date(now);
    currentStart.setDate(now.getDate() - 29);
    currentStart.setHours(0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - 30);
    prevEnd = new Date(currentStart);
    prevEnd.setMilliseconds(-1);
  } else if (period === 'this_month' || period === 'monthly') {
    const targetDate = params?.startDate ? new Date(params.startDate) : now;
    currentStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1, 0, 0, 0, 0);
    currentEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

    prevStart = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1, 0, 0, 0, 0);
    prevEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0, 23, 59, 59, 999);
  } else if (period === 'last_month') {
    currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
    prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
  } else if (period === '3months') {
    currentStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    prevStart = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
    prevEnd = new Date(now.getFullYear(), now.getMonth() - 2, 0, 23, 59, 59, 999);
  } else if (period === '6months') {
    currentStart = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    prevStart = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);
    prevEnd = new Date(now.getFullYear(), now.getMonth() - 5, 0, 23, 59, 59, 999);
  } else if (period === 'this_year' || period === 'yearly') {
    const targetYear = params?.startDate ? new Date(params.startDate).getFullYear() : now.getFullYear();
    currentStart = new Date(targetYear, 0, 1, 0, 0, 0, 0);
    currentEnd = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    prevStart = new Date(targetYear - 1, 0, 1, 0, 0, 0, 0);
    prevEnd = new Date(targetYear - 1, 11, 31, 23, 59, 59, 999);
  } else if (period === 'custom' && params?.startDate && params?.endDate) {
    currentStart = new Date(params.startDate);
    currentStart.setHours(0, 0, 0, 0);
    currentEnd = new Date(params.endDate);
    currentEnd.setHours(23, 59, 59, 999);

    const diffDays = Math.max(1, Math.round((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)));
    prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - diffDays);
    prevEnd = new Date(currentStart);
    prevEnd.setMilliseconds(-1);
  } else {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  }

  return { currentStart, currentEnd, prevStart, prevEnd, period };
}

// Helper: Check if payment method is cash
function isCashPayment(method: string | null | undefined): boolean {
  if (!method) return false;
  const clean = method.trim().toUpperCase();
  return clean === 'TUNAI' || clean === 'CASH';
}

// Helper: Calculate payment gateway / MDR fee (e.g. 0.7% MDR Bank Indonesia QRIS Dinamis DOKU / Online Storefront)
function calculateGatewayFee(t: { gatewayFee?: string | null; platformFee?: string | null; paymentMethod?: string | null; source?: string | null; grandTotal?: string | null }): number {
  const recordedFee = parseFloat(t.gatewayFee || '0');
  if (recordedFee > 0) return recordedFee;

  const explicitFee = parseFloat(t.platformFee || '0') || 0;
  if (explicitFee > 0) return explicitFee;

  const method = (t.paymentMethod || '').trim().toUpperCase();

  // Zero-fee payment methods (Direct Store Bank & Cash)
  // QRIS_STATIC (merchant's physical acrylic QR), CARD (EDC), TRANSFER (Bank), and CASH have 0 gateway fee.
  if (
    method === 'CASH' || 
    method === 'TUNAI' || 
    method === 'QRIS_STATIC' || 
    method === 'QRIS' || 
    method === 'CARD' || 
    method === 'EDC' || 
    method === 'TRANSFER' || 
    method === 'BANK_TRANSFER'
  ) {
    return 0;
  }

  const isOnline = t.source === 'QR' || t.source === 'WEB_ORDER' || t.source === 'ONLINE';
  const isGatewayMethod = method === 'QRIS_DYNAMIC' || method === 'ONLINE' || method === 'MIDTRANS' || method === 'DOKU';

  // Digital gateway settlement (DOKU 0.7% MDR)
  if (isGatewayMethod || (isOnline && method !== 'CASH' && method !== 'TUNAI')) {
    const gTotal = parseFloat(t.grandTotal || '0') || 0;
    return Math.round(gTotal * 0.007);
  }

  return 0;
}

// -------------------------------------------------------------
// 1. LAPORAN PENJUALAN (SALES REPORT & NOVEL ROUNDED BAR ANALYTICS)
// -------------------------------------------------------------
export async function getSalesReport(outletKey: string, params?: DateFilterParams) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized: Sesi tidak ditemukan.' };
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.outletKey, outletKey))
      .limit(1);

    if (!tenant || tenant.id !== user.tenantId) {
      return { success: false, error: 'Akses ditolak: Cabang tidak sesuai hak akses Anda.' };
    }

    const { currentStart, currentEnd, prevStart, prevEnd, period } = resolveDateIntervals(params);

    // Current period transactions
    const trxList = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenant.id),
          gte(transactions.createdAt, currentStart),
          lte(transactions.createdAt, currentEnd)
        )
      )
      .orderBy(desc(transactions.createdAt));

    // Previous period transactions for comparative metrics (+4, -8%, etc.)
    const prevTrxList = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenant.id),
          gte(transactions.createdAt, prevStart),
          lte(transactions.createdAt, prevEnd)
        )
      );

    // Fetch all active products in tenant catalog to identify best sellers and deadstock/low-velocity items
    const allTenantProducts = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        imageUrl: products.imageUrl,
        costPrice: products.costPrice,
        categoryId: products.categoryId,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.tenantId, tenant.id));

    // 1. Calculate COGS / HPP, Top Products, Categories, and Items Sold for current period
    const trxIds = trxList.map((t) => t.id);
    let totalHpp = 0;
    let totalItemsSold = 0;
    const itemsSoldByTrxId: Record<string, number> = {};
    const productSalesMap: Record<string, { id: string; name: string; categoryName: string; price: number; imageUrl?: string | null; totalQty: number; totalRevenue: number }> = {};
    const categorySalesMap: Record<string, { name: string; totalQty: number; totalRevenue: number }> = {};

    if (trxIds.length > 0) {
      const allItems = await db
        .select({
          transactionId: transactionItems.transactionId,
          productId: transactionItems.productId,
          productName: products.name,
          categoryName: categories.name,
          imageUrl: products.imageUrl,
          price: transactionItems.price,
          subtotal: transactionItems.subtotal,
          quantity: transactionItems.quantity,
          costPrice: products.costPrice,
        })
        .from(transactionItems)
        .leftJoin(products, eq(transactionItems.productId, products.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(inArray(transactionItems.transactionId, trxIds));

      allItems.forEach((it) => {
        const qty = it.quantity || 1;
        const cost = parseFloat(it.costPrice || '0') || 0;
        const price = parseFloat(it.price || '0') || 0;
        const subtotal = parseFloat(it.subtotal || '0') || (price * qty);

        totalHpp += cost * qty;
        totalItemsSold += qty;
        if (it.transactionId) {
          itemsSoldByTrxId[it.transactionId] = (itemsSoldByTrxId[it.transactionId] || 0) + qty;
        }

        const pId = it.productId || 'unknown';
        const pName = it.productName || 'Menu Tanpa Nama';
        const catName = it.categoryName || 'Lainnya';

        if (!productSalesMap[pId]) {
          productSalesMap[pId] = {
            id: pId,
            name: pName,
            categoryName: catName,
            price,
            imageUrl: it.imageUrl,
            totalQty: 0,
            totalRevenue: 0,
          };
        }
        productSalesMap[pId].totalQty += qty;
        productSalesMap[pId].totalRevenue += subtotal;

        if (!categorySalesMap[catName]) {
          categorySalesMap[catName] = { name: catName, totalQty: 0, totalRevenue: 0 };
        }
        categorySalesMap[catName].totalQty += qty;
        categorySalesMap[catName].totalRevenue += subtotal;
      });
    }

    // 2. Calculate COGS / HPP, Items Sold, and Product Sales for previous period (for trend & product growth)
    const prevTrxIds = prevTrxList.map((t) => t.id);
    let prevTotalHpp = 0;
    let prevTotalItemsSold = 0;
    const prevProductSalesMap: Record<string, { totalQty: number; totalRevenue: number }> = {};
    if (prevTrxIds.length > 0) {
      const prevItems = await db
        .select({
          productId: transactionItems.productId,
          quantity: transactionItems.quantity,
          price: transactionItems.price,
          subtotal: transactionItems.subtotal,
          costPrice: products.costPrice,
        })
        .from(transactionItems)
        .leftJoin(products, eq(transactionItems.productId, products.id))
        .where(inArray(transactionItems.transactionId, prevTrxIds));

      prevItems.forEach((it) => {
        const qty = it.quantity || 1;
        const cost = parseFloat(it.costPrice || '0') || 0;
        const price = parseFloat(it.price || '0') || 0;
        const subtotal = parseFloat(it.subtotal || '0') || (price * qty);

        prevTotalHpp += cost * qty;
        prevTotalItemsSold += qty;

        const pId = it.productId || 'unknown';
        if (!prevProductSalesMap[pId]) {
          prevProductSalesMap[pId] = { totalQty: 0, totalRevenue: 0 };
        }
        prevProductSalesMap[pId].totalQty += qty;
        prevProductSalesMap[pId].totalRevenue += subtotal;
      });
    }

    const itemsSoldGrowth = prevTotalItemsSold > 0 ? ((totalItemsSold - prevTotalItemsSold) / prevTotalItemsSold) * 100 : (totalItemsSold > 0 ? 100 : 0);

    // Return up to 20 products so client can dynamically toggle between Omzet (Revenue) and Porsi (Qty) perspectives
    const topProducts = Object.values(productSalesMap)
      .map((p) => {
        const prevSales = prevProductSalesMap[p.id];
        const prevRev = prevSales ? prevSales.totalRevenue : 0;
        const prevQty = prevSales ? prevSales.totalQty : 0;
        const growthRevenue = prevRev > 0
          ? Math.round(((p.totalRevenue - prevRev) / prevRev) * 100)
          : (p.totalRevenue > 0 ? 100 : 0);
        const growthQty = prevQty > 0
          ? Math.round(((p.totalQty - prevQty) / prevQty) * 100)
          : (p.totalQty > 0 ? 100 : 0);

        return {
          ...p,
          growthRevenue,
          growthQty,
          growth: growthRevenue,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue || b.totalQty - a.totalQty)
      .slice(0, 20);

    // Worst Selling / Low Velocity Products (Products with lowest or 0 sales)
    const bottomCandidates = allTenantProducts.map((p) => {
      const sales = productSalesMap[p.id];
      const prevSales = prevProductSalesMap[p.id];
      const curRevenue = sales ? sales.totalRevenue : 0;
      const curQty = sales ? sales.totalQty : 0;
      const prevRev = prevSales ? prevSales.totalRevenue : 0;
      const prevQty = prevSales ? prevSales.totalQty : 0;
      const growthRevenue = prevRev > 0
        ? Math.round(((curRevenue - prevRev) / prevRev) * 100)
        : (curRevenue > 0 ? 100 : (prevRev > 0 ? -100 : 0));
      const growthQty = prevQty > 0
        ? Math.round(((curQty - prevQty) / prevQty) * 100)
        : (curQty > 0 ? 100 : (prevQty > 0 ? -100 : 0));

      return {
        id: p.id,
        name: p.name,
        categoryName: p.categoryName || 'Lainnya',
        price: parseFloat(p.price || '0') || 0,
        imageUrl: p.imageUrl,
        totalQty: curQty,
        totalRevenue: curRevenue,
        growthRevenue,
        growthQty,
        growth: growthRevenue,
      };
    });

    const bottomProducts = bottomCandidates
      .sort((a, b) => a.totalRevenue - b.totalRevenue || a.totalQty - b.totalQty)
      .slice(0, 20);

    // Top Categories Share (Revenue & Qty Dual-Perspective)
    const totalCatRevenue = Object.values(categorySalesMap).reduce((sum, c) => sum + c.totalRevenue, 0) || 1;
    const totalCatQty = Object.values(categorySalesMap).reduce((sum, c) => sum + c.totalQty, 0) || 1;
    const topCategories = Object.values(categorySalesMap)
      .map((c) => ({
        name: c.name,
        totalQty: c.totalQty,
        totalRevenue: c.totalRevenue,
        percentageRevenue: (c.totalRevenue / totalCatRevenue) * 100,
        percentageQty: (c.totalQty / totalCatQty) * 100,
        percentage: (c.totalRevenue / totalCatRevenue) * 100,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Metrics aggregation
    let grossSales = 0;
    let totalDiscount = 0;
    let totalGatewayFee = 0;
    let totalTax = 0;
    let totalService = 0;
    let totalCollected = 0;
    let totalOrders = 0;

    const paymentMethodsMap: Record<string, { count: number; total: number; fee: number; net: number; tenderType: string }> = {};
    const channelMap: Record<string, { count: number; total: number }> = {
      'POS': { count: 0, total: 0 },
      'STOREFRONT': { count: 0, total: 0 },
    };
    const orderTypesMap: Record<string, { type: string; count: number; total: number }> = {
      'DINE_IN': { type: 'Makan di Tempat (Dine-In)', count: 0, total: 0 },
      'TAKEAWAY': { type: 'Bawa Pulang (Takeaway)', count: 0, total: 0 },
      'DELIVERY': { type: 'Delivery / Antar', count: 0, total: 0 },
    };

    const daypartsMap: Record<string, { label: string; timeRange: string; orders: number; revenue: number; order: number }> = {
      breakfast: { label: 'Pagi (Sarapan)', timeRange: '07:00 - 10:59', orders: 0, revenue: 0, order: 1 },
      lunch: { label: 'Makan Siang (Rush)', timeRange: '11:00 - 14:59', orders: 0, revenue: 0, order: 2 },
      afternoon: { label: 'Sore (Coffee & Santai)', timeRange: '15:00 - 17:59', orders: 0, revenue: 0, order: 3 },
      dinner: { label: 'Makan Malam', timeRange: '18:00 - 21:59', orders: 0, revenue: 0, order: 4 },
      latenight: { label: 'Larut Malam', timeRange: '22:00 - 06:59', orders: 0, revenue: 0, order: 5 },
    };

    // Dynamic Chart Buckets (Hourly: 24 points, Daily: 28-31 points, Monthly: 12 points)
    const diffHours = (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffHours / 24);

    type ChartBucket = {
      key: string;
      date: string;
      label: string;
      netSales: number;
      grossSales: number;
      discount: number;
      orders: number;
      itemsSold: number;
      projected: number;
    };
    const chartBucketsMap: Record<string, ChartBucket> = {};
    const chartBucketsList: ChartBucket[] = [];

    let chartGranularity: 'hourly' | 'daily' | 'monthly' = 'daily';

    if (diffDays <= 1) {
      chartGranularity = 'hourly';
      for (let h = 0; h < 24; h++) {
        const hourStr = String(h).padStart(2, '0') + ':00';
        const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
        const bucket: ChartBucket = {
          key: hourStr,
          date: hourStr,
          label,
          netSales: 0,
          grossSales: 0,
          discount: 0,
          orders: 0,
          itemsSold: 0,
          projected: 0,
        };
        chartBucketsMap[hourStr] = bucket;
        chartBucketsList.push(bucket);
      }
    } else if (diffDays <= 35) {
      chartGranularity = 'daily';
      const cursor = new Date(currentStart);
      while (cursor <= currentEnd) {
        const ymd = cursor.toISOString().slice(0, 10);
        const dayNum = cursor.getDate();
        const monthShort = cursor.toLocaleDateString('id-ID', { month: 'short' });
        const bucket: ChartBucket = {
          key: ymd,
          date: ymd,
          label: `${dayNum} ${monthShort}`,
          netSales: 0,
          grossSales: 0,
          discount: 0,
          orders: 0,
          itemsSold: 0,
          projected: 0,
        };
        chartBucketsMap[ymd] = bucket;
        chartBucketsList.push(bucket);
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      chartGranularity = 'monthly';
      const cursor = new Date(currentStart.getFullYear(), currentStart.getMonth(), 1);
      while (cursor <= currentEnd) {
        const ym = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        const monthName = cursor.toLocaleDateString('id-ID', { month: 'short' });
        const bucket: ChartBucket = {
          key: ym,
          date: ym,
          label: monthName,
          netSales: 0,
          grossSales: 0,
          discount: 0,
          orders: 0,
          itemsSold: 0,
          projected: 0,
        };
        chartBucketsMap[ym] = bucket;
        chartBucketsList.push(bucket);
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    trxList.forEach((t) => {
      const isCanceled = t.status === 'CANCELLED' || t.status === 'CANCELED' || t.paymentStatus === 'CANCELED' || t.paymentStatus === 'REFUNDED';
      if (isCanceled) return;

      const gTotal = parseFloat(t.grandTotal || '0') || 0;
      const subTotal = parseFloat(t.totalAmount || '0') || 0;
      const disc = parseFloat(t.discount || '0') || 0;
      const tx = parseFloat(t.tax || '0') || 0;
      const sc = parseFloat(t.serviceCharge || '0') || 0;
      const fee = calculateGatewayFee(t);

      grossSales += subTotal;
      totalDiscount += disc;
      totalGatewayFee += fee;
      totalTax += tx;
      totalService += sc;
      totalCollected += gTotal;
      totalOrders += 1;

      // Channel breakdown (Kasir POS vs Storefront Self QR)
      const isStorefront = t.source === 'QR' || t.source === 'WEB_ORDER' || t.source === 'ONLINE';
      const channelKey = isStorefront ? 'STOREFRONT' : 'POS';
      channelMap[channelKey].count += 1;
      channelMap[channelKey].total += gTotal;

      // Order type breakdown (Dine In vs Takeaway vs Delivery)
      const rawOrderType = (t.orderType || 'DINE_IN').toUpperCase();
      const mappedType = rawOrderType === 'TAKEAWAY' || rawOrderType === 'TAKE_AWAY' ? 'TAKEAWAY' : (rawOrderType === 'DELIVERY' ? 'DELIVERY' : 'DINE_IN');
      if (orderTypesMap[mappedType]) {
        orderTypesMap[mappedType].count += 1;
        orderTypesMap[mappedType].total += gTotal;
      }

      // Payment tender method categorization
      const rawMethod = (t.paymentMethod || 'TUNAI').toUpperCase();
      let normMethod = 'Tunai (Cash)';
      let tenderType = 'CASH';

      if (rawMethod === 'QRIS_STATIC') {
        normMethod = 'QRIS Statis Toko';
        tenderType = 'QRIS';
      } else if (rawMethod === 'QRIS_DYNAMIC') {
        normMethod = 'QRIS Dinamis Kasir';
        tenderType = 'QRIS';
      } else if (rawMethod === 'QRIS') {
        normMethod = 'QRIS';
        tenderType = 'QRIS';
      } else if (rawMethod === 'CARD' || rawMethod === 'EDC' || rawMethod === 'DEBIT' || rawMethod === 'CREDIT') {
        normMethod = 'Kartu EDC / Debit';
        tenderType = 'CARD';
      } else if (rawMethod === 'TRANSFER' || rawMethod === 'BANK_TRANSFER') {
        normMethod = 'Transfer Bank';
        tenderType = 'TRANSFER';
      } else if (rawMethod === 'ONLINE' || rawMethod === 'MIDTRANS' || rawMethod === 'DOKU') {
        normMethod = 'Online Gateway (QRIS/VA)';
        tenderType = 'ONLINE';
      } else if (rawMethod === 'CASH' || rawMethod === 'TUNAI') {
        normMethod = 'Tunai (Cash)';
        tenderType = 'CASH';
      } else {
        normMethod = t.paymentMethod || 'Lainnya';
        tenderType = 'OTHER';
      }

      if (!paymentMethodsMap[normMethod]) {
        paymentMethodsMap[normMethod] = { count: 0, total: 0, fee: 0, net: 0, tenderType };
      }
      paymentMethodsMap[normMethod].count += 1;
      paymentMethodsMap[normMethod].total += gTotal;
      paymentMethodsMap[normMethod].fee += fee;
      paymentMethodsMap[normMethod].net += Math.max(0, gTotal - fee);

      // Dynamic chart bucket aggregation
      if (t.createdAt) {
        const txDate = new Date(t.createdAt);
        let bucketKey = '';
        if (chartGranularity === 'hourly') {
          bucketKey = String(txDate.getHours()).padStart(2, '0') + ':00';
        } else if (chartGranularity === 'daily') {
          bucketKey = txDate.toISOString().slice(0, 10);
        } else {
          bucketKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        }

        if (chartBucketsMap[bucketKey]) {
          chartBucketsMap[bucketKey].netSales += Math.max(0, subTotal - disc - fee);
          chartBucketsMap[bucketKey].grossSales += subTotal;
          chartBucketsMap[bucketKey].discount += disc;
          chartBucketsMap[bucketKey].orders += 1;
          chartBucketsMap[bucketKey].itemsSold += itemsSoldByTrxId[t.id] || 0;
        }

        // Dayparts aggregation (Breakfast, Lunch, Afternoon, Dinner, Late Night)
        const hour = txDate.getHours();
        let dpKey = 'latenight';
        if (hour >= 7 && hour < 11) dpKey = 'breakfast';
        else if (hour >= 11 && hour < 15) dpKey = 'lunch';
        else if (hour >= 15 && hour < 18) dpKey = 'afternoon';
        else if (hour >= 18 && hour < 22) dpKey = 'dinner';
        if (daypartsMap[dpKey]) {
          daypartsMap[dpKey].orders += 1;
          daypartsMap[dpKey].revenue += gTotal;
        }
      }
    });

    const totalDeductions = totalDiscount + totalGatewayFee;
    const netSales = Math.max(0, grossSales - totalDeductions);
    const aov = totalOrders > 0 ? netSales / totalOrders : 0;
    const grossProfit = Math.max(0, netSales - totalHpp);
    const grossProfitMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    // Previous period aggregates for comparison
    let prevGrossSales = 0;
    let prevDiscount = 0;
    let prevGatewayFee = 0;
    let prevOrders = 0;

    prevTrxList.forEach((t) => {
      const isCanceled = t.status === 'CANCELLED' || t.status === 'CANCELED' || t.paymentStatus === 'CANCELED' || t.paymentStatus === 'REFUNDED';
      if (isCanceled) return;
      prevGrossSales += parseFloat(t.totalAmount || '0') || 0;
      prevDiscount += parseFloat(t.discount || '0') || 0;
      prevGatewayFee += calculateGatewayFee(t);
      prevOrders += 1;
    });

    const prevDeductions = prevDiscount + prevGatewayFee;
    const prevNetSales = Math.max(0, prevGrossSales - prevDeductions);
    const prevAov = prevOrders > 0 ? prevNetSales / prevOrders : 0;
    const prevGrossProfit = Math.max(0, prevNetSales - prevTotalHpp);

    const grossSalesGrowth = prevGrossSales > 0 ? ((grossSales - prevGrossSales) / prevGrossSales) * 100 : (grossSales > 0 ? 100 : 0);
    const netSalesGrowth = prevNetSales > 0 ? ((netSales - prevNetSales) / prevNetSales) * 100 : (netSales > 0 ? 100 : 0);
    const grossProfitGrowth = prevGrossProfit > 0 ? ((grossProfit - prevGrossProfit) / prevGrossProfit) * 100 : (grossProfit > 0 ? 100 : 0);
    const ordersGrowth = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : (totalOrders > 0 ? 100 : 0);
    const aovGrowth = prevAov > 0 ? ((aov - prevAov) / prevAov) * 100 : 0;

    // Average daily benchmark for projection/target line in rounded block chart
    const targetDailyBaseline = netSales > 0 ? Math.round((netSales / Math.max(1, chartBucketsList.length)) * 1.1) : 0;
    chartBucketsList.forEach((d) => {
      d.projected = targetDailyBaseline;
    });

    // Channel specific stats & percentages
    const posOrders = channelMap['POS'].count;
    const posRevenue = channelMap['POS'].total;
    const posAov = posOrders > 0 ? Math.round(posRevenue / posOrders) : 0;
    const posRevenuePercent = totalCollected > 0 ? (posRevenue / totalCollected) * 100 : 0;
    const posOrdersPercent = totalOrders > 0 ? (posOrders / totalOrders) * 100 : 0;

    const sfOrders = channelMap['STOREFRONT'].count;
    const sfRevenue = channelMap['STOREFRONT'].total;
    const sfAov = sfOrders > 0 ? Math.round(sfRevenue / sfOrders) : 0;
    const sfRevenuePercent = totalCollected > 0 ? (sfRevenue / totalCollected) * 100 : 0;
    const sfOrdersPercent = totalOrders > 0 ? (sfOrders / totalOrders) * 100 : 0;

    const selfOrderAdoptionRate = totalOrders > 0 ? (sfOrders / totalOrders) * 100 : 0;
    const aovUpliftRate = posAov > 0 ? ((sfAov - posAov) / posAov) * 100 : 0;
    const basketSize = totalOrders > 0 ? Number((totalItemsSold / totalOrders).toFixed(1)) : 0;

    // Payment method cashless vs cash analytics
    let cashlessRevenue = 0;
    let cashlessOrders = 0;
    let cashRevenue = 0;
    let cashOrders = 0;

    Object.entries(paymentMethodsMap).forEach(([method, val]) => {
      const isCash = val.tenderType === 'CASH' || method.toLowerCase().includes('tunai') || method.toLowerCase().includes('cash');
      if (isCash) {
        cashRevenue += val.total;
        cashOrders += val.count;
      } else {
        cashlessRevenue += val.total;
        cashlessOrders += val.count;
      }
    });

    const paymentAnalytics = {
      cashlessRevenue,
      cashlessOrders,
      cashlessRevenuePercent: totalCollected > 0 ? (cashlessRevenue / totalCollected) * 100 : 0,
      cashlessOrdersPercent: totalOrders > 0 ? (cashlessOrders / totalOrders) * 100 : 0,
      cashRevenue,
      cashOrders,
      cashRevenuePercent: totalCollected > 0 ? (cashRevenue / totalCollected) * 100 : 0,
      cashOrdersPercent: totalOrders > 0 ? (cashOrders / totalOrders) * 100 : 0,
      totalGatewayFee,
      netSettlement: Math.max(0, totalCollected - totalGatewayFee),
    };

    // Dayparting list with peak indicators
    const daypartsList = Object.entries(daypartsMap).map(([key, dp]) => ({
      key,
      label: dp.label,
      timeRange: dp.timeRange,
      orders: dp.orders,
      revenue: dp.revenue,
      percentageRevenue: totalCollected > 0 ? (dp.revenue / totalCollected) * 100 : 0,
      percentageOrders: totalOrders > 0 ? (dp.orders / totalOrders) * 100 : 0,
      isPeakRevenue: false,
      isPeakOrders: false,
    }));

    let maxRev = -1;
    let maxOrd = -1;
    let peakRevIdx = -1;
    let peakOrdIdx = -1;
    daypartsList.forEach((dp, idx) => {
      if (dp.revenue > maxRev) {
        maxRev = dp.revenue;
        peakRevIdx = idx;
      }
      if (dp.orders > maxOrd) {
        maxOrd = dp.orders;
        peakOrdIdx = idx;
      }
    });
    if (peakRevIdx >= 0) daypartsList[peakRevIdx].isPeakRevenue = true;
    if (peakOrdIdx >= 0) daypartsList[peakOrdIdx].isPeakOrders = true;

    // Void and Cancel Rate for Loss Prevention
    let voidCount = 0;
    let voidAmount = 0;
    trxList.forEach((t) => {
      const isCanceled = t.status === 'CANCELLED' || t.status === 'CANCELED' || t.paymentStatus === 'CANCELED' || t.paymentStatus === 'REFUNDED';
      if (isCanceled) {
        voidCount += 1;
        voidAmount += parseFloat(t.grandTotal || '0') || 0;
      }
    });
    const totalAttempts = totalOrders + voidCount;
    const voidRate = totalAttempts > 0 ? (voidCount / totalAttempts) * 100 : 0;
    const discountRate = grossSales > 0 ? (totalDiscount / grossSales) * 100 : 0;

    return {
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          outletKey: tenant.outletKey,
          slug: tenant.slug,
          storeLogoUrl: tenant.storeLogoUrl,
        },
        period: {
          type: period,
          startDate: currentStart.toISOString(),
          endDate: currentEnd.toISOString(),
          formattedStart: currentStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          formattedEnd: currentEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        },
        kpis: {
          grossSales,
          grossSalesGrowth,
          prevGrossSales,
          totalDiscount,
          totalGatewayFee,
          totalDeductions,
          netSales,
          netSalesGrowth,
          prevNetSales,
          totalHpp,
          grossProfit,
          grossProfitMargin,
          grossProfitGrowth,
          prevGrossProfit,
          totalTax,
          totalService,
          totalCollected,
          totalOrders,
          ordersGrowth,
          prevOrders,
          aov,
          aovGrowth,
          prevAov,
          totalItemsSold,
          itemsSoldGrowth,
          prevTotalItemsSold,
        },
        channelMetrics: {
          posOrders,
          posRevenue,
          posAov,
          posRevenuePercent,
          posOrdersPercent,
          storefrontOrders: sfOrders,
          storefrontRevenue: sfRevenue,
          storefrontAov: sfAov,
          sfRevenuePercent,
          sfOrdersPercent,
          selfOrderAdoptionRate,
          aovUpliftRate,
          basketSize,
        },
        chartGranularity,
        chartData: chartBucketsList,
        topProducts,
        bottomProducts,
        topCategories,
        paymentAnalytics,
        dayparting: daypartsList,
        lossPrevention: {
          voidCount,
          voidAmount,
          voidRate,
          discountRate,
        },
        paymentMethods: Object.entries(paymentMethodsMap).map(([method, val]) => ({
          method,
          tenderType: val.tenderType,
          count: val.count,
          total: val.total,
          gatewayFee: val.fee,
          netAmount: val.net,
          percentageRevenue: totalCollected > 0 ? (val.total / totalCollected) * 100 : 0,
          percentageOrders: totalOrders > 0 ? (val.count / totalOrders) * 100 : 0,
          percentage: totalCollected > 0 ? (val.total / totalCollected) * 100 : 0,
        })).sort((a, b) => b.total - a.total),
        channels: [
          { channel: 'Kasir POS', count: channelMap['POS'].count, total: channelMap['POS'].total, aov: posAov, percentageRevenue: posRevenuePercent, percentageOrders: posOrdersPercent, percentage: posRevenuePercent },
          { channel: 'Self QR Meja', count: channelMap['STOREFRONT'].count, total: channelMap['STOREFRONT'].total, aov: sfAov, percentageRevenue: sfRevenuePercent, percentageOrders: sfOrdersPercent, percentage: sfRevenuePercent },
        ],
        orderTypes: Object.values(orderTypesMap).map((ot) => ({
          type: ot.type,
          count: ot.count,
          total: ot.total,
          percentageRevenue: totalCollected > 0 ? (ot.total / totalCollected) * 100 : 0,
          percentageOrders: totalOrders > 0 ? (ot.count / totalOrders) * 100 : 0,
          percentage: totalCollected > 0 ? (ot.total / totalCollected) * 100 : 0,
        })),
        recentTransactions: trxList,
      },
    };
  } catch (error: any) {
    console.error('Error fetching sales report:', error);
    return { success: false, error: error.message || 'Gagal memuat laporan penjualan' };
  }
}

// -------------------------------------------------------------
// 2. LAPORAN OPERASIONAL & PEAK HOURS HEATMAP (GRANETPRO REFERENCE)
// -------------------------------------------------------------
export async function getOperationsReport(outletKey: string, params?: DateFilterParams) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized: Sesi tidak ditemukan.' };
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.outletKey, outletKey))
      .limit(1);

    if (!tenant || tenant.id !== user.tenantId) {
      return { success: false, error: 'Akses ditolak.' };
    }

    const { currentStart, currentEnd, prevStart, prevEnd, period } = resolveDateIntervals(params);

    const [trxList, prevTrxList] = await Promise.all([
      db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.tenantId, tenant.id),
            gte(transactions.createdAt, currentStart),
            lte(transactions.createdAt, currentEnd)
          )
        ),
      db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.tenantId, tenant.id),
            gte(transactions.createdAt, prevStart),
            lte(transactions.createdAt, prevEnd)
          )
        ),
    ]);

    // Days mapping (Mon=0 to Sun=6, or JS Sun=0 to Sat=6)
    // Reference 1 uses: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const dayFullNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    // 7 days x 24 hours grid
    // Row 0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu, 4 = Fri, 5 = Sat, 6 = Sun
    const heatmapGrid: {
      dayIndex: number;
      dayLabel: string;
      dayFullName: string;
      hours: {
        hour: number;
        hourLabel: string;
        orderCount: number;
        revenue: number;
      }[];
    }[] = [];

    for (let d = 0; d < 7; d++) {
      const hours = [];
      for (let h = 0; h < 24; h++) {
        const hourLabel = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
        hours.push({
          hour: h,
          hourLabel,
          orderCount: 0,
          revenue: 0,
        });
      }
      heatmapGrid.push({
        dayIndex: d,
        dayLabel: dayLabels[d],
        dayFullName: dayFullNames[d],
        hours,
      });
    }

    // Hourly totals (0-23)
    const hourlyTotals: { hour: number; label: string; orderCount: number; revenue: number }[] = [];
    for (let h = 0; h < 24; h++) {
      const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
      hourlyTotals.push({ hour: h, label, orderCount: 0, revenue: 0 });
    }

    // Day of week totals (0=Mon to 6=Sun)
    const dayTotals: { dayIndex: number; dayLabel: string; dayFullName: string; orderCount: number; revenue: number }[] = [];
    for (let d = 0; d < 7; d++) {
      dayTotals.push({
        dayIndex: d,
        dayLabel: dayLabels[d],
        dayFullName: dayFullNames[d],
        orderCount: 0,
        revenue: 0,
      });
    }

    let totalOrders = 0;
    let totalRevenue = 0;

    trxList.forEach((t) => {
      const isCanceled = t.status === 'CANCELLED' || t.status === 'CANCELED' || t.paymentStatus === 'CANCELED' || t.paymentStatus === 'REFUNDED';
      if (isCanceled || !t.createdAt) return;

      const date = new Date(t.createdAt);
      // JS getDay(): 0 is Sunday, 1 is Monday... 6 is Saturday
      // Convert to Mon=0 ... Sun=6
      const jsDay = date.getDay();
      const monIndex = jsDay === 0 ? 6 : jsDay - 1;
      const hour = date.getHours();
      const rev = parseFloat(t.grandTotal || '0') || 0;

      totalOrders += 1;
      totalRevenue += rev;

      // Update grid
      heatmapGrid[monIndex].hours[hour].orderCount += 1;
      heatmapGrid[monIndex].hours[hour].revenue += rev;

      // Update hourly
      hourlyTotals[hour].orderCount += 1;
      hourlyTotals[hour].revenue += rev;

      // Update day
      dayTotals[monIndex].orderCount += 1;
      dayTotals[monIndex].revenue += rev;
    });

    // Previous period aggregates for growth comparison
    const prevHourlyTotals: { hour: number; orderCount: number; revenue: number }[] = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      orderCount: 0,
      revenue: 0,
    }));
    const prevDayTotals: { dayIndex: number; orderCount: number; revenue: number }[] = Array.from({ length: 7 }, (_, d) => ({
      dayIndex: d,
      orderCount: 0,
      revenue: 0,
    }));

    let prevTotalOrders = 0;
    let prevTotalRevenue = 0;

    prevTrxList.forEach((t) => {
      const isCanceled = t.status === 'CANCELLED' || t.status === 'CANCELED' || t.paymentStatus === 'CANCELED' || t.paymentStatus === 'REFUNDED';
      if (isCanceled || !t.createdAt) return;

      const date = new Date(t.createdAt);
      const jsDay = date.getDay();
      const monIndex = jsDay === 0 ? 6 : jsDay - 1;
      const hour = date.getHours();
      const rev = parseFloat(t.grandTotal || '0') || 0;

      prevTotalOrders += 1;
      prevTotalRevenue += rev;
      prevHourlyTotals[hour].orderCount += 1;
      prevHourlyTotals[hour].revenue += rev;
      prevDayTotals[monIndex].orderCount += 1;
      prevDayTotals[monIndex].revenue += rev;
    });

    // Find Peak Hours KPI cards
    // 1. Busiest Hour
    let busiestHour = hourlyTotals[0];
    let slowestHour = hourlyTotals[0];
    hourlyTotals.forEach((h) => {
      if (h.orderCount > busiestHour.orderCount) busiestHour = h;
      if (h.orderCount < slowestHour.orderCount) slowestHour = h;
    });

    let prevBusiestHour = prevHourlyTotals[0];
    prevHourlyTotals.forEach((h) => {
      if (h.orderCount > prevBusiestHour.orderCount) prevBusiestHour = h;
    });

    // 2. Busiest Day
    let busiestDay = dayTotals[0];
    let slowestDay = dayTotals[0];
    dayTotals.forEach((d) => {
      if (d.revenue > busiestDay.revenue) busiestDay = d;
      if (d.revenue < slowestDay.revenue) slowestDay = d;
    });

    let prevBusiestDay = prevDayTotals[0];
    prevDayTotals.forEach((d) => {
      if (d.revenue > prevBusiestDay.revenue) prevBusiestDay = d;
    });

    // Calculate growth percentages
    const totalOrdersGrowth = prevTotalOrders > 0
      ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100
      : 0;

    const totalRevenueGrowth = prevTotalRevenue > 0
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
      : 0;

    const busiestHourOrdersGrowth = prevBusiestHour.orderCount > 0
      ? ((busiestHour.orderCount - prevBusiestHour.orderCount) / prevBusiestHour.orderCount) * 100
      : 0;

    const busiestDayRevenueGrowth = prevBusiestDay.revenue > 0
      ? ((busiestDay.revenue - prevBusiestDay.revenue) / prevBusiestDay.revenue) * 100
      : 0;

    const avgHourlyOrders = totalOrders > 0 ? totalOrders / 24 : 0;
    const prevAvgHourlyOrders = prevTotalOrders > 0 ? prevTotalOrders / 24 : 0;
    const avgHourlyOrdersGrowth = prevAvgHourlyOrders > 0
      ? ((avgHourlyOrders - prevAvgHourlyOrders) / prevAvgHourlyOrders) * 100
      : 0;

    // Dayparts calculation (Pagi 06-11, Siang 11-15, Sore 15-18, Malam 18-23, Dini Hari 23-06)
    const daypartBuckets = {
      pagi: { key: 'pagi' as const, label: 'Pagi', timeRange: '06:00 - 11:00', orderCount: 0, revenue: 0 },
      siang: { key: 'siang' as const, label: 'Makan Siang', timeRange: '11:00 - 15:00', orderCount: 0, revenue: 0 },
      sore: { key: 'sore' as const, label: 'Sore Hari', timeRange: '15:00 - 18:00', orderCount: 0, revenue: 0 },
      malam: { key: 'malam' as const, label: 'Makan Malam', timeRange: '18:00 - 23:00', orderCount: 0, revenue: 0 },
      larut: { key: 'larut' as const, label: 'Larut / Dini Hari', timeRange: '23:00 - 06:00', orderCount: 0, revenue: 0 },
    };

    hourlyTotals.forEach((h) => {
      if (h.hour >= 6 && h.hour < 11) {
        daypartBuckets.pagi.orderCount += h.orderCount;
        daypartBuckets.pagi.revenue += h.revenue;
      } else if (h.hour >= 11 && h.hour < 15) {
        daypartBuckets.siang.orderCount += h.orderCount;
        daypartBuckets.siang.revenue += h.revenue;
      } else if (h.hour >= 15 && h.hour < 18) {
        daypartBuckets.sore.orderCount += h.orderCount;
        daypartBuckets.sore.revenue += h.revenue;
      } else if (h.hour >= 18 && h.hour < 23) {
        daypartBuckets.malam.orderCount += h.orderCount;
        daypartBuckets.malam.revenue += h.revenue;
      } else {
        daypartBuckets.larut.orderCount += h.orderCount;
        daypartBuckets.larut.revenue += h.revenue;
      }
    });

    const dayparts = Object.values(daypartBuckets).map((dp) => ({
      ...dp,
      percentage: totalOrders > 0 ? (dp.orderCount / totalOrders) * 100 : 0,
    }));

    // Weekday vs Weekend (Sen-Jum vs Sab-Min)
    let weekdayOrders = 0;
    let weekdayRevenue = 0;
    let weekendOrders = 0;
    let weekendRevenue = 0;

    dayTotals.forEach((d) => {
      if (d.dayIndex <= 4) {
        weekdayOrders += d.orderCount;
        weekdayRevenue += d.revenue;
      } else {
        weekendOrders += d.orderCount;
        weekendRevenue += d.revenue;
      }
    });

    const weekdayOrdersPercent = totalOrders > 0 ? (weekdayOrders / totalOrders) * 100 : 0;
    const weekendOrdersPercent = totalOrders > 0 ? (weekendOrders / totalOrders) * 100 : 0;

    // Product performance query
    const trxIds = trxList.map((t) => t.id);
    let topProducts: { id: string; name: string; categoryName: string; totalQty: number; totalRevenue: number }[] = [];

    if (trxIds.length > 0) {
      const itemRows = await db
        .select({
          productId: transactionItems.productId,
          productName: products.name,
          categoryName: categories.name,
          quantity: transactionItems.quantity,
          subtotal: transactionItems.subtotal,
        })
        .from(transactionItems)
        .leftJoin(products, eq(transactionItems.productId, products.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(inArray(transactionItems.transactionId, trxIds));

      const prodMap: Record<string, { id: string; name: string; categoryName: string; totalQty: number; totalRevenue: number }> = {};
      itemRows.forEach((row) => {
        const pId = row.productId || 'unknown';
        if (!prodMap[pId]) {
          prodMap[pId] = {
            id: pId,
            name: row.productName || 'Menu Tanpa Nama',
            categoryName: row.categoryName || 'Lainnya',
            totalQty: 0,
            totalRevenue: 0,
          };
        }
        prodMap[pId].totalQty += row.quantity || 1;
        prodMap[pId].totalRevenue += parseFloat(row.subtotal || '0') || 0;
      });

      topProducts = Object.values(prodMap)
        .sort((a, b) => b.totalQty - a.totalQty)
        .slice(0, 10);
    }

    return {
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          outletKey: tenant.outletKey,
        },
        period: {
          type: period,
          startDate: currentStart.toISOString(),
          endDate: currentEnd.toISOString(),
          formattedStart: currentStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          formattedEnd: currentEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        },
        summary: {
          totalOrders,
          totalOrdersGrowth,
          totalRevenue,
          totalRevenueGrowth,
          avgHourlyOrders,
          avgHourlyOrdersGrowth,
          busiestHourOrdersGrowth,
          busiestDayRevenueGrowth,
          weekdayOrders,
          weekdayRevenue,
          weekendOrders,
          weekendRevenue,
          weekdayOrdersPercent,
          weekendOrdersPercent,
        },
        peakKpis: {
          busiestHour: {
            hour: busiestHour.hour,
            label: busiestHour.label,
            orderCount: busiestHour.orderCount,
            revenue: busiestHour.revenue,
            growth: busiestHourOrdersGrowth,
          },
          slowestHour: {
            hour: slowestHour.hour,
            label: slowestHour.label,
            orderCount: slowestHour.orderCount,
            revenue: slowestHour.revenue,
          },
          busiestDay: {
            dayIndex: busiestDay.dayIndex,
            dayName: busiestDay.dayFullName,
            orderCount: busiestDay.orderCount,
            revenue: busiestDay.revenue,
            growth: busiestDayRevenueGrowth,
          },
          slowestDay: {
            dayIndex: slowestDay.dayIndex,
            dayName: slowestDay.dayFullName,
            orderCount: slowestDay.orderCount,
            revenue: slowestDay.revenue,
          },
        },
        dayparts,
        heatmapGrid,
        hourlyDistribution: hourlyTotals,
        dayDistribution: dayTotals,
        topProducts,
      },
    };
  } catch (error: any) {
    console.error('Error fetching operations report:', error);
    return { success: false, error: error.message || 'Gagal memuat laporan operasional' };
  }
}

// -------------------------------------------------------------
// 3. LAPORAN KEUANGAN & ARUS KAS (FINANCE, EXPENSES & RECONCILIATION)
// -------------------------------------------------------------
export async function getFinanceReport(outletKey: string, params?: DateFilterParams) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized: Sesi tidak ditemukan.' };
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.outletKey, outletKey))
      .limit(1);

    if (!tenant || tenant.id !== user.tenantId) {
      return { success: false, error: 'Akses ditolak.' };
    }

    const { currentStart, currentEnd, prevStart, prevEnd, period } = resolveDateIntervals(params);

    // Fetch transactions & previous period transactions
    const [trxList, prevTrxList, expenseList, prevExpenseList] = await Promise.all([
      db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.tenantId, tenant.id),
            gte(transactions.createdAt, currentStart),
            lte(transactions.createdAt, currentEnd)
          )
        )
        .orderBy(desc(transactions.createdAt)),
      db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.tenantId, tenant.id),
            gte(transactions.createdAt, prevStart),
            lte(transactions.createdAt, prevEnd)
          )
        ),
      db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.tenantId, tenant.id),
            gte(expenses.date, currentStart),
            lte(expenses.date, currentEnd)
          )
        )
        .orderBy(desc(expenses.date)),
      db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.tenantId, tenant.id),
            gte(expenses.date, prevStart),
            lte(expenses.date, prevEnd)
          )
        ),
    ]);

    // Time-series Chart Buckets for Hero Cash Flow Chart & MiniSparklines
    const diffDays = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
    interface FinanceChartBucket {
      key: string;
      date: string;
      label: string;
      cashIn: number;
      cashOut: number;
      netFlow: number;
    }
    const chartBucketsMap: Record<string, FinanceChartBucket> = {};
    const chartBucketsList: FinanceChartBucket[] = [];

    let chartGranularity: 'hourly' | 'daily' | 'monthly' = 'daily';

    if (diffDays <= 1) {
      chartGranularity = 'hourly';
      for (let h = 0; h < 24; h++) {
        const hourStr = String(h).padStart(2, '0') + ':00';
        const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
        const bucket: FinanceChartBucket = {
          key: hourStr,
          date: hourStr,
          label,
          cashIn: 0,
          cashOut: 0,
          netFlow: 0,
        };
        chartBucketsMap[hourStr] = bucket;
        chartBucketsList.push(bucket);
      }
    } else if (diffDays <= 35) {
      chartGranularity = 'daily';
      const cursor = new Date(currentStart);
      while (cursor <= currentEnd) {
        const ymd = cursor.toISOString().slice(0, 10);
        const dayNum = cursor.getDate();
        const monthShort = cursor.toLocaleDateString('id-ID', { month: 'short' });
        const bucket: FinanceChartBucket = {
          key: ymd,
          date: ymd,
          label: `${dayNum} ${monthShort}`,
          cashIn: 0,
          cashOut: 0,
          netFlow: 0,
        };
        chartBucketsMap[ymd] = bucket;
        chartBucketsList.push(bucket);
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      chartGranularity = 'monthly';
      const cursor = new Date(currentStart.getFullYear(), currentStart.getMonth(), 1);
      while (cursor <= currentEnd) {
        const ym = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        const monthName = cursor.toLocaleDateString('id-ID', { month: 'short' });
        const bucket: FinanceChartBucket = {
          key: ym,
          date: ym,
          label: monthName,
          cashIn: 0,
          cashOut: 0,
          netFlow: 0,
        };
        chartBucketsMap[ym] = bucket;
        chartBucketsList.push(bucket);
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    const getBucketKey = (d: Date): string => {
      if (chartGranularity === 'hourly') {
        return String(d.getHours()).padStart(2, '0') + ':00';
      } else if (chartGranularity === 'daily') {
        return d.toISOString().slice(0, 10);
      } else {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
    };

    // Fetch product items to calculate theoretical COGS
    const trxIds = trxList.map((t) => t.id);
    let totalHpp = 0;

    if (trxIds.length > 0) {
      const allItems = await db
        .select({
          quantity: transactionItems.quantity,
          costPrice: products.costPrice,
        })
        .from(transactionItems)
        .leftJoin(products, eq(transactionItems.productId, products.id))
        .where(inArray(transactionItems.transactionId, trxIds));

      allItems.forEach((it) => {
        const qty = it.quantity || 1;
        const cost = parseFloat(it.costPrice || '0') || 0;
        totalHpp += cost * qty;
      });
    }

    // Cash in & Sales calculation with accurate cash vs non-cash classification and MDR gateway fees
    let cashGrossSales = 0;
    let cashDiscount = 0;
    let cashCollected = 0; // Actual physical cash received in drawer
    let nonCashGrossSales = 0;
    let nonCashGrandTotal = 0;
    let nonCashDiscount = 0;
    let nonCashGatewayFee = 0;
    let nonCashSettled = 0; // Actual digital money settled into bank account
    let totalGrossSales = 0;
    let totalDiscount = 0;
    let totalGatewayFee = 0;
    const paymentBreakdown: Record<string, number> = {};

    trxList.forEach((t) => {
      const isCanceled =
        t.status === 'CANCELLED' ||
        t.status === 'CANCELED' ||
        t.paymentStatus === 'CANCELED' ||
        t.paymentStatus === 'REFUNDED';
      if (isCanceled) return;

      const gTotal = parseFloat(t.grandTotal || '0') || 0;
      const subTotal = parseFloat(t.totalAmount || '0') || 0;
      const disc = parseFloat(t.discount || '0') || 0;
      const fee = calculateGatewayFee(t);
      const netAmt = t.netAmount ? parseFloat(t.netAmount) : Math.max(0, gTotal - fee);

      totalGrossSales += subTotal;
      totalDiscount += disc;
      totalGatewayFee += fee;

      const rawMethod = (t.paymentMethod || 'TUNAI').trim().toUpperCase();
      let flowIn = 0;
      if (isCashPayment(rawMethod)) {
        cashGrossSales += subTotal;
        cashDiscount += disc;
        cashCollected += gTotal; // Customer handed physical money including PB1
        flowIn = gTotal;
        paymentBreakdown['TUNAI'] = (paymentBreakdown['TUNAI'] || 0) + gTotal;
      } else {
        nonCashGrossSales += subTotal;
        nonCashGrandTotal += gTotal;
        nonCashDiscount += disc;
        nonCashGatewayFee += fee;
        nonCashSettled += netAmt; // Settled into bank account after MDR fee
        flowIn = netAmt;
        paymentBreakdown[rawMethod] = (paymentBreakdown[rawMethod] || 0) + netAmt;
      }

      // Add to time-series bucket
      const bKey = getBucketKey(new Date(t.createdAt));
      if (chartBucketsMap[bKey]) {
        chartBucketsMap[bKey].cashIn += flowIn;
      }
    });

    // Net Sales for P&L and Profitability (Pure Menu Revenue minus deductions)
    const cashSalesNet = Math.max(0, cashGrossSales - cashDiscount);
    const nonCashSalesNet = Math.max(0, nonCashGrossSales - nonCashDiscount - nonCashGatewayFee);
    const netSales = cashSalesNet + nonCashSalesNet;
    const estimatedGrossProfit = Math.max(0, netSales - totalHpp);
    const profitMargin = netSales > 0 ? (estimatedGrossProfit / netSales) * 100 : 0;

    // Process Expenses
    let totalExpenses = 0;
    let cashExpenses = 0;
    let nonCashExpenses = 0;
    const expenseByCategory: Record<string, number> = {};

    expenseList.forEach((exp) => {
      const amt = parseFloat(exp.amount || '0') || 0;
      totalExpenses += amt;
      if (isCashPayment(exp.paymentMethod)) {
        cashExpenses += amt;
      } else {
        nonCashExpenses += amt;
      }
      const cat = exp.category || 'LAINNYA';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amt;

      const bKey = getBucketKey(new Date(exp.date));
      if (chartBucketsMap[bKey]) {
        chartBucketsMap[bKey].cashOut += amt;
      }
    });

    // Fetch Cash Movements from shifts
    const movements = await db
      .select()
      .from(cashMovements)
      .where(
        and(
          eq(cashMovements.tenantId, tenant.id),
          gte(cashMovements.createdAt, currentStart),
          lte(cashMovements.createdAt, currentEnd)
        )
      );

    let manualCashIn = 0;
    let manualCashOut = 0;
    movements.forEach((m) => {
      const amt = parseFloat(m.amount || '0') || 0;
      const isAutoExpense = m.description && m.description.startsWith('[Biaya');
      if (m.type === 'IN') {
        manualCashIn += amt;
        const bKey = getBucketKey(new Date(m.createdAt));
        if (chartBucketsMap[bKey]) {
          chartBucketsMap[bKey].cashIn += amt;
        }
      }
      if (m.type === 'OUT' && !isAutoExpense) {
        manualCashOut += amt;
        const bKey = getBucketKey(new Date(m.createdAt));
        if (chartBucketsMap[bKey]) {
          chartBucketsMap[bKey].cashOut += amt;
        }
      }
    });

    // Compute net flow for all buckets
    chartBucketsList.forEach((b) => {
      b.netFlow = b.cashIn - b.cashOut;
    });

    // Trends for MiniSparklines
    const cashInTrend = chartBucketsList.map((b) => b.cashIn);
    const cashOutTrend = chartBucketsList.map((b) => b.cashOut);
    const netFlowTrend = chartBucketsList.map((b) => b.netFlow);
    const grossProfitTrend = chartBucketsList.map((b) => Math.max(0, b.cashIn - b.cashOut * 0.4));

    // Previous period calculations for comparative growth %
    let prevCashIn = 0;
    prevTrxList.forEach((t) => {
      const isCanceled =
        t.status === 'CANCELLED' ||
        t.status === 'CANCELED' ||
        t.paymentStatus === 'CANCELED' ||
        t.paymentStatus === 'REFUNDED';
      if (isCanceled) return;
      const gTotal = parseFloat(t.grandTotal || '0') || 0;
      const fee = calculateGatewayFee(t);
      const netAmt = t.netAmount ? parseFloat(t.netAmount) : Math.max(0, gTotal - fee);
      const rawMethod = (t.paymentMethod || 'TUNAI').trim().toUpperCase();
      prevCashIn += isCashPayment(rawMethod) ? gTotal : netAmt;
    });

    let prevCashOut = 0;
    prevExpenseList.forEach((exp) => {
      prevCashOut += parseFloat(exp.amount || '0') || 0;
    });

    const prevNetCashFlow = prevCashIn - prevCashOut;

    // Comprehensive Cash Flow Accounting:
    const totalCashIn = cashCollected + nonCashSettled + manualCashIn;
    const totalCashOut = totalExpenses + manualCashOut;
    const netCashFlow = totalCashIn - totalCashOut;

    const cashInGrowth = prevCashIn > 0 ? ((totalCashIn - prevCashIn) / prevCashIn) * 100 : 0;
    const cashOutGrowth = prevCashOut > 0 ? ((totalCashOut - prevCashOut) / prevCashOut) * 100 : 0;
    const netCashFlowGrowth = prevNetCashFlow !== 0 ? ((netCashFlow - prevNetCashFlow) / Math.abs(prevNetCashFlow)) * 100 : 0;
    const grossProfitGrowth = cashInGrowth;

    // Dual-Channel Net Flows:
    const drawerCashIn = cashCollected + manualCashIn;
    const drawerCashOut = cashExpenses + manualCashOut;
    const drawerNetFlow = drawerCashIn - drawerCashOut;

    const digitalCashIn = nonCashSettled;
    const digitalCashOut = nonCashExpenses;
    const digitalNetFlow = digitalCashIn - digitalCashOut;

    // Fetch recent shifts for reconciliation with cashier name
    const shiftList = await db
      .select({
        id: shifts.id,
        tenantId: shifts.tenantId,
        membershipId: shifts.membershipId,
        deviceId: shifts.deviceId,
        startTime: shifts.startTime,
        endTime: shifts.endTime,
        startingCash: shifts.startingCash,
        actualCash: shifts.actualCash,
        expectedCash: shifts.expectedCash,
        cashDifference: shifts.cashDifference,
        status: shifts.status,
        cashierName: sql<string>`COALESCE(${memberships.displayName}, ${accounts.name}, 'Kasir')`,
      })
      .from(shifts)
      .leftJoin(memberships, eq(shifts.membershipId, memberships.id))
      .leftJoin(accounts, eq(memberships.accountId, accounts.id))
      .where(eq(shifts.tenantId, tenant.id))
      .orderBy(desc(shifts.startTime))
      .limit(10);

    return {
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          outletKey: tenant.outletKey,
        },
        period: {
          type: period,
          startDate: currentStart.toISOString(),
          endDate: currentEnd.toISOString(),
          formattedStart: currentStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          formattedEnd: currentEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        },
        chartBuckets: chartBucketsList,
        cashInTrend,
        cashOutTrend,
        netFlowTrend,
        grossProfitTrend,
        growth: {
          cashIn: cashInGrowth,
          cashOut: cashOutGrowth,
          netCashFlow: netCashFlowGrowth,
          grossProfit: grossProfitGrowth,
        },
        cashFlow: {
          totalCashIn,
          cashSalesTotal: cashCollected,
          cashSalesNet,
          manualCashIn,
          nonCashSalesTotal: nonCashSettled,
          nonCashGrandTotal,
          nonCashGatewayFee,
          nonCashSalesNet,
          totalGrossSales,
          totalDiscount,
          totalGatewayFee,
          totalCashOut,
          totalExpenses,
          cashExpenses,
          nonCashExpenses,
          manualCashOut,
          netCashFlow,
          drawerCashIn,
          drawerCashOut,
          drawerNetFlow,
          digitalCashIn,
          digitalCashOut,
          digitalNetFlow,
          paymentBreakdown,
        },
        profitability: {
          netSales,
          totalHpp,
          estimatedGrossProfit,
          profitMargin,
          totalExpenses,
          disclaimer: 'Estimasi Laba Kotor berdasarkan HPP modal produk resep yang terjual, belum dikurangi beban sewa & depresiasi.',
        },
        expenses: expenseList,
        expenseCategoryBreakdown: Object.entries(expenseByCategory).map(([cat, amount]) => ({
          category: cat,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        })),
        shifts: shiftList,
      },
    };
  } catch (error: any) {
    console.error('Error fetching finance report:', error);
    return { success: false, error: error.message || 'Gagal memuat laporan keuangan' };
  }
}

// -------------------------------------------------------------
// 4. ACTION: PENCATATAN BIAYA OPERASIONAL (EXPENSE LOGGING)
// -------------------------------------------------------------
export async function createExpenseAction(data: {
  outletKey: string;
  category: string;
  amount: number;
  paymentMethod: string;
  description: string;
  date?: string;
  receiptUrl?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized: Sesi tidak ditemukan.' };
    }

    if (user.role !== 'OWNER' && user.role !== 'MANAGER' && (user.role as string) !== 'SYSTEM_ADMIN') {
      return { success: false, error: 'Hanya Pemilik atau Manajer yang dapat mencatat pengeluaran.' };
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.outletKey, data.outletKey))
      .limit(1);

    if (!tenant || tenant.id !== user.tenantId) {
      return { success: false, error: 'Outlet tidak valid.' };
    }

    if (!data.description || data.amount <= 0) {
      return { success: false, error: 'Deskripsi dan nominal pengeluaran wajib diisi dengan benar.' };
    }

    const expenseDate = data.date ? new Date(data.date) : new Date();

    const [newExpense] = await db
      .insert(expenses)
      .values({
        tenantId: tenant.id,
        category: data.category || 'OPERASIONAL',
        amount: data.amount.toString(),
        paymentMethod: data.paymentMethod || 'TUNAI',
        description: data.description.trim(),
        date: expenseDate,
        receiptUrl: data.receiptUrl,
        createdByMembershipId: user.id as any,
      })
      .returning();

    // If paid via TUNAI or CASH, check if there is an active shift to log automatic Cash Out
    if (['TUNAI', 'CASH'].includes((data.paymentMethod || '').trim().toUpperCase())) {
      const [activeShift] = await db
        .select()
        .from(shifts)
        .where(
          and(
            eq(shifts.tenantId, tenant.id),
            eq(shifts.status, 'ACTIVE')
          )
        )
        .limit(1);

      if (activeShift) {
        await db.insert(cashMovements).values({
          tenantId: tenant.id,
          shiftId: activeShift.id,
          type: 'OUT',
          amount: data.amount.toString(),
          description: `[Biaya ${data.category}] ${data.description.trim()}`,
        });
      }
    }

    return { success: true, data: newExpense };
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return { success: false, error: error.message || 'Gagal menyimpan pengeluaran.' };
  }
}

// -------------------------------------------------------------
// 4B. ACTION: CATAT KAS MASUK MANUAL (CASH IN)
// -------------------------------------------------------------
export async function createCashInAction(data: {
  outletKey: string;
  amount: number;
  description: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized.' };
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.outletKey, data.outletKey))
      .limit(1);

    if (!tenant || tenant.id !== user.tenantId) {
      return { success: false, error: 'Outlet tidak valid.' };
    }

    if (!data.description || data.amount <= 0) {
      return { success: false, error: 'Deskripsi dan nominal kas masuk wajib diisi dengan benar.' };
    }

    const [activeShift] = await db
      .select()
      .from(shifts)
      .where(
        and(
          eq(shifts.tenantId, tenant.id),
          eq(shifts.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (!activeShift) {
      return {
        success: false,
        error: 'Tidak ada shift kasir yang aktif saat ini. Buka shift kasir terlebih dahulu untuk mencatat kas masuk laci kasir.',
      };
    }

    const [newMovement] = await db
      .insert(cashMovements)
      .values({
        tenantId: tenant.id,
        shiftId: activeShift.id,
        type: 'IN',
        amount: data.amount.toString(),
        description: `[Kas Masuk] ${data.description.trim()}`,
      })
      .returning();

    return { success: true, data: newMovement };
  } catch (error: any) {
    console.error('Error creating cash in:', error);
    return { success: false, error: error.message || 'Gagal menyimpan kas masuk.' };
  }
}

// -------------------------------------------------------------
// 5. ACTION: HAPUS PENGELUARAN
// -------------------------------------------------------------
export async function deleteExpenseAction(expenseId: string, outletKey: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized.' };
    }

    if (user.role !== 'OWNER' && user.role !== 'MANAGER' && (user.role as string) !== 'SYSTEM_ADMIN') {
      return { success: false, error: 'Hanya Pemilik atau Manajer yang dapat menghapus pengeluaran.' };
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.outletKey, outletKey))
      .limit(1);

    if (!tenant || tenant.id !== user.tenantId) {
      return { success: false, error: 'Outlet tidak valid.' };
    }

    await db
      .delete(expenses)
      .where(
        and(
          eq(expenses.id, expenseId),
          eq(expenses.tenantId, tenant.id)
        )
      );

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return { success: false, error: error.message || 'Gagal menghapus pengeluaran.' };
  }
}

// -------------------------------------------------------------
// 6. ACTION: RINGKASAN EKSEKUTIF (REPORTS & ANALYTICS OVERVIEW)
// -------------------------------------------------------------
export async function getReportsOverview(outletKey: string, params?: DateFilterParams) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized: Sesi tidak ditemukan.' };
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.outletKey, outletKey))
      .limit(1);

    if (!tenant || tenant.id !== user.tenantId) {
      return { success: false, error: 'Akses ditolak: Cabang tidak valid.' };
    }

    const { currentStart, currentEnd, prevStart, prevEnd, period } = resolveDateIntervals(params);

    // 1. Fetch Transactions (Current & Previous)
    const trxList = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenant.id),
          gte(transactions.createdAt, currentStart),
          lte(transactions.createdAt, currentEnd)
        )
      )
      .orderBy(desc(transactions.createdAt));

    const prevTrxList = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenant.id),
          gte(transactions.createdAt, prevStart),
          lte(transactions.createdAt, prevEnd)
        )
      );

    // 2. Fetch Items for Theoretical COGS / HPP
    const trxIds = trxList.map((t) => t.id);
    let totalHpp = 0;
    let topProducts: { id: string; name: string; categoryName: string; totalQty: number; totalRevenue: number }[] = [];

    if (trxIds.length > 0) {
      const allItems = await db
        .select({
          quantity: transactionItems.quantity,
          costPrice: products.costPrice,
        })
        .from(transactionItems)
        .leftJoin(products, eq(transactionItems.productId, products.id))
        .where(inArray(transactionItems.transactionId, trxIds));

      allItems.forEach((it) => {
        const qty = it.quantity || 1;
        const cost = parseFloat(it.costPrice || '0') || 0;
        totalHpp += cost * qty;
      });

      // Top 5 Products
      const topItems = await db
        .select({
          productId: transactionItems.productId,
          productName: products.name,
          categoryName: categories.name,
          totalQty: sql<number>`SUM(COALESCE(${transactionItems.quantity}, 1))`,
          totalRevenue: sql<number>`SUM(CAST(${transactionItems.price} AS NUMERIC) * COALESCE(${transactionItems.quantity}, 1))`,
        })
        .from(transactionItems)
        .leftJoin(products, eq(transactionItems.productId, products.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(inArray(transactionItems.transactionId, trxIds))
        .groupBy(transactionItems.productId, products.name, categories.name)
        .orderBy(desc(sql`SUM(COALESCE(${transactionItems.quantity}, 1))`))
        .limit(5);

      topProducts = topItems.map((item) => ({
        id: item.productId || '',
        name: item.productName || 'Menu Tanpa Nama',
        categoryName: item.categoryName || 'Lainnya',
        totalQty: Number(item.totalQty) || 0,
        totalRevenue: Number(item.totalRevenue) || 0,
      }));
    }

    // 3. Sales Aggregations
    const isCashPayment = (method: string | null | undefined): boolean => {
      if (!method) return false;
      const clean = method.trim().toUpperCase();
      return clean === 'TUNAI' || clean === 'CASH';
    };

    let grossSales = 0;
    let totalDiscount = 0;
    let totalGatewayFee = 0;
    let totalTax = 0;
    let totalService = 0;
    let totalCollected = 0;
    let totalOrders = 0;
    let highestTransaction = 0;
    let cashGrossSales = 0;
    let cashDiscount = 0;
    let cashSalesTotal = 0;
    let nonCashGrossSales = 0;
    let nonCashDiscount = 0;
    let nonCashGatewayFee = 0;
    let nonCashSalesTotal = 0;

    const paymentMethodsMap: Record<string, { count: number; total: number }> = {};
    const channelMap: Record<string, { count: number; total: number }> = {
      POS: { count: 0, total: 0 },
      STOREFRONT: { count: 0, total: 0 },
    };

    // Dynamic Chart Buckets (Hourly: 24 points, Daily: 28-31 points, Monthly: 12 points)
    const diffHours = (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffHours / 24);

    type ChartBucket = {
      key: string;
      date: string;
      label: string;
      netSales: number;
      orders: number;
    };
    const chartBucketsMap: Record<string, ChartBucket> = {};
    const chartBucketsList: ChartBucket[] = [];

    let chartGranularity: 'hourly' | 'daily' | 'monthly' = 'daily';

    if (diffDays <= 1) {
      chartGranularity = 'hourly';
      for (let h = 0; h < 24; h++) {
        const hourStr = String(h).padStart(2, '0') + ':00';
        const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
        const bucket: ChartBucket = {
          key: hourStr,
          date: hourStr,
          label,
          netSales: 0,
          orders: 0,
        };
        chartBucketsMap[hourStr] = bucket;
        chartBucketsList.push(bucket);
      }
    } else if (diffDays <= 35) {
      chartGranularity = 'daily';
      const cursor = new Date(currentStart);
      while (cursor <= currentEnd) {
        const ymd = cursor.toISOString().slice(0, 10);
        const dayNum = cursor.getDate();
        const monthShort = cursor.toLocaleDateString('id-ID', { month: 'short' });
        const bucket: ChartBucket = {
          key: ymd,
          date: ymd,
          label: `${dayNum} ${monthShort}`,
          netSales: 0,
          orders: 0,
        };
        chartBucketsMap[ymd] = bucket;
        chartBucketsList.push(bucket);
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      chartGranularity = 'monthly';
      const cursor = new Date(currentStart.getFullYear(), currentStart.getMonth(), 1);
      while (cursor <= currentEnd) {
        const ym = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        const monthName = cursor.toLocaleDateString('id-ID', { month: 'short' });
        const bucket: ChartBucket = {
          key: ym,
          date: ym,
          label: monthName,
          netSales: 0,
          orders: 0,
        };
        chartBucketsMap[ym] = bucket;
        chartBucketsList.push(bucket);
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    // Hourly buckets (0-23)
    const hourlyTotals: { hour: number; label: string; orderCount: number; revenue: number }[] = [];
    for (let h = 0; h < 24; h++) {
      const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
      hourlyTotals.push({ hour: h, label, orderCount: 0, revenue: 0 });
    }

    // Day of week buckets (Mon=0 to Sun=6)
    const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const dayTotals: { dayIndex: number; dayName: string; orderCount: number; revenue: number }[] = dayLabels.map((name, idx) => ({
      dayIndex: idx,
      dayName: name,
      orderCount: 0,
      revenue: 0,
    }));

    // Rush hour bands
    const rushBands = {
      morning: { label: 'Pagi (06-11)', orderCount: 0, revenue: 0 },
      lunch: { label: 'Siang (11-15)', orderCount: 0, revenue: 0 },
      afternoon: { label: 'Sore (15-18)', orderCount: 0, revenue: 0 },
      dinner: { label: 'Malam (18-23)', orderCount: 0, revenue: 0 },
    };

    // 7 days x 24 hours grid for overview heatmap
    const shortDayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const fullDayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const heatmapGrid: {
      dayIndex: number;
      dayLabel: string;
      dayFullName: string;
      hours: {
        hour: number;
        hourLabel: string;
        orderCount: number;
        revenue: number;
      }[];
    }[] = [];

    for (let d = 0; d < 7; d++) {
      const hours = [];
      for (let h = 0; h < 24; h++) {
        const hourLabel = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
        hours.push({
          hour: h,
          hourLabel,
          orderCount: 0,
          revenue: 0,
        });
      }
      heatmapGrid.push({
        dayIndex: d,
        dayLabel: shortDayLabels[d],
        dayFullName: fullDayLabels[d],
        hours,
      });
    }

    trxList.forEach((t) => {
      const isCanceled =
        t.status === 'CANCELLED' ||
        t.status === 'CANCELED' ||
        t.paymentStatus === 'CANCELED' ||
        t.paymentStatus === 'REFUNDED';
      if (isCanceled) return;

      const gTotal = parseFloat(t.grandTotal || '0') || 0;
      const subTotal = parseFloat(t.totalAmount || '0') || 0;
      const disc = parseFloat(t.discount || '0') || 0;
      const tax = parseFloat(t.tax || '0') || 0;
      const serv = parseFloat(t.serviceCharge || '0') || 0;
      const fee = calculateGatewayFee(t);

      grossSales += subTotal;
      totalDiscount += disc;
      totalGatewayFee += fee;
      totalTax += tax;
      totalService += serv;
      totalCollected += gTotal;
      totalOrders += 1;
      if (gTotal > highestTransaction) {
        highestTransaction = gTotal;
      }

      // Cash vs Non-cash
      const rawMethod = (t.paymentMethod || 'TUNAI').trim().toUpperCase();
      if (isCashPayment(rawMethod)) {
        cashGrossSales += subTotal;
        cashDiscount += disc;
        cashSalesTotal += gTotal;
        const normKey = 'TUNAI';
        paymentMethodsMap[normKey] = paymentMethodsMap[normKey] || { count: 0, total: 0 };
        paymentMethodsMap[normKey].count += 1;
        paymentMethodsMap[normKey].total += gTotal;
      } else {
        nonCashGrossSales += subTotal;
        nonCashDiscount += disc;
        const netDigital = t.netAmount ? parseFloat(t.netAmount) : Math.max(0, gTotal - fee);
        nonCashSalesTotal += netDigital;
        const normKey = 
          rawMethod === 'QRIS_STATIC' ? 'QRIS Statis Toko' :
          rawMethod === 'QRIS_DYNAMIC' ? 'QRIS Dinamis' :
          rawMethod === 'QRIS' ? 'QRIS' :
          rawMethod === 'CARD' || rawMethod === 'EDC' ? 'Kartu EDC' :
          rawMethod === 'TRANSFER' || rawMethod === 'BANK_TRANSFER' ? 'Transfer Bank' :
          rawMethod === 'ONLINE' ? 'Self QR Online' : rawMethod;
        paymentMethodsMap[normKey] = paymentMethodsMap[normKey] || { count: 0, total: 0 };
        paymentMethodsMap[normKey].count += 1;
        paymentMethodsMap[normKey].total += netDigital;
      }

      // Channel
      const ch = t.source === 'POS' ? 'POS' : 'STOREFRONT';
      channelMap[ch].count += 1;
      channelMap[ch].total += gTotal;

      // Date calculations
      if (t.createdAt) {
        const dateObj = new Date(t.createdAt);
        const netItemSales = Math.max(0, subTotal - disc - fee);

        if (chartGranularity === 'hourly') {
          const hourKey = String(dateObj.getHours()).padStart(2, '0') + ':00';
          if (chartBucketsMap[hourKey]) {
            chartBucketsMap[hourKey].netSales += netItemSales;
            chartBucketsMap[hourKey].orders += 1;
          }
        } else if (chartGranularity === 'daily') {
          const ymd = dateObj.toISOString().slice(0, 10);
          if (chartBucketsMap[ymd]) {
            chartBucketsMap[ymd].netSales += netItemSales;
            chartBucketsMap[ymd].orders += 1;
          }
        } else {
          const ym = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
          if (chartBucketsMap[ym]) {
            chartBucketsMap[ym].netSales += netItemSales;
            chartBucketsMap[ym].orders += 1;
          }
        }

        // Hourly
        const hour = dateObj.getHours();
        hourlyTotals[hour].orderCount += 1;
        hourlyTotals[hour].revenue += gTotal;

        // Day
        const jsDay = dateObj.getDay();
        const monIdx = jsDay === 0 ? 6 : jsDay - 1;
        dayTotals[monIdx].orderCount += 1;
        dayTotals[monIdx].revenue += gTotal;

        // Populate heatmap grid
        if (heatmapGrid[monIdx] && heatmapGrid[monIdx].hours[hour]) {
          heatmapGrid[monIdx].hours[hour].orderCount += 1;
          heatmapGrid[monIdx].hours[hour].revenue += gTotal;
        }

        // Rush bands
        if (hour >= 6 && hour < 11) {
          rushBands.morning.orderCount += 1;
          rushBands.morning.revenue += gTotal;
        } else if (hour >= 11 && hour < 15) {
          rushBands.lunch.orderCount += 1;
          rushBands.lunch.revenue += gTotal;
        } else if (hour >= 15 && hour < 18) {
          rushBands.afternoon.orderCount += 1;
          rushBands.afternoon.revenue += gTotal;
        } else {
          rushBands.dinner.orderCount += 1;
          rushBands.dinner.revenue += gTotal;
        }
      }
    });

    const netSales = Math.max(0, grossSales - totalDiscount - totalGatewayFee);
    const aov = totalOrders > 0 ? netSales / totalOrders : 0;
    const estimatedGrossProfit = Math.max(0, netSales - totalHpp);
    const profitMargin = netSales > 0 ? (estimatedGrossProfit / netSales) * 100 : 0;

    // Previous period calculations
    let prevGrossSales = 0;
    let prevDiscount = 0;
    let prevGatewayFee = 0;
    let prevOrders = 0;

    prevTrxList.forEach((t) => {
      const isCanceled =
        t.status === 'CANCELLED' ||
        t.status === 'CANCELED' ||
        t.paymentStatus === 'CANCELED' ||
        t.paymentStatus === 'REFUNDED';
      if (isCanceled) return;

      const subTotal = parseFloat(t.totalAmount || '0') || 0;
      const disc = parseFloat(t.discount || '0') || 0;
      prevGrossSales += subTotal;
      prevDiscount += disc;
      prevGatewayFee += calculateGatewayFee(t);
      prevOrders += 1;
    });

    const prevNetSales = Math.max(0, prevGrossSales - prevDiscount - prevGatewayFee);
    const prevAov = prevOrders > 0 ? prevNetSales / prevOrders : 0;

    const netSalesGrowth = prevNetSales > 0 ? ((netSales - prevNetSales) / prevNetSales) * 100 : 0;
    const ordersGrowth = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0;
    const aovGrowth = prevAov > 0 ? ((aov - prevAov) / prevAov) * 100 : 0;

    // 4. Expenses & Cash Movements
    const expenseList = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.tenantId, tenant.id),
          gte(expenses.date, currentStart),
          lte(expenses.date, currentEnd)
        )
      );

    let totalExpenses = 0;
    let cashExpenses = 0;
    let nonCashExpenses = 0;

    expenseList.forEach((exp) => {
      const amt = parseFloat(exp.amount || '0') || 0;
      totalExpenses += amt;
      if (isCashPayment(exp.paymentMethod)) {
        cashExpenses += amt;
      } else {
        nonCashExpenses += amt;
      }
    });

    const movements = await db
      .select()
      .from(cashMovements)
      .where(
        and(
          eq(cashMovements.tenantId, tenant.id),
          gte(cashMovements.createdAt, currentStart),
          lte(cashMovements.createdAt, currentEnd)
        )
      );

    let manualCashIn = 0;
    let manualCashOut = 0;
    movements.forEach((m) => {
      const amt = parseFloat(m.amount || '0') || 0;
      const isAutoExpense = m.description && m.description.startsWith('[Biaya');
      if (m.type === 'IN') manualCashIn += amt;
      if (m.type === 'OUT' && !isAutoExpense) manualCashOut += amt;
    });

    const totalCashIn = cashSalesTotal + nonCashSalesTotal + manualCashIn;
    const totalCashOut = totalExpenses + manualCashOut;
    const netCashFlow = totalCashIn - totalCashOut;
    const drawerNetFlow = (cashSalesTotal + manualCashIn) - (cashExpenses + manualCashOut);
    const digitalNetFlow = nonCashSalesTotal - nonCashExpenses;

    // 5. Peak Hours / Days
    let busiestHour = hourlyTotals[0];
    let slowestHour = hourlyTotals[0];
    hourlyTotals.forEach((h) => {
      if (h.orderCount > busiestHour.orderCount) busiestHour = h;
      if (h.orderCount < slowestHour.orderCount) slowestHour = h;
    });

    let busiestDay = dayTotals[0];
    let slowestDay = dayTotals[0];
    dayTotals.forEach((d) => {
      if (d.revenue > busiestDay.revenue) busiestDay = d;
      if (d.revenue < slowestDay.revenue) slowestDay = d;
    });

    // 6. Active Shift Info
    const [activeShift] = await db
      .select({
        id: shifts.id,
        startTime: shifts.startTime,
        startingCash: shifts.startingCash,
        expectedCash: shifts.expectedCash,
        status: shifts.status,
        cashierName: sql<string>`COALESCE(${memberships.displayName}, ${accounts.name}, 'Kasir')`,
      })
      .from(shifts)
      .leftJoin(memberships, eq(shifts.membershipId, memberships.id))
      .leftJoin(accounts, eq(memberships.accountId, accounts.id))
      .where(
        and(
          eq(shifts.tenantId, tenant.id),
          eq(shifts.status, 'ACTIVE')
        )
      )
      .limit(1);

    // Format top payment methods
    const topPaymentList = Object.entries(paymentMethodsMap).map(([method, val]) => ({
      method,
      total: val.total,
      count: val.count,
      percentage: totalCollected > 0 ? (val.total / totalCollected) * 100 : 0,
    })).sort((a, b) => b.total - a.total);

    // Format channels
    const channels = Object.entries(channelMap).map(([ch, val]) => ({
      channel: ch === 'POS' ? 'Kasir POS' : 'Self QR Meja',
      count: val.count,
      total: val.total,
      percentage: totalCollected > 0 ? (val.total / totalCollected) * 100 : 0,
    }));

    // Mini chart data sorted
    const miniChartData = chartBucketsList;

    return {
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          outletKey: tenant.outletKey,
        },
        period: {
          type: period,
          granularity: chartGranularity,
          startDate: currentStart.toISOString(),
          endDate: currentEnd.toISOString(),
          formattedStart: currentStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          formattedEnd: currentEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        },
        heroKpis: {
          netSales,
          netSalesGrowth,
          totalOrders,
          ordersGrowth,
          aov,
          aovGrowth,
          highestTransaction,
          netCashFlow,
          cashFlowStatus: netCashFlow >= 0 ? ('SURPLUS' as const) : ('DEFICIT' as const),
          grossProfit: estimatedGrossProfit,
          profitMargin,
          busiestHourLabel: busiestHour.label,
          busiestHourOrders: busiestHour.orderCount,
          busiestDayName: busiestDay.dayName,
          busiestDayRevenue: busiestDay.revenue,
        },
        salesSnapshot: {
          grossSales,
          totalDiscount,
          totalCollected,
          miniChartData,
          channels,
          topPaymentMethods: topPaymentList,
        },
        operationsSnapshot: {
          busiestHour,
          slowestHour,
          busiestDay,
          slowestDay,
          topProducts,
          heatmapGrid,
          rushHoursSummary: [
            { timeBand: 'Pagi', label: rushBands.morning.label, orderCount: rushBands.morning.orderCount, percentage: totalOrders > 0 ? (rushBands.morning.orderCount / totalOrders) * 100 : 0 },
            { timeBand: 'Siang', label: rushBands.lunch.label, orderCount: rushBands.lunch.orderCount, percentage: totalOrders > 0 ? (rushBands.lunch.orderCount / totalOrders) * 100 : 0 },
            { timeBand: 'Sore', label: rushBands.afternoon.label, orderCount: rushBands.afternoon.orderCount, percentage: totalOrders > 0 ? (rushBands.afternoon.orderCount / totalOrders) * 100 : 0 },
            { timeBand: 'Malam', label: rushBands.dinner.label, orderCount: rushBands.dinner.orderCount, percentage: totalOrders > 0 ? (rushBands.dinner.orderCount / totalOrders) * 100 : 0 },
          ],
        },
        financeSnapshot: {
          totalCashIn,
          totalCashOut,
          cashSalesTotal,
          nonCashSalesTotal,
          cashExpenses,
          nonCashExpenses,
          manualCashIn,
          manualCashOut,
          drawerNetFlow,
          digitalNetFlow,
          totalHpp,
          activeShift: activeShift
            ? {
                id: activeShift.id,
                cashierName: activeShift.cashierName,
                startTime: activeShift.startTime.toISOString(),
                startingCash: parseFloat(activeShift.startingCash || '0'),
                expectedCash: parseFloat(activeShift.expectedCash || '0'),
                status: activeShift.status,
              }
            : null,
        },
      },
    };
  } catch (error: any) {
    console.error('Error fetching reports overview:', error);
    return { success: false, error: error.message || 'Gagal memuat ringkasan laporan.' };
  }
}

