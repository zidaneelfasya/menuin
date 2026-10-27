import { Metadata } from 'next';
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

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden bg-[#F9FBFF]">
      {/* Sub-sidebar docked directly flush with primary rail */}
      <aside className="w-full md:w-60 flex-shrink-0 bg-white border-r border-[#EAEFF8] flex flex-col h-auto md:h-full relative z-20 shadow-[4px_0_16px_rgba(0,0,0,0.04),1px_0_4px_rgba(0,0,0,0.02)]">
        <ShiftsSidebar outletKey={outletKey} />
      </aside>

      {/* Main Content Area on #F9FBFF Canvas */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 md:p-8 bg-[#F9FBFF]">
        <div className="w-full space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
