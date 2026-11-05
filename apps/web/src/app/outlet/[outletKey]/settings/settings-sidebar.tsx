'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  IconBuildingStore, 
  IconAdjustmentsHorizontal, 
  IconLayout, 
  IconPrinter, 
  IconReceipt, 
  IconMoped, 
  IconCreditCard,
  IconReceiptRefund
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
  /** Terlihat untuk OWNER dan MANAGER. */
  managerUp?: boolean;
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
        label: 'Pembayaran Online',
        icon: IconCreditCard,
        href: (k) => `/outlet/${k}/settings?tab=payment`,
        tab: 'payment',
        ownerOnly: true,
      },
      {
        id: 'online-payments',
        label: 'Transaksi Online',
        icon: IconReceiptRefund,
        href: (k) => `/outlet/${k}/settings/online-payments`,
        isRoute: true,
        managerUp: true,
      },
    ],
  },
];

import { usePageTransition } from '@/components/providers/page-transition-provider';

export function SettingsSidebar({ outletKey, userRole }: SettingsSidebarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { navigateWithTransition, prefetchRoute } = usePageTransition();
  const settingsBase = `/outlet/${outletKey}/settings`;
  const isOnSubRoute = pathname !== settingsBase && pathname.startsWith(`${settingsBase}/`);

  const isOwner = userRole === 'OWNER' || userRole === 'SYSTEM_ADMIN' || !userRole;
  const [currentTab, setCurrentTab] = React.useState(searchParams.get('tab') || 'store');

  React.useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'store';
    setCurrentTab(tabFromUrl);
  }, [searchParams]);

  React.useEffect(() => {
    const handleCustomTab = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCurrentTab(customEvent.detail);
      }
    };
    window.addEventListener('menuin:settings-tab', handleCustomTab);
    return () => window.removeEventListener('menuin:settings-tab', handleCustomTab);
  }, []);

  const handleNavigate = (item: NavItem) => {
    const targetHref = item.href(outletKey);
    if (item.isRoute || isOnSubRoute) {
      navigateWithTransition(targetHref);
    } else {
      if (item.tab) {
        setCurrentTab(item.tab);
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', targetHref);
          window.dispatchEvent(new CustomEvent('menuin:settings-tab', { detail: item.tab }));
        }
      } else {
        navigateWithTransition(targetHref);
      }
    }
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
          const isManagerUp = isOwner || userRole === 'MANAGER';
          const visibleItems = section.items.filter(
            (item) => (!item.ownerOnly || isOwner) && (!item.managerUp || isManagerUp)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="flex space-x-1.5 md:flex-col md:space-x-0 md:space-y-1">
              <h3 className="hidden md:block px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </h3>
              {visibleItems.map((item) => {
                const isActive = item.isRoute
                  ? pathname === item.href(outletKey)
                  : !isOnSubRoute && item.tab === currentTab;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-full px-3.5 py-2 text-xs md:text-sm font-medium transition-all duration-150 whitespace-nowrap cursor-pointer text-left w-full",
                      isActive
                        ? "bg-[#0e59f9] text-white font-semibold shadow-sm"
                        : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isActive ? "text-white" : "text-gray-500"
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
