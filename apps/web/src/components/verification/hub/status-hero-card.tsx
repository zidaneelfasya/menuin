'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HubOverallSummary } from '@/lib/verification/ui-status';

interface StatusHeroCardProps {
  summary: HubOverallSummary;
  onActivate?: () => Promise<void>;
  isActivating?: boolean;
  isOwner?: boolean;
  className?: string;
}

export function StatusHeroCard({
  summary,
  onActivate,
  isActivating = false,
  isOwner = true,
  className,
}: StatusHeroCardProps) {
  const isDirectAction = summary.primaryActionHref.startsWith('#');

  return (
    <div
      className={cn(
        'border-none shadow-md hover:shadow-lg rounded-2xl bg-[#0e59f9] text-white transition-all flex flex-col justify-between overflow-hidden min-h-[220px] p-5 sm:p-6',
        className
      )}
    >
      {/* Top Row: Icon & Pill */}
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-full bg-white text-[#0e59f9] flex items-center justify-center shadow-xs flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-[#0e59f9]" />
        </div>
        {/* Status label: text only in pure white */}
        <span className="text-xs font-semibold text-white">
          {summary.pillLabel}
        </span>
      </div>

      {/* Center Row: Eyebrow, Title & Description */}
      <div className="my-4">
        <span className="text-xs font-semibold text-white/80 block">
          {summary.eyebrow}
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
          {summary.title}
        </h2>
        <p className="text-xs text-blue-100/90 mt-1 max-w-xl leading-relaxed">
          {summary.description}
        </p>
      </div>

      {/* Bottom Row: Actions */}
      <div className="flex items-center gap-2.5 flex-wrap pt-2 border-t border-white/10">
        {!isOwner ? (
          <div className="h-9 px-4 rounded-full bg-white/20 text-white text-xs font-medium inline-flex items-center gap-1.5 backdrop-blur-xs select-none">
            <span>Akses Khusus Pemilik (Mode Lihat)</span>
          </div>
        ) : isDirectAction ? (
          <button
            type="button"
            onClick={onActivate}
            disabled={isActivating}
            className="h-9 px-4 rounded-full bg-white hover:bg-slate-100 text-[#0e59f9] text-xs font-semibold shadow-sm-md inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-75"
          >
            {isActivating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0e59f9]" />
                <span>Mengaktifkan...</span>
              </>
            ) : (
              <>
                <span>{summary.primaryActionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#0e59f9]" />
              </>
            )}
          </button>
        ) : (
          <Link
            href={summary.primaryActionHref}
            className="h-9 px-4 rounded-full bg-white hover:bg-slate-100 text-[#0e59f9] text-xs font-semibold shadow-sm-md inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{summary.primaryActionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0e59f9]" />
          </Link>
        )}

        {isOwner && summary.secondaryActionLabel && summary.secondaryActionHref && (
          <Link
            href={summary.secondaryActionHref}
            className="h-9 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{summary.secondaryActionLabel}</span>
          </Link>
        )}
      </div>
    </div>
  );
}

