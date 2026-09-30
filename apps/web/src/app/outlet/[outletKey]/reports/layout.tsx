import { ReactNode } from "react";
import { ReportsNav } from "./reports-nav";

export default async function ReportsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ outletKey: string }>;
}) {
  const { outletKey } = await params;

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden bg-[#F9FBFF]">
      {/* Sub-sidebar docked flush with primary rail */}
      <aside className="w-full md:w-60 flex-shrink-0 bg-white border-r border-[#EAEFF8] flex flex-col h-auto md:h-full relative z-20 shadow-[4px_0_16px_rgba(0,0,0,0.04),1px_0_4px_rgba(0,0,0,0.02)] print:hidden">
        <ReportsNav />
      </aside>

      {/* Main Content Canvas on #F9FBFF */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 md:p-8 bg-[#F9FBFF]">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
