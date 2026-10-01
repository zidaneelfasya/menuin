'use client';

import * as React from 'react';
import {
  ColorPicker as HeroColorPicker,
  ColorArea,
  ColorSlider,
  ColorSwatch,
  ColorField,
  ColorSwatchPicker,
} from '@heroui/react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChevronDown, Copy, Check, Palette, Pipette } from 'lucide-react';
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

// Helper: Ensure valid uppercase hex string
function normalizeHex(input: string): string {
  if (!input) return '#2563EB';
  const clean = input.trim();
  return clean.startsWith('#') ? clean.toUpperCase() : `#${clean.toUpperCase()}`;
}

// Helper: Determine readable text contrast
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

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      setHasEyeDropper(true);
    }
  }, []);

  const matchedPreset = React.useMemo(() => {
    return presets.find((p) => p.hex.toUpperCase() === safeHex);
  }, [presets, safeHex]);

  const handleCopyHex = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(safeHex);
      setCopied(true);
      toast.success(`Kode warna ${safeHex} disalin!`);
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

  const contrastColor = getContrastTextColor(safeHex);

  return (
    <div className={cn('space-y-3.5', className)}>
      <div className="flex flex-wrap items-center gap-3">
        {/* HeroUI Composable ColorPicker */}
        <HeroColorPicker
          value={safeHex}
          onChange={(color) => {
            const nextHex = color?.toString('hex')?.toUpperCase();
            if (nextHex && nextHex !== safeHex) {
              onChange?.(nextHex);
            }
          }}
        >
          {/* Trigger Button with Active Swatch & Label */}
          <HeroColorPicker.Trigger
            isDisabled={disabled}
            className={cn(
              'group inline-flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all text-xs font-medium cursor-pointer select-none',
              'bg-background/90 hover:bg-background border-border/80 hover:border-border shadow-2xs',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'
            )}
          >
            <ColorSwatch className="w-5 h-5 rounded-lg border border-black/10 shadow-inner shrink-0" />
            <span className="font-mono font-semibold text-foreground tracking-wide text-xs">
              {safeHex}
            </span>
            {matchedPreset && (
              <span className="hidden sm:inline-block text-[11px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60">
                {matchedPreset.name}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 group-hover:text-foreground shrink-0" />
          </HeroColorPicker.Trigger>

          {/* Popover Panel */}
          <HeroColorPicker.Popover
            placement="bottom start"
            className="w-80 p-4 rounded-2xl border border-border/80 bg-popover shadow-xl space-y-4 z-50"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Pemilih Warna HeroUI</span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                {safeHex}
              </span>
            </div>

            {/* 2D Interactive Color Area (Saturation & Brightness) */}
            <div className="space-y-1.5">
              <ColorArea
                colorSpace="hsb"
                xChannel="saturation"
                yChannel="brightness"
                className="w-full h-36 rounded-xl border border-border/80 overflow-hidden relative cursor-crosshair shadow-inner"
              >
                <ColorArea.Thumb className="w-4 h-4 rounded-full border-2 border-white shadow-md cursor-grab active:cursor-grabbing focus:outline-none" />
              </ColorArea>
            </div>

            {/* 1D Hue Slider */}
            <div className="space-y-1">
              <ColorSlider
                channel="hue"
                colorSpace="hsb"
                className="w-full"
              >
                <ColorSlider.Track className="w-full h-4 rounded-lg relative overflow-hidden shadow-inner border border-border/60">
                  <ColorSlider.Thumb className="w-4 h-4 rounded-full border-2 border-white shadow-md top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing focus:outline-none" />
                </ColorSlider.Track>
              </ColorSlider>
            </div>

            {/* ColorField Input + Copy + Pipette Row */}
            <div className="flex items-center gap-2">
              <ColorField className="flex-1">
                <Input
                  className="h-9 font-mono text-xs uppercase bg-background/80 border-border/80 rounded-xl px-3 font-semibold tracking-wider"
                  placeholder="#2563EB"
                />
              </ColorField>

              <button
                type="button"
                onClick={handleCopyHex}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-border/80 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer shrink-0 shadow-2xs"
                title="Salin kode hex"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {hasEyeDropper && (
                <button
                  type="button"
                  onClick={handlePickEyeDropper}
                  className="h-9 w-9 flex items-center justify-center rounded-xl border border-border/80 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer shrink-0 shadow-2xs"
                  title="Ambil warna dari layar (Pipette)"
                >
                  <Pipette className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* ColorSwatchPicker Palette Grid */}
            <div className="space-y-2 pt-1 border-t border-border/60">
              <span className="text-[11px] font-medium text-muted-foreground">Palet Populer</span>
              <ColorSwatchPicker
                value={safeHex}
                onChange={(c) => {
                  const nextHex = c?.toString('hex')?.toUpperCase();
                  if (nextHex) onChange?.(nextHex);
                }}
                className="grid grid-cols-6 gap-2"
              >
                {presets.map((preset) => (
                  <ColorSwatchPicker.Item
                    key={preset.hex}
                    color={preset.hex}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all relative border border-black/5 hover:scale-110 cursor-pointer shadow-2xs focus:outline-none"
                  >
                    <ColorSwatchPicker.Swatch className="w-full h-full rounded-lg" />
                    <ColorSwatchPicker.Indicator className="absolute inset-0 flex items-center justify-center text-white drop-shadow-sm" />
                  </ColorSwatchPicker.Item>
                ))}
              </ColorSwatchPicker>
            </div>
          </HeroColorPicker.Popover>
        </HeroColorPicker>

        {/* Quick-Access Swatch Dots Row (outside popover for quick clicks) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {presets.slice(0, 6).map((preset) => {
            const isSelected = safeHex === preset.hex.toUpperCase();
            return (
              <button
                key={preset.hex}
                type="button"
                disabled={disabled}
                onClick={() => onChange?.(preset.hex.toUpperCase())}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-all relative border cursor-pointer',
                  isSelected
                    ? 'border-foreground ring-2 ring-primary/30 scale-105 shadow-2xs'
                    : 'border-black/10 opacity-80 hover:opacity-100 hover:scale-105'
                )}
                style={{ backgroundColor: preset.hex }}
                title={preset.name}
              >
                {isSelected && (
                  <Check
                    className="w-3.5 h-3.5 drop-shadow-xs"
                    style={{ color: getContrastTextColor(preset.hex) }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Storefront / POS Preview */}
      {showPreview && (
        <div className="p-3.5 rounded-xl bg-muted/25 border border-border/60 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>Pratinjau Elemen Toko</span>
            <span className="font-mono text-[10px] text-muted-foreground">{safeHex}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap pt-0.5">
            <span
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
              style={{
                backgroundColor: safeHex,
                color: contrastColor,
              }}
            >
              + Tambah Menu
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
              Buka • Dine In & Takeaway
            </span>

            <span
              className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
              style={{
                borderColor: `${safeHex}60`,
                borderWidth: '1px',
                color: safeHex,
              }}
            >
              Meja 08
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export both HeroUI primitives and default customized component
export {
  HeroColorPicker,
  ColorArea,
  ColorSlider,
  ColorSwatch,
  ColorField,
  ColorSwatchPicker,
};

export default ColorPicker;
