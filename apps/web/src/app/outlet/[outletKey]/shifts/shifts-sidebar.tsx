'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  IconClock, 
  IconArrowsExchange, 
  IconReceipt, 
  IconHistory, 
  IconCalendarEvent
} from '@tabler/icons-react';

interface ShiftsSidebarProps {
  outletKey: string;
  hasActiveShift?: boolean;
}

export function ShiftsSidebar({ outletKey, hasActiveShift }: ShiftsSidebarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentTab = searchParams.get('tab') || 'active';

  const navItems = [
    {
      id: 'active',
      label: 'Shift Aktif',
      icon: IconClock,
      tab: 'active',
      badge: hasActiveShift ? 'Aktif' : undefined,
    },
    {
      id: 'movements',
      label: 'Arus Kas Laci',
      icon: IconArrowsExchange,
      tab: 'movements',
    },
    {
      id: 'transactions',
      label: 'Transaksi Shift',
      icon: IconReceipt,
      tab: 'transactions',
    },
    {
      id: 'history',
      label: 'Riwayat & Rekap',
      icon: IconHistory,
      tab: 'history',
    },
    {
      id: 'schedule',
      label: 'Jadwal & Log',
      icon: IconCalendarEvent,
      tab: 'schedule',
    },
  ];

  const handleNavigate = (tab: string) => {
    router.replace(`/outlet/${outletKey}/shifts?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="flex flex-col h-full p-2 md:p-3">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-2 py-3 mb-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold font-sans text-gray-900 truncate">Shift Kasir</h2>
          <p className="text-[10px] text-gray-500 truncate">Sesi Kasir & Arus Kas</p>
        </div>
        {hasActiveShift && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Aktif
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex space-x-1.5 md:flex-col md:space-x-0 md:space-y-1 overflow-x-auto pb-1 md:pb-0 scrollbar-hide flex-1">
        {navItems.map((item) => {
          const isActive = item.tab === currentTab;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.tab)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs md:text-sm font-medium transition-all duration-150 whitespace-nowrap cursor-pointer text-left w-full",
                isActive
                  ? "bg-[#0e59f9]/10 text-[#0e59f9] font-semibold shadow-xs"
                  : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  isActive ? "text-[#0e59f9]" : "text-gray-500"
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
