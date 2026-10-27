import * as React from 'react';
import { cn } from '@/lib/utils';
import { getStatusDescriptor, type VerificationItemStatus } from '@/lib/verification/ui-status';

interface StatusPillProps {
  status?: string | null;
  customLabel?: string;
  className?: string;
}

export function StatusPill({ status, customLabel, className }: StatusPillProps) {
  const desc = getStatusDescriptor(status);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors border-none',
        desc.badgeClass,
        className
      )}
    >
      {customLabel || desc.label}
    </span>
  );
}
