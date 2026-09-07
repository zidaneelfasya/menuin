import { Metadata } from 'next';
import { Suspense } from 'react';
import { getTenantSettings } from '@/lib/actions/settings';
import { SettingsClient } from './settings-client';
import { SettingsSkeleton } from '@/components/ui/settings-skeleton';
import { getTenantCatalogSettings } from '@/lib/actions/catalog';

export const metadata: Metadata = {
  title: 'Pengaturan Toko & Pajak - Bolu Anisa POS',
};

async function SettingsDataWrapper() {
  const [result, catalogResult] = await Promise.all([
    getTenantSettings(),
    getTenantCatalogSettings()
  ]);
  const tenant = result.success ? result.data : null;
  return <SettingsClient tenant={tenant} catalogSettings={catalogResult} />;
}

export default function Page() {
  return (
    <div className="p-6">
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsDataWrapper />
      </Suspense>
    </div>
  );
}
