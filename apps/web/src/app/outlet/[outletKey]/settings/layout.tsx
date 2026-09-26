import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/actions/auth';
import { SettingsSidebar } from './settings-sidebar';

export const metadata: Metadata = {
  title: 'Pengaturan - Menuin',
};

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ outletKey: string }>;
}) {
  const { outletKey } = await params;
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="border-b border-border/60 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pengaturan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola profil toko, alur kasir, format struk, pajak, dan integrasi outlet Anda.
        </p>
      </div>

      {/* Main Settings Body: Sidebar in layout + Content */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Settings Sidebar in Layout */}
        <SettingsSidebar outletKey={outletKey} userRole={user?.role} />

        {/* Content Area */}
        <main className="flex-1 min-w-0 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
