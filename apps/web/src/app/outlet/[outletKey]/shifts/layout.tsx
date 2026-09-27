import { Metadata } from 'next';
import { getActiveShift } from '@/lib/actions/shifts';
import { ShiftsSidebar } from './shifts-sidebar';

export const metadata: Metadata = {
  title: 'Shift Kasir - Menuin',
};

export default async function ShiftsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ outletKey: string }>;
}) {
  const { outletKey } = await params;
  const activeShiftResult = await getActiveShift();
  const hasActiveShift = Boolean(activeShiftResult.success && activeShiftResult.data);

  return (
    <div className="space-y-6">
      {/* Shifts Header */}
      <div className="border-b border-border/60 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Shift Kasir</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola sesi kasir aktif, pencatatan kas masuk & keluar, dan audit riwayat shift.
        </p>
      </div>

      {/* Main Shifts Body: Sidebar in layout + Content */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Shifts Sidebar in Layout */}
        <ShiftsSidebar outletKey={outletKey} hasActiveShift={hasActiveShift} />

        {/* Content Area */}
        <main className="flex-1 min-w-0 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
