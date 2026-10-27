'use server';

import { db } from '@/lib/db';
import { transactions, transactionItems, products, shifts, tenants, memberships } from '@/lib/db/schema';
import { eq, desc, asc, sql, and, or, ilike, inArray, gte, lte, lt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import { insertPosTransaction, type PosCheckoutPayload } from '@/lib/pos/create-pos-transaction';

export type GetTransactionsParams = {
  search?: string;
  status?: string; // 'all' | 'on_process' | 'completed' | 'pending_payment' | 'cancelled'
  timeRange?: string; // 'all' | 'today' | 'yesterday' | '7days' | 'this_month' | 'custom'
  startDate?: string;
  endDate?: string;
  orderType?: string; // 'all' | 'dine_in' | 'takeaway' | 'delivery'
  source?: string; // 'all' | 'pos' | 'storefront'
  sortBy?: string; // 'newest' | 'oldest' | 'amount_high' | 'amount_low'
  page?: number;
  limit?: number;
};

export async function createTransaction(payload: PosCheckoutPayload) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized or no dashboard' };

    // QRIS dinamis tidak boleh dicatat lunas oleh kasir: harus lewat konfirmasi DOKU.
    if ((payload.paymentMethod || '').toUpperCase() === 'QRIS_DYNAMIC') {
      return { success: false, error: 'QRIS dinamis harus dibayar lewat kode QR DOKU.' };
    }

    const created = await insertPosTransaction({
      tenantId: user.tenantId,
      cashierMembershipId: user.id,
      payload,
      mode: 'PAID',
    });

    if (user && typeof user === "object" && "outletKey" in user) { revalidatePath(`/outlet/${user.outletKey}`, "layout"); }
    return { success: true, transactionId: created.id };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { success: false, error: 'Gagal memproses transaksi.' };
  }
}

