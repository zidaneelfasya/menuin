import * as React from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  verificationStatus?: 'verified' | 'action_required' | 'under_review' | 'pending' | 'draft' | 'incomplete';
  statusNote?: string | null;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  eyebrow,
  title,
  description,
  action,
  verificationStatus,
  statusNote,
  children,
  className,
}: SectionCardProps) {
  const hasHeader = Boolean(eyebrow || title || description || action || verificationStatus);

  const renderStatusBadge = () => {
    if (!verificationStatus || verificationStatus === 'incomplete' || verificationStatus === 'draft') {
      return null;
    }

    if (verificationStatus === 'verified') {
      return (
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold"
          title="Data pada bagian ini telah diverifikasi dan disetujui"
        >
          Terverifikasi
        </span>
      );
    }

    if (verificationStatus === 'action_required') {
      return (
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold"
          title={statusNote || 'Terdapat data atau dokumen yang perlu diperbaiki'}
        >
          Perlu Revisi
        </span>
      );
    }

    if (verificationStatus === 'under_review' || verificationStatus === 'pending') {
      return (
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0e59f9] text-xs font-semibold"
          title="Data sedang diperiksa oleh tim kepatuhan"
        >
          Sedang Ditinjau
        </span>
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border-none p-5 sm:p-6 shadow-sm-md hover:shadow-md transition-all space-y-4',
        className
      )}
    >
      {hasHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            {eyebrow && (
              <span className="text-xs font-semibold text-slate-500 block">
                {eyebrow}
              </span>
            )}
            {title && (
              <h2 className="text-base font-semibold text-slate-900 tracking-tight mt-0.5">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
            {renderStatusBadge()}
            {action}
          </div>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
