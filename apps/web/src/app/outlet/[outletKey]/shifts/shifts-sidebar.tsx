'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  IconClock, 
  IconArrowsExchange, 
  IconReceipt, 
  IconHistory, 
  IconCalendarEvent, 
  IconChevronRight,
  IconBuildingStore
} from '@tabler/icons-react';

interface ShiftsSidebarProps {
  outletKey: string;
  hasActiveShift?: boolean;
}

interface ShiftNavItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tab: string;
  badge?: string;
}

interface ShiftNavSection {
  title: string;
  items: ShiftNavItem[];
}

export function ShiftsSidebar({ outletKey, hasActiveShift }: ShiftsSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentTab = searchParams.get('tab') || 'active';

  const sections: ShiftNavSection[] = [
    {
      title: 'Operasional Kasir',
      items: [
        {
          id: 'active',
          label: 'Shift Aktif',
          description: hasActiveShift ? 'Sesi berjalan & uang laci' : 'Buka sesi kasir baru',
          icon: IconClock,
          tab: 'active',
          badge: hasActiveShift ? 'Aktif' : undefined,
        },
        {
          id: 'movements',
          label: 'Arus Kas Laci (In / Out)',
          description: 'Catat kas masuk & kas keluar',
          icon: IconArrowsExchange,
          tab: 'movements',
        },
        {
          id: 'transactions',
          label: 'Transaksi Shift Berjalan',
          description: 'Daftar order pada shift aktif',
          icon: IconReceipt,
          tab: 'transactions',
        },
      ],
    },
    {
      title: 'Audit & Rekapitulasi',
      items: [
        {
          id: 'history',
          label: 'Riwayat & Rekap Shift',
          description: 'Arsip shift kemarin & audit selisih',
          icon: IconHistory,
          tab: 'history',
        },
        {
          id: 'schedule',
          label: 'Jadwal & Log Aktivitas',
          description: 'Kalender mingguan & timeline',
          icon: IconCalendarEvent,
          tab: 'schedule',
        },
      ],
    },
  ];

  const handleNavigate = (tab: string) => {
    router.replace(`/outlet/${outletKey}/shifts?tab=${tab}`, { scroll: false });
  };

  return (
    <aside className="w-full lg:w-64 xl:w-72 shrink-0">
      {/* Mobile Horizontal Scroll Strip */}
      <div className="lg:hidden overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-2">
        <div className="flex gap-1.5 min-w-max p-1 bg-card border border-border/70 rounded-2xl shadow-xs">
          {sections.flatMap((s) => s.items).map((item) => {
            const isActive = item.tab === currentTab;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.tab)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Vertical Sidebar */}
      <div className="hidden lg:block sticky top-2 bg-card border border-border/70 rounded-2xl p-3.5 shadow-xs min-h-[calc(100vh-12rem)]">
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                {section.title}
              </h3>
              <div className="space-y-1 pt-1">
                {section.items.map((item) => {
                  const isActive = item.tab === currentTab;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item.tab)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon
                          className={cn(
                            'w-5 h-5 shrink-0 transition-colors',
                            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                          )}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">{item.label}</p>
                          <p
                            className={cn(
                              'text-[11px] truncate mt-0.5',
                              isActive ? 'text-primary/80 font-normal' : 'text-muted-foreground/70'
                            )}
                          >
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <IconChevronRight
                        className={cn(
                          'w-4 h-4 shrink-0 transition-transform duration-150',
                          isActive
                            ? 'text-primary translate-x-0.5 opacity-100'
                            : 'text-muted-foreground/40 opacity-0 group-hover:opacity-100'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
