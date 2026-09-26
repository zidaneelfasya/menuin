'use server';

import { db } from '../db';
import { transactions, transactionItems, products, tenants, memberships, posDevices, shifts, accounts } from '../db/schema';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';
import { getCurrentUser } from './auth';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, eachHourOfInterval, differenceInCalendarDays, isAfter, isBefore } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export type OutletOverviewData = {
  outletName: string;
  outletKey: string;
  slug: string | null;
  storeDescription: string | null;
  storefrontEnabled: boolean;
  staffCount: number;
  deviceCount: number;
  totalLifetimeTransactions: number;
  userName: string;
  activeAlertCount: number;
  criticalAlerts: string[];
};

export type PeriodMetrics = {
  grossSales: number;
  grossSalesGrowth: number;
  totalDiscount: number;
  netSales: number;
  netSalesGrowth: number;
  totalTax: number;
  totalServiceCharge: number;
  totalCollected: number;
  cogs: number;
  cogsRatio: number;
  cogsGrowth: number;
  grossProfit: number;
  grossProfitGrowth: number;
  totalTransactions: number;
  transactionsGrowth: number;
  averageOrderValue: number;
  aovGrowth: number;
  grossMargin: number;
  grossMarginGrowth: number;
  // Backward compatibility aliases
  totalOmzet: number;
  totalLaba: number;
  profitMargin: number;
  omzetGrowth: number;
  labaGrowth: number;
};

export type PaymentMethodStat = {
  method: string;
  label: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
};

export type ChannelStat = {
  channel: 'POS' | 'STOREFRONT';
  label: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  aov: number;
};

export type ChartDataPoint = {
  date: string;
  label: string;
  omzet: number;
  pesanan: number;
  laba: number;
  isFuture?: boolean;
};

export type TopSellingProduct = {
  id: string;
  name: string;
  totalSold: number;
  totalRevenue: number;
  sharePercentage: number;
};

export type OperationalPulse = {
  activeShift: {
    id: string;
    cashierName: string;
    startedAt: string;
    startingCash: number;
    hoursOpen: number;
  } | null;
  devices: {
    total: number;
    active: number;
    offline: number;
    list: {
      id: string;
      name: string;
      status: string;
      lastSeenAt: string | null;
    }[];
  };
  stockHealth: {
    total: number;
    safe: number;
    low: number;
    outOfStock: number;
  };
  todayOrders: {
    completed: number;
    pending: number;
    total: number;
  };
};

export type AttentionItem = {
  id: string;
  type: 'stock' | 'shift' | 'device';
  title: string;
  description: string;
  severity: 'warning' | 'critical';
  actionLabel: string;
  actionHref: string;
};

export type AnnualMonthRecap = {
  monthIndex: number;
  monthName: string;
  omzet: number;
  pesanan: number;
  aov: number;
  laba: number;
  status: 'completed' | 'in_progress' | 'future';
  isBestMonth: boolean;
};

export type BusinessInsight = {
  id: string;
  type: 'trend' | 'champion' | 'basket' | 'peak' | 'profit';
  text: string;
};

export type DashboardResponse = {
  success: boolean;
  error?: string;
  tab: 'harian' | 'bulanan' | 'tahunan';
  periodLabel: string;
  outlet: OutletOverviewData;
  metrics: PeriodMetrics;
  chartData: ChartDataPoint[];
  topProducts: TopSellingProduct[];
  paymentMix: PaymentMethodStat[];
  channelMix: ChannelStat[];
  operationalPulse: OperationalPulse;
  attentionItems: AttentionItem[];
  annualBreakdown?: AnnualMonthRecap[];
  bestMonthName?: string;
  insights: BusinessInsight[];
};

