import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { devicePairingCodes, posDevices } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'fallback_secret';

export async function POST(req: Request) {
  try {
    const { code, deviceName, deviceIdentifier } = await req.json();

    if (!code || !deviceName || !deviceIdentifier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify code
    const [pairing] = await db.select().from(devicePairingCodes).where(
      and(
        eq(devicePairingCodes.code, code.toUpperCase()),
        eq(devicePairingCodes.status, 'PENDING'),
        gt(devicePairingCodes.expiresAt, new Date())
      )
    ).limit(1);

    if (!pairing) {
      return NextResponse.json({ error: 'Kode pairing tidak valid atau sudah kedaluwarsa' }, { status: 400 });
    }

    // 2. Create pos device
    const [newDevice] = await db.insert(posDevices).values({
      tenantId: pairing.tenantId,
      name: deviceName,
      deviceIdentifier,
      status: 'ACTIVE',
      lastSeenAt: new Date(),
    }).returning();

    // 3. Mark code as completed
    await db.update(devicePairingCodes)
      .set({ status: 'COMPLETED' })
      .where(eq(devicePairingCodes.id, pairing.id));

    // 4. Generate JWT
    const token = jwt.sign({
      deviceId: newDevice.id,
      tenantId: newDevice.tenantId,
      deviceIdentifier,
      type: 'pos_device'
    }, JWT_SECRET, { expiresIn: '365d' });

    return NextResponse.json({
      success: true,
      token,
      device: {
        id: newDevice.id,
        name: newDevice.name,
      }
    });

  } catch (error: any) {
    console.error('POS Pair API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
