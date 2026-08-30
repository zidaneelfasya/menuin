'use client';

import * as React from 'react';
import { UserProfile } from '@/lib/actions/auth';
import { Sidebar } from './sidebar';
import { Menu, ShieldCheck } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';

export function AdminLayoutShell({
  user,
  children,
}: {
  user: UserProfile;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground antialiased">
      {/* Sidebar Navigation */}
      <Sidebar user={user} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-[260px] transition-[padding] duration-300">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Buka Menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight">Platform Control Panel</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>System Administrator</span>
            </div>
            <div className="md:hidden">
              <ThemeSwitcher />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
