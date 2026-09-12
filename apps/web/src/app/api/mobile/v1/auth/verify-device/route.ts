import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posDevices } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const headerDeviceId = req.headers.get('x-device-id');
    const deviceId = (body.deviceId || headerDeviceId)?.trim();
    const rawTenantId = (body.tenantId || req.headers.get('x-tenant-id'))?.trim();

    if (!deviceId) {
      return NextResponse.json({
        valid: false,
        error: 'DEVICE_ID_REQUIRED',
        message: 'Device ID is required',
      }, { status: 400 });
    }

    const isDeviceUuid = UUID_REGEX.test(deviceId);
    const deviceCondition = isDeviceUuid
      ? eq(posDevices.id, deviceId)
      : eq(posDevices.deviceIdentifier, deviceId);

    const conditions = [deviceCondition];
    if (rawTenantId && UUID_REGEX.test(rawTenantId)) {
      conditions.push(eq(posDevices.tenantId, rawTenantId));
    }

    const [device] = await db
      .select()
      .from(posDevices)
      .where(and(...conditions))
      .limit(1);

    if (!device || device.status !== 'ACTIVE') {
      return NextResponse.json({
        valid: false,
        error: 'DEVICE_REVOKED',
        message: 'Perangkat ini telah dihapus atau dicabut dari outlet oleh Owner di website MENUIN.',
      }, { status: 403 });
    }

    // Update lastSeenAt
    await db.update(posDevices)
      .set({ lastSeenAt: new Date() })
      .where(eq(posDevices.id, device.id));

    return NextResponse.json({
      valid: true,
      device: {
        id: device.id,
        name: device.name,
        tenantId: device.tenantId,
      },
    });
  } catch (error: any) {
    console.error('Verify Device POST Error:', error);
    return NextResponse.json({
      valid: false,
      error: 'DEVICE_REVOKED',
      message: 'Perangkat ini tidak ditemukan atau telah dicabut oleh Owner di website MENUIN.',
    }, { status: 403 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const headerDeviceId = req.headers.get('x-device-id');
    const paramDeviceId = req.nextUrl.searchParams.get('deviceId');
    const deviceId = (headerDeviceId || paramDeviceId)?.trim();
    const rawTenantId = (req.headers.get('x-tenant-id') || req.nextUrl.searchParams.get('tenantId'))?.trim();

    if (!deviceId) {
      return NextResponse.json({
        valid: false,
        error: 'DEVICE_ID_REQUIRED',
        message: 'Device ID is required',
      }, { status: 400 });
    }

    const isDeviceUuid = UUID_REGEX.test(deviceId);
    const deviceCondition = isDeviceUuid
      ? eq(posDevices.id, deviceId)
      : eq(posDevices.deviceIdentifier, deviceId);

    const conditions = [deviceCondition];
    if (rawTenantId && UUID_REGEX.test(rawTenantId)) {
      conditions.push(eq(posDevices.tenantId, rawTenantId));
    }

    const [device] = await db
      .select()
      .from(posDevices)
      .where(and(...conditions))
      .limit(1);

    if (!device || device.status !== 'ACTIVE') {
      return NextResponse.json({
        valid: false,
        error: 'DEVICE_REVOKED',
        message: 'Perangkat ini telah dihapus atau dicabut dari outlet oleh Owner di website MENUIN.',
      }, { status: 403 });
    }

    // Update lastSeenAt
    await db.update(posDevices)
      .set({ lastSeenAt: new Date() })
      .where(eq(posDevices.id, device.id));

    return NextResponse.json({
      valid: true,
      device: {
        id: device.id,
        name: device.name,
        tenantId: device.tenantId,
      },
    });
  } catch (error: any) {
    console.error('Verify Device GET Error:', error);
    return NextResponse.json({
      valid: false,
      error: 'DEVICE_REVOKED',
      message: 'Perangkat ini tidak ditemukan atau telah dicabut oleh Owner di website MENUIN.',
    }, { status: 403 });
  }
}
