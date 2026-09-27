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
  categories
} from '@/lib/db/schema';
import { eq, and, gte, lte, desc, inArray, sql } from 'drizzle-orm';
import { getCurrentUser } from './auth';

export type ReportPeriod = 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'last_month' | '3months' | '6months' | 'custom';

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

  if (period === 'today') {
    currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

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
  } else if (period === 'this_month') {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
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

    // Metrics aggregation
    let grossSales = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalService = 0;
    let totalCollected = 0;
    let totalOrders = 0;

    const paymentMethodsMap: Record<string, { count: number; total: number }> = {};
    const channelMap: Record<string, { count: number; total: number }> = {
      'POS': { count: 0, total: 0 },
      'STOREFRONT': { count: 0, total: 0 },
    };

    // Daily breakdown bucket for stacked rounded square chart
    const dailyMap: Record<string, { date: string; label: string; netSales: number; orders: number; projected: number }> = {};

    const formatLocalDateKey = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Initialize days in interval
    const stepDate = new Date(currentStart);
    while (stepDate <= currentEnd) {
      const dateKey = formatLocalDateKey(stepDate);
      const label = `${stepDate.getDate()} ${stepDate.toLocaleDateString('id-ID', { month: 'short' })}`;
      dailyMap[dateKey] = { date: dateKey, label, netSales: 0, orders: 0, projected: 0 };
      stepDate.setDate(stepDate.getDate() + 1);
    }

    trxList.forEach((t) => {
      const isCanceled = t.status === 'CANCELLED' || t.status === 'CANCELED' || t.paymentStatus === 'CANCELED' || t.paymentStatus === 'REFUNDED';
      if (isCanceled) return;

      const gTotal = parseFloat(t.grandTotal || '0') || 0;
      const subTotal = parseFloat(t.totalAmount || '0') || 0;
      const disc = parseFloat(t.discount || '0') || 0;
      const tx = parseFloat(t.tax || '0') || 0;
      const sc = parseFloat(t.serviceCharge || '0') || 0;

      grossSales += subTotal;
      totalDiscount += disc;
      totalTax += tx;
      totalService += sc;
      totalCollected += gTotal;
      totalOrders += 1;

      // Channel breakdown
      const isStorefront = t.source === 'QR' || t.source === 'WEB_ORDER';
      const channelKey = isStorefront ? 'STOREFRONT' : 'POS';
      channelMap[channelKey].count += 1;
      channelMap[channelKey].total += gTotal;

      // Payment method
      const method = (t.paymentMethod || 'TUNAI').toUpperCase();
      if (!paymentMethodsMap[method]) {
        paymentMethodsMap[method] = { count: 0, total: 0 };
      }
      paymentMethodsMap[method].count += 1;
      paymentMethodsMap[method].total += gTotal;

      // Daily bucket
      const dayKey = t.createdAt ? formatLocalDateKey(new Date(t.createdAt)) : '';
      if (dailyMap[dayKey]) {
        dailyMap[dayKey].netSales += Math.max(0, subTotal - disc);
        dailyMap[dayKey].orders += 1;
      }
    });

    const netSales = Math.max(0, grossSales - totalDiscount);
    const aov = totalOrders > 0 ? netSales / totalOrders : 0;

    // Previous period aggregates for comparison
    let prevGrossSales = 0;
    let prevDiscount = 0;
    let prevOrders = 0;

    prevTrxList.forEach((t) => {
      const isCanceled = t.status === 'CANCELLED' || t.status === 'CANCELED' || t.paymentStatus === 'CANCELED' || t.paymentStatus === 'REFUNDED';
      if (isCanceled) return;
      prevGrossSales += parseFloat(t.totalAmount || '0') || 0;
      prevDiscount += parseFloat(t.discount || '0') || 0;
      prevOrders += 1;
    });

    const prevNetSales = Math.max(0, prevGrossSales - prevDiscount);
    const prevAov = prevOrders > 0 ? prevNetSales / prevOrders : 0;

    const netSalesGrowth = prevNetSales > 0 ? ((netSales - prevNetSales) / prevNetSales) * 100 : (netSales > 0 ? 100 : 0);
    const ordersGrowth = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : (totalOrders > 0 ? 100 : 0);
    const aovGrowth = prevAov > 0 ? ((aov - prevAov) / prevAov) * 100 : 0;

    // Average daily benchmark for projection/target line in rounded block chart
    const dailyList = Object.values(dailyMap);
    const daysWithDataCount = Math.max(1, dailyList.length);
    const targetDailyBaseline = netSales > 0 ? Math.round(netSales / daysWithDataCount * 1.1) : 0;

    dailyList.forEach((d) => {
      d.projected = targetDailyBaseline;
    });

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
          netSales,
          netSalesGrowth,
          prevNetSales,
          grossSales,
          totalDiscount,
          totalTax,
          totalService,
          totalCollected,
          totalOrders,
          ordersGrowth,
          prevOrders,
          aov,
          aovGrowth,
          prevAov,
        },
        chartData: dailyList,
        paymentMethods: Object.entries(paymentMethodsMap).map(([method, val]) => ({
          method,
          count: val.count,
          total: val.total,
          percentage: totalCollected > 0 ? (val.total / totalCollected) * 100 : 0,
        })),
        channels: [
          { channel: 'Kasir POS', count: channelMap['POS'].count, total: channelMap['POS'].total },
          { channel: 'Storefront QR Meja', count: channelMap['STOREFRONT'].count, total: channelMap['STOREFRONT'].total },
        ],
        recentTransactions: trxList.slice(0, 50),
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

    const { currentStart, currentEnd, period } = resolveDateIntervals(params);

    const trxList = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenant.id),
          gte(transactions.createdAt, currentStart),
          lte(transactions.createdAt, currentEnd)
        )
      );

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

    // Find Peak Hours KPI cards
    // 1. Busiest Hour
    let busiestHour = hourlyTotals[0];
    let slowestHour = hourlyTotals[0];
    hourlyTotals.forEach((h) => {
      if (h.orderCount > busiestHour.orderCount) busiestHour = h;
      if (h.orderCount < slowestHour.orderCount) slowestHour = h;
    });

    // 2. Busiest Day
    let busiestDay = dayTotals[0];
    let slowestDay = dayTotals[0];
    dayTotals.forEach((d) => {
      if (d.revenue > busiestDay.revenue) busiestDay = d;
      if (d.revenue < slowestDay.revenue) slowestDay = d;
    });

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
        peakKpis: {
          busiestHour: {
            hour: busiestHour.hour,
            label: busiestHour.label,
            orderCount: busiestHour.orderCount,
            revenue: busiestHour.revenue,
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
          },
          slowestDay: {
            dayIndex: slowestDay.dayIndex,
            dayName: slowestDay.dayFullName,
            orderCount: slowestDay.orderCount,
            revenue: slowestDay.revenue,
          },
        },
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

    const { currentStart, currentEnd, period } = resolveDateIntervals(params);

    // Fetch transactions
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

    // Cash in from CASH transactions
    let cashSalesTotal = 0;
    let nonCashSalesTotal = 0;
    let totalGrossSales = 0;
    let totalDiscount = 0;

    trxList.forEach((t) => {
      const isCanceled = t.status === 'CANCELLED' || t.status === 'CANCELED' || t.paymentStatus === 'CANCELED' || t.paymentStatus === 'REFUNDED';
      if (isCanceled) return;

      const gTotal = parseFloat(t.grandTotal || '0') || 0;
      const subTotal = parseFloat(t.totalAmount || '0') || 0;
      const disc = parseFloat(t.discount || '0') || 0;

      totalGrossSales += subTotal;
      totalDiscount += disc;

      if ((t.paymentMethod || '').toUpperCase() === 'TUNAI') {
        cashSalesTotal += gTotal;
      } else {
        nonCashSalesTotal += gTotal;
      }
    });

    const netSales = Math.max(0, totalGrossSales - totalDiscount);
    const estimatedGrossProfit = Math.max(0, netSales - totalHpp);
    const profitMargin = netSales > 0 ? (estimatedGrossProfit / netSales) * 100 : 0;

    // Fetch Expenses
    const expenseList = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.tenantId, tenant.id),
          gte(expenses.date, currentStart),
          lte(expenses.date, currentEnd)
        )
      )
      .orderBy(desc(expenses.date));

    let totalExpenses = 0;
    let cashExpenses = 0;
    const expenseByCategory: Record<string, number> = {};

    expenseList.forEach((exp) => {
      const amt = parseFloat(exp.amount || '0') || 0;
      totalExpenses += amt;
      if (exp.paymentMethod === 'TUNAI') {
        cashExpenses += amt;
      }
      const cat = exp.category || 'LAINNYA';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amt;
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
      if (m.type === 'IN') manualCashIn += amt;
      if (m.type === 'OUT') manualCashOut += amt;
    });

    const totalCashIn = cashSalesTotal + manualCashIn;
    const totalCashOut = cashExpenses + manualCashOut;
    const netCashFlow = totalCashIn - totalCashOut;

    // Fetch recent shifts for reconciliation
    const shiftList = await db
      .select()
      .from(shifts)
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
        cashFlow: {
          totalCashIn,
          cashSalesTotal,
          manualCashIn,
          nonCashSalesTotal,
          totalCashOut,
          cashExpenses,
          manualCashOut,
          netCashFlow,
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

    // If paid via TUNAI, check if there is an active shift to log automatic Cash Out
    if (data.paymentMethod === 'TUNAI') {
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
