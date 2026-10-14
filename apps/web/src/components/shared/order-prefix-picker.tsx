'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  generatePrefixSuggestions, 
  sanitizeOrderPrefix, 
  generateOrderSuffix 
} from '@/lib/utils/order-number';
import { RefreshCw } from 'lucide-react';
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
    <div className={cn("grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 items-start", className)}>
      <div className="md:col-span-4 space-y-0.5">
        <Label className="text-sm font-semibold text-foreground">
          Format ID Pesanan (Prefix)
        </Label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Awalan kode unik pesanan outlet (diikuti 8 karakter acak).
        </p>
      </div>

      <div className="md:col-span-8 space-y-3.5">
        {/* Suggestion Chips */}
        {suggestions.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground font-medium">
              Rekomendasi dari nama outlet:
            </span>
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
                      "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 cursor-pointer",
                      isSelected
                        ? "bg-foreground text-background border-foreground shadow-2xs"
                        : "bg-muted/40 text-foreground border-border/80 hover:bg-muted/70 hover:border-border"
                    )}
                  >
                    {sug}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input + Preview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-0.5">
          <div className="space-y-1.5">
            <Label htmlFor="orderPrefixInput" className="text-xs font-medium text-muted-foreground">
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
                className="font-mono text-xs font-semibold tracking-wider uppercase h-10 bg-background/80 hover:bg-background border-border/80 rounded-xl"
              />
              {value && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground">
                  {value.length} kar
                </span>
              )}
            </div>
          </div>

          {/* Live Preview Simulation Card */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">
                Pratinjau Kode Struk
              </Label>
              <button
                type="button"
                onClick={handleRefreshSample}
                title="Acak contoh 8 karakter"
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Acak Sampel</span>
              </button>
            </div>
            <div className="h-10 px-3 rounded-xl border border-dashed border-border/80 bg-muted/20 flex items-center justify-between">
              <div className="font-mono text-xs tracking-wider">
                <span className="font-semibold text-foreground">
                  {activePrefix}-
                </span>
                <span className="text-muted-foreground font-medium">
                  {sampleSuffix}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                8 kar
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderPrefixPicker;
