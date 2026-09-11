import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shifts, cashMovements, transactions, transactionItems, memberships } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'menuin-pos-secret-key-change-in-prod';

async function verifyMobileAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.sub, 
      username: decoded.username,
      tenantId: decoded.tenantId,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

// GET Active Shift
export async function GET(req: NextRequest) {
  try {
    const user = await verifyMobileAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const activeShifts = await db
      .select({
        id: shifts.id,
        tenantId: shifts.tenantId,
        membershipId: shifts.membershipId,
        startTime: shifts.startTime,
        endTime: shifts.endTime,
        startingCash: shifts.startingCash,
        actualCash: shifts.actualCash,
        expectedCash: shifts.expectedCash,
        cashDifference: shifts.cashDifference,
        status: shifts.status,
        createdAt: shifts.createdAt,
        updatedAt: shifts.updatedAt,
        cashierName: memberships.displayName,
      })
      .from(shifts)
      .leftJoin(memberships, eq(shifts.membershipId, memberships.id))
      .where(
        and(
          eq(shifts.tenantId, user.tenantId),
          eq(shifts.status, 'ACTIVE')
        )
      )
      .orderBy(desc(shifts.createdAt))
      .limit(1);

    if (activeShifts.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    const shift = activeShifts[0];

    // Calculate metrics
    const txs = await db
      .select()
      .from(transactions)
      .where(eq(transactions.shiftId, shift.id));

    const movements = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.shiftId, shift.id));

    const paidTxs = txs.filter(t => t.paymentStatus === 'PAID');
    const totalTransactions = paidTxs.length;
    const totalSales = paidTxs.reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0);
    
    const totalCashSales = paidTxs
      .filter(t => t.paymentMethod?.toUpperCase() === 'CASH')
      .reduce((acc, t) => acc + (Number(t.grandTotal) || 0), 0);

    const totalCashIn = movements
      .filter(m => m.type === 'IN')
      .reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

    const totalCashOut = movements
      .filter(m => m.type === 'OUT')
      .reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

    const startingCash = Number(shift.startingCash) || 0;
    const expectedCash = startingCash + totalCashSales + totalCashIn - totalCashOut;

    return NextResponse.json({
      success: true,
      data: {
        ...shift,
        metrics: {
          totalCashSales,
          totalCashIn,
          totalCashOut,
          startingCash,
          expectedCash,
          totalTransactions,
          totalSales,
        }
      }
    });

  } catch (error) {
    console.error('Mobile API GET Active Shift Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST Start Shift
export async function POST(req: NextRequest) {
  try {
    const user = await verifyMobileAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const startingCash = Number(payload.startingCash) || 0;

    // Check if there is an active shift
    const existing = await db
      .select()
      .from(shifts)
      .where(
        and(
          eq(shifts.tenantId, user.tenantId),
          eq(shifts.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Outlet sudah memiliki shift yang aktif' }, { status: 400 });
    }

    const [newShift] = await db.insert(shifts).values({
      tenantId: user.tenantId,
      membershipId: user.id,
      startingCash: startingCash.toString(),
      status: 'ACTIVE'
    }).returning();

    return NextResponse.json({ success: true, data: newShift });
  } catch (error) {
    console.error('Mobile API POST Start Shift Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT End Shift
export async function PUT(req: NextRequest) {
  try {
    const user = await verifyMobileAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const actualCash = Number(payload.actualCash);
    const shiftId = payload.shiftId;

    if (!shiftId || actualCash === undefined) {
      return NextResponse.json({ error: 'Shift ID and actual cash are required' }, { status: 400 });
    }

    const [shift] = await db.select().from(shifts).where(eq(shifts.id, shiftId));
    if (!shift || shift.status !== 'ACTIVE' || shift.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Invalid or inactive shift' }, { status: 400 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mobile API PUT End Shift Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
