'use client';

import * as React from 'react';
import { CATEGORY_ICONS, getCategoryIcon } from '../lib/category-icons';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type CategoryIconPickerProps = {
  selectedIcon: string | null | undefined;
  onSelectIcon: (iconName: string) => void;
};

export function CategoryIconPicker({ selectedIcon, onSelectIcon }: CategoryIconPickerProps) {
  const [activeGroup, setActiveGroup] = React.useState<string>('Semua');

  const groups = ['Semua', 'Minuman', 'Makanan', 'Snack & Dessert', 'Paket & Spesial'];

  const filteredIcons = React.useMemo(() => {
    if (activeGroup === 'Semua') return CATEGORY_ICONS;
    return CATEGORY_ICONS.filter((item) => item.group === activeGroup);
  }, [activeGroup]);

  const CurrentIcon = getCategoryIcon(selectedIcon);
  const currentItem = CATEGORY_ICONS.find((item) => item.name === selectedIcon);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-slate-800">
          Ikon Kategori
        </Label>
        {selectedIcon && (
          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
            Terpilih: <strong className="text-slate-800">{currentItem?.label || selectedIcon}</strong>
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
        {groups.map((grp) => (
          <button
            key={grp}
            type="button"
            onClick={() => setActiveGroup(grp)}
            className={cn(
              'px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer',
              activeGroup === grp
                ? 'bg-[#0e59f9] text-white font-semibold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
            )}
          >
            {grp}
          </button>
        ))}
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-7 gap-2 p-2.5 bg-slate-50/80 rounded-2xl border-none max-h-48 overflow-y-auto pr-1">
        {filteredIcons.map((item) => {
          const IconComp = item.icon;
          const isSelected = selectedIcon === item.name;

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onSelectIcon(item.name)}
              title={item.label}
              className={cn(
                'h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer relative group',
                isSelected
                  ? 'bg-[#0e59f9] text-white scale-105 font-semibold ring-2 ring-blue-600 ring-offset-1'
                  : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-[#0e59f9] shadow-sm-md border-none'
              )}
            >
              <IconComp className={cn("w-4 h-4", isSelected ? "text-white" : "")} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