export async function getTransactions(params?: GetTransactionsParams) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized or no dashboard' };
    }

    const tenantId = user.tenantId;
    const page = Math.max(1, Number(params?.page || 1));
    const limit = Math.max(1, Math.min(100, Number(params?.limit || 25)));
    const offset = (page - 1) * limit;

    // 1. Time-window conditions (tenantId + time filter) - PURE EXECUTIVE PERIOD
    const timeConditions: any[] = [eq(transactions.tenantId, tenantId)];

    const selectedTimeRange = params?.timeRange || 'this_month';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (selectedTimeRange !== 'all') {
      if (selectedTimeRange === 'today') {
        timeConditions.push(gte(transactions.createdAt, startOfToday));
      } else if (selectedTimeRange === 'yesterday') {
        timeConditions.push(
          and(gte(transactions.createdAt, startOfYesterday), lt(transactions.createdAt, startOfToday))
        );
      } else if (selectedTimeRange === '7days') {
        timeConditions.push(gte(transactions.createdAt, sevenDaysAgo));
      } else if (selectedTimeRange === 'this_month') {
        timeConditions.push(gte(transactions.createdAt, startOfMonth));
      } else if (selectedTimeRange === 'custom' && params?.startDate) {
        const start = new Date(params.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(params.endDate || params.startDate);
        end.setHours(23, 59, 59, 999);
        timeConditions.push(and(gte(transactions.createdAt, start), lte(transactions.createdAt, end)));
      }
    }

    // 2. Table-specific conditions (timeConditions + search + status + orderType + source)
    const tableConditions: any[] = [...timeConditions];

    // 2A. Search Query (ILIKE across orderNumber, customerName, tableNumber, paymentMethod, id)
    if (params?.search && params.search.trim().length > 0) {
      const q = `%${params.search.trim()}%`;
      tableConditions.push(
        or(
          ilike(transactions.orderNumber, q),
          ilike(transactions.customerName, q),
          ilike(transactions.tableNumber, q),
          ilike(transactions.paymentMethod, q),
          sql`CAST(${transactions.id} AS TEXT) ILIKE ${q}`
        )
      );
    }

    // 2B. Status Condition
    if (params?.status && params.status !== 'all') {
      if (params.status === 'completed') {
        tableConditions.push(
          or(eq(transactions.status, 'COMPLETED'), eq(transactions.paymentStatus, 'PAID'))
        );
      } else if (params.status === 'on_process') {
        tableConditions.push(
          and(
            inArray(transactions.status, ['PROCESSING', 'NEW', 'READY']),
            sql`${transactions.paymentStatus} != 'PAID'`
          )
        );
      } else if (params.status === 'pending_payment') {
        tableConditions.push(inArray(transactions.paymentStatus, ['PENDING', 'UNPAID']));
      } else if (params.status === 'cancelled') {
        tableConditions.push(
          or(
            inArray(transactions.status, ['CANCELLED', 'CANCELED']),
            inArray(transactions.paymentStatus, ['CANCELED', 'REFUNDED'])
          )
        );
      }
    }

    // 2C. Order Type Filter
    if (params?.orderType && params.orderType !== 'all') {
      if (params.orderType === 'dine_in') {
        tableConditions.push(eq(transactions.orderType, 'DINE_IN'));
      } else if (params.orderType === 'takeaway') {
        tableConditions.push(
          or(ilike(transactions.orderType, '%TAKE%'), ilike(transactions.orderType, '%BUNGKUS%'))
        );
      } else if (params.orderType === 'delivery') {
        tableConditions.push(
          or(
            ilike(transactions.orderType, '%DELIV%'),
            ilike(transactions.orderType, '%GRAB%'),
            ilike(transactions.orderType, '%GOFOOD%'),
            ilike(transactions.orderType, '%SHOPEE%')
          )
        );
      }
    }

    // 2D. Source Filter
    if (params?.source && params.source !== 'all') {
      if (params.source === 'pos') {
        tableConditions.push(eq(transactions.source, 'POS'));
      } else if (params.source === 'storefront') {
        tableConditions.push(
          inArray(transactions.source, ['ONLINE', 'WEB_ORDER', 'STOREFRONT', 'QR', 'DELIVERY'])
        );
      }
    }

    // 3. Sorting
    let sortOrder = desc(transactions.createdAt);
    if (params?.sortBy === 'oldest') {
      sortOrder = asc(transactions.createdAt);
    } else if (params?.sortBy === 'amount_high') {
      sortOrder = desc(transactions.grandTotal);
    } else if (params?.sortBy === 'amount_low') {
      sortOrder = asc(transactions.grandTotal);
    }

    // 4. Parallel Queries via Promise.allSettled:
    // - rowsQuery: Fetches active page rows matching tableConditions
    // - countFilteredQuery: Counts total rows matching tableConditions for pagination
    // - periodStatsQuery: Computes KPI summary and tab counts based ONLY on timeConditions (decoupled from search/status filters)
    const rowsQuery = db
      .select()
      .from(transactions)
      .where(and(...tableConditions))
      .orderBy(sortOrder)
      .limit(limit)
      .offset(offset);

    const countFilteredQuery = db
      .select({
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(transactions)
      .where(and(...tableConditions));

    const periodStatsQuery = db
      .select({
        totalOrders: sql<number>`CAST(COUNT(*) AS INTEGER)`,
        totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.paymentStatus} = 'PAID' OR ${transactions.status} = 'COMPLETED' THEN CAST(${transactions.grandTotal} AS NUMERIC) ELSE 0 END), 0)`,
        countCompleted: sql<number>`CAST(COUNT(*) FILTER (WHERE ${transactions.status} = 'COMPLETED' OR ${transactions.paymentStatus} = 'PAID') AS INTEGER)`,
        countOnProcess: sql<number>`CAST(COUNT(*) FILTER (WHERE ${transactions.status} IN ('PROCESSING', 'NEW', 'READY') AND ${transactions.paymentStatus} != 'PAID') AS INTEGER)`,
        countPending: sql<number>`CAST(COUNT(*) FILTER (WHERE ${transactions.paymentStatus} IN ('PENDING', 'UNPAID')) AS INTEGER)`,
        countCancelled: sql<number>`CAST(COUNT(*) FILTER (WHERE ${transactions.status} IN ('CANCELLED', 'CANCELED') OR ${transactions.paymentStatus} IN ('CANCELED', 'REFUNDED')) AS INTEGER)`,
      })
      .from(transactions)
      .where(and(...timeConditions));

    const [rowsResult, countResult, statsResult] = await Promise.allSettled([
      rowsQuery,
      countFilteredQuery,
      periodStatsQuery,
    ]);

    // Handle data rows
    const data = rowsResult.status === 'fulfilled' ? rowsResult.value : [];

    // Handle total filtered count for pagination
    let totalMatchingItems = data.length;
    if (countResult.status === 'fulfilled' && countResult.value.length > 0) {
      totalMatchingItems = Number(countResult.value[0].count) || 0;
    }

    // Handle period stats with resilient fallback
    let stats = {
      totalOrders: totalMatchingItems,
      totalRevenue: data
        .filter((r) => r.paymentStatus === 'PAID' || r.status === 'COMPLETED')
        .reduce((sum, r) => sum + parseFloat(r.grandTotal || '0'), 0),
      countCompleted: data.filter((r) => r.paymentStatus === 'PAID' || r.status === 'COMPLETED').length,
      countOnProcess: data.filter((r) => ['PROCESSING', 'NEW', 'READY'].includes(r.status) && r.paymentStatus !== 'PAID').length,
      countPending: data.filter((r) => ['PENDING', 'UNPAID'].includes(r.paymentStatus || '')).length,
      countCancelled: data.filter((r) => ['CANCELLED', 'CANCELED'].includes(r.status) || ['CANCELED', 'REFUNDED'].includes(r.paymentStatus || '')).length,
    };

    if (statsResult.status === 'fulfilled' && statsResult.value.length > 0) {
      const s = statsResult.value[0];
      stats = {
        totalOrders: Number(s.totalOrders) || 0,
        totalRevenue: parseFloat(String(s.totalRevenue || 0)),
        countCompleted: Number(s.countCompleted) || 0,
        countOnProcess: Number(s.countOnProcess) || 0,
        countPending: Number(s.countPending) || 0,
        countCancelled: Number(s.countCancelled) || 0,
      };
    }

    const totalPages = Math.max(1, Math.ceil(totalMatchingItems / limit));
    const aov = stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0;

    return {
      success: true,
      data,
      summary: {
        totalRevenue: stats.totalRevenue,
        totalOrders: stats.totalOrders,
        aov,
      },
      statusCounts: {
        all: stats.totalOrders,
        completed: stats.countCompleted,
        onProcess: stats.countOnProcess,
        pendingPayment: stats.countPending,
        cancelled: stats.countCancelled,
      },
      pagination: {
        page,
        limit,
        totalItems: totalMatchingItems,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return { success: false, error: 'Gagal mengambil data transaksi.' };
  }
}

export async function getTransactionDetails(transactionId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    const [trx] = await db
      .select({
        id: transactions.id,
        totalAmount: transactions.totalAmount,
        discount: transactions.discount,
        tax: transactions.tax,
        serviceCharge: transactions.serviceCharge,
        platformFee: transactions.platformFee,
        rounding: transactions.rounding,
        gatewayFee: transactions.gatewayFee,
        netAmount: transactions.netAmount,
        grandTotal: transactions.grandTotal,
        promoCode: transactions.promoCode,
        paymentMethod: transactions.paymentMethod,
        paymentStatus: transactions.paymentStatus,
        status: transactions.status,
        source: transactions.source,
        orderType: transactions.orderType,
        customerName: transactions.customerName,
        customerPhone: transactions.customerPhone,
        tableNumber: transactions.tableNumber,
        orderNumber: transactions.orderNumber,
        voidReason: transactions.voidReason,
        voidedAt: transactions.voidedAt,
        createdAt: transactions.createdAt,
        cashierName: memberships.displayName,
      })
      .from(transactions)
      .leftJoin(memberships, eq(transactions.cashierMembershipId, memberships.id))
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.tenantId, user.tenantId)
        )
      )
      .limit(1);

    if (!trx) {
      return { success: false, error: 'Transaksi tidak ditemukan.' };
    }

    const items = await db
      .select({
        id: transactionItems.id,
        productId: transactionItems.productId,
        productName: products.name,
        quantity: transactionItems.quantity,
        price: transactionItems.price,
        subtotal: transactionItems.subtotal,
        modifiers: transactionItems.modifiers,
        notes: transactionItems.notes,
      })
      .from(transactionItems)
      .leftJoin(products, eq(transactionItems.productId, products.id))
      .where(
        and(
          eq(transactionItems.transactionId, trx.id),
          eq(transactionItems.tenantId, user.tenantId)
        )
      );

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, user.tenantId))
      .limit(1);

    return {
      success: true,
      data: {
        transaction: trx,
        items: items.map(it => ({
          name: it.productName || 'Item Menu',
          quantity: it.quantity,
          price: parseFloat(it.price || '0'),
          subtotal: parseFloat(it.subtotal || '0'),
          modifiers: it.modifiers,
          notes: it.notes,
        })),
        settings: tenant,
      },
    };
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return { success: false, error: 'Gagal mengambil detail transaksi.' };
  }
}

export async function voidTransaction(payload: { transactionId: string; reason: string; restock?: boolean }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized: Sesi tidak ditemukan.' };
    }

    const tenantId = user.tenantId;

    if (user.role !== 'OWNER' && user.role !== 'MANAGER' && (user.role as string) !== 'SYSTEM_ADMIN') {
      return { success: false, error: 'Hanya OWNER atau MANAGER yang memiliki otorisasi untuk membatalkan (void) transaksi.' };
    }

    if (!payload.reason || payload.reason.trim().length < 3) {
      return { success: false, error: 'Wajib menyertakan alasan pembatalan transaksi secara jelas.' };
    }

    let orderNumberDisplay = '';

    await db.transaction(async (tx) => {
      // Row-Level Lock: Lock this transaction row so no concurrent void can proceed
      const [lockedTrx] = await tx
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.id, payload.transactionId),
            eq(transactions.tenantId, tenantId)
          )
        )
        .for('update');

      if (!lockedTrx) {
        throw new Error('Transaksi tidak ditemukan.');
      }

      if (lockedTrx.status === 'CANCELLED' || lockedTrx.paymentStatus === 'CANCELED') {
        throw new Error('Transaksi ini sudah pernah dibatalkan sebelumnya.');
      }

      orderNumberDisplay = lockedTrx.orderNumber || lockedTrx.id.slice(0, 8);

      // 1. Update status to CANCELLED with immutable audit fields
      await tx
        .update(transactions)
        .set({
          status: 'CANCELLED',
          paymentStatus: 'CANCELED',
          voidReason: payload.reason.trim(),
          voidedAt: new Date(),
          voidedByMembershipId: user.id,
        })
        .where(eq(transactions.id, lockedTrx.id));

      // 2. Optional restock of items
      if (payload.restock !== false) {
        const items = await tx
          .select()
          .from(transactionItems)
          .where(eq(transactionItems.transactionId, lockedTrx.id));

        for (const item of items) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(products.id, item.productId),
                eq(products.tenantId, tenantId),
                eq(products.trackStock, true)
              )
            );
        }
      }
    });

    if (user && typeof user === 'object' && 'outletKey' in user) {
      revalidatePath(`/outlet/${user.outletKey}/transactions`, 'page');
      revalidatePath(`/outlet/${user.outletKey}/reports`, 'page');
      revalidatePath(`/outlet/${user.outletKey}/orders`, 'page');
    }

    return {
      success: true,
      message: `Transaksi ${orderNumberDisplay} berhasil dibatalkan dan tercatat dalam log audit anti-fraud.`,
    };
  } catch (error: any) {
    console.error('Error voiding transaction:', error);
    return { success: false, error: error.message || 'Gagal membatalkan transaksi.' };
  }
}

