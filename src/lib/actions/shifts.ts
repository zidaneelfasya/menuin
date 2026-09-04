'use server';

import { db } from '@/lib/db';
import { shifts, cashMovements, transactions, transactionItems, products, users, tenants } from '@/lib/db/schema';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

// 1. Get active shift for current user (or any user in tenant if they have one)
export async function getActiveShift() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    const activeShifts = await db
      .select({
        id: shifts.id,
        tenantId: shifts.tenantId,
        userId: shifts.userId,
        startTime: shifts.startTime,
        endTime: shifts.endTime,
        startingCash: shifts.startingCash,
        actualCash: shifts.actualCash,
        expectedCash: shifts.expectedCash,
        cashDifference: shifts.cashDifference,
        status: shifts.status,
        createdAt: shifts.createdAt,
        updatedAt: shifts.updatedAt,
        cashierName: users.name,
      })
      .from(shifts)
      .leftJoin(users, eq(shifts.userId, users.id))
      .where(
        and(
          eq(shifts.tenantId, user.tenantId),
          eq(shifts.status, 'ACTIVE')
        )
      )
      .orderBy(desc(shifts.createdAt))
      .limit(1);

    if (activeShifts.length === 0) {
      return { success: true, data: null };
    }

    const shift = activeShifts[0];
    
    // Fetch all transactions in this shift
    const txs = await db
      .select()
      .from(transactions)
      .where(eq(transactions.shiftId, shift.id))
      .orderBy(desc(transactions.createdAt));

    // Fetch sold items summary
    const soldItemsSummary = await db
      .select({
        totalItemsSold: sql<number>`CAST(COALESCE(SUM(${transactionItems.quantity}), 0) AS INT)`
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactions.id, transactionItems.transactionId))
      .where(
        and(
          eq(transactions.shiftId, shift.id),
          eq(transactions.paymentStatus, 'PAID')
        )
      );

    // Fetch cash movements
    const movements = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.shiftId, shift.id))
      .orderBy(desc(cashMovements.createdAt));

    // Calculate metrics
    const paidTxs = txs.filter(t => t.paymentStatus === 'PAID');
    const pendingTxs = txs.filter(t => t.paymentStatus === 'PENDING');

    const totalTransactions = paidTxs.length;
    const totalSales = paidTxs.reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0);
    
    const totalCashSales = paidTxs
      .filter(t => t.paymentMethod?.toUpperCase() === 'CASH')
      .reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0);

    const totalQrisSales = paidTxs
      .filter(t => t.paymentMethod?.toUpperCase() === 'QRIS')
      .reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0);

    const totalDebitSales = paidTxs
      .filter(t => t.paymentMethod?.toUpperCase() === 'DEBIT' || t.paymentMethod?.toUpperCase() === 'CARD')
      .reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0);

    const totalTransferSales = paidTxs
      .filter(t => t.paymentMethod?.toUpperCase() === 'BANK_TRANSFER' || t.paymentMethod?.toUpperCase() === 'TRANSFER')
      .reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0);

    const totalOnlineSales = paidTxs
      .filter(t => t.source === 'ONLINE')
      .reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0);

    const totalPosSales = paidTxs
      .filter(t => t.source === 'POS')
      .reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0);

    const totalNonCashSales = totalQrisSales + totalDebitSales + totalTransferSales + (paidTxs.filter(t => t.paymentMethod?.toUpperCase() === 'ONLINE').reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0));

    const totalCashIn = movements
      .filter(m => m.type === 'IN')
      .reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

    const totalCashOut = movements
      .filter(m => m.type === 'OUT')
      .reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

    const startingCash = Number(shift.startingCash) || 0;
    const expectedCash = startingCash + totalCashSales + totalCashIn - totalCashOut;
    const averageOrderValue = totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;
    const totalItemsSold = Number(soldItemsSummary[0]?.totalItemsSold || 0);

    return { 
      success: true, 
      data: {
        ...shift,
        metrics: {
          totalCashSales,
          totalQrisSales,
          totalDebitSales,
          totalTransferSales,
          totalOnlineSales,
          totalPosSales,
          totalNonCashSales,
          totalCashIn,
          totalCashOut,
          startingCash,
          expectedCash,
          totalTransactions,
          totalSales,
          totalItemsSold,
          totalOnlineOrders: paidTxs.filter(t => t.source === 'ONLINE').length,
          totalPosOrders: paidTxs.filter(t => t.source === 'POS').length,
          pendingOrdersCount: pendingTxs.length,
          averageOrderValue,
        },
        transactions: txs.slice(0, 20),
        cashMovements: movements
      } 
    };
  } catch (error) {
    console.error('Error fetching active shift:', error);
    return { success: false, error: 'Failed to fetch active shift' };
  }
}

