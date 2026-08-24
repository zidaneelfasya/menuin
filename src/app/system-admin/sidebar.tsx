'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Server, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/actions/auth';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Dashboard', href: '/system-admin', icon: LayoutDashboard },
  { name: 'Tenants', href: '/system-admin/tenants', icon: Server },
  { name: 'Users', href: '/system-admin/users', icon: Users },
];

export function Sidebar({ user }: { user: UserProfile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? '80px' : '260px' }}
      className="bg-card border-r hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 shadow-sm"
    >
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
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-5 bg-card border rounded-full p-1 text-muted-foreground hover:text-foreground shadow-sm hidden md:block"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide">
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    'flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group',
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground')} />
                  {!collapsed && (
                    <span className="ml-3 font-medium text-sm">{item.name}</span>
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
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0 uppercase">
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
    </motion.aside>
  );
}
