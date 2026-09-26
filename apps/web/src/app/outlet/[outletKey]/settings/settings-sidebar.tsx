'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  IconBuildingStore, 
  IconAdjustmentsHorizontal, 
  IconLayout, 
  IconPrinter, 
  IconDeviceMobile, 
  IconReceipt, 
  IconMoped, 
  IconCreditCard,
  IconChevronRight
} from '@tabler/icons-react';
import { usePageTransition } from '@/components/providers/page-transition-provider';

interface SettingsSidebarProps {
  outletKey: string;
  userRole?: string;
}

interface NavItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  href: (outletKey: string) => string;
  tab?: string;
  isRoute?: boolean;
  ownerOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SETTINGS_SECTIONS: NavSection[] = [
  {
    title: 'Toko & Tampilan',
    items: [
      {
        id: 'store',
        label: 'Profil Toko',
        description: 'Identitas, logo, & warna tema',
        icon: IconBuildingStore,
        href: (k) => `/outlet/${k}/settings?tab=store`,
        tab: 'store',
      },
      {
        id: 'bestseller',
        label: 'Tampilan Katalog',
        description: 'Menu unggulan & kartu katalog',
        icon: IconAdjustmentsHorizontal,
        href: (k) => `/outlet/${k}/settings?tab=bestseller`,
        tab: 'bestseller',
      },
    ],
  },
  {
    title: 'Kasir & Operasional',
    items: [
      {
        id: 'pos',
        label: 'Alur Kasir (POS)',
        description: 'Konfigurasi transaksi kasir',
        icon: IconLayout,
        href: (k) => `/outlet/${k}/settings?tab=pos`,
        tab: 'pos',
      },
      {
        id: 'receipt',
        label: 'Struk & Tiket Dapur',
        description: 'Header, footer, & tiket dapur',
        icon: IconPrinter,
        href: (k) => `/outlet/${k}/settings?tab=receipt`,
        tab: 'receipt',
      },
      {
        id: 'devices',
        label: 'Perangkat Kasir',
        description: 'Tautkan mesin POS & tablet',
        icon: IconDeviceMobile,
        href: (k) => `/outlet/${k}/settings/devices`,
        isRoute: true,
      },
    ],
  },
  {
    title: 'Keuangan & Integrasi',
    items: [
      {
        id: 'tax',
        label: 'Pajak & Biaya',
        description: 'PB1 & service charge',
        icon: IconReceipt,
        href: (k) => `/outlet/${k}/settings?tab=tax`,
        tab: 'tax',
      },
      {
        id: 'platform',
        label: 'Komisi Online Food',
        description: 'GrabFood, GoFood, ShopeeFood',
        icon: IconMoped,
        href: (k) => `/outlet/${k}/settings?tab=platform`,
        tab: 'platform',
      },
      {
        id: 'payment',
        label: 'Integrasi Midtrans',
        description: 'Payment gateway & keys',
        icon: IconCreditCard,
        href: (k) => `/outlet/${k}/settings?tab=payment`,
        tab: 'payment',
        ownerOnly: true,
      },
    ],
  },
];

export function SettingsSidebar({ outletKey, userRole }: SettingsSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { navigateWithTransition } = usePageTransition();

  const isOwner = userRole === 'OWNER' || userRole === 'SYSTEM_ADMIN' || !userRole;
  const currentTab = searchParams.get('tab') || 'store';
  const isDevicesPage = pathname.includes('/settings/devices');

  const handleNavigate = (item: NavItem) => {
    const targetHref = item.href(outletKey);
    if (item.isRoute) {
      if (pathname !== targetHref) {
        navigateWithTransition(targetHref);
      }
    } else {
      if (isDevicesPage) {
        navigateWithTransition(targetHref);
      } else {
        router.replace(targetHref, { scroll: false });
      }
    }
  };

  return (
    <aside className="w-full lg:w-64 xl:w-72 shrink-0">
      {/* Mobile Horizontal Scroll Strip */}
      <div className="lg:hidden overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-2">
        <div className="flex gap-1.5 min-w-max p-1 bg-card border border-border/70 rounded-2xl shadow-xs">
          {SETTINGS_SECTIONS.flatMap((s) => s.items)
            .filter((item) => !item.ownerOnly || isOwner)
            .map((item) => {
              const isActive = item.isRoute
                ? isDevicesPage
                : !isDevicesPage && item.tab === currentTab;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item)}
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
      <div className="hidden lg:flex flex-col justify-between sticky top-2 bg-card border border-border/70 rounded-2xl p-3.5 shadow-xs min-h-[calc(100vh-12rem)]">
        <div className="space-y-5">
          {SETTINGS_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) => !item.ownerOnly || isOwner);
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  {section.title}
                </h3>
                <div className="space-y-1 pt-1">
                  {visibleItems.map((item) => {
                    const isActive = item.isRoute
                      ? isDevicesPage
                      : !isDevicesPage && item.tab === currentTab;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavigate(item)}
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
                            {item.description && (
                              <p
                                className={cn(
                                  'text-[11px] truncate mt-0.5',
                                  isActive ? 'text-primary/80 font-normal' : 'text-muted-foreground/70'
                                )}
                              >
                                {item.description}
                              </p>
                            )}
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
            );
          })}
        </div>

        {/* Bottom Status Card */}
        <div className="pt-4 mt-4 border-t border-border/50">
          <div className="p-3 bg-muted/30 border border-border/40 rounded-xl flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-foreground truncate">Outlet Siap Digunakan</p>
              <p className="text-[10px] text-muted-foreground truncate">Konfigurasi otomatis tersimpan</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
