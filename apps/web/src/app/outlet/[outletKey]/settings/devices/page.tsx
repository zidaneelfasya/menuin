import { getDevicesAction } from '@/lib/actions/devices';
import { DevicesClient } from './devices-client';
import { requireTenantAccess } from '@/lib/actions/auth-context';
import { redirect } from 'next/navigation';

export default async function DevicesPage() {
  const context = await requireTenantAccess();
  const res = await getDevicesAction();
  
  if (res.error) {
    return <div className="p-4 text-red-500">Error: {res.error}</div>;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">POS & Devices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola perangkat kasir (Point of Sale) yang terhubung ke outlet ini.
        </p>
      </div>

      <DevicesClient 
        initialDevices={res.devices || []} 
        canManage={context.membership.role === 'OWNER' || context.membership.role === 'MANAGER'} 
      />
    </div>
  );
}