export async function getDashboardDataForTenant(
  tenant: {
    id: string;
    name: string;
    outletKey: string;
    slug: string | null;
    storeDescription?: string | null;
    storefrontEnabled?: boolean | null;
  },
  userName: string = 'Owner',
  searchParams: {
    tab?: string;
    preset?: string;
    from?: string;
    to?: string;
    month?: string;
    year?: string;
  }
): Promise<DashboardResponse> {
  try {
    const tenantId = tenant.id;
    const outletKey = tenant.outletKey;
    const now = new Date();
    const tab = (searchParams.tab === 'bulanan' || searchParams.tab === 'tahunan') ? searchParams.tab : 'harian';

    // 2. Compute date boundaries based on tab and parameters
    let startDate = new Date();
    let endDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();
    let periodLabel = '';

    if (tab === 'harian') {
      if (searchParams.from && searchParams.to) {
        startDate = new Date(searchParams.from);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(searchParams.to);
        endDate.setHours(23, 59, 59, 999);
        const dayDiff = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        prevStartDate = subDays(startDate, dayDiff);
        prevEndDate = new Date(startDate.getTime() - 1);

        const isSameDay = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');
        const isToday = format(startDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
        if (isSameDay) {
          periodLabel = isToday 
            ? `Hari Ini (${format(startDate, 'd MMM yyyy', { locale: localeId })})`
            : format(startDate, 'd MMM yyyy', { locale: localeId });
        } else if (startDate.getFullYear() === endDate.getFullYear()) {
          periodLabel = `${format(startDate, 'd MMM', { locale: localeId })} — ${format(endDate, 'd MMM yyyy', { locale: localeId })}`;
        } else {
          periodLabel = `${format(startDate, 'd MMM yyyy', { locale: localeId })} — ${format(endDate, 'd MMM yyyy', { locale: localeId })}`;
        }
      } else if (searchParams.preset === 'yesterday') {
        const yesterday = subDays(now, 1);
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
        endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
        prevStartDate = subDays(startDate, 1);
        prevEndDate = new Date(prevStartDate.getFullYear(), prevStartDate.getMonth(), prevStartDate.getDate(), 23, 59, 59, 999);
        periodLabel = `Kemarin (${format(startDate, 'd MMM yyyy', { locale: localeId })})`;
      } else if (searchParams.preset === 'last30') {
        startDate = subDays(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0), 29);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        prevStartDate = subDays(startDate, 30);
        prevEndDate = new Date(startDate.getTime() - 1);
        periodLabel = `${format(startDate, 'd MMM', { locale: localeId })} — ${format(endDate, 'd MMM yyyy', { locale: localeId })}`;
      } else if (searchParams.preset === 'last7') {
        startDate = subDays(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0), 6);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        prevStartDate = subDays(startDate, 7);
        prevEndDate = new Date(startDate.getTime() - 1);
        periodLabel = `${format(startDate, 'd MMM', { locale: localeId })} — ${format(endDate, 'd MMM yyyy', { locale: localeId })}`;
      } else {
        // DEFAULT: TODAY (Hari Ini)
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        prevStartDate = subDays(startDate, 1);
        prevEndDate = new Date(prevStartDate.getFullYear(), prevStartDate.getMonth(), prevStartDate.getDate(), 23, 59, 59, 999);
        periodLabel = `Hari Ini (${format(startDate, 'd MMM yyyy', { locale: localeId })})`;
      }
    } else if (tab === 'bulanan') {
      const monthStr = searchParams.month || format(now, 'yyyy-MM');
      const [yStr, mStr] = monthStr.split('-');
      const year = parseInt(yStr) || now.getFullYear();
      const month = parseInt(mStr) || (now.getMonth() + 1);

      startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Previous month
      prevStartDate = new Date(year, month - 2, 1, 0, 0, 0, 0);
      prevEndDate = new Date(year, month - 1, 0, 23, 59, 59, 999);

      periodLabel = format(startDate, 'MMMM yyyy', { locale: localeId });
    } else if (tab === 'tahunan') {
      const year = parseInt(searchParams.year || '') || now.getFullYear();
      startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);

      prevStartDate = new Date(year - 1, 0, 1, 0, 0, 0, 0);
      prevEndDate = new Date(year - 1, 11, 31, 23, 59, 59, 999);

      periodLabel = 'Tahun ' + year;
    }

    // 3. Parallel Queries
    const dateFilter = and(
      eq(transactions.tenantId, tenantId),
      gte(transactions.createdAt, startDate),
      lte(transactions.createdAt, endDate),
      eq(transactions.status, 'COMPLETED')
    );

    const prevDateFilter = and(
      eq(transactions.tenantId, tenantId),
      gte(transactions.createdAt, prevStartDate),
      lte(transactions.createdAt, prevEndDate),
      eq(transactions.status, 'COMPLETED')
    );

    const [
      staffCountRes,
      devicesRes,
      lifetimeTxRes,
      activeShiftRes,
      metricsCurrentRes,
      profitCurrentRes,
      metricsPrevRes,
      profitPrevRes,
      topProductsRes,
      stockStatsRes,
      lowStockItemsRes,
      todayTxRes,
      paymentMixRes,
      channelMixRes,
    ] = await Promise.all([
      // Staff count
      db.select({ count: sql<number>`count(${memberships.id})::int` })
        .from(memberships)
        .where(and(eq(memberships.tenantId, tenantId), eq(memberships.status, 'ACTIVE'))),
      
      // Devices
      db.select({
        id: posDevices.id,
        name: posDevices.name,
        status: posDevices.status,
        lastSeenAt: posDevices.lastSeenAt,
      })
      .from(posDevices)
      .where(eq(posDevices.tenantId, tenantId)),

      // Lifetime transactions
      db.select({ count: sql<number>`count(${transactions.id})::int` })
        .from(transactions)
        .where(and(eq(transactions.tenantId, tenantId), eq(transactions.status, 'COMPLETED'))),

      // Active Shift
      db.select({
        id: shifts.id,
        startTime: shifts.startTime,
        startingCash: shifts.startingCash,
        cashierName: sql<string>`COALESCE(${memberships.displayName}, ${accounts.name}, 'Kasir')`
      })
      .from(shifts)
      .leftJoin(memberships, eq(shifts.membershipId, memberships.id))
      .leftJoin(accounts, eq(memberships.accountId, accounts.id))
      .where(and(eq(shifts.tenantId, tenantId), eq(shifts.status, 'ACTIVE')))
      .limit(1),

      // Current Period Metrics (Transactions, Gross Sales, Discounts, Net Sales, Tax PBJT, Service Charge, Collected)
      db.select({
        totalTransactions: sql<number>`count(${transactions.id})::int`,
        totalGrossSales: sql<number>`COALESCE(sum(${transactions.totalAmount}), 0)::numeric`,
        totalDiscount: sql<number>`COALESCE(sum(${transactions.discount}), 0)::numeric`,
        totalNetSales: sql<number>`COALESCE(sum(${transactions.totalAmount} - COALESCE(${transactions.discount}, 0)), 0)::numeric`,
        totalTax: sql<number>`COALESCE(sum(${transactions.tax}), 0)::numeric`,
        totalServiceCharge: sql<number>`COALESCE(sum(${transactions.serviceCharge}), 0)::numeric`,
        totalCollected: sql<number>`COALESCE(sum(${transactions.grandTotal}), 0)::numeric`,
      })
      .from(transactions)
      .where(dateFilter),

      // Current Period Cost of Goods Sold (Recipe/Product Cost)
      db.select({
        totalRevenue: sql<number>`COALESCE(sum(${transactionItems.subtotal}), 0)::numeric`,
        totalCost: sql<number>`COALESCE(sum(${transactionItems.quantity} * ${products.costPrice}), 0)::numeric`,
      })
      .from(transactionItems)
      .innerJoin(products, eq(transactionItems.productId, products.id))
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(dateFilter),

      // Previous Period Metrics
      db.select({
        totalTransactions: sql<number>`count(${transactions.id})::int`,
        totalGrossSales: sql<number>`COALESCE(sum(${transactions.totalAmount}), 0)::numeric`,
        totalDiscount: sql<number>`COALESCE(sum(${transactions.discount}), 0)::numeric`,
        totalNetSales: sql<number>`COALESCE(sum(${transactions.totalAmount} - COALESCE(${transactions.discount}, 0)), 0)::numeric`,
        totalTax: sql<number>`COALESCE(sum(${transactions.tax}), 0)::numeric`,
        totalServiceCharge: sql<number>`COALESCE(sum(${transactions.serviceCharge}), 0)::numeric`,
        totalCollected: sql<number>`COALESCE(sum(${transactions.grandTotal}), 0)::numeric`,
      })
      .from(transactions)
      .where(prevDateFilter),

      // Previous Period Cost
      db.select({
        totalRevenue: sql<number>`COALESCE(sum(${transactionItems.subtotal}), 0)::numeric`,
        totalCost: sql<number>`COALESCE(sum(${transactionItems.quantity} * ${products.costPrice}), 0)::numeric`,
      })
      .from(transactionItems)
      .innerJoin(products, eq(transactionItems.productId, products.id))
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(prevDateFilter),

      // Top Selling Products in Period
      db.select({
        id: products.id,
        name: products.name,
        totalSold: sql<number>`sum(${transactionItems.quantity})::int`,
        totalRevenue: sql<number>`sum(${transactionItems.subtotal})::numeric`,
      })
      .from(transactionItems)
      .innerJoin(products, eq(transactionItems.productId, products.id))
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(dateFilter)
      .groupBy(products.id, products.name)
      .orderBy(desc(sql`sum(${transactionItems.quantity})`))
      .limit(5),

      // Stock Stats
      db.select({
        total: sql<number>`count(${products.id})::int`,
        safe: sql<number>`count(case when ${products.stock} > ${products.minStock} then 1 end)::int`,
        low: sql<number>`count(case when ${products.stock} <= ${products.minStock} and ${products.stock} > 0 then 1 end)::int`,
        outOfStock: sql<number>`count(case when ${products.stock} <= 0 then 1 end)::int`,
      })
      .from(products)
      .where(eq(products.tenantId, tenantId)),

      // Critical low stock items
      db.select({
        id: products.id,
        name: products.name,
        stock: products.stock,
        minStock: products.minStock,
        price: products.price,
      })
      .from(products)
      .where(and(eq(products.tenantId, tenantId), sql`${products.stock} <= ${products.minStock}`))
      .orderBy(products.stock)
      .limit(6),

      // Today's orders count
      db.select({
        completed: sql<number>`count(case when ${transactions.status} = 'COMPLETED' then 1 end)::int`,
        pending: sql<number>`count(case when ${transactions.status} = 'PENDING' then 1 end)::int`,
        total: sql<number>`count(${transactions.id})::int`,
      })
      .from(transactions)
      .where(and(
        eq(transactions.tenantId, tenantId),
        gte(transactions.createdAt, new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)),
        lte(transactions.createdAt, new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999))
      )),

      // Payment Methods Distribution (Cash vs Digital Tender)
      db.select({
        method: transactions.paymentMethod,
        totalAmount: sql<number>`COALESCE(sum(${transactions.grandTotal}), 0)::numeric`,
        count: sql<number>`count(${transactions.id})::int`,
      })
      .from(transactions)
      .where(dateFilter)
      .groupBy(transactions.paymentMethod)
      .orderBy(desc(sql`sum(${transactions.grandTotal})`)),

      // Channel Distribution (Kasir POS vs Storefront Self-Order)
      db.select({
        source: transactions.source,
        totalAmount: sql<number>`COALESCE(sum(${transactions.totalAmount} - COALESCE(${transactions.discount}, 0)), 0)::numeric`,
        count: sql<number>`count(${transactions.id})::int`,
      })
      .from(transactions)
      .where(dateFilter)
      .groupBy(transactions.source),
    ]);

    // 4. Calculate KPI Metrics & Growth (Strict F&B Accounting Standard)
    const curTx = metricsCurrentRes[0]?.totalTransactions || 0;
    const curGrossSales = Number(metricsCurrentRes[0]?.totalGrossSales || 0);
    const curTotalDiscount = Number(metricsCurrentRes[0]?.totalDiscount || 0);
    const curNetSales = Number(metricsCurrentRes[0]?.totalNetSales || 0);
    const curTotalTax = Number(metricsCurrentRes[0]?.totalTax || 0);
    const curTotalServiceCharge = Number(metricsCurrentRes[0]?.totalServiceCharge || 0);
    const curTotalCollected = Number(metricsCurrentRes[0]?.totalCollected || 0);

    const curCost = Number(profitCurrentRes[0]?.totalCost || 0);
    // Theoretical Gross Profit = Net Operating Sales - Theoretical Unit Cost (COGS)
    const curGrossProfit = curNetSales > 0 ? Math.max(0, curNetSales - curCost) : 0;
    const curAov = curTx > 0 ? Math.round(curNetSales / curTx) : 0;
    const curGrossMargin = curNetSales > 0 ? Number(((curGrossProfit / curNetSales) * 100).toFixed(1)) : 0;
    const curCogsRatio = curNetSales > 0 ? Number(((curCost / curNetSales) * 100).toFixed(1)) : 0;

    const prevTx = metricsPrevRes[0]?.totalTransactions || 0;
    const prevGrossSales = Number(metricsPrevRes[0]?.totalGrossSales || 0);
    const prevNetSales = Number(metricsPrevRes[0]?.totalNetSales || 0);
    const prevCost = Number(profitPrevRes[0]?.totalCost || 0);
    const prevGrossProfit = prevNetSales > 0 ? Math.max(0, prevNetSales - prevCost) : 0;
    const prevAov = prevTx > 0 ? Math.round(prevNetSales / prevTx) : 0;
    const prevGrossMargin = prevNetSales > 0 ? Number(((prevGrossProfit / prevNetSales) * 100).toFixed(1)) : 0;

    const grossSalesGrowth = prevGrossSales > 0 ? Number((((curGrossSales - prevGrossSales) / prevGrossSales) * 100).toFixed(1)) : (curGrossSales > 0 ? 100 : 0);
    const netSalesGrowth = prevNetSales > 0 ? Number((((curNetSales - prevNetSales) / prevNetSales) * 100).toFixed(1)) : (curNetSales > 0 ? 100 : 0);
    const cogsGrowth = prevCost > 0 ? Number((((curCost - prevCost) / prevCost) * 100).toFixed(1)) : (curCost > 0 ? 100 : 0);
    const txGrowth = prevTx > 0 ? Number((((curTx - prevTx) / prevTx) * 100).toFixed(1)) : (curTx > 0 ? 100 : 0);
    const aovGrowth = prevAov > 0 ? Number((((curAov - prevAov) / prevAov) * 100).toFixed(1)) : (curAov > 0 ? 100 : 0);
    const grossProfitGrowth = prevGrossProfit > 0 ? Number((((curGrossProfit - prevGrossProfit) / prevGrossProfit) * 100).toFixed(1)) : (curGrossProfit > 0 ? 100 : 0);
    const grossMarginGrowth = prevGrossMargin > 0 ? Number((curGrossMargin - prevGrossMargin).toFixed(1)) : 0;

    // Derived margin ratio for dynamic chart calculations
    const dynamicMarginRatio = curNetSales > 0 ? (curGrossProfit / curNetSales) : 0.65;

    const metrics: PeriodMetrics = {
      grossSales: curGrossSales,
      grossSalesGrowth,
      totalDiscount: curTotalDiscount,
      netSales: curNetSales,
      netSalesGrowth,
      totalTax: curTotalTax,
      totalServiceCharge: curTotalServiceCharge,
      totalCollected: curTotalCollected,
      cogs: curCost,
      cogsRatio: curCogsRatio,
      cogsGrowth,
      grossProfit: curGrossProfit,
      grossProfitGrowth,
      totalTransactions: curTx,
      transactionsGrowth: txGrowth,
      averageOrderValue: curAov,
      aovGrowth,
      grossMargin: curGrossMargin,
      grossMarginGrowth,
      // Backward compatibility aliases
      totalOmzet: curNetSales,
      omzetGrowth: netSalesGrowth,
      totalLaba: curGrossProfit,
      labaGrowth: grossProfitGrowth,
      profitMargin: curGrossMargin,
    };

    // Calculate Payment Methods Breakdown (Tender Instrument)
    const totalPaymentCollected = paymentMixRes.reduce((acc, p) => acc + Number(p.totalAmount || 0), 0);
    const paymentLabelMap: Record<string, string> = {
      CASH: 'Tunai (Cash)',
      QRIS: 'QRIS',
      EDC: 'Debit / EDC',
      DEBIT: 'Kartu Debit',
      CREDIT: 'Kartu Kredit',
      TRANSFER: 'Transfer Bank',
      ONLINE: 'Online (Midtrans Gateway)',
      MIDTRANS: 'Online (Midtrans Gateway)',
    };
    const paymentMix: PaymentMethodStat[] = paymentMixRes.map(p => {
      const amt = Number(p.totalAmount || 0);
      return {
        method: p.method,
        label: paymentLabelMap[p.method.toUpperCase()] || p.method,
        totalAmount: amt,
        transactionCount: p.count,
        percentage: totalPaymentCollected > 0 ? Number(((amt / totalPaymentCollected) * 100).toFixed(1)) : 0,
      };
    });

    // Calculate Channel Distribution (Kasir Langsung POS vs Storefront Self-Order)
    let posCount = 0;
    let posAmount = 0;
    let storefrontCount = 0;
    let storefrontAmount = 0;

    channelMixRes.forEach(row => {
      const src = (row.source || 'POS').toUpperCase();
      const count = Number(row.count || 0);
      const amt = Number(row.totalAmount || 0);

      if (src === 'POS') {
        posCount += count;
        posAmount += amt;
      } else {
        // ONLINE, WEB_ORDER, QR, STOREFRONT, etc.
        storefrontCount += count;
        storefrontAmount += amt;
      }
    });

    const totalChannelSales = posAmount + storefrontAmount;

    const channelMix: ChannelStat[] = [
      {
        channel: 'POS',
        label: 'Kasir Langsung (POS)',
        totalAmount: posAmount,
        transactionCount: posCount,
        percentage: totalChannelSales > 0 ? Number(((posAmount / totalChannelSales) * 100).toFixed(1)) : 0,
        aov: posCount > 0 ? Math.round(posAmount / posCount) : 0,
      },
      {
        channel: 'STOREFRONT',
        label: 'Storefront (Self-Order)',
        totalAmount: storefrontAmount,
        transactionCount: storefrontCount,
        percentage: totalChannelSales > 0 ? Number(((storefrontAmount / totalChannelSales) * 100).toFixed(1)) : 0,
        aov: storefrontCount > 0 ? Math.round(storefrontAmount / storefrontCount) : 0,
      },
    ];

    // 5. Build Sales Chart Data
    let chartData: ChartDataPoint[] = [];
    let annualBreakdown: AnnualMonthRecap[] | undefined;
    let bestMonthName: string | undefined;

    if (tab === 'tahunan') {
      const year = startDate.getFullYear();
      const isCurrentYear = year === now.getFullYear();
      const currentMonthIndex = now.getMonth(); // 0-indexed

      // Query monthly sums for the year (Net Sales = totalAmount - discount)
      const monthlyData = await db.select({
        month: sql<number>`EXTRACT(MONTH FROM ${transactions.createdAt})::int`,
        omzet: sql<number>`COALESCE(sum(${transactions.totalAmount} - COALESCE(${transactions.discount}, 0)), 0)::numeric`,
        pesanan: sql<number>`count(${transactions.id})::int`,
      })
      .from(transactions)
      .where(dateFilter)
      .groupBy(sql`EXTRACT(MONTH FROM ${transactions.createdAt})`);

      const monthlyMap = new Map<number, { omzet: number; pesanan: number }>();
      monthlyData.forEach(d => {
        monthlyMap.set(d.month, { omzet: Number(d.omzet), pesanan: d.pesanan });
      });

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const fullMonthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

      let maxOmzet = -1;
      let bestMonthIdx = -1;

      const recapList: AnnualMonthRecap[] = [];

      for (let m = 0; m < 12; m++) {
        const monthNumber = m + 1;
        const isFuture = isCurrentYear && m > currentMonthIndex;
        const isCurrent = isCurrentYear && m === currentMonthIndex;
        const status: 'completed' | 'in_progress' | 'future' = isFuture ? 'future' : (isCurrent ? 'in_progress' : 'completed');

        const mData = monthlyMap.get(monthNumber) || { omzet: 0, pesanan: 0 };
        const mOmzet = isFuture ? 0 : mData.omzet;
        const mPesanan = isFuture ? 0 : mData.pesanan;
        const mAov = mPesanan > 0 ? Math.round(mOmzet / mPesanan) : 0;
        const mLaba = Math.round(mOmzet * dynamicMarginRatio);

        if (!isFuture && mOmzet > maxOmzet) {
          maxOmzet = mOmzet;
          bestMonthIdx = m;
        }

        recapList.push({
          monthIndex: m,
          monthName: fullMonthNames[m],
          omzet: mOmzet,
          pesanan: mPesanan,
          aov: mAov,
          laba: mLaba,
          status,
          isBestMonth: false,
        });

        chartData.push({
          date: `${year}-${String(monthNumber).padStart(2, '0')}`,
          label: monthNames[m],
          omzet: mOmzet,
          pesanan: mPesanan,
          laba: mLaba,
          isFuture,
        });
      }

      if (bestMonthIdx !== -1 && maxOmzet > 0) {
        recapList[bestMonthIdx].isBestMonth = true;
        bestMonthName = fullMonthNames[bestMonthIdx];
      }

      annualBreakdown = recapList;
    } else {
      // Determine if hourly breakdown is needed (< 7 days in harian tab)
      const dayCount = differenceInCalendarDays(endDate, startDate) + 1;
      const isHourly = tab === 'harian' && dayCount < 7;

      if (isHourly) {
        // Query transactions grouped by hour (Net Sales = totalAmount - discount)
        const hourlyData = await db.select({
          hourKey: sql<string>`to_char(${transactions.createdAt}, 'YYYY-MM-DD HH24')`,
          omzet: sql<number>`COALESCE(sum(${transactions.totalAmount} - COALESCE(${transactions.discount}, 0)), 0)::numeric`,
          pesanan: sql<number>`count(${transactions.id})::int`,
        })
        .from(transactions)
        .where(dateFilter)
        .groupBy(sql`to_char(${transactions.createdAt}, 'YYYY-MM-DD HH24')`);

        const hourlyMap = new Map<string, { omzet: number; pesanan: number }>();
        hourlyData.forEach(d => {
          hourlyMap.set(d.hourKey, { omzet: Number(d.omzet), pesanan: d.pesanan });
        });

        // Determine adaptive hour step based on dayCount to keep points clean and readable
        let stepHours = 1;
        if (dayCount === 1) {
          stepHours = 2; // 12 points for 1 day
        } else if (dayCount === 2) {
          stepHours = 4; // 12 points for 2 days
        } else if (dayCount === 3 || dayCount === 4) {
          stepHours = 6; // 12 - 16 points
        } else {
          stepHours = 8; // 15 - 18 points for 5-6 days
        }

        const intervalPoints: ChartDataPoint[] = [];
        const cur = new Date(startDate);
        while (cur <= endDate) {
          const blockStart = new Date(cur);
          let blockOmzet = 0;
          let blockPesanan = 0;

          for (let h = 0; h < stepHours; h++) {
            const hDate = new Date(cur.getTime() + h * 3600 * 1000);
            if (hDate > endDate) break;
            const hKey = format(hDate, 'yyyy-MM-dd HH');
            const info = hourlyMap.get(hKey);
            if (info) {
              blockOmzet += info.omzet;
              blockPesanan += info.pesanan;
            }
          }

          const blockLaba = Math.round(blockOmzet * dynamicMarginRatio);
          const label = dayCount === 1 
            ? format(blockStart, 'HH:00')
            : format(blockStart, 'd MMM, HH:00', { locale: localeId });

          intervalPoints.push({
            date: format(blockStart, 'yyyy-MM-dd HH:mm'),
            label,
            omzet: blockOmzet,
            pesanan: blockPesanan,
            laba: blockLaba,
          });

          cur.setTime(cur.getTime() + stepHours * 3600 * 1000);
        }

        chartData = intervalPoints;
      } else {
        // Daily intervals (Net Sales = totalAmount - discount)
        const dailyData = await db.select({
          dayDate: sql<string>`to_char(${transactions.createdAt}, 'YYYY-MM-DD')`,
          omzet: sql<number>`COALESCE(sum(${transactions.totalAmount} - COALESCE(${transactions.discount}, 0)), 0)::numeric`,
          pesanan: sql<number>`count(${transactions.id})::int`,
        })
        .from(transactions)
        .where(dateFilter)
        .groupBy(sql`to_char(${transactions.createdAt}, 'YYYY-MM-DD')`);

        const dailyMap = new Map<string, { omzet: number; pesanan: number }>();
        dailyData.forEach(d => {
          dailyMap.set(d.dayDate, { omzet: Number(d.omzet), pesanan: d.pesanan });
        });

        // Generate all dates in interval
        const allDays = eachDayOfInterval({ start: startDate, end: endDate });
        chartData = allDays.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const dInfo = dailyMap.get(key) || { omzet: 0, pesanan: 0 };
          const dLaba = Math.round(dInfo.omzet * dynamicMarginRatio);
          const label = tab === 'bulanan' ? format(day, 'd MMM', { locale: localeId }) : format(day, 'EEE, d MMM', { locale: localeId });
          return {
            date: key,
            label,
            omzet: dInfo.omzet,
            pesanan: dInfo.pesanan,
            laba: dLaba,
          };
        });
      }
    }

    // 6. Top Selling Products with Share %
    const maxSold = topProductsRes.length > 0 ? (topProductsRes[0].totalSold || 1) : 1;
    const topProducts: TopSellingProduct[] = topProductsRes.map(p => ({
      id: p.id,
      name: p.name,
      totalSold: p.totalSold || 0,
      totalRevenue: Number(p.totalRevenue || 0),
      sharePercentage: Math.round(((p.totalSold || 0) / maxSold) * 100),
    }));

    // 7. Operational Pulse & Attention Items
    const rawActiveShift = activeShiftRes[0];
    let hoursOpen = 0;
    if (rawActiveShift?.startTime) {
      hoursOpen = Math.round((now.getTime() - new Date(rawActiveShift.startTime).getTime()) / (1000 * 60 * 60));
    }

    const activeShift = rawActiveShift ? {
      id: rawActiveShift.id,
      cashierName: rawActiveShift.cashierName || 'Kasir Aktif',
      startedAt: format(new Date(rawActiveShift.startTime), 'HH:mm (d MMM)', { locale: localeId }),
      startingCash: Number(rawActiveShift.startingCash || 0),
      hoursOpen,
    } : null;

    // Devices health
    const totalDevices = devicesRes.length;
    const oneDayAgo = subDays(now, 1);
    let offlineCount = 0;
    const deviceList = devicesRes.map(d => {
      const isOffline = !d.lastSeenAt || new Date(d.lastSeenAt) < oneDayAgo || d.status !== 'ACTIVE';
      if (isOffline) offlineCount++;
      return {
        id: d.id,
        name: d.name,
        status: d.status,
        lastSeenAt: d.lastSeenAt ? format(new Date(d.lastSeenAt), 'd MMM, HH:mm', { locale: localeId }) : null,
      };
    });

    const stockStats = stockStatsRes[0] || { total: 0, safe: 0, low: 0, outOfStock: 0 };
    const todayOrders = todayTxRes[0] || { completed: 0, pending: 0, total: 0 };

    const operationalPulse: OperationalPulse = {
      activeShift,
      devices: {
        total: totalDevices,
        active: Math.max(0, totalDevices - offlineCount),
        offline: offlineCount,
        list: deviceList,
      },
      stockHealth: {
        total: stockStats.total || 0,
        safe: stockStats.safe || 0,
        low: stockStats.low || 0,
        outOfStock: stockStats.outOfStock || 0,
      },
      todayOrders: {
        completed: todayOrders.completed || 0,
        pending: todayOrders.pending || 0,
        total: todayOrders.total || 0,
      },
    };

    // Attention Items calculation
    const attentionItems: AttentionItem[] = [];
    const criticalAlerts: string[] = [];

    // Check low stock
    if (lowStockItemsRes.length > 0) {
      const lowCount = (stockStats.low || 0) + (stockStats.outOfStock || 0);
      criticalAlerts.push(`${lowCount} item stok kritis`);
      lowStockItemsRes.forEach(item => {
        attentionItems.push({
          id: `stock-${item.id}`,
          type: 'stock',
          title: `Stok Menipis: ${item.name}`,
          description: `Tersisa ${item.stock} pcs (batas minimum: ${item.minStock} pcs)`,
          severity: item.stock <= 0 ? 'critical' : 'warning',
          actionLabel: 'Kelola Stok',
          actionHref: `/outlet/${outletKey}/inventory`,
        });
      });
    }

    // Check unclosed shift (> 14h)
    if (activeShift && activeShift.hoursOpen >= 14) {
      criticalAlerts.push('Shift kasir > 14 jam belum ditutup');
      attentionItems.push({
        id: `shift-${activeShift.id}`,
        type: 'shift',
        title: 'Shift Kasir Berjalan Terlalu Lama',
        description: `Shift kasir oleh ${activeShift.cashierName} telah aktif selama ${activeShift.hoursOpen} jam. Pastikan shift segera ditutup.`,
        severity: 'warning',
        actionLabel: 'Tutup Shift',
        actionHref: `/outlet/${outletKey}/shifts`,
      });
    }

    // Check offline devices
    if (offlineCount > 0) {
      criticalAlerts.push(`${offlineCount} perangkat butuh perhatian`);
      deviceList.filter(d => !d.lastSeenAt || new Date(d.lastSeenAt) < oneDayAgo).forEach(d => {
        attentionItems.push({
          id: `device-${d.id}`,
          type: 'device',
          title: `Perangkat Offline: ${d.name}`,
          description: d.lastSeenAt ? `Terakhir aktif ${d.lastSeenAt}` : 'Belum pernah sinkronisasi',
          severity: 'warning',
          actionLabel: 'Cek Perangkat',
          actionHref: `/outlet/${outletKey}/settings/devices`,
        });
      });
    }

    // 8. Generate Actionable F&B Business Insights (No Fluff, Data-Driven)
    const insights: BusinessInsight[] = [];

    // A. Discount Rate / Margin Protection Insight
    const discountRate = curGrossSales > 0 ? Number(((curTotalDiscount / curGrossSales) * 100).toFixed(1)) : 0;
    if (curGrossSales > 0 && curTotalDiscount > 0) {
      if (discountRate <= 8) {
        insights.push({
          id: 'insight-discount',
          type: 'profit',
          text: `Tingkat Diskon Sehat: Pemotongan diskon sebesar ${discountRate}% (Rp ${curTotalDiscount.toLocaleString('id-ID')}) dari penjualan bruto masih berada dalam batas aman industri F&B (< 8%).`,
        });
      } else {
        insights.push({
          id: 'insight-discount',
          type: 'profit',
          text: `Peringatan Promosi: Tingkat diskon mencapai ${discountRate}% dari penjualan bruto. Evaluasi efektivitas promo agar tidak menggerus margin kontribusi menu utama.`,
        });
      }
    }

    // B. Peak Operational Rush Hour
    let peakPoint: ChartDataPoint | null = null;
    for (const pt of chartData) {
      if (!pt.isFuture && (!peakPoint || pt.pesanan > peakPoint.pesanan)) {
        peakPoint = pt;
      }
    }
    if (peakPoint && peakPoint.pesanan > 0) {
      insights.push({
        id: 'insight-peak',
        type: 'peak',
        text: `Jam Sibuk Operasional: Lonjakan pesanan tertinggi terjadi pada ${peakPoint.label} (${peakPoint.pesanan} transaksi). Optimalkan alokasi staf dan kesiapan bahan di jam tersebut.`,
      });
    }

    // C. COGS & Margin Health
    if (curNetSales > 0 && curCost > 0) {
      insights.push({
        id: 'insight-cogs',
        type: 'profit',
        text: `Pengendalian HPP (COGS): Beban modal bahan sebesar ${curCogsRatio}% dari Net Revenue (Rp ${curCost.toLocaleString('id-ID')}). ${curCogsRatio <= 38 ? 'Tingkat efisiensi biaya prima sangat baik (< 38%).' : 'Evaluasi potensi pemborosan bahan atau kenaikan harga supplier.'}`,
      });
    }

    // D. Champion Product & Velocity
    if (topProducts.length > 0 && topProducts[0].totalSold > 0) {
      insights.push({
        id: 'insight-champion',
        type: 'champion',
        text: `Menu Unggulan: ${topProducts[0].name} menjadi kontributor volume tertinggi (${topProducts[0].totalSold} porsi terjual). Pertimbangkan paket bundling atau variasi topping tambahan.`,
      });
    }

    // E. Basket Size (AOV) Insight
    if (curAov > 0) {
      insights.push({
        id: 'insight-basket',
        type: 'basket',
        text: `Rata-rata Nilai Transaksi (AOV): Tercatat Rp ${curAov.toLocaleString('id-ID')} per tiket belanja. Dorong kasir melakukan upselling minuman & side-dish untuk meningkatkan nilai keranjang.`,
      });
    }

    // F. Storefront Self-Order Adoption Insight
    const totalChannelOrders = posCount + storefrontCount;
    if (totalChannelOrders > 0 && storefrontCount > 0) {
      const storefrontRatio = Math.round((storefrontCount / totalChannelOrders) * 100);
      insights.push({
        id: 'insight-channel',
        type: 'trend',
        text: `Adopsi Storefront Mandiri: ${storefrontRatio}% pesanan (${storefrontCount} transaksi) dipesan mandiri oleh pelanggan via QR meja/Storefront, mempercepat alur antrean kasir.`,
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: 'insight-default',
        type: 'trend',
        text: 'Belum ada transaksi selesai pada periode ini. Data operasional siap tercatat secara otomatis saat kasir melayani pesanan.',
      });
    }

    // 9. Hero / Outlet Overview Structure
    const outlet: OutletOverviewData = {
      outletName: tenant.name,
      outletKey: tenant.outletKey,
      slug: tenant.slug,
      storeDescription: tenant.storeDescription ?? null,
      storefrontEnabled: Boolean(tenant.storefrontEnabled),
      staffCount: staffCountRes[0]?.count || 1,
      deviceCount: totalDevices,
      totalLifetimeTransactions: lifetimeTxRes[0]?.count || 0,
      userName: userName || 'Owner',
      activeAlertCount: criticalAlerts.length,
      criticalAlerts,
    };

    return {
      success: true,
      tab,
      periodLabel,
      outlet,
      metrics,
      chartData,
      topProducts,
      paymentMix,
      channelMix,
      operationalPulse,
      attentionItems,
      annualBreakdown,
      bestMonthName,
      insights,
    };
  } catch (error: any) {
    console.error('Error fetching dashboard data for tenant:', error);
    return {
      success: false,
      error: error.message || 'Gagal memuat data dashboard outlet',
    } as any;
  }
}

