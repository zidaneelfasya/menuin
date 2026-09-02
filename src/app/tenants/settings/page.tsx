import { Metadata } from 'next';
import { Suspense } from 'react';
import { getTenantSettings } from '@/lib/actions/settings';
import { SettingsClient } from './settings-client';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export const metadata: Metadata = {
  title: 'Pengaturan Toko & Pajak - Bolu Anisa POS',
};

async function SettingsDataWrapper() {
  const result = await getTenantSettings();
  const tenant = result.success ? result.data : null;
  return <SettingsClient tenant={tenant} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6"><TableSkeleton /></div>}>
      <SettingsDataWrapper />
    </Suspense>
  );
}
