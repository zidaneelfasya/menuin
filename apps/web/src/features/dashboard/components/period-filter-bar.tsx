'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { format, subMonths, addMonths } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PeriodFilterBarProps {
  currentTab: 'harian' | 'bulanan' | 'tahunan';
  periodLabel: string;
  totalTransactions?: number;
  successRate?: string;
}

export function PeriodFilterBar({ 
  currentTab, 
  periodLabel, 
  totalTransactions = 0,
  successRate = '100.0%' 
}: PeriodFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPreset = searchParams.get('preset') || (searchParams.get('from') ? 'custom' : 'last7');
  const monthParam = searchParams.get('month') || format(new Date(), 'yyyy-MM');
  const yearParam = searchParams.get('year') || String(new Date().getFullYear());

  // Date range state for custom daily picker
  const [customRange, setCustomRange] = React.useState<DateRange | undefined>(() => {
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    if (fromStr && toStr) {
      return { from: new Date(fromStr), to: new Date(toStr) };
    }
    return undefined;
  });

  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  // Tab change handler
  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);

    // Clean other tab-specific params
    if (newTab === 'harian') {
      params.delete('month');
      params.delete('year');
      if (!params.get('preset')) params.set('preset', 'last7');
    } else if (newTab === 'bulanan') {
      params.delete('preset');
      params.delete('from');
      params.delete('to');
      params.delete('year');
      if (!params.get('month')) params.set('month', format(new Date(), 'yyyy-MM'));
    } else if (newTab === 'tahunan') {
      params.delete('preset');
      params.delete('from');
      params.delete('to');
      params.delete('month');
      if (!params.get('year')) params.set('year', String(new Date().getFullYear()));
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  // Preset click handler for Harian
  const handlePresetChange = (preset: 'today' | 'yesterday' | 'last7' | 'last30') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'harian');
    params.set('preset', preset);
    params.delete('from');
    params.delete('to');
    router.push(`${pathname}?${params.toString()}`);
  };

  // Custom date selection handler
  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    setCustomRange(range);
    if (range?.from && range?.to) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', 'harian');
      params.set('preset', 'custom');
      params.set('from', format(range.from, 'yyyy-MM-dd'));
      params.set('to', format(range.to, 'yyyy-MM-dd'));
      setIsCalendarOpen(false);
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  // Month navigation handlers
  const handleMonthStep = (step: number) => {
    const [y, m] = monthParam.split('-').map(Number);
    const curDate = new Date(y, m - 1, 1);
    const targetDate = step > 0 ? addMonths(curDate, step) : subMonths(curDate, Math.abs(step));
    const nextMonthStr = format(targetDate, 'yyyy-MM');

    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'bulanan');
    params.set('month', nextMonthStr);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleMonthSelect = (selectedMonth: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'bulanan');
    params.set('month', selectedMonth);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Year select handler
  const handleYearSelect = (selectedYear: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'tahunan');
    params.set('year', selectedYear);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Generate list of recent months for dropdown
  const monthOptions = React.useMemo(() => {
    const list: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 18; i++) {
      const d = subMonths(now, i);
      list.push({
        value: format(d, 'yyyy-MM'),
        label: format(d, 'MMMM yyyy', { locale: localeId }),
      });
    }
    return list;
  }, []);

  // Generate list of available years
  const yearOptions = React.useMemo(() => {
    const curYear = new Date().getFullYear();
    return [curYear, curYear - 1, curYear - 2].map(String);
  }, []);

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm space-y-4">
      {/* Exact Supabase Transition Bar: Grip Icon ::: Stats Counter & Period Picker */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Grip Handle & Analytics Meta */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <GripVertical className="w-4 h-4 text-gray-300" />
            <span className="text-sm font-bold text-gray-900">
              {totalTransactions.toLocaleString('id-ID')} Total Pesanan
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              {successRate} Sukses
            </span>
          </div>

          <div className="hidden sm:flex items-center text-xs text-gray-500 font-medium pl-3 border-l border-gray-200">
            <span>Periode:</span>
            <span className="ml-1.5 font-semibold text-gray-800">{periodLabel}</span>
          </div>
        </div>

        {/* Right: Tabs & Sub-Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-auto">
            <TabsList className="bg-gray-100 p-1 border border-gray-200/60 rounded-lg h-9">
              <TabsTrigger 
                value="harian" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-xs font-semibold px-3 rounded-md transition-all"
              >
                Harian
              </TabsTrigger>
              <TabsTrigger 
                value="bulanan" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-xs font-semibold px-3 rounded-md transition-all"
              >
                Bulanan
              </TabsTrigger>
              <TabsTrigger 
                value="tahunan" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-xs font-semibold px-3 rounded-md transition-all"
              >
                Tahunan (Recap)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Sub-controls based on active tab */}
          <div className="flex items-center gap-2">
            {/* HARIAN CONTROLS */}
            {currentTab === 'harian' && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  variant={currentPreset === 'today' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "h-8 text-xs font-medium px-2.5",
                    currentPreset === 'today' ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                  onClick={() => handlePresetChange('today')}
                >
                  Hari Ini
                </Button>

                <Button
                  type="button"
                  variant={currentPreset === 'yesterday' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "h-8 text-xs font-medium px-2.5",
                    currentPreset === 'yesterday' ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                  onClick={() => handlePresetChange('yesterday')}
                >
                  Kemarin
                </Button>

                <Button
                  type="button"
                  variant={currentPreset === 'last7' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "h-8 text-xs font-medium px-2.5",
                    currentPreset === 'last7' ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                  onClick={() => handlePresetChange('last7')}
                >
                  7 Hari
                </Button>

                <Button
                  type="button"
                  variant={currentPreset === 'last30' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "h-8 text-xs font-medium px-2.5",
                    currentPreset === 'last30' ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                  onClick={() => handlePresetChange('last30')}
                >
                  30 Hari
                </Button>

                {/* Custom Date Range Popover */}
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={currentPreset === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        "h-8 text-xs font-medium gap-1.5 px-2.5",
                        currentPreset === 'custom' ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-600 border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>Kustom</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="end">
                    <div className="text-xs font-semibold text-gray-700 mb-2">
                      Pilih Rentang Tanggal
                    </div>
                    <Calendar
                      mode="range"
                      defaultMonth={customRange?.from || new Date()}
                      selected={customRange}
                      onSelect={handleCustomRangeSelect}
                      numberOfMonths={1}
                      locale={localeId}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* BULANAN CONTROLS */}
            {currentTab === 'bulanan' && (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-gray-600 border-gray-200 hover:bg-gray-50"
                  onClick={() => handleMonthStep(-1)}
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <Select value={monthParam} onValueChange={handleMonthSelect}>
                  <SelectTrigger className="h-8 w-[170px] text-xs font-medium border-gray-200">
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {monthOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-gray-600 border-gray-200 hover:bg-gray-50"
                  onClick={() => handleMonthStep(1)}
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* TAHUNAN CONTROLS */}
            {currentTab === 'tahunan' && (
              <div className="flex items-center gap-2">
                <Select value={yearParam} onValueChange={handleYearSelect}>
                  <SelectTrigger className="h-8 w-[110px] text-xs font-medium border-gray-200">
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={y} className="text-xs font-medium">
                        Tahun {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
