import { Metadata } from 'next';
import { Suspense } from 'react';
import { getDevicesAction } from '@/lib/actions/devices';
import { DevicesClient } from './devices-client';
import { requireTenantAccess } from '@/lib/actions/auth-context';
import DevicesLoading from './loading';

export const metadata: Metadata = {
  title: 'Perangkat Kasir - Menuin',
};

async function DevicesDataWrapper({ outletKey }: { outletKey: string }) {
  const context = await requireTenantAccess();
  const res = await getDevicesAction();
  
  if (res.error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
        Error memuat perangkat kasir: {res.error}
      </div>
    );
  }
  
  return (
    <DevicesClient 
      initialDevices={res.devices || []} 
      canManage={context.membership.role === 'OWNER' || context.membership.role === 'MANAGER'} 
      outletKey={outletKey}
    />
  );
}

export default async function DevicesPage({ params }: { params: Promise<{ outletKey: string }> }) {
  const { outletKey } = await params;
  return (
    <Suspense fallback={<DevicesLoading />}>
      <DevicesDataWrapper outletKey={outletKey} />
    </Suspense>
  );
}
