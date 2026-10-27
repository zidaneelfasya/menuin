"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3, Clock, Wallet, FileSpreadsheet, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReportsNav() {
  const pathname = usePathname();
  const params = useParams();
  const outletKey = (params.outletKey as string) || "";

  const navItems = [
    {
      href: `/outlet/${outletKey}/reports`,
      icon: LayoutDashboard,
      label: "Ringkasan",
      exact: true,
    },
    {
      href: `/outlet/${outletKey}/reports/sales`,
      icon: BarChart3,
      label: "Penjualan",
      exact: false,
    },
    {
      href: `/outlet/${outletKey}/reports/operations`,
      icon: Clock,
      label: "Operasional",
      exact: false,
    },
    {
      href: `/outlet/${outletKey}/reports/finance`,
      icon: Wallet,
      label: "Keuangan & Arus Kas",
      exact: false,
    },
  ];

  return (
    <div className="flex flex-col h-full p-2 md:p-3">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center gap-2.5 px-2 py-3 mb-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight truncate">Report &amp; Analytics</h2>
          <p className="text-[10px] text-slate-400 font-medium truncate">Performa &amp; Analitik Bisnis</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex space-x-1.5 md:flex-col md:space-x-0 md:space-y-1 overflow-x-auto pb-1 md:pb-0 scrollbar-hide flex-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-xs md:text-sm font-medium transition-all duration-150 whitespace-nowrap cursor-pointer",
                isActive
                  ? "bg-[#0e59f9] text-white font-semibold shadow-sm-md"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  isActive ? "text-white" : "text-slate-500"
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
