'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { 
  Bell, 
  ShieldCheck, 
  CreditCard, 
  Store,
  Check
} from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  NotificationItem, 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '@/lib/actions/notifications';
import { createClient } from '@/lib/supabase/client';
import { usePageTransition } from '@/components/providers/page-transition-provider';
import { cn } from '@/lib/utils';

interface NotificationPopoverProps {
  tenantId: string;
  outletKey?: string;
}

type PopoverFilter = 'all' | 'unread' | 'verification' | 'billing';

export function NotificationPopover({ tenantId, outletKey = '' }: NotificationPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<PopoverFilter>('all');
  
  const params = useParams();
  const pathname = usePathname();
  const { navigateWithTransition, prefetchRoute } = usePageTransition();

  // Dynamically resolve active outlet key with high reliability
  const activeOutletKey = React.useMemo(() => {
    return (
      (params?.outletKey as string) || 
      pathname.match(/\/outlet\/([^\/]+)/)?.[1] || 
      outletKey || 
      ''
    );
  }, [params, pathname, outletKey]);

  const targetNotificationsUrl = React.useMemo(() => {
    return activeOutletKey ? `/outlet/${activeOutletKey}/notifications` : '/select-tenant';
  }, [activeOutletKey]);

  // Load initial notifications
  const loadNotifications = React.useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const res = await getNotifications({ limit: 10 });
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Prefetch full notifications page whenever popover is opened or hovered
  React.useEffect(() => {
    if (open && targetNotificationsUrl) {
      prefetchRoute(targetNotificationsUrl);
    }
  }, [open, targetNotificationsUrl, prefetchRoute]);

  // Realtime subscription via Supabase channel (isolated popover topic)
  React.useEffect(() => {
    if (!tenantId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`popover-notifications-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime popover channel error for tenant:', tenantId);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, loadNotifications]);

  // Mark single notification as read & navigate
  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      markNotificationAsRead(item.id);
    }

    if (item.actionUrl) {
      setOpen(false);
      navigateWithTransition(item.actionUrl);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead();
  };

  // Helper for context tag (Matches Image 2 pill badge)
  const getContextBadge = (category: string) => {
    switch (category) {
      case 'VERIFICATION':
        return {
          label: 'Verifikasi',
          className: 'bg-emerald-50 text-emerald-700',
        };
      case 'BILLING':
        return {
          label: 'Langganan',
          className: 'bg-blue-50 text-[#0e59f9]',
        };
      case 'ACCOUNT_TEAM':
        return {
          label: 'Outlet',
          className: 'bg-purple-50 text-purple-700',
        };
      default:
        return {
          label: 'Sistem',
          className: 'bg-slate-100 text-slate-700',
        };
    }
  };

  // Avatar icon helper (Matches Image 2 left circular avatar)
  const renderAvatar = (category: string) => {
    switch (category) {
      case 'VERIFICATION':
        return (
          <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
        );
      case 'BILLING':
        return (
          <div className="h-9 w-9 rounded-full bg-blue-100 text-[#0e59f9] flex items-center justify-center shrink-0">
            <CreditCard className="h-4 w-4" />
          </div>
        );
      case 'ACCOUNT_TEAM':
      default:
        return (
          <div className="h-9 w-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Store className="h-4 w-4" />
          </div>
        );
    }
  };

  // Formatter for timestamp (Matches Image 2: e.g. Today, 10:45 AM or Yesterday, 4:00 PM)
  const formatPopoverDate = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      const diffInMs = now.getTime() - d.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

      const timeStr = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);

      if (diffInMinutes < 60) {
        if (diffInMinutes <= 1) return 'Baru saja';
        return `${diffInMinutes} mnt lalu`;
      }

      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      if (isToday) {
        return `Hari ini, ${timeStr}`;
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday =
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear();

      if (isYesterday) {
        return `Kemarin, ${timeStr}`;
      }

      const dateStr = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
      }).format(d);

      return `${dateStr}, ${timeStr}`;
    } catch {
      return '';
    }
  };

  // Filtered notifications based on active pill
  const filteredNotifications = React.useMemo(() => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter((n) => !n.isRead);
      case 'verification':
        return notifications.filter((n) => n.category === 'VERIFICATION');
      case 'billing':
        return notifications.filter((n) => n.category === 'BILLING');
      case 'all':
      default:
        return notifications;
    }
  }, [notifications, activeFilter]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Pusat notifikasi"
          onMouseEnter={() => {
            if (targetNotificationsUrl) prefetchRoute(targetNotificationsUrl);
          }}
          className="relative text-slate-500 hover:text-slate-800 h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-95 transition-all cursor-pointer outline-none"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[400px] max-w-[calc(100vw-2rem)] p-0 rounded-2xl bg-white border-none shadow-[0_12px_36px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.06)] overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150"
      >
        {/* Header Popover: Notifications + Mark all as read (Image 2 Style) */}
        <div className="p-4 pb-3 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base text-slate-900 tracking-normal">
              Notifikasi
            </h2>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                title="Tandai semua sudah dibaca"
                aria-label="Tandai semua sudah dibaca"
                className="h-7 w-7 rounded-full bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-95 active:bg-emerald-700 border-none shadow-[0_1px_3px_rgba(16,185,129,0.18)] hover:shadow-[0_2px_8px_rgba(16,185,129,0.28)]"
              >
                <Check className="h-4 w-4 stroke-[2.5]" />
              </button>
            ) : (
              <div
                title="Semua notifikasi sudah dibaca"
                className="h-7 w-7 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center select-none"
              >
                <Check className="h-4 w-4 stroke-[2]" />
              </div>
            )}
          </div>

          {/* Quick Filter Pills (Image 2 Style) */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto scrollbar-none pb-0.5">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border-none shrink-0",
                activeFilter === 'all'
                  ? "bg-[#0e59f9] text-white shadow-none"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              )}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border-none shrink-0",
                activeFilter === 'unread'
                  ? "bg-[#0e59f9] text-white shadow-none"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              )}
            >
              Belum dibaca {unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('verification')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border-none shrink-0",
                activeFilter === 'verification'
                  ? "bg-[#0e59f9] text-white shadow-none"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              )}
            >
              Verifikasi
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('billing')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border-none shrink-0",
                activeFilter === 'billing'
                  ? "bg-[#0e59f9] text-white shadow-none"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              )}
            >
              Langganan
            </button>
          </div>
        </div>

        {/* List of Notifications (Image 2 Style with Avatar & Unread Bullet) */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100/80">
          {loading && notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Memuat notifikasi...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-2">
                <Bell className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">Semua sudah teratasi</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada notifikasi pada filter ini</p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const badge = getContextBadge(item.category);
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={() => {
                    if (item.actionUrl) prefetchRoute(item.actionUrl);
                  }}
                  className={cn(
                    "px-4 py-3.5 flex items-start gap-3 transition-colors cursor-pointer group",
                    item.isRead ? "bg-white hover:bg-slate-50/70" : "bg-blue-50/20 hover:bg-blue-50/40"
                  )}
                >
                  {/* Circular Avatar / Icon */}
                  {renderAvatar(item.category)}

                  {/* Main Notification Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs leading-snug line-clamp-1",
                      item.isRead ? "text-slate-800 font-semibold" : "text-slate-950 font-bold"
                    )}>
                      {item.title}
                    </p>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>

                    {/* Bottom Line: Badge Tag on Left + Date on Right (Image 2 Style - NO RED TEXT!) */}
                    <div className="flex items-center justify-between mt-2 pt-0.5">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium leading-none", badge.className)}>
                        {badge.label}
                      </span>

                      <span className="text-[11px] text-slate-400 font-normal shrink-0">
                        {formatPopoverDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: View all notification (Image 2 Style) */}
        <div className="border-t border-slate-100 bg-white p-3 text-center">
          <Link
            href={targetNotificationsUrl}
            prefetch={true}
            onMouseEnter={() => prefetchRoute(targetNotificationsUrl)}
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
              navigateWithTransition(targetNotificationsUrl);
            }}
            className="text-xs font-semibold text-slate-600 hover:text-[#0e59f9] transition-colors block text-center cursor-pointer select-none"
          >
            Lihat semua notifikasi
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
