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

  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const monthParam = searchParams.get('month') || format(new Date(), 'yyyy-MM');
  const yearParam = searchParams.get('year') || String(new Date().getFullYear());

  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  const isSelectedToday = fromParam === todayDateStr && toParam === todayDateStr;
  const hasCustomDate = Boolean(fromParam && toParam) && !isSelectedToday;

  // Sync customRange with searchParams
  const customRange = React.useMemo<DateRange | undefined>(() => {
    if (fromParam && toParam) {
      return { from: new Date(fromParam), to: new Date(toParam) };
    }
    return undefined;
  }, [fromParam, toParam]);

  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(customRange);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  // Keep tempRange synced when opening popover or when customRange updates
  React.useEffect(() => {
    if (isCalendarOpen) {
      setTempRange(customRange || { from: new Date(), to: new Date() });
    }
  }, [isCalendarOpen, customRange]);

  // Tab change handler
  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);

    // Clean other tab-specific params
    if (newTab === 'harian') {
      params.delete('month');
      params.delete('year');
      params.delete('preset');
      params.delete('from');
      params.delete('to');
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

  // Custom date apply handler (supports both single day and date ranges)
  const handleApplyRange = () => {
    if (!tempRange?.from) return;
    const toDate = tempRange.to || tempRange.from;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'harian');
    params.delete('preset');
    params.set('from', format(tempRange.from, 'yyyy-MM-dd'));
    params.set('to', format(toDate, 'yyyy-MM-dd'));
    setIsCalendarOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Quick preset: Today inside calendar popover
  const handleSelectToday = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'harian');
    params.delete('preset');
    params.delete('from');
    params.delete('to');
    setIsCalendarOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Reset to default (Hari Ini)
  const handleResetToDefault = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'harian');
    params.delete('preset');
    params.delete('from');
    params.delete('to');
    setIsCalendarOpen(false);
    router.push(`${pathname}?${params.toString()}`);
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

  // Formatted button label for daily date range trigger (defaults to 'Hari Ini')
  const dateButtonLabel = React.useMemo(() => {
    if (fromParam && toParam) {
      const fromDate = new Date(fromParam);
      const toDate = new Date(toParam);
      if (fromParam === toParam) {
        if (fromParam === todayDateStr) {
          return 'Hari Ini';
        }
        return format(fromDate, 'd MMM yyyy', { locale: localeId });
      }
      if (fromDate.getFullYear() === toDate.getFullYear()) {
        return `${format(fromDate, 'd MMM', { locale: localeId })} — ${format(toDate, 'd MMM yyyy', { locale: localeId })}`;
      }
      return `${format(fromDate, 'd MMM yyyy', { locale: localeId })} — ${format(toDate, 'd MMM yyyy', { locale: localeId })}`;
    }
    return 'Hari Ini';
  }, [fromParam, toParam, todayDateStr]);

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 sm:p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4">
        
        {/* Left: Grip Handle & Analytics Meta */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
            <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
              {totalTransactions.toLocaleString('id-ID')} Total Pesanan
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 whitespace-nowrap">
              {successRate} Sukses
            </span>
          </div>

          <div className="flex items-center text-xs text-gray-500 font-medium pl-3 border-l border-gray-200">
            <span className="text-gray-400">Periode:</span>
            <span className="ml-1.5 font-semibold text-gray-800 whitespace-nowrap">{periodLabel}</span>
          </div>
        </div>

        {/* Right: Tabs & Single Compact Selector Control */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-auto">
            <TabsList className="bg-gray-100 p-1 border border-gray-200/60 rounded-lg h-9">
              <TabsTrigger 
                value="harian" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-xs font-semibold px-3 rounded-md transition-all h-7"
              >
                Harian
              </TabsTrigger>
              <TabsTrigger 
                value="bulanan" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-xs font-semibold px-3 rounded-md transition-all h-7"
              >
                Bulanan
              </TabsTrigger>
              <TabsTrigger 
                value="tahunan" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-xs font-semibold px-3 rounded-md transition-all h-7"
              >
                Tahunan (Recap)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Sub-controls based on active tab */}
          <div className="flex items-center gap-2">
            {/* HARIAN CONTROLS: Clean Date Range Popover */}
            {currentTab === 'harian' && (
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 text-xs font-medium gap-2 px-3 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-none rounded-lg",
                      hasCustomDate && "border-blue-300 bg-blue-50/50 text-blue-700 font-semibold"
                    )}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-gray-500" />
                    <span>{dateButtonLabel}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="text-xs font-semibold text-gray-900">
                      Pilih Rentang Tanggal
                    </div>
                    {hasCustomDate && (
                      <button
                        type="button"
                        onClick={handleResetToDefault}
                        className="text-[11px] text-gray-500 hover:text-gray-900 transition-colors underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="p-2">
                    <Calendar
                      mode="range"
                      defaultMonth={tempRange?.from || customRange?.from || new Date()}
                      selected={tempRange}
                      onSelect={setTempRange}
                      numberOfMonths={1}
                      locale={localeId}
                    />
                  </div>

                  <div className="p-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs font-medium text-gray-600 hover:text-gray-900 px-2"
                      onClick={handleSelectToday}
                    >
                      Hari Ini
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-medium px-2.5 border-gray-200"
                        onClick={() => setIsCalendarOpen(false)}
                      >
                        Batal
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs font-semibold px-3 bg-gray-900 text-white hover:bg-gray-800"
                        onClick={handleApplyRange}
                        disabled={!tempRange?.from}
                      >
                        Terapkan
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* BULANAN CONTROLS */}
            {currentTab === 'bulanan' && (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-gray-600 border-gray-200 hover:bg-gray-50 rounded-lg"
                  onClick={() => handleMonthStep(-1)}
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <Select value={monthParam} onValueChange={handleMonthSelect}>
                  <SelectTrigger className="h-9 w-[160px] text-xs font-medium border-gray-200 rounded-lg">
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
                  className="h-9 w-9 text-gray-600 border-gray-200 hover:bg-gray-50 rounded-lg"
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
                  <SelectTrigger className="h-9 w-[110px] text-xs font-medium border-gray-200 rounded-lg">
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