// 2. Start new shift
export async function startShift(startingCash: number) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    const existing = await getActiveShift();
    if (existing.success && existing.data) {
      return { success: false, error: 'Toko sudah memiliki shift yang aktif' };
    }

    const [newShift] = await db.insert(shifts).values({
      tenantId: user.tenantId,
      userId: user.id,
      startingCash: startingCash.toString(),
      status: 'ACTIVE'
    }).returning();

    revalidatePath('/tenants/shifts');
    revalidatePath('/tenants/pos');
    
    return { success: true, data: newShift };
  } catch (error) {
    console.error('Error starting shift:', error);
    return { success: false, error: 'Failed to start shift' };
  }
}

// 3. End shift
export async function endShift(shiftId: string, actualCash: number) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    const [shift] = await db.select().from(shifts).where(eq(shifts.id, shiftId));
    if (!shift || shift.status !== 'ACTIVE') {
      return { success: false, error: 'Invalid shift' };
    }

    const cashTx = await db
      .select({ total: sql<number>`COALESCE(SUM(${transactions.grandTotal}), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.shiftId, shiftId),
          eq(transactions.paymentMethod, 'CASH'),
          eq(transactions.paymentStatus, 'PAID')
        )
      );
      
    const movements = await db
      .select({
        totalIn: sql<number>`COALESCE(SUM(CASE WHEN ${cashMovements.type} = 'IN' THEN ${cashMovements.amount} ELSE 0 END), 0)`,
        totalOut: sql<number>`COALESCE(SUM(CASE WHEN ${cashMovements.type} = 'OUT' THEN ${cashMovements.amount} ELSE 0 END), 0)`
      })
      .from(cashMovements)
      .where(eq(cashMovements.shiftId, shiftId));

    const totalCashSales = Number(cashTx[0]?.total || 0);
    const totalCashIn = Number(movements[0]?.totalIn || 0);
    const totalCashOut = Number(movements[0]?.totalOut || 0);

    const expectedCash = Number(shift.startingCash) + totalCashSales + totalCashIn - totalCashOut;
    const cashDifference = actualCash - expectedCash;

    await db.update(shifts).set({
      status: 'ENDED',
      endTime: new Date(),
      actualCash: actualCash.toString(),
      expectedCash: expectedCash.toString(),
      cashDifference: cashDifference.toString()
    }).where(eq(shifts.id, shiftId));

    revalidatePath('/tenants/shifts');
    revalidatePath('/tenants/pos');
    
    return { success: true };
  } catch (error) {
    console.error('Error ending shift:', error);
    return { success: false, error: 'Failed to end shift' };
  }
}

// 4. Add Cash Movement
export async function addCashMovement(shiftId: string, type: 'IN' | 'OUT', amount: number, description: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    await db.insert(cashMovements).values({
      shiftId,
      type,
      amount: amount.toString(),
      description
    });

    revalidatePath('/tenants/shifts');
    return { success: true };
  } catch (error) {
    console.error('Error adding cash movement:', error);
    return { success: false, error: 'Failed to add cash movement' };
  }
}

// 5. Get Shift History
export async function getShiftHistory() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    const historyRows = await db
      .select({
        id: shifts.id,
        tenantId: shifts.tenantId,
        userId: shifts.userId,
        startTime: shifts.startTime,
        endTime: shifts.endTime,
        startingCash: shifts.startingCash,
        actualCash: shifts.actualCash,
        expectedCash: shifts.expectedCash,
        cashDifference: shifts.cashDifference,
        status: shifts.status,
        createdAt: shifts.createdAt,
        updatedAt: shifts.updatedAt,
        cashierName: users.name,
      })
      .from(shifts)
      .leftJoin(users, eq(shifts.userId, users.id))
      .where(eq(shifts.tenantId, user.tenantId))
      .orderBy(desc(shifts.createdAt));

    // Also get transaction counts & sales summary for each shift
    const enrichedHistory = await Promise.all(
      historyRows.map(async (shift) => {
        const txSummary = await db
          .select({
            count: sql<number>`CAST(COUNT(${transactions.id}) AS INT)`,
            total: sql<number>`COALESCE(SUM(${transactions.grandTotal}), 0)`
          })
          .from(transactions)
          .where(eq(transactions.shiftId, shift.id));

        return {
          ...shift,
          totalTransactions: Number(txSummary[0]?.count || 0),
          totalSales: Number(txSummary[0]?.total || 0),
        };
      })
    );

    return { success: true, data: enrichedHistory };
  } catch (error) {
    console.error('Error fetching shift history:', error);
    return { success: false, error: 'Failed to fetch shift history' };
  }
}

// 6. Get Shift Details
export async function getShiftDetails(shiftId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' };

    const shiftRows = await db
      .select({
        id: shifts.id,
        tenantId: shifts.tenantId,
        userId: shifts.userId,
        startTime: shifts.startTime,
        endTime: shifts.endTime,
        startingCash: shifts.startingCash,
        actualCash: shifts.actualCash,
        expectedCash: shifts.expectedCash,
        cashDifference: shifts.cashDifference,
        status: shifts.status,
        createdAt: shifts.createdAt,
        updatedAt: shifts.updatedAt,
        cashierName: users.name,
        restaurantName: tenants.name,
      })
      .from(shifts)
      .leftJoin(users, eq(shifts.userId, users.id))
      .leftJoin(tenants, eq(shifts.tenantId, tenants.id))
      .where(eq(shifts.id, shiftId));

    if (shiftRows.length === 0 || shiftRows[0].tenantId !== user.tenantId) {
      return { success: false, error: 'Shift not found' };
    }

    const shift = shiftRows[0];
    const txs = await db.select().from(transactions).where(eq(transactions.shiftId, shiftId)).orderBy(desc(transactions.createdAt));

    const soldItems = await db
      .select({
        productId: transactionItems.productId,
        name: products.name,
        totalQuantity: sql<number>`CAST(SUM(${transactionItems.quantity}) AS INT)`,
        totalRevenue: sql<number>`SUM(${transactionItems.subtotal})`
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactions.id, transactionItems.transactionId))
      .innerJoin(products, eq(products.id, transactionItems.productId))
      .where(eq(transactions.shiftId, shiftId))
      .groupBy(transactionItems.productId, products.name)
      .orderBy(desc(sql`SUM(${transactionItems.quantity})`));

    const movements = await db.select().from(cashMovements).where(eq(cashMovements.shiftId, shiftId)).orderBy(desc(cashMovements.createdAt));

    // Calculate detailed breakdown
    const paidTxs = txs.filter(t => t.paymentStatus === 'PAID');
    const totalTransactions = paidTxs.length;
    const totalItemsSold = soldItems.reduce((acc, p) => acc + (Number(p.totalQuantity) || 0), 0);
    const totalSales = paidTxs.reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0);

    const totalCashSales = paidTxs
      .filter(t => t.paymentMethod?.toUpperCase() === 'CASH')
      .reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0);

    const totalQrisSales = paidTxs
      .filter(t => t.paymentMethod?.toUpperCase() === 'QRIS')
      .reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0);

    const totalDebitSales = paidTxs
      .filter(t => t.paymentMethod?.toUpperCase() === 'DEBIT' || t.paymentMethod?.toUpperCase() === 'CARD')
      .reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0);

    const totalTransferSales = paidTxs
      .filter(t => t.paymentMethod?.toUpperCase() === 'BANK_TRANSFER' || t.paymentMethod?.toUpperCase() === 'TRANSFER')
      .reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0);

    const totalOnlineSales = paidTxs
      .filter(t => t.source === 'ONLINE')
      .reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0);

    const totalCashIn = movements
      .filter(m => m.type === 'IN')
      .reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

    const totalCashOut = movements
      .filter(m => m.type === 'OUT')
      .reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

    const startingCash = Number(shift.startingCash) || 0;
    const expectedCash = Number(shift.expectedCash) || (startingCash + totalCashSales + totalCashIn - totalCashOut);
    const actualCash = shift.actualCash !== null ? Number(shift.actualCash) : null;
    const cashDifference = shift.cashDifference !== null ? Number(shift.cashDifference) : (actualCash !== null ? actualCash - expectedCash : null);

    const metrics = {
      totalTransactions,
      totalItemsSold,
      totalSales,
      totalCashSales,
      totalQrisSales,
      totalDebitSales,
      totalTransferSales,
      totalOnlineSales,
      totalCashIn,
      totalCashOut,
      startingCash,
      expectedCash,
      actualCash,
      cashDifference,
    };

    return {
      success: true,
      data: {
        shift,
        metrics,
        transactions: txs,
        soldProducts: soldItems,
        cashMovements: movements
      }
    };
  } catch (error) {
    console.error('Error fetching shift details:', error);
    return { success: false, error: 'Failed to fetch shift details' };
  }
}
