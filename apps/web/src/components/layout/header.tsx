'use client';

import * as React from 'react';
import { Bell, Wifi, MonitorSmartphone, Menu, ChevronDown, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/lib/actions/auth';
import { ThemeSwitcher } from '@/components/theme-switcher';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createAvatar } from '@dicebear/core';
import { openPeeps } from '@dicebear/collection';

export function Header({ 
  collapsed,
  setMobileOpen,
  user,
  availableTenants = []
}: { 
  collapsed: boolean;
  setMobileOpen: (open: boolean) => void;
  user: UserProfile;
  availableTenants?: any[];
}) {
  const [time, setTime] = React.useState<Date | null>(null);
  const [domain, setDomain] = React.useState('menuin.id');

  // Exact same doodle art avatar generator as in TeamClient
  const userAvatarUri = React.useMemo(() => {
    try {
      const seed = (user.email || user.name || 'user').trim().toLowerCase();
      const avatar = createAvatar(openPeeps, {
        seed,
        backgroundColor: ['dbeafe', 'eff6ff', 'e0f2fe'],
        scale: 92,
      });
      return avatar.toDataUri();
    } catch {
      return null;
    }
  }, [user.email, user.name]);

  React.useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    if (typeof window !== 'undefined') {
      setDomain(window.location.host.includes('localhost') ? 'localhost:3000' : 'menuin.id');
    }
    
    return () => clearInterval(timer);
  }, []);

  const activeTenant = availableTenants.find(t => t.tenantId === user.tenantId);
  const currentLogoUrl = user.storeLogoUrl || activeTenant?.storeLogoUrl;
  const formattedUrl = activeTenant?.slug ? `${activeTenant.slug}.${domain}` : '';

  return (
    <header 
      className={cn(
        "h-16 bg-white border-b border-[#F0F2F6] flex items-center justify-between px-4 fixed top-0 right-0 z-30 transition-all duration-300 left-0 shadow-[0_4px_20px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.02)]",
        collapsed ? "md:left-[80px]" : "md:left-[260px]"
      )}
    >
      {/* Left section: Breadcrumb Navigation */}
      <div className="flex items-center flex-1 gap-2">
        <button 
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        <div className="hidden md:flex items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center">
                  <img 
                    src={currentLogoUrl || `https://api.dicebear.com/10.x/waves/svg?seed=${encodeURIComponent(user.restaurantName || 'Menuin')}&radius=10`} 
                    alt={user.restaurantName || 'Outlet Logo'} 
                    className="h-6 w-6 rounded-md object-cover border border-border/50 bg-muted/30" 
                  />
                </BreadcrumbPage>
              </BreadcrumbItem>
              
              <BreadcrumbSeparator />
              
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1.5 font-semibold text-foreground hover:bg-muted px-2 py-1 rounded-md transition-colors outline-none">
                    <span className="truncate max-w-[150px]">{user.restaurantName || 'Pilih Outlet'}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[220px]">
                    {availableTenants.map((t) => (
                      <DropdownMenuItem key={t.outletKey} asChild>
                        <a href={`/outlet/${t.outletKey}/dashboard`} className="cursor-pointer flex items-center gap-2">
                          <img 
                            src={t.storeLogoUrl || `https://api.dicebear.com/10.x/waves/svg?seed=${encodeURIComponent(t.name || 'Menuin')}&radius=10`} 
                            alt={t.name} 
                            className="h-4 w-4 rounded-sm object-cover border border-border/50 bg-muted/30" 
                          />
                          <span className="truncate">{t.name}</span>
                        </a>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>

              {formattedUrl && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink 
                      href={`http://${formattedUrl}`} 
                      target="_blank"
                      className="text-primary/80 hover:text-primary max-w-[200px] truncate"
                    >
                      {formattedUrl}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Right section: Info & Actions */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* User Info */}
        <div className="hidden md:flex items-center px-3 py-1.5 bg-muted/50 rounded-lg text-sm border border-border/50">
          {userAvatarUri ? (
            <img 
              src={userAvatarUri} 
              alt={user.name} 
              className="h-6 w-6 rounded-full mr-2 bg-blue-50/50 border border-blue-200/80 dark:border-blue-900/60 object-cover shrink-0 select-none shadow-xs" 
            />
          ) : (
            <div className="h-6 w-6 rounded-full mr-2 bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-600 dark:text-blue-300 font-medium text-[10px] flex items-center justify-center shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-xs leading-none">{user.name}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{user.role}</span>
          </div>
        </div>

        {/* Time */}
        <div className="hidden sm:block text-sm font-medium text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/30">
          {time ? time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '...'}
        </div>

        {/* Network Status */}
        <div className="hidden sm:flex text-success items-center justify-center h-10 w-10 rounded-full hover:bg-success/10 transition-colors cursor-help" title="Online">
          <Wifi className="h-5 w-5" />
        </div>

        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* Notifications */}
        <button className="relative text-muted-foreground hover:text-foreground h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border-2 border-card"></span>
        </button>
      </div>
    </header>
  );
}
