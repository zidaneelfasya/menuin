'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  showRefresh?: boolean;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
  children,
  showRefresh = true,
  className,
}: PageHeaderProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden',
        className
      )}
    >
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">
              {eyebrow}
            </span>
            {badge}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mt-0.5">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
        {showRefresh && (
          <button
            type="button"
            onClick={handleRefresh}
            title="Muat Ulang Halaman"
            disabled={isRefreshing}
            className="w-9 h-9 rounded-full border-none bg-white hover:bg-slate-100 text-slate-600 shadow-sm-md flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={cn('w-4 h-4 text-slate-500', isRefreshing && 'animate-spin')}
            />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
