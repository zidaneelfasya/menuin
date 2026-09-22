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
  const isCleanLayout = pathname?.includes('/checkout') || pathname?.includes('/payment');

  if (isCleanLayout) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-800 w-full">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 font-sans text-gray-800 w-full max-w-full overflow-x-clip">
      <StoreHeroHeader {...headerProps} />
      <main className="max-w-2xl mx-auto px-4 py-4 w-full">
        {children}
      </main>
    </div>
  );
}
