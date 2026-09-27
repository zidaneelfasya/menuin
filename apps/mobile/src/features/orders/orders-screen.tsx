import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useOrdersData,
  useUpdateOrderStatus,
  useBulkUpdateOrderStatus,
  useToggleOrderItemStatus,
  useSyncOrderPayment,
  searchOrderByNumber,
  OrderDto,
  OrderItemDto,
} from './api/use-orders';
import { formatCurrency, formatDate } from '@menuin/utils';
import { useQueryClient } from '@tanstack/react-query';
import { OrderQrScannerModal } from './order-qr-scanner-modal';
import { OrderQrModal } from './order-qr-modal';

import {
  Search,
  RefreshCw,
  Clock,
  ChefHat,
  CheckCircle2,
  Check,
  CheckCheck,
  CreditCard,
  UtensilsCrossed,
  ShoppingBag,
  Store,
  User,
  X,
  XCircle,
  AlertCircle,
  ChevronRight,
  Printer,
  Receipt,
  Camera,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  Info,
  Filter,
} from 'lucide-react-native';

export type StatusKey = 'PENDING' | 'NEW' | 'PROCESSING' | 'READY';

export interface StatusConfig {
  key: StatusKey;
  title: string;
  nextStatus: string;
  nextStatusTitle: string;
  actionLabel: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  btnBg: string;
  btnText: string;
}

export const STATUS_CONFIGS: Record<StatusKey, StatusConfig> = {
  PENDING: {
    key: 'PENDING',
    title: 'Menunggu Bayar',
    nextStatus: 'NEW',
    nextStatusTitle: 'Pesanan Baru',
    actionLabel: 'Konfirmasi Bayar',
    dotColor: '#94a3b8', // gray
    badgeBg: '#f1f5f9', // slate-100
    badgeText: '#1e293b', // slate-800
    btnBg: '#1e293b', // slate-800
    btnText: '#ffffff',
  },
  NEW: {
    key: 'NEW',
    title: 'Pesanan Baru',
    nextStatus: 'PROCESSING',
    nextStatusTitle: 'Sedang Disiapkan',
    actionLabel: 'Mulai Siapkan',
    dotColor: '#3b82f6', // blue-500
    badgeBg: '#eff6ff', // blue-50
    badgeText: '#1d4ed8', // blue-700
    btnBg: '#2563eb', // blue-600
    btnText: '#ffffff',
  },
  PROCESSING: {
    key: 'PROCESSING',
    title: 'Sedang Disiapkan',
    nextStatus: 'READY',
    nextStatusTitle: 'Siap Disajikan',
    actionLabel: 'Tandai Siap',
    dotColor: '#f59e0b', // amber-500
    badgeBg: '#fffbeb', // amber-50
    badgeText: '#b45309', // amber-700
    btnBg: '#d97706', // amber-600
    btnText: '#ffffff',
  },
  READY: {
    key: 'READY',
    title: 'Siap Disajikan',
    nextStatus: 'COMPLETED',
    nextStatusTitle: 'Pesanan Selesai',
    actionLabel: 'Selesaikan',
    dotColor: '#10b981', // emerald-500
    badgeBg: '#ecfdf5', // emerald-50
    badgeText: '#047857', // emerald-700
    btnBg: '#059669', // emerald-600
    btnText: '#ffffff',
  },
};

const elapsedFormatter = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatElapsed(dateInput: Date | string): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin}m lalu`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}j lalu`;
    return elapsedFormatter.format(date);
  } catch {
    return '';
  }
}

interface OrderCardItemProps {
  order: OrderDto;
  onSelect: (order: OrderDto) => void;
  onStartPrepare: (order: OrderDto) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onToggleItem: (itemId: string, currentCompleted: boolean) => void;
  onCheckMidtrans: (orderId: string) => void;
  onShowQr: (order: OrderDto) => void;
  isUpdating: boolean;
  isCheckingMidtrans: boolean;
}

