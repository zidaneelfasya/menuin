import { getDevicesAction } from '@/lib/actions/devices';
import { DevicesClient } from './devices-client';
import { requireTenantAccess } from '@/lib/actions/auth-context';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Perangkat Kasir - Menuin',
};

export default async function DevicesPage({ params }: { params: Promise<{ outletKey: string }> }) {
  const { outletKey } = await params;
  const context = await requireTenantAccess();
  const res = await getDevicesAction();
  
  if (res.error) {
    return <div className="p-4 text-red-500">Error: {res.error}</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="pb-5 border-b border-border/60 mb-6">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Tautkan Perangkat Kasir</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tautkan smartphone, tablet, atau mesin POS kasir yang terhubung ke outlet ini.
          </p>
        </div>

        <DevicesClient 
          initialDevices={res.devices || []} 
          canManage={context.membership.role === 'OWNER' || context.membership.role === 'MANAGER'} 
        />
      </div>
    </div>
  );
}
