'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  UserRound,
  Landmark,
  Store,
  History,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePageTransition } from '@/components/providers/page-transition-provider';

export function VerificationNav() {
  const pathname = usePathname();
  const params = useParams();
  const outletKey = (params.outletKey as string) || '';
  const { navigateWithTransition, prefetchRoute } = usePageTransition();

  const navItems = [
    {
      href: `/outlet/${outletKey}/verification`,
      icon: LayoutDashboard,
      label: 'Ringkasan',
      exact: true,
    },
    {
      href: `/outlet/${outletKey}/verification/business`,
      icon: Building2,
      label: 'Profil Usaha',
      exact: false,
    },
    {
      href: `/outlet/${outletKey}/verification/representative`,
      icon: UserRound,
      label: 'Perwakilan Bisnis',
      exact: false,
    },
    {
      href: `/outlet/${outletKey}/verification/settlement`,
      icon: Landmark,
      label: 'Rekening Settlement',
      exact: false,
    },
    {
      href: `/outlet/${outletKey}/verification/outlet`,
      icon: Store,
      label: 'Lokasi Gerai',
      exact: false,
    },
    {
      href: `/outlet/${outletKey}/verification/history`,
      icon: History,
      label: 'Riwayat Pengajuan',
      exact: false,
    },
  ];

  return (
    <div className="flex flex-col h-full p-2 md:p-3">
      {/* Back to Dashboard link */}
      <div className="px-2 pt-1 pb-2">
        <Link
          href={`/outlet/${outletKey}/dashboard`}
          prefetch={true}
          onMouseEnter={() => prefetchRoute(`/outlet/${outletKey}/dashboard`)}
          onClick={(e) => {
            e.preventDefault();
            navigateWithTransition(`/outlet/${outletKey}/dashboard`);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>

      {/* Sub-sidebar Header */}
      <div className="hidden md:flex items-center gap-2.5 px-2 py-2 mb-3 border-b border-slate-100">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900 truncate">
            Verifikasi Bisnis
          </h2>
          <p className="text-[11px] text-slate-500 truncate">
            Legalitas & kepatuhan gerai
          </p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex space-x-1.5 md:flex-col md:space-x-0 md:space-y-1 overflow-x-auto pb-1 md:pb-0 no-scrollbar flex-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onMouseEnter={() => prefetchRoute(item.href)}
              onClick={(e) => {
                e.preventDefault();
                navigateWithTransition(item.href);
              }}
              className={cn(
                'flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-xs md:text-sm transition-all duration-150 whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-[#0e59f9] text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 flex-shrink-0',
                  isActive ? 'text-white' : 'text-slate-500'
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
