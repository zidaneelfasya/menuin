import * as React from 'react';
import { cn } from '@/lib/utils';

interface ReadOnlyFieldProps {
  label: string;
  value?: string | number | null;
  placeholder?: string;
  hint?: string;
  badge?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function ReadOnlyField({
  label,
  value,
  placeholder = '-',
  hint,
  badge,
  className,
  children,
}: ReadOnlyFieldProps) {
  const displayValue = value !== undefined && value !== null && value !== '' ? String(value) : placeholder;
  const isPlaceholder = displayValue === placeholder;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600 tracking-tight">
          {label}
        </label>
        {badge}
      </div>
      {children ? (
        children
      ) : (
        <div
          className={cn(
            'min-h-10 rounded-xl border border-[#EAEFF8] bg-slate-50/70 px-3.5 py-2 flex items-center text-xs sm:text-sm font-medium transition-colors select-text',
            isPlaceholder ? 'text-slate-400 italic' : 'text-slate-800'
          )}
        >
          <span className="truncate">{displayValue}</span>
        </div>
      )}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
