'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconLogout, 
  IconArrowsExchange
} from '@tabler/icons-react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  History,
  BarChart3, 
  Wallet, 
  Percent, 
  UserCircle, 
  Settings,
  Store,
  ChefHat,
  SlidersHorizontal,
  Smartphone
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { UserProfile } from '@/lib/actions/auth';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useRealtimeOrder } from '@/components/providers/realtime-order-provider';
import { usePageTransition } from '../providers/page-transition-provider';

const getNavItems = (outletKey: string) => [
  { name: 'Dashboard', href: `/outlet/${outletKey}/dashboard`, icon: LayoutDashboard, roles: ['OWNER', 'MANAGER'] },
  { name: 'Kasir (POS)', href: `/outlet/${outletKey}/pos`, icon: ShoppingCart, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { name: 'Pesanan Masuk', href: `/outlet/${outletKey}/orders`, icon: ChefHat, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { name: 'Katalog Menu', href: `/outlet/${outletKey}/katalog`, icon: Store, roles: ['OWNER', 'MANAGER'] },
  { name: 'Daftar Menu', href: `/outlet/${outletKey}/items`, icon: Package, roles: ['OWNER', 'MANAGER'] },
  { name: 'Kategori', href: `/outlet/${outletKey}/categories`, icon: Tags, roles: ['OWNER', 'MANAGER'] },
  { name: 'Topping & Varian', href: `/outlet/${outletKey}/modifiers`, icon: SlidersHorizontal, roles: ['OWNER', 'MANAGER'] },
  { name: 'Shift Kasir', href: `/outlet/${outletKey}/shifts`, icon: Wallet, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { name: 'Riwayat Transaksi', href: `/outlet/${outletKey}/transactions`, icon: History, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { name: 'Laporan Penjualan', href: `/outlet/${outletKey}/reports`, icon: BarChart3, roles: ['OWNER', 'MANAGER'] },
  { name: 'Diskon & Promo', href: `/outlet/${outletKey}/promotions`, icon: Percent, roles: ['OWNER', 'MANAGER'] },
  { name: 'Tim & Karyawan', href: `/outlet/${outletKey}/team`, icon: UserCircle, roles: ['OWNER'] },
  { name: 'Perangkat Kasir', href: `/outlet/${outletKey}/settings/devices`, icon: Smartphone, roles: ['OWNER', 'MANAGER'] },
  { name: 'Pengaturan Toko', href: `/outlet/${outletKey}/settings`, icon: Settings, roles: ['OWNER', 'MANAGER'] },
];

function SidebarContent({ collapsed, setCollapsed, user }: { collapsed: boolean; setCollapsed?: (val: boolean) => void; user: UserProfile }) {
  const pathname = usePathname();
  const router = useRouter();
  const { incomingOrders } = useRealtimeOrder();
  const { navigateWithTransition } = usePageTransition();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const outletKey = user.outletKey || 'unknown';
  const navItems = getNavItems(outletKey).filter(item => !item.roles || item.roles.includes(user.role as any));

  // Determine if the current page has a sub-sidebar (e.g. Katalog Menu or Settings)
  const hasSubSidebar = pathname.includes('/katalog');
  const curvedTabBg = hasSubSidebar ? '#ffffff' : '#F9FBFF';

  return (
    <>
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center px-4  relative flex-shrink-0">
        <div className={cn("relative flex items-center transition-all", collapsed ? "w-8 h-8 mx-auto" : "w-28 h-9")}>
          <Image 
            src="/menuin-putih.png" 
            alt="Logo Menuin" 
            fill 
            className="object-contain" 
            priority
          />
        </div>
        
        {setCollapsed && (
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-5 bg-white text-[#0e59f9] border border-blue-100 rounded-full p-1 shadow-md hover:bg-white/95 hidden md:flex items-center justify-center cursor-pointer z-50 transition-transform active:scale-95"
            title={collapsed ? "Perluas Sidebar" : "Kecilkan Sidebar"}
          >
            {collapsed ? <IconChevronRight size={13} stroke={2.5} /> : <IconChevronLeft size={13} stroke={2.5} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className={cn(
        "flex-1 overflow-y-auto py-4 scrollbar-hide space-y-1",
        collapsed ? "px-2" : "pl-3 pr-0"
      )}>
        {/* Main Nav Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== `/outlet/${outletKey}/dashboard` && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigateWithTransition(item.href);
                }}
              >
                {collapsed ? (
                  /* Collapsed Nav Item */
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all duration-150 group relative cursor-pointer my-1',
                      isActive 
                        ? 'bg-white text-[#0e59f9] shadow-sm' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    )}
                    title={item.name}
                  >
                    <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-[#0e59f9]' : 'text-white/80 group-hover:text-white')} />
                    {item.href.includes('/orders') && incomingOrders.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-sm">
                        {incomingOrders.length}
                      </span>
                    )}
                  </div>
                ) : (
                  /* Expanded Nav Item */
                  <div
                    className={cn(
                      'flex items-center px-3.5 py-2.5 transition-all duration-150 group relative cursor-pointer my-0.5',
                      isActive 
                        ? 'curved-tab-active font-semibold z-20' 
                        : 'mr-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 font-medium'
                    )}
                    style={isActive ? ({ '--curved-tab-bg': curvedTabBg } as React.CSSProperties) : undefined}
                    title={item.name}
                  >
                    <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-[#0e59f9]' : 'text-white/80 group-hover:text-white')} />
                    <span className={cn('ml-3 font-semibold text-sm flex-1 truncate', isActive ? 'text-[#0e59f9]' : 'text-white/90 group-hover:text-white')}>
                      {item.name}
                    </span>
                    {item.href.includes('/orders') && incomingOrders.length > 0 && (
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full shadow-sm",
                        isActive ? "bg-[#0e59f9] text-white" : "bg-white text-[#0e59f9]"
                      )}>
                        {incomingOrders.length}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Area */}
      <div className="p-3  flex-shrink-0">
        <div className={cn('flex items-center gap-2', collapsed ? 'flex-col justify-center' : 'justify-between')}>
          {!collapsed && (
            <div className="flex items-center overflow-hidden flex-1">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold flex-shrink-0 uppercase text-xs border border-white/20">
                {user.name.charAt(0)}
              </div>
              <div className="ml-2.5 overflow-hidden flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[11px] text-white/70 truncate">{user.role} &bull; {user.restaurantName}</p>
              </div>
            </div>
          )}
          <div className={cn('flex items-center gap-1', collapsed && 'flex-col mt-1')}>
            <button 
              type="button"
              onClick={() => navigateWithTransition('/select-tenant')}
              className={cn('text-white/80 hover:text-white hover:bg-white/15 transition-colors h-8 w-8 flex items-center justify-center rounded-lg cursor-pointer')}
              title="Ganti Toko / Cabang"
            >
              <IconArrowsExchange size={collapsed ? 16 : 18} />
            </button>
            <ThemeSwitcher 
              triggerClassName="text-white/80 hover:text-white hover:bg-white/15 transition-colors h-8 w-8 p-0 rounded-lg cursor-pointer flex items-center justify-center border-0 shadow-none bg-transparent"
              iconClassName="text-white/80 hover:text-white"
              size={collapsed ? 16 : 18}
            />
            <button 
              onClick={handleLogout}
              className={cn('text-white/80 hover:text-rose-200 hover:bg-rose-500/20 transition-colors h-8 w-8 flex items-center justify-center rounded-lg cursor-pointer')}
              title="Keluar"
            >
              <IconLogout size={collapsed ? 16 : 18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function Sidebar({ 
  collapsed, 
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  user
}: { 
  collapsed: boolean; 
  setCollapsed: (val: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
  user: UserProfile;
}) {
  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? '80px' : '260px' }}
        className="bg-[#0e59f9] text-white rounded-r-2xl md:rounded-r-3xl hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 shadow-[6px_0_24px_rgba(14,89,249,0.18),2px_0_8px_rgba(0,0,0,0.06)] select-none"
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} user={user} />
      </motion.aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0 flex flex-col bg-[#0e59f9] text-white border-0 select-none">
          <SheetTitle className="sr-only">Navigasi</SheetTitle>
          <SidebarContent collapsed={false} user={user} />
        </SheetContent>
      </Sheet>
    </>
  );
}

