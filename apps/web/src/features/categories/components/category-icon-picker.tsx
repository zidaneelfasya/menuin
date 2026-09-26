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
        <Label className="text-xs font-semibold text-foreground">
          Ikon Kategori
        </Label>
        {selectedIcon && (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
            Terpilih: <strong className="text-foreground">{currentItem?.label || selectedIcon}</strong>
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide text-xs">
        {groups.map((grp) => (
          <button
            key={grp}
            type="button"
            onClick={() => setActiveGroup(grp)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer',
              activeGroup === grp
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground'
            )}
          >
            {grp}
          </button>
        ))}
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-7 gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 max-h-44 overflow-y-auto pr-1">
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
                'h-9 w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer relative group',
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs scale-105 font-semibold ring-2 ring-blue-600 ring-offset-1'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 border border-slate-200/80 dark:border-slate-700'
              )}
            >
              <IconComp className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
