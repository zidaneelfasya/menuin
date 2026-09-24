'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { StoreHeroHeader, StoreHeroHeaderProps } from './store-hero-header';

interface StoreLayoutClientProps {
  headerProps: StoreHeroHeaderProps;
  children: ReactNode;
}

export function StoreLayoutClient({
  headerProps,
  children,
}: StoreLayoutClientProps) {
  const pathname = usePathname();
  const isCleanLayout = pathname?.includes('/checkout') || pathname?.includes('/payment') || pathname?.includes('/status');

  if (isCleanLayout) {
    return (
      <div className="min-h-screen bg-slate-100/60 font-sans text-gray-800 w-full flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-[#f8fafc] relative">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 font-sans text-gray-800 w-full flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-[#f8fafc] pb-24 relative overflow-x-clip">
        <StoreHeroHeader {...headerProps} />
        <main className="w-full px-3.5 sm:px-4 py-3 sm:py-4">
          {children}
        </main>
      </div>
    </div>
  );
}
