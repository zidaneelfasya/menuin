'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CircleCheck,
  Clock,
  CircleAlert,
  CircleDashed,
  Edit3,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusDescriptor, type VerificationItemStatus } from '@/lib/verification/ui-status';

interface PillarCardProps {
  eyebrow: string;
  title: string;
  status?: string | null;
  icon: LucideIcon;
  href: string;
  editHref?: string;
  className?: string;
}

export function PillarCard({
  eyebrow,
  title,
  status,
  icon: Icon,
  href,
  editHref,
  className,
}: PillarCardProps) {
  const router = useRouter();
  const desc = getStatusDescriptor(status);

  const renderIndicator = (s: VerificationItemStatus) => {
    switch (s) {
      case 'verified':
        // Filled emerald green circle with white checkmark
        return (
          <CircleCheck className="w-5 h-5 fill-emerald-500 text-white flex-shrink-0" />
        );
      case 'under_review':
        return <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case 'action_required':
        return <CircleAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />;
      case 'incomplete':
      default:
        return <CircleDashed className="w-4 h-4 text-slate-300 flex-shrink-0" />;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(href);
        }
      }}
      className={cn(
        'p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between min-h-[110px] cursor-pointer transition-all duration-150 select-none hover:shadow-xs',
        desc.cardBgClass,
        desc.cardBorderClass,
        className
      )}
    >
      {/* Top Row: Circular blue icon on left, status indicator (CircleAlert for action_required) on right */}
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-full bg-[#0e59f9] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
          <Icon className="w-4 h-4 text-white" />
        </div>
        {renderIndicator(desc.status)}
      </div>

      {/* Bottom Info: Eyebrow, Title & Status Label on left, Edit Button on bottom right if action_required */}
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium text-slate-500 block truncate">
            {eyebrow}
          </span>
          <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate mt-0.5">
            {title}
          </p>
          <span
            className={cn(
              'text-[11px] font-medium block mt-0.5',
              desc.status === 'verified' && 'text-emerald-700',
              desc.status === 'under_review' && 'text-amber-700',
              desc.status === 'action_required' && 'text-rose-700',
              desc.status === 'incomplete' && 'text-slate-400'
            )}
          >
            {desc.label}
          </span>
        </div>

        {desc.status === 'action_required' && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(editHref || href);
            }}
            className="group/editbtn w-7 h-7 rounded-full bg-blue-50 hover:bg-[#0e59f9] text-[#0e59f9] hover:text-white flex items-center justify-center transition-all duration-200 ease-out active:scale-90 shadow-2xs hover:shadow-xs cursor-pointer select-none flex-shrink-0"
            title="Perbaiki Data (Buka Formulir Onboarding)"
            aria-label="Perbaiki data di formulir onboarding"
          >
            <Edit3 className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover/editbtn:scale-110" />
          </button>
        )}
      </div>
    </div>
  );
}


