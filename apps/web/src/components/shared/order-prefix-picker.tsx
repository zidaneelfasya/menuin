'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  generatePrefixSuggestions, 
  sanitizeOrderPrefix, 
} from '@/lib/utils/order-number';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderPrefixPickerProps {
  value: string;
  onChange: (value: string) => void;
  outletName?: string;
  disabled?: boolean;
  className?: string;
  layout?: 'grid' | 'stacked';
}

export function OrderPrefixPicker({
  value,
  onChange,
  outletName = '',
  disabled = false,
  className,
}: OrderPrefixPickerProps) {
  // Realistic 3-digit order number for F&B preview (e.g. 001, 042, 108)
  const [sampleNumber, setSampleNumber] = React.useState('001');

  // Compute smart suggestions based on outletName
  const suggestions = React.useMemo(() => {
    return generatePrefixSuggestions(outletName);
  }, [outletName]);

  const activePrefix = sanitizeOrderPrefix(value || suggestions[0] || 'KSR');

  const handleRefreshSample = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const randomNum = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    setSampleNumber(randomNum);
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
    <div className={cn("space-y-3.5 font-sans w-full", className)}>
      {/* 1. Suggestion Chips */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-800">
            Pilihan Singkatan dari Nama Restoran
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((sug) => {
              const isSelected = activePrefix === sug;
              return (
                <button
                  key={sug}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectSuggestion(sug)}
                  className={cn(
                    "px-3.5 py-1 text-xs font-semibold rounded-full border transition-all duration-150 cursor-pointer",
                    isSelected
                      ? "bg-[#0055D6] text-white border-[#0055D6] shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  )}
                >
                  {sug}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Custom Input Field (Full Width & Agak Kotak rounded-[4px]) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="orderPrefixInput" className="text-xs font-semibold text-slate-800">
            Kode Singkatan Nota Kasir
          </Label>
          <span className="text-[11px] text-slate-400">Otomatis / Opsional</span>
        </div>
        <div className="relative">
          <Input
            id="orderPrefixInput"
            value={value}
            onChange={handleCustomChange}
            disabled={disabled}
            placeholder={suggestions[0] || 'KSR'}
            maxLength={10}
            className="font-mono text-sm font-semibold tracking-wider uppercase h-10 bg-white border-slate-300 rounded-[4px] px-3 focus-visible:ring-1 focus-visible:ring-[#0055D6] focus-visible:border-[#0055D6]"
          />
          {value && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400">
              {value.length} huruf
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 pt-0.5">
          Huruf awal yang tercetak pada nomor struk kasir dan tiket pesanan dapur.
        </p>
      </div>

      {/* 3. Live Preview Card (Clean & Compact) */}
      <div className="space-y-1 pt-0.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-800">
            Contoh Tampilan Nomor di Struk Kasir
          </Label>
          <button
            type="button"
            onClick={handleRefreshSample}
            title="Acak contoh nomor"
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Acak Nomor</span>
          </button>
        </div>
        <div className="h-10 px-3.5 rounded-[4px] border border-dashed border-slate-300 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold font-mono tracking-wider text-slate-900">
              #{activePrefix}-{sampleNumber}
            </span>
            <span className="text-[10px] font-semibold text-[#0055D6] bg-blue-50 px-2 py-0.5 rounded-full">
              Nomor Pesanan
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
            Struk Kasir &bull; Tiket Dapur
          </span>
        </div>
      </div>
    </div>
  );
}

export default OrderPrefixPicker;
