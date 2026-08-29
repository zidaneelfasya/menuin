'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  Archive, 
  History,
  BarChart3, 
  Wallet, 
  Percent, 
  UserCircle, 
  Settings,
  ShoppingBag,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
  ChefHat
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { UserProfile, signOutAction } from '@/lib/actions/auth';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useRealtimeOrder } from '@/components/providers/realtime-order-provider';

const navItems = [
  { name: 'Dashboard', href: '/tenants/dashboard', icon: LayoutDashboard, roles: ['SUPERADMIN'] },
  { name: 'Kasir (POS)', href: '/tenants/pos', icon: ShoppingCart, roles: ['SUPERADMIN', 'CASHIER'] },
  { name: 'Pesanan Dapur', href: '/tenants/orders', icon: ChefHat, roles: ['SUPERADMIN', 'CASHIER'] },
  { name: 'Katalog', href: '/tenants/catalog', icon: Store, roles: ['SUPERADMIN'] },
  { name: 'Produk', href: '/tenants/products', icon: Package, roles: ['SUPERADMIN'] },
  { name: 'Kategori', href: '/tenants/categories', icon: Tags, roles: ['SUPERADMIN'] },
  { name: 'Stock', href: '/tenants/inventory', icon: Archive, roles: ['SUPERADMIN'] },
  { name: 'Riwayat Transaksi', href: '/tenants/transactions', icon: History, roles: ['SUPERADMIN', 'CASHIER'] },
  { name: 'Laporan', href: '/tenants/reports', icon: BarChart3, roles: ['SUPERADMIN'] },
  { name: 'Keuangan', href: '/tenants/finance', icon: Wallet, roles: ['SUPERADMIN'] },
  { name: 'Promo', href: '/tenants/promotions', icon: Percent, roles: ['SUPERADMIN'] },
  { name: 'Kasir Toko', href: '/tenants/users', icon: UserCircle, roles: ['SUPERADMIN'] },
  { name: 'Pengaturan', href: '/tenants/settings', icon: Settings, roles: ['SUPERADMIN'] },
  { name: 'Pengaturan Kasir', href: '/tenants/pos/settings', icon: Settings, roles: ['SUPERADMIN'] },
  { name: 'Pembelian', href: '/tenants/purchases', icon: ShoppingBag, roles: ['SUPERADMIN'] },
];

function SidebarContent({ collapsed, setCollapsed, user }: { collapsed: boolean; setCollapsed?: (val: boolean) => void; user: UserProfile }) {
  const pathname = usePathname();
  const router = useRouter();
  const { incomingOrders } = useRealtimeOrder();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

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
            className="absolute -right-3 top-5 bg-card border rounded-full p-1 text-muted-foreground hover:text-foreground shadow-sm hidden md:block"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide">
        <nav className="space-y-1.5">
          {navItems.filter(item => !item.roles || item.roles.includes(user.role as any)).map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    'flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                  {!collapsed && (
                    <span className="ml-3 font-medium text-sm flex-1">{item.name}</span>
                  )}
                  {item.href === '/tenants/orders' && incomingOrders.length > 0 && (
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
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.role}</p>
              </div>
            </div>
          )}
          <div className={cn('flex items-center gap-1', collapsed && 'flex-col')}>
            <ThemeSwitcher />
            <button 
              onClick={handleLogout}
              className={cn('text-muted-foreground hover:text-destructive transition-colors h-9 w-9 flex items-center justify-center', collapsed && 'bg-muted rounded-full')}
              title="Logout"
            >
              <LogOut size={collapsed ? 18 : 20} />
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
