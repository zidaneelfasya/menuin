'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { 
  IconLayoutDashboard, 
  IconShoppingCart, 
  IconPackage, 
  IconTags, 
  IconArchive, 
  IconHistory, 
  IconChartBar, 
  IconWallet, 
  IconPercentage, 
  IconUserCircle, 
  IconSettings, 
  IconShoppingBag, 
  IconLogout, 
  IconChevronLeft, 
  IconChevronRight, 
  IconBuildingStore, 
  IconChefHat, 
  IconAdjustmentsHorizontal, 
  IconArrowsExchange
} from '@tabler/icons-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { UserProfile } from '@/lib/actions/auth';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useRealtimeOrder } from '@/components/providers/realtime-order-provider';
import { usePageTransition } from '../providers/page-transition-provider';

const getNavItems = (outletKey: string) => [
  { name: 'Dashboard', href: `/outlet/${outletKey}/dashboard`, icon: IconLayoutDashboard, roles: ['OWNER', 'MANAGER'] },
  { name: 'Kasir (POS)', href: `/outlet/${outletKey}/pos`, icon: IconShoppingCart, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { name: 'Pesanan Masuk', href: `/outlet/${outletKey}/orders`, icon: IconChefHat, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { name: 'Katalog Menu', href: `/outlet/${outletKey}/katalog`, icon: IconBuildingStore, roles: ['OWNER', 'MANAGER'] },
  { name: 'Daftar Menu', href: `/outlet/${outletKey}/items`, icon: IconPackage, roles: ['OWNER', 'MANAGER'] },
  { name: 'Kategori', href: `/outlet/${outletKey}/categories`, icon: IconTags, roles: ['OWNER', 'MANAGER'] },
  { name: 'Topping & Varian', href: `/outlet/${outletKey}/modifiers`, icon: IconAdjustmentsHorizontal, roles: ['OWNER', 'MANAGER'] },
  { name: 'Stok Bahan', href: `/outlet/${outletKey}/inventory`, icon: IconArchive, roles: ['OWNER', 'MANAGER'] },
  { name: 'Shift Kasir', href: `/outlet/${outletKey}/shifts`, icon: IconWallet, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { name: 'Riwayat Transaksi', href: `/outlet/${outletKey}/transactions`, icon: IconHistory, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { name: 'Laporan Penjualan', href: `/outlet/${outletKey}/reports`, icon: IconChartBar, roles: ['OWNER', 'MANAGER'] },
  { name: 'Diskon & Promo', href: `/outlet/${outletKey}/promotions`, icon: IconPercentage, roles: ['OWNER', 'MANAGER'] },
  { name: 'Tim & Karyawan', href: `/outlet/${outletKey}/team`, icon: IconUserCircle, roles: ['OWNER'] },
  { name: 'Pengaturan', href: `/outlet/${outletKey}/settings`, icon: IconSettings, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
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

  return (
    <>
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b px-4 relative">
        <div className="relative w-24 h-16 flex-shrink-0">
          <Image 
            src="/logo-menuin-memanjang.svg" 
            alt="Logo Menuin" 
            fill 
            className="object-contain" 
            priority
          />
        </div>
        
        {setCollapsed && (
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-5 bg-card border rounded-full p-1 text-muted-foreground hover:text-foreground shadow-sm hidden md:block cursor-pointer"
          >
            {collapsed ? <IconChevronRight size={14} /> : <IconChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-5 px-3 scrollbar-hide space-y-4">
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
                <div
                  className={cn(
                    'flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative cursor-pointer',
                    isActive 
                      ? 'bg-primary/10 text-primary font-semibold' 
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                  {!collapsed && (
                    <span className="ml-3 font-medium text-sm flex-1">{item.name}</span>
                  )}
                  {item.href.includes('/orders') && incomingOrders.length > 0 && (
                    <span className={cn(
                      "absolute bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full",
                      collapsed ? "top-0 right-0 translate-x-1 -translate-y-1" : "right-3 top-1/2 -translate-y-1/2"
                    )}>
                      {incomingOrders.length}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Area */}
      <div className="p-4 border-t border-border/50">
        <div className={cn('flex items-center gap-2', collapsed ? 'flex-col justify-center' : 'justify-between')}>
          {!collapsed && (
            <div className="flex items-center overflow-hidden flex-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0 uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="ml-3 overflow-hidden flex-1">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.role} &bull; {user.restaurantName}</p>
              </div>
            </div>
          )}
          <div className={cn('flex items-center gap-1 mt-2', collapsed && 'flex-col')}>
            <button 
              type="button"
              onClick={() => navigateWithTransition('/select-tenant')}
              className={cn('text-muted-foreground hover:text-primary transition-colors h-9 w-9 flex items-center justify-center cursor-pointer', collapsed && 'bg-muted rounded-full')}
              title="Ganti Toko / Cabang"
            >
              <IconArrowsExchange size={collapsed ? 18 : 20} />
            </button>
            <ThemeSwitcher />
            <button 
              onClick={handleLogout}
              className={cn('text-muted-foreground hover:text-destructive transition-colors h-9 w-9 flex items-center justify-center cursor-pointer', collapsed && 'bg-muted rounded-full')}
              title="Keluar"
            >
              <IconLogout size={collapsed ? 18 : 20} />
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
        className="bg-card border-r hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 shadow-sm"
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} user={user} />
      </motion.aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0 flex flex-col bg-card border-r">
          <SheetTitle className="sr-only">Navigasi</SheetTitle>
          <SidebarContent collapsed={false} user={user} />
        </SheetContent>
      </Sheet>
    </>
  );
}
