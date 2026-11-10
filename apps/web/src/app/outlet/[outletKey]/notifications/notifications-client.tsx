'use client';

import * as React from 'react';
import { 
  Bell, 
  ExternalLink,
  Calendar as CalendarIcon,
  ChevronDown,
  RefreshCw,
  Check
} from 'lucide-react';
import { 
  NotificationItem, 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '@/lib/actions/notifications';
import { createClient } from '@/lib/supabase/client';
import { usePageTransition } from '@/components/providers/page-transition-provider';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface NotificationsClientProps {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
  tenantId: string;
  outletKey: string;
}

type PresetOption = 'all' | 'today' | '7days' | 'this_month' | 'last_month' | 'custom';

export function NotificationsClient({
  initialNotifications,
  initialUnreadCount,
  tenantId,
  outletKey,
}: NotificationsClientProps) {
  const [items, setItems] = React.useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = React.useState(initialUnreadCount);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  // Date Range Filter States
  const [activePreset, setActivePreset] = React.useState<PresetOption>('all');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const isFirstMount = React.useRef(true);
  const { navigateWithTransition, prefetchRoute } = usePageTransition();

  // Load fresh notifications with active date filters
  const refreshNotifications = React.useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await getNotifications({
        startDate: dateRange?.from,
        endDate: dateRange?.to,
        limit: 100,
      });

      if (res.success) {
        setItems(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (e) {
      console.error('Failed to refresh notifications:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [dateRange]);

  // Trigger reload when filter changes (skip first mount)
  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    refreshNotifications();
  }, [refreshNotifications]);

  // Realtime subscription via Supabase channel (isolated page topic)
  React.useEffect(() => {
    if (!tenantId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`page-notifications-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          refreshNotifications();
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime page channel error for tenant:', tenantId);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, refreshNotifications]);

  // Mark single item as read & navigate if actionUrl present
  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await markNotificationAsRead(item.id);
    }

    if (item.actionUrl) {
      navigateWithTransition(item.actionUrl);
    }
  };

  // Mark all items as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead();
  };

  // Preset handlers for Date Range Picker
  const handleSelectPreset = (preset: PresetOption) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (preset === 'all') {
      setActivePreset('all');
      setDateRange(undefined);
      setTempRange(undefined);
      setIsCalendarOpen(false);
      return;
    }

    if (preset === 'today') {
      const range = { from: today, to: today };
      setActivePreset('today');
      setDateRange(range);
      setTempRange(range);
      setIsCalendarOpen(false);
      return;
    }

    if (preset === '7days') {
      const range = { from: subDays(today, 6), to: today };
      setActivePreset('7days');
      setDateRange(range);
      setTempRange(range);
      setIsCalendarOpen(false);
      return;
    }

    if (preset === 'this_month') {
      const range = { from: startOfMonth(today), to: endOfMonth(today) };
      setActivePreset('this_month');
      setDateRange(range);
      setTempRange(range);
      setIsCalendarOpen(false);
      return;
    }

    if (preset === 'last_month') {
      const prevMonth = subMonths(today, 1);
      const range = { from: startOfMonth(prevMonth), to: endOfMonth(prevMonth) };
      setActivePreset('last_month');
      setDateRange(range);
      setTempRange(range);
      setIsCalendarOpen(false);
      return;
    }
  };

  const handleApplyCustomRange = () => {
    if (!tempRange?.from) return;
    setDateRange(tempRange);
    setActivePreset('custom');
    setIsCalendarOpen(false);
  };

  // Label for Date Range Picker button
  const datePickerLabel = React.useMemo(() => {
    if (activePreset === 'all' || !dateRange?.from) return 'Semua waktu';
    if (activePreset === 'today') return 'Hari ini';
    if (activePreset === '7days') return '7 hari terakhir';
    if (activePreset === 'this_month') return 'Bulan ini';
    if (activePreset === 'last_month') return 'Bulan lalu';

    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'd MMM', { locale: localeId })} - ${format(dateRange.to, 'd MMM yyyy', { locale: localeId })}`;
    }
    if (dateRange.from) {
      return format(dateRange.from, 'd MMM yyyy', { locale: localeId });
    }
    return 'Pilih tanggal';
  }, [activePreset, dateRange]);

  // Context sub-label helper (Menuin Standard Indonesian)
  const getContextLabel = (category: string) => {
    switch (category) {
      case 'VERIFICATION':
        return 'Verifikasi Usaha';
      case 'BILLING':
        return 'Status Pembayaran';
      case 'ACCOUNT_TEAM':
        return 'Pembaruan Toko';
      default:
        return 'Log Sistem';
    }
  };

  // Indonesian Date Formatter (Menuin Standard: e.g. 25 Oktober 2026, 14:30 WIB)
  const formatMainLogDate = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      const datePart = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
      const timePart = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
      return `${datePart}, ${timePart} WIB`;
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman (Menuin Standard Typography) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-normal">
              Log Notifikasi
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0e59f9]">
                {unreadCount} belum dibaca
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Lihat semua notifikasi Anda dan update terbaru
          </p>
        </div>

        {/* Date Range Picker (Menuin Raised Soft-UI Button) */}
        <div>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "h-10 px-4 rounded-full bg-white text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 inline-flex items-center gap-2 transition-all cursor-pointer select-none shadow-[0_2px_10px_rgba(160,175,200,0.22)] border-none active:scale-[0.98]",
                  activePreset !== 'all' && "bg-blue-50 text-[#0e59f9] font-semibold"
                )}
              >
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>{datePickerLabel}</span>
                {isRefreshing ? (
                  <RefreshCw className="w-3 h-3 text-[#0e59f9] animate-spin ml-0.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              className="w-auto p-0 rounded-2xl shadow-2xl border-none bg-white z-50 overflow-hidden"
            >
              {/* Popover Header */}
              <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-slate-900">
                  Pilih Rentang Tanggal
                </span>
                {activePreset !== 'all' && (
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('all')}
                    className="text-[11px] text-[#0e59f9] hover:underline cursor-pointer"
                  >
                    Reset semua waktu
                  </button>
                )}
              </div>

              {/* Preset Buttons Grid */}
              <div className="p-2 border-b border-slate-100 grid grid-cols-3 sm:grid-cols-5 gap-1 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('all')}
                  className={cn(
                    "px-2.5 py-1.5 text-xs rounded-full text-center font-medium transition-colors cursor-pointer border-none",
                    activePreset === 'all'
                      ? "bg-[#0e59f9] text-white font-semibold shadow-xs"
                      : "bg-white hover:bg-slate-100 text-slate-700"
                  )}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('today')}
                  className={cn(
                    "px-2.5 py-1.5 text-xs rounded-full text-center font-medium transition-colors cursor-pointer border-none",
                    activePreset === 'today'
                      ? "bg-[#0e59f9] text-white font-semibold shadow-xs"
                      : "bg-white hover:bg-slate-100 text-slate-700"
                  )}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('7days')}
                  className={cn(
                    "px-2.5 py-1.5 text-xs rounded-full text-center font-medium transition-colors cursor-pointer border-none",
                    activePreset === '7days'
                      ? "bg-[#0e59f9] text-white font-semibold shadow-xs"
                      : "bg-white hover:bg-slate-100 text-slate-700"
                  )}
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('this_month')}
                  className={cn(
                    "px-2.5 py-1.5 text-xs rounded-full text-center font-medium transition-colors cursor-pointer border-none",
                    activePreset === 'this_month'
                      ? "bg-[#0e59f9] text-white font-semibold shadow-xs"
                      : "bg-white hover:bg-slate-100 text-slate-700"
                  )}
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('last_month')}
                  className={cn(
                    "px-2.5 py-1.5 text-xs rounded-full text-center font-medium transition-colors cursor-pointer border-none",
                    activePreset === 'last_month'
                      ? "bg-[#0e59f9] text-white font-semibold shadow-xs"
                      : "bg-white hover:bg-slate-100 text-slate-700"
                  )}
                >
                  Bulan Lalu
                </button>
              </div>

              {/* Range Calendar */}
              <div className="p-2">
                <Calendar
                  mode="range"
                  defaultMonth={tempRange?.from || dateRange?.from || new Date()}
                  selected={tempRange}
                  onSelect={setTempRange}
                  numberOfMonths={1}
                  locale={localeId}
                />
              </div>

              {/* Footer Preview & Apply */}
              <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
                <div className="text-[11px] text-slate-500">
                  {tempRange?.from ? (
                    <>
                      {format(tempRange.from, "d MMM", { locale: localeId })}
                      {tempRange.to
                        ? ` - ${format(tempRange.to, "d MMM yyyy", { locale: localeId })}`
                        : ""}
                    </>
                  ) : (
                    "Pilih rentang tanggal"
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCalendarOpen(false)}
                    className="h-8 rounded-full text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyCustomRange}
                    disabled={!tempRange?.from}
                    className="h-8 text-xs font-semibold bg-[#0e59f9] text-white hover:bg-blue-700 rounded-full px-4 shadow-sm cursor-pointer border-none"
                  >
                    Terapkan
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Toolbar Aksi Cepat (Menuin Raised Tactile Pill) */}
      <div className="flex items-center gap-2 pt-1 pb-1">
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-slate-700 bg-white shadow-[0_2px_8px_rgba(160,175,200,0.22)] hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] transition-all cursor-pointer border-none"
          >
            <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
            <span>Tandai semua sudah dibaca</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-400 bg-slate-100/60 border-none select-none">
            <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[2]" />
            <span>Semua notifikasi sudah dibaca</span>
          </div>
        )}
      </div>

      {/* Konten Log Notifikasi (Menuin Pure-White Borderless Card Standard) */}
      {items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-[0_4px_20px_rgba(160,175,200,0.14)] border-none my-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Bell className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            Tidak ada notifikasi
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            Belum ada catatan log notifikasi untuk rentang waktu yang dipilih.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(160,175,200,0.14)] border-none overflow-hidden divide-y divide-slate-100/80">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => {
                if (item.actionUrl) prefetchRoute(item.actionUrl);
              }}
              className={cn(
                "p-5 transition-all cursor-pointer group flex flex-col justify-center border-none",
                item.isRead
                  ? "bg-white hover:bg-slate-50/60"
                  : "bg-blue-50/25 hover:bg-blue-50/45"
              )}
            >
              {/* Baris 1: Metadata Sub-label (Menuin Standard) */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-normal leading-normal">
                <span className={cn(
                  "font-medium",
                  item.category === 'VERIFICATION' ? "text-[#0e59f9]" :
                  item.category === 'BILLING' ? "text-emerald-600" :
                  "text-slate-600"
                )}>
                  {getContextLabel(item.category)}
                </span>
                <span className="text-slate-300">•</span>
                <span>{formatMainLogDate(item.createdAt)}</span>
                {!item.isRead && (
                  <span className="inline-flex items-center ml-1 px-2 py-0.2 rounded-full text-[10px] font-semibold bg-blue-100 text-[#0e59f9]">
                    Baru
                  </span>
                )}
              </div>

              {/* Baris 2: Judul & Action Link Menuin Blue (Bukan Merah!) */}
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 mt-1">
                <h3 className={cn(
                  "text-sm tracking-normal",
                  item.isRead ? "font-semibold text-slate-800" : "font-semibold text-slate-950"
                )}>
                  {item.title}
                </h3>

                {item.actionUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(item);
                    }}
                    className="text-xs font-semibold text-[#0e59f9] hover:text-[#0b4de0] hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer select-none self-start sm:self-auto transition-colors"
                  >
                    <span>{item.actionLabel || 'Lihat Detail'}</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Baris 3: Pesan Deskripsi */}
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {item.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
