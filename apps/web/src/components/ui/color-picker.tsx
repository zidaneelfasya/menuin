'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Copy, Check, Pipette } from 'lucide-react';
import { toast } from 'sonner';

export interface ColorPreset {
  name: string;
  hex: string;
}

export const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
  { name: 'Menuin Blue', hex: '#2563EB' },
  { name: 'Indigo Modern', hex: '#4F46E5' },
  { name: 'Deep Violet', hex: '#7C3AED' },
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Forest Teal', hex: '#0D9488' },
  { name: 'Warm Amber', hex: '#F59E0B' },
  { name: 'Sunset Orange', hex: '#EA580C' },
  { name: 'Coral Rose', hex: '#F43F5E' },
  { name: 'Crimson Red', hex: '#E11D48' },
  { name: 'Dark Slate', hex: '#1E293B' },
  { name: 'Mocha Coffee', hex: '#78350F' },
  { name: 'Midnight Navy', hex: '#0F172A' },
];

export interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  presets?: ColorPreset[];
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
}

function normalizeHex(input: string): string {
  if (!input) return '#2563EB';
  const clean = input.trim();
  return clean.startsWith('#') ? clean.toUpperCase() : `#${clean.toUpperCase()}`;
}

function getContrastTextColor(hex: string): string {
  try {
    const raw = hex.replace('#', '');
    if (raw.length !== 6 && raw.length !== 3) return '#FFFFFF';
    const r = parseInt(raw.length === 3 ? raw[0] + raw[0] : raw.slice(0, 2), 16);
    const g = parseInt(raw.length === 3 ? raw[1] + raw[1] : raw.slice(2, 4), 16);
    const b = parseInt(raw.length === 3 ? raw[2] + raw[2] : raw.slice(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 150 ? '#0F172A' : '#FFFFFF';
  } catch {
    return '#FFFFFF';
  }
}

export function ColorPicker({
  value = '#2563EB',
  onChange,
  presets = DEFAULT_COLOR_PRESETS,
  disabled = false,
  className,
  showPreview = true,
}: ColorPickerProps) {
  const safeHex = normalizeHex(value);
  const [copied, setCopied] = React.useState(false);
  const [hasEyeDropper, setHasEyeDropper] = React.useState(false);
  const colorInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      setHasEyeDropper(true);
    }
  }, []);

  const handleCopyHex = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(safeHex);
      setCopied(true);
      toast.success(`Kode warna ${safeHex} disalin`);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handlePickEyeDropper = async () => {
    if (typeof window === 'undefined' || !('EyeDropper' in window)) return;
    try {
      // @ts-expect-error EyeDropper is supported in Chromium
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        onChange?.(result.sRGBHex.toUpperCase());
      }
    } catch {
      // User cancelled pipette
    }
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('#')) val = '#' + val;
    val = val.slice(0, 7);
    onChange?.(val.toUpperCase());
  };

  const contrastColor = getContrastTextColor(safeHex);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Preset Swatches + Custom Picker Controls */}
      <div className="space-y-3">
        {/* Swatches Grid */}
        <div className="flex flex-wrap items-center gap-2">
          {presets.map((preset) => {
            const isSelected = safeHex.toUpperCase() === preset.hex.toUpperCase();
            return (
              <button
                key={preset.hex}
                type="button"
                disabled={disabled}
                onClick={() => onChange?.(preset.hex.toUpperCase())}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all relative cursor-pointer border',
                  isSelected
                    ? 'border-foreground ring-2 ring-primary/30 scale-105 shadow-xs'
                    : 'border-black/10 dark:border-white/10 opacity-85 hover:opacity-100 hover:scale-105'
                )}
                style={{ backgroundColor: preset.hex }}
                title={preset.name}
              >
                {isSelected && (
                  <Check
                    className="w-4 h-4 drop-shadow-xs"
                    style={{ color: getContrastTextColor(preset.hex) }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Input + Pipette + Native Color Input */}
        <div className="flex items-center gap-2.5 max-w-sm">
          {/* Native Color Swatch Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              disabled={disabled}
              onClick={() => colorInputRef.current?.click()}
              className="w-10 h-10 rounded-xl border border-border/80 shadow-2xs flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
              style={{ backgroundColor: safeHex }}
              title="Pilih warna kustom"
            />
            <input
              ref={colorInputRef}
              type="color"
              value={safeHex.length === 7 ? safeHex : '#2563EB'}
              onChange={(e) => onChange?.(e.target.value.toUpperCase())}
              disabled={disabled}
              className="sr-only"
              tabIndex={-1}
            />
          </div>

          {/* Hex Input */}
          <div className="relative flex-1">
            <Input
              value={safeHex}
              onChange={handleHexInputChange}
              disabled={disabled}
              maxLength={7}
              placeholder="#2563EB"
              className="h-10 font-mono text-xs font-semibold uppercase bg-background/80 hover:bg-background border-border/80 rounded-xl pl-3 pr-8 tracking-wider focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
            />
            <button
              type="button"
              onClick={handleCopyHex}
              disabled={disabled}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Salin kode hex"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Pipette / EyeDropper */}
          {hasEyeDropper && (
            <button
              type="button"
              disabled={disabled}
              onClick={handlePickEyeDropper}
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-border/80 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer shrink-0 shadow-2xs"
              title="Ambil warna dari layar"
            >
              <Pipette className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Live Minimal Preview */}
      {showPreview && (
        <div className="pt-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
              style={{
                backgroundColor: safeHex,
                color: contrastColor,
              }}
            >
              Tombol Utama
            </span>
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors"
              style={{
                backgroundColor: `${safeHex}15`,
                color: safeHex,
                borderColor: `${safeHex}35`,
                borderWidth: '1px',
              }}
            >
              Badge Menu
            </span>
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
              style={{
                borderColor: `${safeHex}60`,
                borderWidth: '1px',
                color: safeHex,
              }}
            >
              Border Aksen
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ColorPicker;
