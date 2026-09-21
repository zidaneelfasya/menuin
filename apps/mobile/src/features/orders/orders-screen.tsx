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
  OrderDto,
  OrderItemDto,
} from './api/use-orders';
import { formatCurrency, formatDate } from '@menuin/utils';
import { useQueryClient } from '@tanstack/react-query';

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
    actionLabel: 'Konfirmasi',
    dotColor: '#f59e0b', // amber-500
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
  isUpdating: boolean;
}

const OrderCardItem = React.memo(function OrderCardItem({
  order,
  onSelect,
  onStartPrepare,
  onUpdateStatus,
  onToggleItem,
  isUpdating,
}: OrderCardItemProps) {
  const isTakeaway = order.orderType === 'TAKE_AWAY' || order.orderType === 'TAKEAWAY';
  const isOnline = order.orderType === 'ONLINE' || order.orderType === 'DELIVERY';
  const isPaid = order.paymentStatus === 'PAID';
  const itemsList = Array.isArray(order.items) ? order.items : [];
  const completedItemsCount = itemsList.filter((i) => i.isCompleted).length;
  const totalItemsCount = itemsList.length;
  const config = STATUS_CONFIGS[order.status as StatusKey] || STATUS_CONFIGS.NEW;

  return (
    <View className="bg-white rounded-2xl p-3.5 mb-3 border border-slate-200/90 shadow-2xs">
      {/* Clickable Card Header: Order Number, Payment Status, Elapsed Time & Service Info */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelect(order)}
      >
        <View className="flex-row items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <View className="flex-row items-center gap-1.5">
            <Text className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
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
                className={`text-[10px] font-bold ${
                  isPaid ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {isPaid ? 'Lunas' : 'Belum Bayar'}
              </Text>
            </View>
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
            <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
              {order.tableNumber
                ? `Meja ${order.tableNumber}`
                : isTakeaway
                ? 'Bawa Pulang (Takeaway)'
                : isOnline
                ? 'Pesanan Online'
                : 'Dine In'}
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
          <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
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
              <View
                className={`w-4 h-4 mt-0.5 rounded items-center justify-center ${
                  item.isCompleted
                    ? 'bg-emerald-600 border border-emerald-600'
                    : 'border border-slate-300 bg-white'
                }`}
              >
                {item.isCompleted && <Check size={10} color="#ffffff" strokeWidth={3} />}
              </View>
              <View className="flex-1">
                <Text
                  className={`text-xs ${
                    item.isCompleted
                      ? 'line-through text-slate-400 font-medium'
                      : 'text-slate-800 font-semibold'
                  }`}
                  numberOfLines={1}
                >
                  <Text className="font-mono font-bold text-slate-900">{item.quantity}x</Text>{' '}
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

      {/* Card Footer: Total Price & Stage Action Button */}
      <View className="flex-row items-center justify-between pt-1 border-t border-slate-100">
        <TouchableOpacity activeOpacity={0.7} onPress={() => onSelect(order)}>
          <Text className="text-[10px] text-slate-400 font-medium">Total Pesanan</Text>
          <Text className="text-xs font-black text-slate-900 font-mono">
            {formatCurrency(Number(order.grandTotal))}
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-1.5">
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
            <Text style={{ color: config.btnText }} className="text-xs font-bold">
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
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600 || width >= 768;
  const isPhoneLandscape = !isTablet && isLandscape;

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'ONLINE'>('ALL');
  const [activeStage, setActiveStage] = useState<StatusKey>('NEW');

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [orderToPrepare, setOrderToPrepare] = useState<OrderDto | null>(null);
  const [isPrepareModalOpen, setIsPrepareModalOpen] = useState(false);
  const [bulkTargetStage, setBulkTargetStage] = useState<StatusKey>('NEW');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

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

  // Filter orders by order type and search query
  const filteredOrders = useMemo(() => {
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
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        order.orderNumber?.toLowerCase().includes(q) ||
        order.customerName?.toLowerCase().includes(q) ||
        (order.tableNumber && `meja ${order.tableNumber}`.toLowerCase().includes(q))
      );
    });
  }, [allOrders, typeFilter, searchQuery]);

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

    // Optimistic cache update for query key
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
        {/* Column Header (Always visible in tablet column, or phone active column) */}
        <View className="bg-white px-3.5 py-2.5 border-b border-slate-200 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View style={{ backgroundColor: config.dotColor }} className="w-2.5 h-2.5 rounded-full" />
            <Text className="text-xs font-bold text-slate-900 tracking-tight">{config.title}</Text>
            <View className="px-1.5 py-0.2 rounded-full bg-slate-100">
              <Text className="text-[10px] font-bold text-slate-600">{stageOrders.length}</Text>
            </View>
          </View>

          {/* Tombol Selesai Semua (Icon Centang Saja) */}
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
                isUpdating={updateStatusMutation.isPending}
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
        <Text className="mt-3 text-slate-500 font-medium text-xs">Memuat pesanan dapur...</Text>
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
          <Text className="text-white font-bold text-xs">Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-100/70">
      {/* 1. TOP CONTROL BAR: SEARCH & TYPE FILTERS & REFRESH */}
      <View className="bg-white border-b border-slate-200 px-3.5 pt-3 pb-3">
        {/* Search Input Box */}
        <View className="flex-row items-center bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200">
          <Search size={15} color="#64748b" />
          <TextInput
            placeholder="Cari meja, no order, nama..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-xs text-slate-800 ml-2 py-0.5 font-medium"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
              <X size={14} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills & Manual Refresh Button */}
        <View className="flex-row items-center justify-between mt-2.5">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 mr-2">
            <View className="flex-row items-center gap-1.5">
              <TouchableOpacity
                onPress={() => setTypeFilter('ALL')}
                activeOpacity={0.8}
                className={`px-3 py-1.5 rounded-lg border ${
                  typeFilter === 'ALL'
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    typeFilter === 'ALL' ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  Semua
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTypeFilter('DINE_IN')}
                activeOpacity={0.8}
                className={`px-3 py-1.5 rounded-lg border ${
                  typeFilter === 'DINE_IN'
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    typeFilter === 'DINE_IN' ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  Dine In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTypeFilter('TAKEAWAY')}
                activeOpacity={0.8}
                className={`px-3 py-1.5 rounded-lg border ${
                  typeFilter === 'TAKEAWAY'
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    typeFilter === 'TAKEAWAY' ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  Bawa Pulang
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTypeFilter('ONLINE')}
                activeOpacity={0.8}
                className={`px-3 py-1.5 rounded-lg border ${
                  typeFilter === 'ONLINE'
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    typeFilter === 'ONLINE' ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  Online
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Refresh Button to the right of filter options */}
          <View className="flex-row items-center pl-1 border-l border-slate-200">
            <TouchableOpacity
              onPress={handleManualRefresh}
              disabled={isRefreshing || isRefetching}
              className="flex-row items-center gap-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs active:opacity-75"
            >
              <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
                <RefreshCw size={13} color="#2563eb" />
              </Animated.View>
              <Text className="text-[11px] font-bold text-slate-700">Refresh</Text>
            </TouchableOpacity>
          </View>
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
                    <View
                      style={{ backgroundColor: config.dotColor }}
                      className="w-2 h-2 rounded-full"
                    />
                    <Text
                      className={`text-xs font-bold ${
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
                        className={`text-[10px] font-bold ${
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

          {/* Pending Orders Notification Banner (Smartphone only, when not on PENDING tab) */}
          {activeStage !== 'PENDING' && stageCounts.PENDING > 0 && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveStage('PENDING')}
              className="bg-amber-50 mx-3 mt-2.5 px-3 py-2.5 rounded-xl border border-amber-300 flex-row items-center justify-between shadow-xs"
            >
              <View className="flex-row items-center gap-2 flex-1 mr-2">
                <View className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-amber-900 leading-tight">
                    Ada {stageCounts.PENDING} pesanan menunggu pembayaran / konfirmasi
                  </Text>
                  <Text className="text-[10px] text-amber-700">
                    Termasuk pesanan online dari storefront
                  </Text>
                </View>
              </View>
              <View className="bg-amber-600 px-2.5 py-1.5 rounded-lg flex-row items-center gap-1">
                <Text className="text-[11px] font-bold text-white">Lihat & Proses</Text>
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
                    <Text className="text-base font-black text-slate-900">Mulai Penyiapan</Text>
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
                    <Text className="text-[10px] font-bold text-slate-400 uppercase">Nomor Order</Text>
                    <Text className="font-mono text-sm font-black text-slate-900">
                      #{orderToPrepare?.orderNumber || orderToPrepare?.id?.slice(0, 5) || ''}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] font-bold text-slate-400 uppercase">Layanan</Text>
                    <Text className="text-xs font-bold text-slate-800">
                      {orderToPrepare?.tableNumber
                        ? `Meja ${orderToPrepare.tableNumber}`
                        : (orderToPrepare?.orderType || '').replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {/* Items Preview */}
                <View className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 max-h-36">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Daftar Menu ({orderToPrepare?.items?.length || 0})
                  </Text>
                  <ScrollView nestedScrollEnabled className="max-h-28">
                    {orderToPrepare?.items?.map((item, idx) => (
                      <View
                        key={item.id || idx}
                        className="flex-row justify-between items-center py-1 border-b border-dashed border-slate-200 last:border-0"
                      >
                        <Text className="text-xs text-slate-800 flex-1 mr-2" numberOfLines={1}>
                          <Text className="font-bold text-blue-600 font-mono">{item.quantity}x </Text>
                          {item.productName}
                        </Text>
                        <Text className="text-[11px] font-mono text-slate-600">
                          {formatCurrency(Number(item.subtotal))}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* Cetak Dokumen Fisik Quick Actions */}
                <View className="space-y-2 pt-1">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs font-bold text-slate-800">Cetak Dokumen Fisik</Text>
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
                      <Text className="text-xs font-bold text-slate-700">Tiket Dapur</Text>
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
                      <Text className="text-xs font-bold text-slate-700">Struk Pelanggan</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        'Cetak Dokumen',
                        `Mencetak tiket dapur & struk pelanggan untuk pesanan #${orderToPrepare?.orderNumber || ''}...`
                      )
                    }
                    className="w-full py-2 bg-slate-50 border border-slate-200 rounded-xl flex-row items-center justify-center gap-1.5 active:bg-blue-50"
                  >
                    <Printer size={14} color="#475569" />
                    <Text className="text-xs font-bold text-slate-700">
                      Cetak Keduanya (Struk & Tiket Dapur)
                    </Text>
                  </TouchableOpacity>
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
                  <Text className="text-xs font-bold text-slate-600">Batal</Text>
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
                  <Text className="text-xs font-bold text-white">Mulai Penyiapan</Text>
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
                  <Text className="text-sm font-bold text-slate-900">Lanjutkan Semua Pesanan?</Text>
                  <Text className="text-[11px] text-slate-500 font-medium">
                    {STATUS_CONFIGS[bulkTargetStage]?.title} → {STATUS_CONFIGS[bulkTargetStage]?.nextStatusTitle}
                  </Text>
                </View>
              </View>

              <View className="py-3.5 space-y-3">
                <Text className="text-xs text-slate-600 leading-relaxed">
                  Apakah Anda yakin untuk menyelesaikan semua pesanan pada status{' '}
                  <Text className="font-bold text-slate-900">
                    "{STATUS_CONFIGS[bulkTargetStage]?.title}"
                  </Text>{' '}
                  sebanyak{' '}
                  <Text className="font-bold text-emerald-600">
                    {filteredOrders.filter((o) => o.status === bulkTargetStage).length} pesanan
                  </Text>{' '}
                  dan lanjut ke status tahap selanjutnya (
                  <Text className="font-bold text-blue-600">
                    "{STATUS_CONFIGS[bulkTargetStage]?.nextStatusTitle}"
                  </Text>
                  )?
                </Text>

                {/* List of Affected Orders */}
                <View className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 max-h-40">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                            <Text className="font-mono text-[10px] font-bold text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded">
                              {o.orderNumber || `#${o.id.slice(0, 5)}`}
                            </Text>
                            <Text className="text-[11px] text-slate-700 font-medium max-w-[120px]" numberOfLines={1}>
                              {o.customerName || (o.tableNumber ? `Meja ${o.tableNumber}` : 'Pesanan')}
                            </Text>
                          </View>
                          <Text className="text-[10px] font-bold text-slate-600">
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
                  <Text className="text-xs font-bold text-slate-600">Batal</Text>
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
                      <Text className="text-xs font-bold text-white">
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
              className="bg-white rounded-t-3xl max-h-[88%] p-5 border-t border-slate-100"
              onPress={(e) => e.stopPropagation()}
            >
              {/* Sheet Handle */}
              <View className="items-center -mt-2 pb-3">
                <View className="w-10 h-1 rounded-full bg-slate-300" />
              </View>

              <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
                <View>
                  <Text className="text-base font-black text-slate-900">
                    Pesanan #{selectedOrder?.orderNumber || selectedOrder?.id?.slice(0, 5) || ''}
                  </Text>
                  <Text className="text-xs text-slate-500 font-medium">
                    {selectedOrder?.createdAt ? formatDate(selectedOrder.createdAt) : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                >
                  <X size={16} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView className="py-3" showsVerticalScrollIndicator={false}>
                {/* Order Meta Card */}
                <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-4 flex-row justify-between">
                  <View>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase">Tipe Pesanan</Text>
                    <Text className="text-xs font-bold text-slate-800 mt-0.5">
                      {selectedOrder?.tableNumber
                        ? `Meja ${selectedOrder.tableNumber}`
                        : (selectedOrder?.orderType || '').replace('_', ' ')}
                    </Text>
                  </View>
                  {selectedOrder?.customerName && (
                    <View className="items-end">
                      <Text className="text-[10px] font-bold text-slate-400 uppercase">Pelanggan</Text>
                      <Text className="text-xs font-bold text-slate-800 mt-0.5">
                        {selectedOrder.customerName}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Items List */}
                <View className="mb-4">
                  <Text className="text-xs font-bold text-slate-900 mb-2">Daftar Item Menu</Text>
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
                        <View
                          className={`w-5 h-5 rounded mr-3 items-center justify-center ${
                            item.isCompleted ? 'bg-emerald-600' : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {item.isCompleted && <Check size={12} color="#fff" strokeWidth={3} />}
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-xs ${
                              item.isCompleted
                                ? 'line-through text-slate-400 font-medium'
                                : 'font-bold text-slate-800'
                            }`}
                          >
                            <Text className="font-mono font-black text-slate-900">
                              {item.quantity}x
                            </Text>{' '}
                            {item.productName}
                          </Text>
                          {Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                            <Text className="text-[10px] text-slate-500 font-medium mt-0.5">
                              + {item.modifiers.map((m: any) => m.name || m.optionName).filter(Boolean).join(', ')}
                            </Text>
                          )}
                          {item.notes && (
                            <Text className="text-[10px] text-amber-600 font-medium italic mt-0.5">
                              Catatan: {item.notes}
                            </Text>
                          )}
                        </View>
                        <Text className="text-xs font-mono font-bold text-slate-700">
                          {formatCurrency(Number(item.subtotal))}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Total Summary */}
                <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-4 flex-row justify-between items-center">
                  <Text className="text-xs font-bold text-slate-600">Total Pembayaran</Text>
                  <Text className="text-sm font-black text-slate-900 font-mono">
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
                      <Text className="text-xs font-bold text-white">
                        {selectedOrder.status === 'NEW'
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
                        className="w-full py-2.5 rounded-xl border border-red-200 items-center justify-center active:bg-red-50"
                      >
                        <Text className="text-xs font-bold text-red-600">Batalkan Pesanan</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

export default OrdersScreen;