export async function getOutletDashboardData(
  outletKey: string,
  searchParams: {
    tab?: string;
    preset?: string;
    from?: string;
    to?: string;
    month?: string; // YYYY-MM
    year?: string;  // YYYY
  }
): Promise<DashboardResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' } as any;
    }

    // 1. Resolve tenant strictly by outletKey
    const [tenant] = await db.select()
      .from(tenants)
      .where(eq(tenants.outletKey, outletKey))
      .limit(1);

    if (!tenant) {
      return { success: false, error: 'Outlet tidak ditemukan' } as any;
    }

    return await getDashboardDataForTenant(tenant, user.name || 'Owner', searchParams);
  } catch (error: any) {
    console.error('Error fetching outlet dashboard data:', error);
    return {
      success: false,
      error: error.message || 'Gagal memuat data dashboard outlet',
    } as any;
  }
}

// Backward-compatible actions
export async function getDashboardMetrics(startDate: Date, endDate: Date) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }
    const tenantId = user.tenantId;

    const dateFilter = and(
      eq(transactions.tenantId, tenantId),
      gte(transactions.createdAt, startDate),
      lte(transactions.createdAt, endDate),
      eq(transactions.status, 'COMPLETED')
    );

    const txResult = await db.select({
      totalTransactions: sql<number>`count(${transactions.id})::int`,
      totalOmzet: sql<number>`COALESCE(sum(${transactions.grandTotal}), 0)::numeric`,
    }).from(transactions).where(dateFilter);

    const profitResult = await db.select({
      totalRevenue: sql<number>`COALESCE(sum(${transactionItems.subtotal}), 0)::numeric`,
      totalCost: sql<number>`COALESCE(sum(${transactionItems.quantity} * ${products.costPrice}), 0)::numeric`,
    })
    .from(transactionItems)
    .innerJoin(products, eq(transactionItems.productId, products.id))
    .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
    .where(dateFilter);

    const revenue = Number(profitResult[0]?.totalRevenue || 0);
    const cost = Number(profitResult[0]?.totalCost || 0);

    const prodResult = await db.select({ count: sql<number>`count(${products.id})::int` })
      .from(products)
      .where(eq(products.tenantId, tenantId));

    return {
      success: true,
      data: {
        totalTransactions: txResult[0]?.totalTransactions || 0,
        totalOmzet: Number(txResult[0]?.totalOmzet || 0),
        totalLaba: Math.max(0, revenue - cost),
        totalProduk: prodResult[0]?.count || 0
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return { success: false, error: 'Gagal mengambil metrik dashboard' };
  }
}

