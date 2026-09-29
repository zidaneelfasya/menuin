'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  IconBuildingStore, 
  IconAdjustmentsHorizontal, 
  IconLayout, 
  IconPrinter, 
  IconReceipt, 
  IconMoped, 
  IconCreditCard
} from '@tabler/icons-react';

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
        icon: IconBuildingStore,
        href: (k) => `/outlet/${k}/settings?tab=store`,
        tab: 'store',
      },
      {
        id: 'bestseller',
        label: 'Tampilan Katalog',
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
        icon: IconLayout,
        href: (k) => `/outlet/${k}/settings?tab=pos`,
        tab: 'pos',
      },
      {
        id: 'receipt',
        label: 'Struk & Tiket Dapur',
        icon: IconPrinter,
        href: (k) => `/outlet/${k}/settings?tab=receipt`,
        tab: 'receipt',
      },
    ],
  },
  {
    title: 'Keuangan & Integrasi',
    items: [
      {
        id: 'tax',
        label: 'Pajak & Biaya',
        icon: IconReceipt,
        href: (k) => `/outlet/${k}/settings?tab=tax`,
        tab: 'tax',
      },
      {
        id: 'platform',
        label: 'Komisi Online Food',
        icon: IconMoped,
        href: (k) => `/outlet/${k}/settings?tab=platform`,
        tab: 'platform',
      },
      {
        id: 'payment',
        label: 'Integrasi Midtrans',
        icon: IconCreditCard,
        href: (k) => `/outlet/${k}/settings?tab=payment`,
        tab: 'payment',
        ownerOnly: true,
      },
    ],
  },
];

export function SettingsSidebar({ outletKey, userRole }: SettingsSidebarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const isOwner = userRole === 'OWNER' || userRole === 'SYSTEM_ADMIN' || !userRole;
  const currentTab = searchParams.get('tab') || 'store';

  const handleNavigate = (item: NavItem) => {
    const targetHref = item.href(outletKey);
    router.replace(targetHref, { scroll: false });
  };

  return (
    <div className="flex flex-col h-full p-2 md:p-3">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center gap-2.5 px-2 py-3 mb-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">Pengaturan Toko</h2>
          <p className="text-[10px] text-gray-500 truncate">Konfigurasi & Integrasi</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex space-x-1.5 md:flex-col md:space-x-0 md:space-y-3 overflow-x-auto pb-1 md:pb-0 scrollbar-hide flex-1">
        {SETTINGS_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => !item.ownerOnly || isOwner);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="flex space-x-1.5 md:flex-col md:space-x-0 md:space-y-1">
              <h3 className="hidden md:block px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {section.title}
              </h3>
              {visibleItems.map((item) => {
                const isActive = item.tab === currentTab;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs md:text-sm font-medium transition-all duration-150 whitespace-nowrap cursor-pointer text-left w-full",
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
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
