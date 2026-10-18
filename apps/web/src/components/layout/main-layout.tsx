'use client';

import * as React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/lib/actions/auth';
import { RealtimeOrderProvider } from '../providers/realtime-order-provider';

import { usePathname } from 'next/navigation';

export function MainLayout({ children, user, availableTenants }: { children: React.ReactNode, user: UserProfile, availableTenants: any[] }) {
  const pathname = usePathname();

  const subSidebarSections = ['katalog', 'shifts', 'settings', 'reports', 'verification'];
  const getSection = (path: string) => {
    const match = path.match(/\/outlet\/[^\/]+\/([^\/\?#]+)/);
    return match ? match[1] : '';
  };

  const currentSection = getSection(pathname);
  const hasSubSidebar = subSidebarSections.includes(currentSection);

  const [collapsed, setCollapsed] = React.useState(hasSubSidebar);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const prevSectionRef = React.useRef(currentSection);

  React.useEffect(() => {
    if (prevSectionRef.current !== currentSection) {
      prevSectionRef.current = currentSection;
      setCollapsed(hasSubSidebar);
    }
  }, [currentSection, hasSubSidebar]);

  return (
    <RealtimeOrderProvider tenantId={user.tenantId || ''}>
      <div className="min-h-screen bg-[#F9FBFF] text-foreground">
        <Sidebar 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          mobileOpen={mobileOpen} 
          setMobileOpen={setMobileOpen} 
          user={user}
        />
        <Header 
          collapsed={collapsed} 
          setMobileOpen={setMobileOpen} 
          user={user}
          availableTenants={availableTenants}
        />
        <main 
          className={cn(
            "pt-16 transition-all duration-300 min-h-screen",
            collapsed ? "md:pl-[80px]" : "md:pl-[260px]",
            "pl-0" // On mobile, no padding left
          )}
        >
          {hasSubSidebar ? (
            <div className="h-[calc(100vh-4rem)] overflow-hidden">
              {children}
            </div>
          ) : (
            <div className="p-4 md:p-6 h-[calc(100vh-4rem)] overflow-y-auto">
              {children}
            </div>
          )}
        </main>
      </div>
    </RealtimeOrderProvider>
  );
}