export async function getTopSellingProducts(startDate: Date, endDate: Date) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }

    const result = await db.select({
      name: products.name,
      totalSold: sql<number>`sum(${transactionItems.quantity})::int`
    })
    .from(transactionItems)
    .innerJoin(products, eq(transactionItems.productId, products.id))
    .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
    .where(and(
      eq(transactions.tenantId, user.tenantId),
      gte(transactions.createdAt, startDate),
      lte(transactions.createdAt, endDate),
      eq(transactions.status, 'COMPLETED')
    ))
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
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }

    const result = await db.select({
      name: products.name,
      stock: products.stock,
      minStock: products.minStock
    })
    .from(products)
    .where(and(
      eq(products.tenantId, user.tenantId),
      sql`${products.stock} <= ${products.minStock}`
    ))
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
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }

    const groupBySql = groupBy === 'day' ? sql`to_char(${transactions.createdAt}, 'YYYY-MM-DD')` : (groupBy === 'month' ? sql`to_char(${transactions.createdAt}, 'YYYY-MM')` : sql`to_char(${transactions.createdAt}, 'YYYY')`);

    const result = await db.select({
      date: sql<string>`${groupBySql}`,
      omzet: sql<number>`COALESCE(sum(${transactions.grandTotal}), 0)::numeric`
    })
    .from(transactions)
    .where(and(
      eq(transactions.tenantId, user.tenantId),
      gte(transactions.createdAt, startDate),
      lte(transactions.createdAt, endDate),
      eq(transactions.status, 'COMPLETED')
    ))
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
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }

    const result = await db.select({
      id: transactions.id,
      date: transactions.createdAt,
      totalAmount: transactions.grandTotal,
      paymentMethod: transactions.paymentMethod,
      status: transactions.status
    })
    .from(transactions)
    .where(eq(transactions.tenantId, user.tenantId))
    .orderBy(desc(transactions.createdAt))
    .limit(limitCount);

    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return { success: false, error: 'Gagal mengambil transaksi terbaru' };
  }
}
