import * as React from 'react';
import Link from 'next/link';
import { CircleAlert, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewerNotesCardProps {
  outletKey: string;
  notes: Array<{
    pillar: string;
    reason: string;
    actionHref: string;
  }>;
  className?: string;
}

export function ReviewerNotesCard({
  outletKey,
  notes,
  className,
}: ReviewerNotesCardProps) {
  if (!notes || notes.length === 0) return null;

  return (
    <div
      className={cn(
        'bg-rose-50/40 rounded-2xl border border-rose-200 p-5 sm:p-6 shadow-sm space-y-3',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <CircleAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
        <div>
          <span className="text-xs font-semibold text-rose-700 block">
            Catatan Peninjau Kepatuhan
          </span>
          <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
            Tindakan Diperlukan untuk Melanjutkan Verifikasi
          </h3>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {notes.map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-rose-200/60 bg-white/90 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <span className="text-xs font-semibold text-rose-700">
                {item.pillar}
              </span>
              <p className="text-xs text-slate-700 mt-0.5">{item.reason}</p>
            </div>
            <Link
              href={item.actionHref}
              className="group inline-flex items-center gap-1.5 h-7 px-3 rounded-[6px] text-xs font-semibold text-[#0e59f9] bg-blue-50 hover:bg-[#0e59f9] hover:text-white border border-blue-200/60 hover:border-[#0e59f9] transition-all duration-200 ease-out active:scale-95 shadow-2xs flex-shrink-0 cursor-pointer select-none"
            >
              <span>Perbaiki Data</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
