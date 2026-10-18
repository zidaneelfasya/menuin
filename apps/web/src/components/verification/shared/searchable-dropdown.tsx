'use client';

import * as React from 'react';
import { ChevronsUpDown, Search, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
  id?: string;
  aliases?: string[];
}

export interface SearchableDropdownProps {
  value?: string;
  onChange: (value: string, selectedOption?: DropdownOption) => void;
  options: DropdownOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  disabledPlaceholder?: string;
  loading?: boolean;
  loadingText?: string;
  className?: string;
  buttonClassName?: string;
}

export function SearchableDropdown({
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  emptyText,
  disabled = false,
  disabledPlaceholder,
  loading = false,
  loadingText = 'Memuat data...',
  className,
  buttonClassName,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Find currently selected option
  const selectedOption = React.useMemo(() => {
    if (!value) return null;
    return (
      options.find(
        (opt) =>
          opt.value.toLowerCase() === value.toLowerCase() ||
          opt.label.toLowerCase() === value.toLowerCase() ||
          (opt.id && opt.id.toLowerCase() === value.toLowerCase())
      ) || { value, label: value }
    );
  }, [value, options]);

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
    if (!q) return options;

    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.aliases && opt.aliases.some((a) => a.toLowerCase().includes(q)))
    );
  }, [searchQuery, options]);

  const handleSelect = (opt: DropdownOption) => {
    onChange(opt.value, opt);
    setIsOpen(false);
    setSearchQuery('');
  };

  const isCurrentSelected = (opt: DropdownOption) => {
    if (!value) return false;
    return (
      opt.value.toLowerCase() === value.toLowerCase() ||
      opt.label.toLowerCase() === value.toLowerCase() ||
      (opt.id && opt.id.toLowerCase() === value.toLowerCase())
    );
  };

  return (
    <div ref={containerRef} className={cn('relative select-none font-sans', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => !disabled && !loading && setIsOpen((prev) => !prev)}
        className={cn(
          'w-full h-10 rounded-[6px] border bg-white px-3.5 text-sm font-sans font-normal text-left flex items-center justify-between transition-colors shadow-none',
          disabled
            ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'border-[#0e59f9] ring-1 ring-[#0e59f9] text-slate-900 cursor-pointer'
            : 'border-slate-300 text-slate-900 hover:border-slate-400 cursor-pointer',
          buttonClassName
        )}
      >
        <span className={cn('truncate font-sans', !selectedOption && !loading && 'text-slate-400')}>
          {loading
            ? loadingText
            : disabled && disabledPlaceholder
            ? disabledPlaceholder
            : selectedOption
            ? selectedOption.label
            : placeholder}
        </span>
        {loading ? (
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0 ml-2" />
        ) : (
          <ChevronsUpDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && !disabled && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-[6px] shadow-lg overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-100 font-sans">
          {/* Search Header Row */}
          <div className="p-2.5 border-b border-slate-100 flex items-center gap-2 bg-white">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full text-xs font-sans font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
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
                    key={opt.id || opt.value}
                    onClick={() => handleSelect(opt)}
                    className="px-2.5 py-2 rounded-[4px] text-xs font-sans text-slate-800 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-slate-900 stroke-[2] flex-shrink-0 ml-2" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-6 text-center text-xs font-sans text-slate-400">
                {emptyText || `Tidak ada data yang cocok dengan "${searchQuery}"`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
