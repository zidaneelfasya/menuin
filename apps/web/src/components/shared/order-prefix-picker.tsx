'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  generatePrefixSuggestions, 
  sanitizeOrderPrefix, 
  generateOrderSuffix 
} from '@/lib/utils/order-number';
import { Sparkles, RefreshCw, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderPrefixPickerProps {
  value: string;
  onChange: (value: string) => void;
  outletName?: string;
  disabled?: boolean;
  className?: string;
}

export function OrderPrefixPicker({
  value,
  onChange,
  outletName = '',
  disabled = false,
  className,
}: OrderPrefixPickerProps) {
  // Sample 8-character random suffix for live preview
  const [sampleSuffix, setSampleSuffix] = React.useState('7B4K9X2M');

  // Compute smart suggestions based on outletName
  const suggestions = React.useMemo(() => {
    return generatePrefixSuggestions(outletName);
  }, [outletName]);

  const activePrefix = sanitizeOrderPrefix(value || suggestions[0] || 'ORD');

  // Refresh sample preview with new random 8 characters
  const handleRefreshSample = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setSampleSuffix(generateOrderSuffix(8));
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = sanitizeOrderPrefix(raw);
    onChange(sanitized);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (disabled) return;
    onChange(suggestion);
  };

  return (
    <div className={cn("space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <Label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-slate-500" />
            Kode Karakter Awal ID Pesanan (Order Prefix)
          </Label>
          <p className="text-xs text-slate-500 mt-0.5">
            Awalan kode pesanan unik untuk outlet ini, dilanjutkan 8 digit acak.
          </p>
        </div>
      </div>

      {/* Suggestion Chips */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <span>Rekomendasi dari nama outlet:</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {suggestions.map((sug) => {
              const isSelected = activePrefix === sug;
              return (
                <button
                  key={sug}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectSuggestion(sug)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 flex items-center gap-1",
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  )}
                >
                  <span>{sug}</span>
                 
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input + Preview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <Label htmlFor="orderPrefixInput" className="text-xs font-medium text-slate-600">
            Kustomisasi Kode Awalan
          </Label>
          <div className="relative">
            <Input
              id="orderPrefixInput"
              value={value}
              onChange={handleCustomChange}
              disabled={disabled}
              placeholder={suggestions[0] || 'MG'}
              maxLength={12}
              className="font-mono text-sm tracking-wide uppercase bg-slate-50/50"
            />
            {value && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                {value.length} kar
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Hanya huruf dan angka (A-Z, 0-9). Otomatis huruf kapital.
          </p>
        </div>

        {/* Live Preview Simulation Card */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-slate-600">
              Pratinjau ID Pesanan Pelanggan
            </Label>
            <button
              type="button"
              onClick={handleRefreshSample}
              title="Acak contoh 8 karakter"
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Acak Sampel</span>
            </button>
          </div>
          <div className="h-9 px-3 rounded-md border border-dashed border-slate-300 bg-slate-50 flex items-center justify-between">
            <div className="font-mono text-xs sm:text-sm tracking-wider">
              <span className="font-semibold px-1 py-0.5 ">
                {activePrefix}
              </span>
              <span className="text-slate-700 font-medium">
                {sampleSuffix}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              8 kar acak
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Format yang akan muncul di struk kasir, status online, & tiket dapur.
          </p>
        </div>
      </div>
    </div>
  );
}