const OrderCardItem = React.memo(function OrderCardItem({
  order,
  onSelect,
  onStartPrepare,
  onUpdateStatus,
  onToggleItem,
  onCheckMidtrans,
  onShowQr,
  isUpdating,
  isCheckingMidtrans,
}: OrderCardItemProps) {
  const isTakeaway = order.orderType === 'TAKE_AWAY' || order.orderType === 'TAKEAWAY';
  const isOnline = order.orderType === 'ONLINE' || order.orderType === 'DELIVERY';
  const isPaid = order.paymentStatus === 'PAID';
  const isPendingOnline = order.status === 'PENDING' && (isOnline || order.paymentMethod === 'ONLINE');
  const itemsList = Array.isArray(order.items) ? order.items : [];
  const completedItemsCount = itemsList.filter((i) => i.isCompleted).length;
  const totalItemsCount = itemsList.length;
  const config = STATUS_CONFIGS[order.status as StatusKey] || STATUS_CONFIGS.NEW;

  return (
    <View className="bg-white rounded-2xl p-3.5 mb-3 border border-slate-200/90 shadow-2xs">
      {/* Clickable Card Header: Order Number, Payment Status, QR Code View Button & Elapsed Time */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelect(order)}
      >
        <View className="flex-row items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <View className="flex-row items-center gap-1.5 flex-wrap flex-1 mr-2">
            <Text className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              #{order.orderNumber || order.id.slice(0, 5)}
            </Text>
            
            <View
              className={`flex-row items-center px-2 py-0.5 rounded-full ${
                isPaid ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
              }`}
            >
              <View
                className={`w-1.5 h-1.5 rounded-full mr-1 ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`}
              />
              <Text
                className={`text-[10px] font-semibold ${
                  isPaid ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {isPaid ? 'Lunas' : 'Belum Bayar'}
              </Text>
            </View>

            {/* Quick Button to Display Customer QR Modal */}
            <TouchableOpacity
              onPress={(e) => {
                onShowQr(order);
              }}
              activeOpacity={0.75}
              className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 flex-row items-center gap-1"
              accessibilityLabel="Tampilkan QR code pesanan"
            >
              <QrCode size={11} color="#2563eb" />
              <Text className="text-[10px] font-semibold text-blue-700">QR</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-1">
            <Clock size={11} color="#94a3b8" />
            <Text className="text-[10px] font-semibold text-slate-400">
              {formatElapsed(order.createdAt)}
            </Text>
          </View>
        </View>

        {/* Customer & Service Info */}
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center gap-1.5 flex-1 mr-2">
            {isTakeaway ? (
              <View className="p-1 rounded-md bg-amber-50">
                <ShoppingBag size={13} color="#d97706" />
              </View>
            ) : isOnline ? (
              <View className="p-1 rounded-md bg-blue-50">
                <Store size={13} color="#2563eb" />
              </View>
            ) : (
              <View className="p-1 rounded-md bg-slate-100">
                <UtensilsCrossed size={13} color="#475569" />
              </View>
            )}
            <Text className="text-xs font-semibold text-slate-800" numberOfLines={1}>
              {order.tableNumber
                ? `Meja ${order.tableNumber}`
                : isTakeaway
                ? 'Bawa Pulang (Takeaway)'
                : isOnline
                ? 'Pesanan Online'
                : 'Makan di Tempat'}
            </Text>
          </View>

          {order.customerName && (
            <View className="flex-row items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
              <User size={10} color="#64748b" />
              <Text className="text-[10px] font-semibold text-slate-600 max-w-[100px]" numberOfLines={1}>
                {order.customerName}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Items Checklist Box */}
      <View className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-100/90 mb-3">
        <View className="flex-row justify-between items-center mb-1.5 pb-1 border-b border-slate-200/50">
          <Text className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Item Menu
          </Text>
          <Text className="text-[10px] font-semibold text-slate-500">
            {completedItemsCount}/{totalItemsCount} Siap
          </Text>
        </View>

        <View className="space-y-1.5">
          {itemsList.slice(0, 4).map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => onToggleItem(item.id, item.isCompleted)}
              className="flex-row items-start gap-2 py-0.5"
            >
              {/* Modern Square Checkbox (UI Guidelines Rule 4.3) */}
              <View
                className={`w-4 h-4 mt-0.5 rounded-md items-center justify-center transition-all ${
                  item.isCompleted
                    ? 'bg-emerald-600 border border-emerald-600'
                    : 'border border-slate-300 bg-white'
                }`}
              >
                {item.isCompleted && <Check size={10} color="#ffffff" strokeWidth={2.5} />}
              </View>
              <View className="flex-1">
                <Text
                  className={`text-xs ${
                    item.isCompleted
                      ? 'line-through text-slate-400 font-normal'
                      : 'text-slate-800 font-semibold'
                  }`}
                  numberOfLines={1}
                >
                  <Text className="font-mono font-semibold text-slate-900">{item.quantity}x</Text>{' '}
                  {item.productName}
                </Text>
                {Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                  <Text className="text-[10px] text-slate-500 ml-4 font-normal" numberOfLines={1}>
                    + {item.modifiers.map((m: any) => m.name || m.optionName).filter(Boolean).join(', ')}
                  </Text>
                )}
                {item.notes && (
                  <Text className="text-[10px] text-amber-600 italic ml-4 font-normal" numberOfLines={1}>
                    Catatan: {item.notes}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {itemsList.length > 4 && (
            <Text className="text-[10px] text-slate-400 font-medium italic pt-0.5 pl-6">
              +{itemsList.length - 4} item lainnya...
            </Text>
          )}
        </View>
      </View>

      {/* Card Footer: Total Price, Cek Midtrans (if pending online like Web), & Stage Action Button */}
      <View className="flex-row items-center justify-between pt-1 border-t border-slate-100">
        <TouchableOpacity activeOpacity={0.7} onPress={() => onSelect(order)}>
          <Text className="text-[10px] text-slate-400 font-medium">Total Pesanan</Text>
          <Text className="text-xs font-semibold text-slate-900 font-mono">
            {formatCurrency(Number(order.grandTotal))}
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-1.5">
          {/* Quick "Cek Midtrans" Button on Pending Online Cards (Matching Web Kanban) */}
          {isPendingOnline && (
            <TouchableOpacity
              onPress={() => onCheckMidtrans(order.id)}
              disabled={isCheckingMidtrans}
              activeOpacity={0.75}
              className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/80 flex-row items-center gap-1 active:bg-blue-100"
            >
              {isCheckingMidtrans ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <RefreshCw size={11} color="#2563eb" />
              )}
              <Text className="text-[11px] font-semibold text-blue-700">Cek Midtrans</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              if (order.status === 'NEW') {
                onStartPrepare(order);
              } else {
                onUpdateStatus(order.id, config.nextStatus);
              }
            }}
            disabled={isUpdating}
            activeOpacity={0.75}
            style={{ backgroundColor: config.btnBg }}
            className="px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 shadow-2xs"
          >
            {order.status === 'NEW' ? (
              <ChefHat size={12} color={config.btnText} />
            ) : (
              <ChevronRight size={12} color={config.btnText} />
            )}
            <Text style={{ color: config.btnText }} className="text-xs font-semibold">
              {config.actionLabel}
            </Text>
          </TouchableOpacity>

          {(order.status === 'PENDING' || order.status === 'NEW') && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Batalkan Pesanan', 'Apakah Anda yakin ingin membatalkan pesanan ini?', [
                  { text: 'Tidak', style: 'cancel' },
                  {
                    text: 'Ya, Batalkan',
                    style: 'destructive',
                    onPress: () => onUpdateStatus(order.id, 'CANCELLED'),
                  },
                ]);
              }}
              activeOpacity={0.7}
              className="px-2.5 py-2 rounded-xl border border-red-200 items-center justify-center bg-white"
            >
              <X size={13} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

export function OrdersScreen() {
  const { data: queryResult, isLoading, error, refetch, isRefetching } = useOrdersData();
  const updateStatusMutation = useUpdateOrderStatus();
  const bulkUpdateMutation = useBulkUpdateOrderStatus();
  const toggleItemMutation = useToggleOrderItemStatus();
  const syncPaymentMutation = useSyncOrderPayment();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600 || width >= 768;
  const isPhoneLandscape = !isTablet && isLandscape;

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'ONLINE'>('ALL');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeStage, setActiveStage] = useState<StatusKey>('NEW');

  // Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSearchingScannedOrder, setIsSearchingScannedOrder] = useState(false);
  const [checkingMidtransOrderId, setCheckingMidtransOrderId] = useState<string | null>(null);

  // QR Modal State (to show customer QR modal with paid watermark prevention)
  const [qrModalOrder, setQrModalOrder] = useState<OrderDto | null>(null);

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [orderToPrepare, setOrderToPrepare] = useState<OrderDto | null>(null);
  const [isPrepareModalOpen, setIsPrepareModalOpen] = useState(false);
  const [bulkTargetStage, setBulkTargetStage] = useState<StatusKey>('NEW');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  // In-app floating toast banner state
  const [toastData, setToastData] = useState<{
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const toastAnim = useRef(new Animated.Value(-120)).current;
  const toastTimerRef = useRef<any>(null);

  const hideToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    Animated.timing(toastAnim, {
      toValue: -120,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setToastData(null);
    });
  }, [toastAnim]);

  const showToast = useCallback(
    (data: { type: 'info' | 'success' | 'warning' | 'error'; title: string; message: string }) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setToastData(data);
      toastAnim.setValue(-120);
      Animated.spring(toastAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }).start();

      toastTimerRef.current = setTimeout(() => {
        hideToast();
      }, 4000);
    },
    [toastAnim, hideToast]
  );

  // Rotation animation for manual refresh button
  const spinAnim = useRef(new Animated.Value(0)).current;

  const startSpin = () => {
    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const allOrders: OrderDto[] = useMemo(() => {
    return queryResult?.data || [];
  }, [queryResult]);

  // Helper to extract clean order number from raw text or full URL
  const parseOrderNumber = useCallback((text: string): string => {
    const clean = text.trim();
    try {
      if (clean.includes('order=')) {
        const url = clean.startsWith('http')
          ? new URL(clean)
          : new URL(`http://dummy.com${clean.startsWith('/') ? '' : '/'}${clean}`);
        const orderParam = url.searchParams.get('order');
        if (orderParam) return orderParam.replace(/^#/, '').trim();
      }
    } catch {
      // fallback
    }
    return clean.replace(/^#/, '').trim();
  }, []);

  // Filter orders by order type and search query
  const filteredOrders = useMemo(() => {
    const parsedSearch = parseOrderNumber(searchQuery).toLowerCase();

    return allOrders.filter((order) => {
      // Filter by order type
      if (typeFilter === 'DINE_IN') {
        if (order.orderType !== 'DINE_IN') return false;
      } else if (typeFilter === 'TAKEAWAY') {
        if (order.orderType !== 'TAKE_AWAY' && order.orderType !== 'TAKEAWAY') return false;
      } else if (typeFilter === 'ONLINE') {
        if (order.orderType !== 'ONLINE' && order.orderType !== 'DELIVERY') return false;
      }

      // Filter by search query
      if (!parsedSearch) return true;
      const orderNum = (order.orderNumber || '').replace(/^#/, '').toLowerCase();
      const customerName = (order.customerName || '').toLowerCase();
      const tableNumber = (order.tableNumber || '').toLowerCase();
      const orderId = order.id.toLowerCase();

      return (
        orderNum.includes(parsedSearch) ||
        customerName.includes(parsedSearch) ||
        `meja ${tableNumber}`.includes(parsedSearch) ||
        orderId.includes(parsedSearch)
      );
    });
  }, [allOrders, typeFilter, searchQuery, parseOrderNumber]);

  // Counts for the 4 Kanban stages (PENDING, NEW, PROCESSING, READY)
  const stageCounts = useMemo(() => {
    const counts: Record<StatusKey, number> = {
      PENDING: 0,
      NEW: 0,
      PROCESSING: 0,
      READY: 0,
    };
    filteredOrders.forEach((o) => {
      if (counts[o.status as StatusKey] !== undefined) {
        counts[o.status as StatusKey]++;
      }
    });
    return counts;
  }, [filteredOrders]);

  /**
   * QR Scan Handler dengan Pencegahan Scan Ulang:
   * Sesuai logic web: Jika pesanan sudah dibayar (paymentStatus === 'PAID')
   * atau statusnya sudah bukan PENDING (sudah NEW, PROCESSING, READY, COMPLETED),
   * sistem memberikan peringatan jelas bahwa pesanan ini SUDAH DIBAYAR & DITERIMA
   * dan mencegah konfirmasi pembayaran ganda di kasir!
   */
  const handleScanCode = async (rawCode: string) => {
    const orderNum = parseOrderNumber(rawCode);
    if (!orderNum) return;

    const cleanTarget = orderNum.toUpperCase();

    // 1. Cari di local state terlebih dahulu
    let targetOrder = allOrders.find(
      (o) =>
        (o.orderNumber && o.orderNumber.replace(/^#/, '').toUpperCase() === cleanTarget) ||
        o.id === rawCode ||
        o.id.toUpperCase() === cleanTarget
    );

    // 2. Jika belum ada di memory state, query server backend via lookup API
    if (!targetOrder) {
      setIsSearchingScannedOrder(true);
      try {
        const loaded = await searchOrderByNumber(orderNum);
        if (loaded) {
          targetOrder = loaded;
          queryClient.setQueryData(['orders'], (old: any) => {
            if (!old || !old.data) return { success: true, data: [loaded] };
            if (old.data.some((o: OrderDto) => o.id === loaded.id)) {
              return old;
            }
            return {
              ...old,
              data: [loaded, ...old.data],
            };
          });
        }
      } catch {
        // fail silently to not crash
      } finally {
        setIsSearchingScannedOrder(false);
      }
    }

    if (!targetOrder) {
      showToast({
        type: 'error',
        title: 'Tidak Ditemukan',
        message: `Pesanan #${orderNum} tidak terdaftar di sistem outlet.`,
      });
      return;
    }

    // 3. PENCEGAHAN SCAN ULANG (LOGIKA PERSIS SEPERTI DI WEB)
    const isAlreadyPaid =
      (targetOrder.paymentStatus || '').toUpperCase() === 'PAID' ||
      (targetOrder.status && (targetOrder.status || '').toUpperCase() !== 'PENDING');

    setIsScannerOpen(false);

    if (isAlreadyPaid) {
      // TIDAK BUKA MODAL DETAIL!
      // TIDAK BERPINDAH TAB PADA HP!
      const statusTitle =
        STATUS_CONFIGS[targetOrder.status as StatusKey]?.title || targetOrder.status;

      showToast({
        type: 'warning',
        title: 'Pesanan Sudah Lunas',
        message: `Pesanan #${targetOrder.orderNumber?.replace(/^#/, '') || targetOrder.id.slice(0, 5)} sudah lunas & berstatus "${statusTitle}". Detail tidak dibuka untuk mencegah duplikasi pembayaran.`,
      });
      return;
    }

    // 4. HANYA JIKA STATUS PENDING (MENUNGGU PEMBAYARAN KASIR):
    // Pada HP otomatis diarahkan ke tab Menunggu Bayar & modal pembayaran terbuka
    if (!isTablet) {
      setActiveStage('PENDING');
    }
    setSelectedOrder(targetOrder);
    showToast({
      type: 'success',
      title: 'Pesanan Siap Dibayar',
      message: `Pesanan #${targetOrder.orderNumber?.replace(/^#/, '') || targetOrder.id.slice(0, 5)} siap dikonfirmasi pembayarannya di kasir.`,
    });
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    startSpin();
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePullRefresh = async () => {
    setIsPullRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsPullRefreshing(false);
    }
  };

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate(
      { orderId, status: newStatus },
      {
        onSuccess: () => {
          if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder(null);
          }
          if (orderToPrepare && orderToPrepare.id === orderId) {
            setIsPrepareModalOpen(false);
            setOrderToPrepare(null);
          }
        },
        onError: () => {
          Alert.alert('Gagal', 'Tidak dapat mengupdate status pesanan.');
        },
      }
    );
  };

  // Check Midtrans payment status
  const handleCheckMidtransPayment = (orderId: string) => {
    setCheckingMidtransOrderId(orderId);
    syncPaymentMutation.mutate(orderId, {
      onSuccess: (res) => {
        setCheckingMidtransOrderId(null);
        if (res?.isPaid) {
          Alert.alert(
            'Pembayaran Berhasil',
            'Pembayaran Midtrans telah berhasil diverifikasi dan pesanan otomatis masuk antrean dapur.'
          );
          if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder((prev) =>
              prev ? { ...prev, paymentStatus: 'PAID', status: res.status || 'NEW' } : null
            );
          }
        } else {
          Alert.alert(
            'Belum Dibayar',
            res?.error || res?.message || 'Pembayaran belum diselesaikan oleh pelanggan di Midtrans.'
          );
        }
      },
      onError: (err: any) => {
        setCheckingMidtransOrderId(null);
        Alert.alert('Gagal', err?.message || 'Gagal memeriksa status pembayaran Midtrans.');
      },
    });
  };

  const handleToggleItem = (itemId: string, currentCompleted: boolean) => {
    const updateCache = (old: any) => {
      if (!old || !old.data) return old;
      return {
        ...old,
        data: old.data.map((order: OrderDto) => ({
          ...order,
          items: order.items.map((item: OrderItemDto) =>
            item.id === itemId ? { ...item, isCompleted: !currentCompleted } : item
          ),
        })),
      };
    };

    // Optimistic cache update
    queryClient.setQueryData(['orders'], updateCache);

    toggleItemMutation.mutate(
      { itemId, isCompleted: !currentCompleted },
      {
        onError: () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
      }
    );
  };

  const handleSelectOrder = useCallback((order: OrderDto) => {
    setSelectedOrder(order);
  }, []);

  const handleStartPrepare = useCallback((order: OrderDto) => {
    setOrderToPrepare(order);
    setIsPrepareModalOpen(true);
  }, []);

  const handleUpdateStatusCallback = useCallback((orderId: string, newStatus: string) => {
    handleUpdateStatus(orderId, newStatus);
  }, [updateStatusMutation]);

  const handleToggleItemCallback = useCallback((itemId: string, currentCompleted: boolean) => {
    handleToggleItem(itemId, currentCompleted);
  }, [toggleItemMutation, queryClient]);

  const handleShowQrCallback = useCallback((order: OrderDto) => {
    setQrModalOrder(order);
  }, []);

  const handleStartPrepareClick = (order: OrderDto) => {
    setOrderToPrepare(order);
    setIsPrepareModalOpen(true);
  };

  const handleOpenBulkModal = (stageKey: StatusKey) => {
    setBulkTargetStage(stageKey);
    setIsBulkModalOpen(true);
  };

  const handleConfirmBulkAdvance = () => {
    const targetConfig = STATUS_CONFIGS[bulkTargetStage];
    const targetOrders = filteredOrders.filter((o) => o.status === bulkTargetStage);
    const orderIds = targetOrders.map((o) => o.id);

    if (orderIds.length === 0) {
      setIsBulkModalOpen(false);
      return;
    }

    bulkUpdateMutation.mutate(
      { orderIds, status: targetConfig.nextStatus },
      {
        onSuccess: () => {
          setIsBulkModalOpen(false);
          Alert.alert(
            'Berhasil',
            `${orderIds.length} pesanan berhasil dipindahkan ke "${targetConfig.nextStatusTitle}".`
          );
        },
        onError: () => {
          Alert.alert('Gagal', 'Terjadi kesalahan saat memindahkan seluruh pesanan.');
        },
      }
    );
  };

  const renderColumn = (stageKey: StatusKey, isTabletColumn = false) => {
    const stageOrders = filteredOrders.filter((o) => o.status === stageKey);
    const config = STATUS_CONFIGS[stageKey];

    return (
      <View
        key={stageKey}
        className={`${
          isTabletColumn ? 'w-80 mr-3.5' : 'flex-1'
        } bg-slate-50/70 rounded-2xl border border-slate-200/80 overflow-hidden`}
      >
        {/* Column Header */}
        <View className="bg-white px-3.5 py-2.5 border-b border-slate-200 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            
            <Text className="text-xs font-semibold text-slate-900 tracking-tight">{config.title}</Text>
            <View className="px-1.5 py-0.2 rounded-full bg-slate-100">
              <Text className="text-[10px] font-semibold text-slate-600">{stageOrders.length}</Text>
            </View>
          </View>

          {/* Selesai Semua (Centang Icon) */}
          <TouchableOpacity
            onPress={() => {
              if (stageOrders.length > 0) {
                handleOpenBulkModal(stageKey);
              }
            }}
            disabled={stageOrders.length === 0 || bulkUpdateMutation.isPending}
            activeOpacity={0.75}
            accessibilityLabel={`Selesaikan semua pesanan ${config.title}`}
            className={`w-7 h-7 rounded-lg border items-center justify-center ${
              stageOrders.length === 0
                ? 'opacity-30 bg-slate-100 border-slate-200'
                : 'bg-emerald-50 border-emerald-300'
            }`}
          >
            <Check size={15} strokeWidth={2.5} color={stageOrders.length === 0 ? '#94a3b8' : '#059669'} />
          </TouchableOpacity>
        </View>

        {/* Orders List inside this Column */}
        <ScrollView
          className="flex-1 p-2.5"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: isTabletColumn
              ? 40 + insets.bottom
              : (isPhoneLandscape ? 60 : 85) + Math.max(insets.bottom, 16),
          }}
          refreshControl={
            !isTabletColumn ? (
              <RefreshControl
                refreshing={isPullRefreshing}
                onRefresh={handlePullRefresh}
                tintColor="#2563eb"
                colors={['#2563eb']}
              />
            ) : undefined
          }
        >
          {stageOrders.length === 0 ? (
            <View className="py-20 items-center justify-center">
              <UtensilsCrossed size={32} color="#cbd5e1" />
              <Text className="text-slate-400 font-semibold text-xs mt-2.5">
                Tidak ada pesanan di status ini
              </Text>
            </View>
          ) : (
            stageOrders.map((order) => (
              <OrderCardItem
                key={order.id}
                order={order}
                onSelect={handleSelectOrder}
                onStartPrepare={handleStartPrepare}
                onUpdateStatus={handleUpdateStatusCallback}
                onToggleItem={handleToggleItemCallback}
                onCheckMidtrans={handleCheckMidtransPayment}
                onShowQr={handleShowQrCallback}
                isUpdating={updateStatusMutation.isPending}
                isCheckingMidtrans={checkingMidtransOrderId === order.id}
              />
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  if (isLoading && allOrders.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-3 text-slate-500 font-semibold text-xs">Memuat pesanan masuk...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 p-4">
        <AlertCircle size={36} color="#ef4444" />
        <Text className="text-red-500 font-semibold mt-2 text-center text-sm">
          Gagal memuat antrean pesanan.
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-4 px-5 py-2.5 bg-blue-600 rounded-xl active:opacity-90"
        >
          <Text className="text-white font-semibold text-xs">Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-100/70 relative">
      {/* Floating Animated Toast Banner (Sonner-like Native Experience) */}
      {toastData && (
        <Animated.View
          style={{
            transform: [{ translateY: toastAnim }],
            top: Math.max(insets.top, 10),
          }}
          className="absolute left-3.5 right-3.5 z-50 shadow-lg"
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={hideToast}
            className={`p-3 rounded-2xl flex-row items-start gap-2.5 border shadow-sm ${
              toastData.type === 'success'
                ? 'bg-emerald-50 border-emerald-300'
                : toastData.type === 'warning'
                ? 'bg-amber-50 border-amber-300'
                : toastData.type === 'error'
                ? 'bg-red-50 border-red-300'
                : 'bg-blue-50 border-blue-300'
            }`}
          >
            <View
              className={`w-7 h-7 rounded-xl items-center justify-center mt-0.5 ${
                toastData.type === 'success'
                  ? 'bg-emerald-100'
                  : toastData.type === 'warning'
                  ? 'bg-amber-100'
                  : toastData.type === 'error'
                  ? 'bg-red-100'
                  : 'bg-blue-100'
              }`}
            >
              {toastData.type === 'success' ? (
                <CheckCircle2 size={16} color="#047857" />
              ) : toastData.type === 'warning' ? (
                <AlertTriangle size={16} color="#b45309" />
              ) : toastData.type === 'error' ? (
                <XCircle size={16} color="#b91c1c" />
              ) : (
                <Info size={16} color="#1d4ed8" />
              )}
            </View>

            <View className="flex-1 pr-1">
              <Text
                className={`text-xs font-semibold ${
                  toastData.type === 'success'
                    ? 'text-emerald-950'
                    : toastData.type === 'warning'
                    ? 'text-amber-950'
                    : toastData.type === 'error'
                    ? 'text-red-950'
                    : 'text-blue-950'
                }`}
              >
                {toastData.title}
              </Text>
              <Text
                className={`text-[11px] font-normal leading-relaxed mt-0.5 ${
                  toastData.type === 'success'
                    ? 'text-emerald-800'
                    : toastData.type === 'warning'
                    ? 'text-amber-800'
                    : toastData.type === 'error'
                    ? 'text-red-800'
                    : 'text-blue-800'
                }`}
              >
                {toastData.message}
              </Text>
            </View>

            <TouchableOpacity onPress={hideToast} className="p-1 opacity-60">
              <X size={14} color="#64748b" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* 1. TOP CONTROL BAR: FILTER (LEFT) + SEARCH (CENTER) + SCAN QR & REFRESH (RIGHT) */}
      <View className="bg-white border-b border-slate-200 px-3.5 py-2.5">
        <View className="flex-row items-center gap-2">
          {/* Tombol Filter di Ujung Kiri (Hanya Icon Tanpa Teks) */}
          <TouchableOpacity
            onPress={() => setIsFilterModalOpen(true)}
            activeOpacity={0.75}
            accessibilityLabel="Filter jenis pesanan"
            className={`w-9 h-9 rounded-xl border items-center justify-center relative ${
              typeFilter !== 'ALL'
                ? 'bg-blue-50 border-blue-500'
                : 'bg-white border-slate-200 active:bg-slate-50'
            }`}
          >
            <Filter size={15} color={typeFilter !== 'ALL' ? '#2563eb' : '#64748b'} />
            {typeFilter !== 'ALL' && (
              <View className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600" />
            )}
          </TouchableOpacity>

          {/* Search Bar Berada di Tengah Antara Filter dan Scan QR */}
          <View className="flex-1 h-9 flex-row items-center bg-slate-100 rounded-xl px-3 border border-slate-200">
            <Search size={15} color="#64748b" />
            <TextInput
              placeholder="Cari meja, no order, nama..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-xs text-slate-800 ml-2 py-0 font-medium"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                <X size={14} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Tombol Scan QR: Di samping Refresh, Mobile HP hanya Icon, Tablet Icon + Teks */}
          <TouchableOpacity
            onPress={() => setIsScannerOpen(true)}
            activeOpacity={0.75}
            accessibilityLabel="Pindai QR pesanan pelanggan"
            className={`h-9 rounded-xl border border-slate-200 bg-white items-center justify-center active:bg-blue-50 ${
              isTablet ? 'flex-row gap-1.5 px-3' : 'w-9'
            }`}
          >
            <Camera size={15} color="#2563eb" />
            {isTablet && (
              <Text className="text-xs font-semibold text-blue-700">Scan QR</Text>
            )}
          </TouchableOpacity>

          {/* Tombol Refresh Manual (di samping Scan QR) */}
          <TouchableOpacity
            onPress={handleManualRefresh}
            disabled={isRefreshing || isRefetching}
            activeOpacity={0.75}
            accessibilityLabel="Muat ulang daftar pesanan"
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white items-center justify-center active:bg-slate-50"
          >
            <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
              <RefreshCw size={14} color="#2563eb" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. BODY CONTENT: TABLET (HORIZONTAL 4 COLUMNS) VS SMARTPHONE (TABS + ACTIVE COLUMN) */}
      {isTablet ? (
        <View className="flex-1 p-3 bg-slate-100/70">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {(['PENDING', 'NEW', 'PROCESSING', 'READY'] as const).map((stageKey) =>
              renderColumn(stageKey, true)
            )}
          </ScrollView>
        </View>
      ) : (
        <View className="flex-1">
          {/* 4 Stage Tabs (Smartphone Only) */}
          <View className="bg-white border-b border-slate-200">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row px-2">
              {(['PENDING', 'NEW', 'PROCESSING', 'READY'] as const).map((stageKey) => {
                const config = STATUS_CONFIGS[stageKey];
                const isActive = activeStage === stageKey;
                const count = stageCounts[stageKey] || 0;

                return (
                  <TouchableOpacity
                    key={stageKey}
                    onPress={() => setActiveStage(stageKey)}
                    className={`flex-row items-center gap-1.5 px-3.5 py-3 border-b-2 ${
                      isActive ? 'border-blue-600' : 'border-transparent'
                    }`}
                  >
                    
                    <Text
                      className={`text-xs font-semibold ${
                        isActive ? 'text-blue-600' : 'text-slate-500'
                      }`}
                    >
                      {config.title}
                    </Text>
                    <View
                      className={`px-1.5 py-0.5 rounded-full ${
                        stageKey === 'PENDING' && count > 0
                          ? 'bg-amber-100'
                          : isActive
                          ? 'bg-blue-100'
                          : 'bg-slate-100'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-semibold ${
                          stageKey === 'PENDING' && count > 0
                            ? 'text-amber-800'
                            : isActive
                            ? 'text-blue-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Pending Orders Notification Banner */}
          {activeStage !== 'PENDING' && stageCounts.PENDING > 0 && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveStage('PENDING')}
              className="bg-amber-50 mx-3 mt-2.5 px-3 py-2.5 rounded-xl border border-amber-300 flex-row items-center justify-between shadow-xs"
            >
              <View className="flex-row items-center gap-2 flex-1 mr-2">
                <View className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-amber-900 leading-tight">
                    Ada {stageCounts.PENDING} pesanan menunggu pembayaran / konfirmasi
                  </Text>
                  <Text className="text-[10px] text-amber-700">
                    Termasuk pesanan online dari storefront
                  </Text>
                </View>
              </View>
              <View className="bg-amber-600 px-2.5 py-1.5 rounded-lg flex-row items-center gap-1">
                <Text className="text-[11px] font-semibold text-white">Lihat & Proses</Text>
                <ChevronRight size={12} color="#ffffff" />
              </View>
            </TouchableOpacity>
          )}

          {/* Active Stage Column for Smartphone */}
          <View className="flex-1 p-3">
            {renderColumn(activeStage, false)}
          </View>
        </View>
      )}

      {/* 3. MODAL MULAI PENYIAPAN & CETAK STRUK/TIKET (PREPARE MODAL) */}
      {isPrepareModalOpen && !!orderToPrepare && (
        <Modal
          visible={isPrepareModalOpen && !!orderToPrepare}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setIsPrepareModalOpen(false);
            setOrderToPrepare(null);
          }}
        >
          <View className="flex-1 bg-black/50 justify-center items-center p-4">
            <View className="bg-white w-full max-w-md rounded-2xl p-5 border border-slate-100 shadow-xl">
              {/* Header */}
              <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
                <View className="flex-row items-center gap-2.5">
                  <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center">
                    <ChefHat size={22} color="#2563eb" />
                  </View>
                  <View>
                    <Text className="text-base font-semibold text-slate-900">Mulai Penyiapan</Text>
                    <Text className="text-xs text-slate-500 font-medium">Tiket dapur & struk pelanggan</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setIsPrepareModalOpen(false);
                    setOrderToPrepare(null);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                >
                  <X size={16} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Order Info & Items List */}
              <View className="py-3.5 space-y-3">
                <View className="flex-row justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <View>
                    <Text className="text-[10px] font-semibold text-slate-400 uppercase">Nomor Order</Text>
                    <Text className="font-mono text-sm font-semibold text-slate-900">
                      #{orderToPrepare?.orderNumber || orderToPrepare?.id?.slice(0, 5) || ''}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] font-semibold text-slate-400 uppercase">Layanan</Text>
                    <Text className="text-xs font-semibold text-slate-800">
                      {orderToPrepare?.tableNumber
                        ? `Meja ${orderToPrepare.tableNumber}`
                        : (orderToPrepare?.orderType || '').replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {/* Items Preview */}
                <View className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 max-h-36">
                  <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Daftar Menu ({orderToPrepare?.items?.length || 0})
                  </Text>
                  <ScrollView nestedScrollEnabled className="max-h-28">
                    {orderToPrepare?.items?.map((item, idx) => (
                      <View
                        key={item.id || idx}
                        className="flex-row justify-between items-center py-1 border-b border-dashed border-slate-200 last:border-0"
                      >
                        <Text className="text-xs text-slate-800 flex-1 mr-2" numberOfLines={1}>
                          <Text className="font-semibold text-blue-600 font-mono">{item.quantity}x </Text>
                          {item.productName}
                        </Text>
                        <Text className="text-[11px] font-mono text-slate-600 font-semibold">
                          {formatCurrency(Number(item.subtotal))}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* Cetak Dokumen Fisik Quick Actions */}
                <View className="space-y-2 pt-1">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs font-semibold text-slate-800">Cetak Dokumen Fisik</Text>
                    <Text className="text-[10px] text-slate-400 font-medium">Opsional</Text>
                  </View>

                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(
                          'Cetak Tiket Dapur',
                          `Mencetak tiket dapur untuk pesanan #${orderToPrepare?.orderNumber || ''}...`
                        )
                      }
                      className="flex-1 py-2.5 px-2 bg-slate-50 border border-slate-200 rounded-xl flex-row items-center justify-center gap-1.5 active:bg-blue-50"
                    >
                      <ChefHat size={14} color="#d97706" />
                      <Text className="text-xs font-semibold text-slate-700">Tiket Dapur</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(
                          'Cetak Struk Pelanggan',
                          `Mencetak struk pelanggan untuk pesanan #${orderToPrepare?.orderNumber || ''}...`
                        )
                      }
                      className="flex-1 py-2.5 px-2 bg-slate-50 border border-slate-200 rounded-xl flex-row items-center justify-center gap-1.5 active:bg-blue-50"
                    >
                      <Receipt size={14} color="#2563eb" />
                      <Text className="text-xs font-semibold text-slate-700">Struk Pelanggan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Modal Actions */}
              <View className="flex-row gap-2 pt-3 border-t border-slate-100">
                <TouchableOpacity
                  onPress={() => {
                    setIsPrepareModalOpen(false);
                    setOrderToPrepare(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 items-center justify-center active:bg-slate-50"
                >
                  <Text className="text-xs font-semibold text-slate-600">Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (orderToPrepare) {
                      handleUpdateStatus(orderToPrepare.id, 'PROCESSING');
                    }
                  }}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 items-center justify-center flex-row gap-1.5 shadow-sm active:bg-blue-700"
                >
                  <ChefHat size={14} color="#fff" />
                  <Text className="text-xs font-semibold text-white">Mulai Penyiapan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 4. MODAL KONFIRMASI SELESAI SEMUA PESANAN */}
      {isBulkModalOpen && (
        <Modal
          visible={isBulkModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsBulkModalOpen(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center p-4">
            <View className="bg-white w-full max-w-sm rounded-2xl p-5 border border-slate-100 shadow-lg">
              <View className="flex-row items-center gap-2.5 border-b border-slate-100 pb-3">
                <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center">
                  <CheckCheck size={20} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-900">Lanjutkan Semua Pesanan?</Text>
                  <Text className="text-[11px] text-slate-500 font-medium">
                    {STATUS_CONFIGS[bulkTargetStage]?.title} → {STATUS_CONFIGS[bulkTargetStage]?.nextStatusTitle}
                  </Text>
                </View>
              </View>

              <View className="py-3.5 space-y-3">
                <Text className="text-xs text-slate-600 leading-relaxed">
                  Apakah Anda yakin untuk melanjutkan semua pesanan pada status{' '}
                  <Text className="font-semibold text-slate-900">
                    "{STATUS_CONFIGS[bulkTargetStage]?.title}"
                  </Text>{' '}
                  sebanyak{' '}
                  <Text className="font-semibold text-emerald-600">
                    {filteredOrders.filter((o) => o.status === bulkTargetStage).length} pesanan
                  </Text>{' '}
                  ke status berikutnya (
                  <Text className="font-semibold text-blue-600">
                    "{STATUS_CONFIGS[bulkTargetStage]?.nextStatusTitle}"
                  </Text>
                  )?
                </Text>

                {/* List of Affected Orders */}
                <View className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 max-h-40">
                  <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Daftar Pesanan ({filteredOrders.filter((o) => o.status === bulkTargetStage).length})
                  </Text>
                  <ScrollView nestedScrollEnabled className="max-h-32">
                    {filteredOrders
                      .filter((o) => o.status === bulkTargetStage)
                      .map((o) => (
                        <View
                          key={o.id}
                          className="flex-row justify-between items-center py-1 border-b border-slate-100 last:border-0"
                        >
                          <View className="flex-row items-center gap-1.5">
                            <Text className="font-mono text-[10px] font-semibold text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded">
                              {o.orderNumber || `#${o.id.slice(0, 5)}`}
                            </Text>
                            <Text className="text-[11px] text-slate-700 font-medium max-w-[120px]" numberOfLines={1}>
                              {o.customerName || (o.tableNumber ? `Meja ${o.tableNumber}` : 'Pesanan')}
                            </Text>
                          </View>
                          <Text className="text-[10px] font-semibold text-slate-600">
                            {formatCurrency(Number(o.grandTotal))}
                          </Text>
                        </View>
                      ))}
                  </ScrollView>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-2 pt-2 border-t border-slate-100">
                <TouchableOpacity
                  onPress={() => setIsBulkModalOpen(false)}
                  disabled={bulkUpdateMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 items-center justify-center active:bg-slate-50"
                >
                  <Text className="text-xs font-semibold text-slate-600">Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmBulkAdvance}
                  disabled={bulkUpdateMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 items-center justify-center flex-row gap-1.5 shadow-sm active:bg-emerald-700"
                >
                  {bulkUpdateMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <CheckCheck size={14} color="#fff" />
                      <Text className="text-xs font-semibold text-white">
                        Ya, Lanjutkan ({filteredOrders.filter((o) => o.status === bulkTargetStage).length})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 5. MODAL DETAIL PESANAN LENGKAP (BOTTOM SHEET / MODAL) */}
      {!!selectedOrder && (
        <Modal
          visible={!!selectedOrder}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedOrder(null)}
        >
          <Pressable
            className="flex-1 bg-black/40 justify-end"
            onPress={() => setSelectedOrder(null)}
          >
            <Pressable
              className="bg-white rounded-t-3xl max-h-[92%] p-5 border-t border-slate-100"
              onPress={(e) => e.stopPropagation()}
            >
              {/* Sheet Handle */}
              <View className="items-center -mt-2 pb-3">
                <View className="w-10 h-1 rounded-full bg-slate-300" />
              </View>

              {/* Header with Order Number & Payment Status */}
              <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
                <View>
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-base font-semibold text-slate-900">
                      Pesanan #{selectedOrder?.orderNumber || selectedOrder?.id?.slice(0, 5) || ''}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded-full ${
                        selectedOrder?.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 border border-emerald-200'
                          : 'bg-amber-50 border border-amber-200'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-semibold ${
                          selectedOrder?.paymentStatus === 'PAID'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {selectedOrder?.paymentStatus === 'PAID' ? 'LUNAS' : 'BELUM LUNAS'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-slate-500 font-medium">
                    {selectedOrder?.createdAt ? formatDate(selectedOrder.createdAt) : ''}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1.5">
                  {/* Button to Show Customer QR Modal */}
                  <TouchableOpacity
                    onPress={() => setQrModalOrder(selectedOrder)}
                    className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 items-center justify-center"
                    accessibilityLabel="Tampilkan QR code pesanan ini"
                  >
                    <QrCode size={15} color="#2563eb" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedOrder(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                  >
                    <X size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView className="py-3" showsVerticalScrollIndicator={false}>
                {/* Banner Status Pembayaran (Pencegahan Pembayaran Ulang) */}
                {selectedOrder?.paymentStatus === 'PAID' ? (
                  <View className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl mb-3 flex-row items-center gap-2.5">
                    <View className="w-8 h-8 rounded-xl bg-emerald-100 items-center justify-center">
                      <ShieldCheck size={18} color="#059669" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-emerald-900">
                        Pembayaran Sudah Lunas & Diverifikasi
                      </Text>
                      <Text className="text-[11px] text-emerald-700">
                        Status saat ini: {STATUS_CONFIGS[selectedOrder.status as StatusKey]?.title || selectedOrder.status}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View className="bg-amber-50 border border-amber-200 p-3 rounded-2xl mb-3 flex-row items-center gap-2.5">
                    <View className="w-8 h-8 rounded-xl bg-amber-100 items-center justify-center">
                      <AlertTriangle size={18} color="#d97706" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-amber-900">
                        Menunggu Pembayaran Kasir
                      </Text>
                      <Text className="text-[11px] text-amber-700">
                        Tunjukkan QR ke kasir atau konfirmasi pembayaran di bawah.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Order Meta Card */}
                <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-3 grid">
                  <View className="flex-row justify-between mb-2 pb-2 border-b border-slate-200/50">
                    <View>
                      <Text className="text-[10px] font-semibold text-slate-400 uppercase">Tipe Pesanan</Text>
                      <Text className="text-xs font-semibold text-slate-800 mt-0.5">
                        {selectedOrder?.tableNumber
                          ? `Meja ${selectedOrder.tableNumber}`
                          : (selectedOrder?.orderType || '').replace('_', ' ')}
                      </Text>
                    </View>
                    {selectedOrder?.customerName && (
                      <View className="items-end">
                        <Text className="text-[10px] font-semibold text-slate-400 uppercase">Pelanggan</Text>
                        <Text className="text-xs font-semibold text-slate-800 mt-0.5">
                          {selectedOrder.customerName}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row justify-between">
                    <View>
                      <Text className="text-[10px] font-semibold text-slate-400 uppercase">Metode Bayar</Text>
                      <Text className="text-xs font-semibold text-slate-800 mt-0.5">
                        {selectedOrder?.paymentMethod || 'CASH / KASIR'}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[10px] font-semibold text-slate-400 uppercase">Status Bayar</Text>
                      <Text
                        className={`text-xs font-semibold mt-0.5 ${
                          selectedOrder?.paymentStatus === 'PAID'
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {selectedOrder?.paymentStatus === 'PAID' ? 'Lunas' : 'Menunggu Bayar'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Online Midtrans Payment Sync Button (Matching Web Kanban) */}
                {selectedOrder.status === 'PENDING' &&
                  (selectedOrder.orderType === 'ONLINE' ||
                    selectedOrder.paymentMethod === 'ONLINE' ||
                    selectedOrder.paymentStatus !== 'PAID') && (
                    <TouchableOpacity
                      onPress={() => handleCheckMidtransPayment(selectedOrder.id)}
                      disabled={syncPaymentMutation.isPending}
                      activeOpacity={0.8}
                      className="w-full py-2.5 px-3 mb-3 rounded-xl bg-blue-50 border border-blue-200 flex-row items-center justify-center gap-1.5 active:bg-blue-100"
                    >
                      {syncPaymentMutation.isPending ? (
                        <ActivityIndicator size="small" color="#2563eb" />
                      ) : (
                        <RefreshCw size={13} color="#2563eb" />
                      )}
                      <Text className="text-xs font-semibold text-blue-700">
                        {syncPaymentMutation.isPending
                          ? 'Memeriksa Midtrans...'
                          : 'Periksa Status Pembayaran Midtrans'}
                      </Text>
                    </TouchableOpacity>
                  )}

                {/* Items List */}
                <View className="mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs font-semibold text-slate-900">Daftar Item Menu</Text>
                    <Text className="text-[11px] text-slate-400 font-semibold">
                      {selectedOrder?.items?.filter((i) => i.isCompleted).length} dari{' '}
                      {selectedOrder?.items?.length || 0} siap
                    </Text>
                  </View>
                  <View className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    {selectedOrder?.items?.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        onPress={() => handleToggleItem(item.id, item.isCompleted)}
                        className={`flex-row items-center p-3 ${
                          item.isCompleted ? 'bg-emerald-50/20' : 'bg-white'
                        }`}
                      >
                        {/* Modern Square Checkbox (UI Guidelines Rule 4.3) */}
                        <View
                          className={`w-5 h-5 rounded-lg mr-3 items-center justify-center ${
                            item.isCompleted
                              ? 'bg-emerald-600 border border-emerald-600'
                              : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {item.isCompleted && <Check size={12} color="#fff" strokeWidth={2.5} />}
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-xs ${
                              item.isCompleted
                                ? 'line-through text-slate-400 font-normal'
                                : 'font-semibold text-slate-800'
                            }`}
                          >
                            <Text className="font-mono font-semibold text-slate-900">
                              {item.quantity}x
                            </Text>{' '}
                            {item.productName}
                          </Text>
                          {Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                            <Text className="text-[10px] text-slate-500 font-normal mt-0.5">
                              + {item.modifiers.map((m: any) => m.name || m.optionName).filter(Boolean).join(', ')}
                            </Text>
                          )}
                          {item.notes && (
                            <Text className="text-[10px] text-amber-600 font-medium italic mt-0.5">
                              Catatan: {item.notes}
                            </Text>
                          )}
                        </View>
                        <Text className="text-xs font-mono font-semibold text-slate-700">
                          {formatCurrency(Number(item.subtotal))}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Print Physical Receipt Quick Buttons (Matching Web) */}
                <View className="p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-3 space-y-2">
                  <Text className="text-[11px] font-semibold text-slate-700">Cetak Dokumen:</Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert('Cetak Struk', `Mencetak struk pelanggan #${selectedOrder?.orderNumber || ''}...`)
                      }
                      className="flex-1 py-2 rounded-xl bg-white border border-slate-200 flex-row items-center justify-center gap-1.5 active:bg-slate-100"
                    >
                      <Receipt size={13} color="#2563eb" />
                      <Text className="text-xs font-semibold text-slate-700">Struk Pelanggan</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert('Cetak Dapur', `Mencetak tiket dapur #${selectedOrder?.orderNumber || ''}...`)
                      }
                      className="flex-1 py-2 rounded-xl bg-white border border-slate-200 flex-row items-center justify-center gap-1.5 active:bg-slate-100"
                    >
                      <ChefHat size={13} color="#d97706" />
                      <Text className="text-xs font-semibold text-slate-700">Tiket Dapur</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Total Summary */}
                <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-3 flex-row justify-between items-center">
                  <Text className="text-xs font-semibold text-slate-600">Total Pembayaran</Text>
                  <Text className="text-sm font-semibold text-slate-900 font-mono">
                    {formatCurrency(Number(selectedOrder?.grandTotal || 0))}
                  </Text>
                </View>

                {/* Primary Action in Sheet */}
                {selectedOrder && (
                  <View className="space-y-2">
                    <TouchableOpacity
                      onPress={() => {
                        if (selectedOrder.status === 'NEW') {
                          const target = selectedOrder;
                          setSelectedOrder(null);
                          handleStartPrepareClick(target);
                        } else {
                          const next = STATUS_CONFIGS[selectedOrder.status as StatusKey]?.nextStatus;
                          if (next) {
                            handleUpdateStatus(selectedOrder.id, next);
                          }
                        }
                      }}
                      disabled={updateStatusMutation.isPending}
                      className="w-full py-3 rounded-xl bg-blue-600 items-center justify-center flex-row gap-2 shadow-sm active:bg-blue-700"
                    >
                      <CheckCircle2 size={16} color="#fff" />
                      <Text className="text-xs font-semibold text-white">
                        {selectedOrder.status === 'PENDING'
                          ? 'Konfirmasi Pembayaran Kasir'
                          : selectedOrder.status === 'NEW'
                          ? 'Mulai Penyiapan (Dapur)'
                          : STATUS_CONFIGS[selectedOrder.status as StatusKey]?.actionLabel || 'Proses'}
                      </Text>
                    </TouchableOpacity>

                    {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'NEW') && (
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert('Batalkan Pesanan', 'Yakin ingin membatalkan pesanan ini?', [
                            { text: 'Tidak', style: 'cancel' },
                            {
                              text: 'Ya, Batalkan',
                              style: 'destructive',
                              onPress: () => {
                                handleUpdateStatus(selectedOrder.id, 'CANCELLED');
                                setSelectedOrder(null);
                              },
                            },
                          ]);
                        }}
                        className="w-full py-2.5 rounded-xl border border-red-200 items-center justify-center active:bg-red-50 mt-1"
                      >
                        <Text className="text-xs font-semibold text-red-600">Batalkan Pesanan</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* 6. MODAL KAMERA SCANNER QR PESANAN */}
      <OrderQrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanCode}
        isSearching={isSearchingScannedOrder}
      />

      {/* 7. MODAL QR PESANAN PELANGGAN (DENGAN WATERMARK PENCEGAHAN SCAN ULANG JIKA SUDAH LUNAS) */}
      {!!qrModalOrder && (
        <OrderQrModal
          isOpen={!!qrModalOrder}
          onClose={() => setQrModalOrder(null)}
          orderNumber={qrModalOrder.orderNumber || `#${qrModalOrder.id.slice(0, 5)}`}
          grandTotal={Number(qrModalOrder.grandTotal)}
          customerName={qrModalOrder.customerName}
          tableNumber={qrModalOrder.tableNumber}
          orderType={qrModalOrder.orderType}
          paymentStatus={qrModalOrder.paymentStatus}
          status={qrModalOrder.status}
        />
      )}

      {/* 8. MODAL FILTER TIPE PESANAN */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <Pressable
          className={`flex-1 bg-black/40 ${
            isTablet ? 'justify-center items-center p-4' : 'justify-end'
          }`}
          onPress={() => setIsFilterModalOpen(false)}
        >
          <Pressable
            style={{
              paddingBottom: isTablet ? undefined : Math.max(insets.bottom, 20),
            }}
            className={`bg-white border border-slate-100 shadow-xl ${
              isTablet
                ? 'w-full max-w-sm rounded-2xl p-5'
                : 'w-full rounded-t-3xl p-5'
            }`}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3.5 border-b border-slate-100">
              <View className="flex-row items-center gap-2.5">
                <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center">
                  <Filter size={16} color="#2563eb" />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-slate-900">Filter Tipe Pesanan</Text>
                  <Text className="text-[11px] text-slate-500 font-medium">
                    Pilih tipe pesanan yang ingin ditampilkan
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 items-center justify-center"
              >
                <X size={14} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* List Pilihan Filter */}
            <View className="py-2.5">
              {[
                {
                  key: 'ALL' as const,
                  label: 'Semua',
                  desc: 'Tampilkan semua jenis pesanan',
                  Icon: UtensilsCrossed,
                },
                {
                  key: 'DINE_IN' as const,
                  label: 'Dine In',
                  desc: 'Pesanan makan di tempat',
                  Icon: UtensilsCrossed,
                },
                {
                  key: 'TAKEAWAY' as const,
                  label: 'Bawa Pulang',
                  desc: 'Pesanan take away / dibungkus',
                  Icon: ShoppingBag,
                },
                {
                  key: 'ONLINE' as const,
                  label: 'Online',
                  desc: 'Pesanan online / delivery',
                  Icon: Store,
                },
              ].map((item) => {
                const isSelected = typeFilter === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (isSelected && item.key !== 'ALL') {
                        setTypeFilter('ALL');
                      } else {
                        setTypeFilter(item.key);
                      }
                      setIsFilterModalOpen(false);
                    }}
                    className={`flex-row items-center justify-between p-3 rounded-xl border mb-2 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300'
                        : 'bg-white border-slate-100 active:bg-slate-50'
                    }`}
                  >
                    <View className="flex-row items-center gap-3 flex-1 mr-2">
                      <View
                        className={`w-8 h-8 rounded-lg items-center justify-center ${
                          isSelected ? 'bg-blue-600' : 'bg-slate-100'
                        }`}
                      >
                        <item.Icon
                          size={15}
                          color={isSelected ? '#ffffff' : '#64748b'}
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-xs font-semibold ${
                            isSelected ? 'text-blue-900' : 'text-slate-800'
                          }`}
                        >
                          {item.label}
                        </Text>
                        <Text className="text-[10px] text-slate-500">
                          {item.desc}
                        </Text>
                      </View>
                    </View>

                    {/* Checkbox indicator */}
                    <View
                      className={`w-5 h-5 rounded-lg border-2 items-center justify-center ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={12} color="#ffffff" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Reset Button (hanya jika sedang aktif filter spesifik) */}
            {typeFilter !== 'ALL' && (
              <TouchableOpacity
                onPress={() => {
                  setTypeFilter('ALL');
                  setIsFilterModalOpen(false);
                }}
                className="mt-1 py-2.5 rounded-xl bg-slate-100 items-center justify-center active:bg-slate-200"
              >
                <Text className="text-xs font-semibold text-slate-700">
                  Reset ke Semua Pesanan
                </Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default OrdersScreen;
