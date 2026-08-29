'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Server, LogOut, ChevronLeft, ChevronRight, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/actions/auth';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { name: 'Dashboard', href: '/system-admin', icon: LayoutDashboard, desc: 'Ringkasan & Metrik' },
  { name: 'Tenants', href: '/system-admin/tenants', icon: Server, desc: 'Kelola Toko & Langganan' },
  { name: 'Users', href: '/system-admin/users', icon: Users, desc: 'Kelola Pengguna Platform' },
];

export function Sidebar({ 
  user,
  mobileOpen = false,
  setMobileOpen,
}: { 
  user: UserProfile;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen?.(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? '80px' : '270px',
          x: mobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 768 ? -300 : 0)
        }}
        className={cn(
          "bg-card/95 backdrop-blur-md border-r flex flex-col h-screen fixed left-0 top-0 z-50 transition-[width] duration-300 shadow-sm",
          mobileOpen ? "flex !w-[270px]" : "hidden md:flex"
        )}
      >
        {/* Header / Brand */}
        <div className="h-20 flex items-center justify-between border-b px-4 relative">
          <Link href="/system-admin" className="flex items-center gap-3 overflow-hidden">
            <div className="relative w-28 h-10 flex-shrink-0">
              <Image
                src="/logo-menuin-memanjang.svg"
                alt="Logo Menuin"
                fill
                className="object-contain"
                priority
              />
            </div>
            {!collapsed && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                System
              </span>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex absolute -right-3 top-7 bg-card border rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted shadow-sm transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* System Admin Portal Banner */}
        {!collapsed && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/15 flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-foreground tracking-tight leading-none">System Admin</p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">Control Center</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/system-admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen?.(false)}
                >
                  <div
                    className={cn(
                      'flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-medium'
                        : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105',
                        isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    {!collapsed && (
                      <div className="ml-3 overflow-hidden">
                        <span className="text-sm block leading-tight">{item.name}</span>
                        <span className={cn("text-[11px] block mt-0.5 truncate", isActive ? "text-blue-100" : "text-muted-foreground")}>
                          {item.desc}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Actions */}
        <div className="p-3 border-t border-border/50 bg-muted/20">
          <div className={cn('flex items-center gap-2', collapsed ? 'flex-col justify-center' : 'justify-between')}>
            {!collapsed && (
              <div className="flex items-center overflow-hidden flex-1 min-w-0 pr-1">
                <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold flex-shrink-0 text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-2.5 overflow-hidden">
                  <p className="text-xs font-semibold truncate leading-tight">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{user.email}</p>
                </div>
              </div>
            )}
            <div className={cn('flex items-center gap-1', collapsed && 'flex-col')}>
              <ThemeSwitcher />
              <button
                onClick={handleLogout}
                className={cn(
                  'text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors h-8 w-8 flex items-center justify-center',
                  collapsed && 'bg-muted rounded-full'
                )}
                title="Keluar"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
