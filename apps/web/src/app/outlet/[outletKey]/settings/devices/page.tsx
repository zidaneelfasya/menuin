import { getDevicesAction } from '@/lib/actions/devices';
import { DevicesClient } from './devices-client';
import { requireTenantAccess } from '@/lib/actions/auth-context';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Perangkat Kasir - Menuin',
};

export default async function DevicesPage() {
  const context = await requireTenantAccess();
  const res = await getDevicesAction();
  
  if (res.error) {
    return <div className="p-4 text-red-500">Error: {res.error}</div>;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tautkan Perangkat Kasir</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tautkan smartphone, tablet, atau mesin POS kasir yang terhubung ke outlet ini.
        </p>
      </div>

      <DevicesClient 
        initialDevices={res.devices || []} 
        canManage={context.membership.role === 'OWNER' || context.membership.role === 'MANAGER'} 
      />
    </div>
  );
}
