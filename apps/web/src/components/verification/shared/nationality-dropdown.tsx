'use client';

import * as React from 'react';
import { ChevronsUpDown, Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NationalityOptionItem {
  value: string;
  label: string;
  aliases?: string[];
}

export const NATIONALITY_OPTIONS: NationalityOptionItem[] = [
  { value: 'Indonesia', label: 'Indonesia', aliases: ['WNI', 'Indonesia', 'Indonesian', 'ID'] },
  { value: 'WNA', label: 'Warga Negara Asing (WNA)', aliases: ['WNA', 'Asing', 'Foreign', 'Foreigner'] },
];

interface NationalityDropdownProps {
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
}

export function NationalityDropdown({
  value,
  onChange,
  disabled = false,
  className,
  buttonClassName,
}: NationalityDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Find currently selected option
  const selectedOption = React.useMemo(() => {
    if (!value) return null;
    return (
      NATIONALITY_OPTIONS.find(
        (opt) =>
          opt.value.toLowerCase() === value.toLowerCase() ||
          opt.label.toLowerCase() === value.toLowerCase()
      ) || { value, label: value }
    );
  }, [value]);

  // Click outside and Escape key listener
  React.useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Auto focus search input on open
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return NATIONALITY_OPTIONS;

    return NATIONALITY_OPTIONS.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.aliases && opt.aliases.some((a) => a.toLowerCase().includes(q)))
    );
  }, [searchQuery]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const isCurrentSelected = (opt: NationalityOptionItem) => {
    if (!value) return false;
    return (
      opt.value.toLowerCase() === value.toLowerCase() ||
      opt.label.toLowerCase() === value.toLowerCase()
    );
  };

  return (
    <div ref={containerRef} className={cn('relative select-none', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          'w-full h-10 rounded-[6px] border px-3.5 text-sm font-normal text-left flex items-center justify-between transition-colors shadow-none',
          disabled
            ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'border-[#0e59f9] ring-1 ring-[#0e59f9] bg-white text-slate-900 cursor-pointer'
            : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 cursor-pointer',
          buttonClassName
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-slate-400')}>
          {selectedOption ? selectedOption.label : 'Pilih kewarganegaraan...'}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-[6px] shadow-lg overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Search Header Row */}
          <div className="p-2.5 border-b border-slate-100 flex items-center gap-2 bg-white">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kewarganegaraan..."
              className="w-full text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 cursor-pointer flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Clean Flat Options List (No categories, no descriptions, checkmark on selected) */}
          <div className="max-h-60 overflow-y-auto p-1 no-scrollbar space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = isCurrentSelected(opt);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className="px-2.5 py-2 rounded-[4px] text-xs text-slate-800 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-slate-900 stroke-[2] flex-shrink-0 ml-2" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-6 text-center text-xs text-slate-400">
                Tidak ada kewarganegaraan yang cocok dengan &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
