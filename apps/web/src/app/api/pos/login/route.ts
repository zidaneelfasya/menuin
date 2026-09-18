import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memberships, posDevices, posSessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'fallback_secret';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== 'pos_device') {
      return NextResponse.json({ error: 'Invalid token type' }, { status: 401 });
    }

    const { membershipId, pin } = await req.json();

    if (!membershipId || !pin) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // Verify device is still ACTIVE
    const [device] = await db.select().from(posDevices).where(
      and(eq(posDevices.id, decoded.deviceId), eq(posDevices.status, 'ACTIVE'))
    ).limit(1);

    if (!device) {
      return NextResponse.json({ error: 'Perangkat sudah dicabut aksesnya' }, { status: 403 });
    }

    // Verify membership and PIN
    const [membership] = await db.select().from(memberships).where(
      and(eq(memberships.id, membershipId), eq(memberships.tenantId, decoded.tenantId), eq(memberships.status, 'ACTIVE'))
    ).limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'Staff tidak ditemukan atau tidak aktif' }, { status: 404 });
    }

    if (!membership.pinHash) {
      return NextResponse.json({ error: 'Staff belum mengatur PIN' }, { status: 400 });
    }

    const isValid = await bcrypt.compare(pin, membership.pinHash);
    if (!isValid) {
      return NextResponse.json({ error: 'PIN salah' }, { status: 401 });
    }

    // Create session
    const [session] = await db.insert(posSessions).values({
      tenantId: decoded.tenantId,
      deviceId: decoded.deviceId,
      membershipId: membership.id,
      status: 'ACTIVE',
    }).returning();

    // Generate Session JWT
    const sessionToken = jwt.sign({
      sessionId: session.id,
      deviceId: decoded.deviceId,
      tenantId: decoded.tenantId,
      membershipId: membership.id,
      role: membership.role,
      type: 'pos_session'
    }, JWT_SECRET, { expiresIn: '12h' });

    // Update last seen
    await db.update(posDevices).set({ lastSeenAt: new Date() }).where(eq(posDevices.id, decoded.deviceId));

    return NextResponse.json({
      success: true,
      sessionToken,
      staff: {
        id: membership.id,
        role: membership.role
      }
    });

  } catch (error: any) {
    console.error('POS Login API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
