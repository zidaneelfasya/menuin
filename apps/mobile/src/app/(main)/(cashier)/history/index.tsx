import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  Receipt,
  Calendar,
  Clock,
  User,
  ShoppingBag,
  Printer,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Banknote,
  RotateCcw,
} from 'lucide-react-native';
import { useOrders, Order } from '@/hooks/use-orders';
import { Badge, EmptyState } from '@/components/ui';

export default function TransactionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { data: ordersData, isLoading, refetch, isRefetching } = useOrders();
  const orders: Order[] = ordersData?.data || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PAID' && order.paymentStatus === 'PAID') ||
        (statusFilter === 'UNPAID' && order.paymentStatus !== 'PAID');
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Selected order (defaults to first in list on tablet)
  const activeOrder = useMemo(() => {
    if (selectedOrderId) {
      const found = orders.find((o) => o.id === selectedOrderId);
      if (found) return found;
    }
    return filteredOrders[0] || null;
  }, [selectedOrderId, orders, filteredOrders]);

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(price || 0));
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    if (!isTablet) {
      setIsMobileDetailOpen(true);
    }
  };

  const renderDetailContent = (order: Order) => {
    return (
      <View className="flex-1 bg-white p-5">
        {/* Order Header */}
        <View className="flex-row items-start justify-between pb-4 border-b border-gray-100">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center space-x-2 mb-1">
              <Text className="text-lg font-black text-gray-900 tracking-tight">
                #{order.orderNumber}
              </Text>
              <Badge
                label={order.paymentStatus}
                variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
                size="sm"
              />
            </View>
            <View className="flex-row items-center text-xs text-gray-500">
              <Clock size={12} color="#9ca3af" className="mr-1" />
              <Text className="text-xs text-gray-500 font-medium">
                {formatDate(order.createdAt)}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-xs text-gray-400 font-bold uppercase">Tipe</Text>
            <Text className="text-xs font-black text-gray-800">
              {order.orderType || 'DINE_IN'}
            </Text>
          </View>
        </View>

        {/* Customer & Table */}
        <View className="py-3 flex-row items-center justify-between border-b border-gray-100 bg-gray-50/50 px-3 rounded-xl my-3">
          <View className="flex-row items-center">
            <User size={14} color="#6b7280" className="mr-2" />
            <Text className="text-xs font-semibold text-gray-700">
              {order.customerName ? `Pelanggan: ${order.customerName}` : 'Pelanggan Umum'}
            </Text>
          </View>
          {order.tableNumber && (
            <Text className="text-xs font-black text-blue-600">
              Meja #{order.tableNumber}
            </Text>
          )}
        </View>

        {/* Ordered Items List */}
        <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
          Daftar Pesanan ({order.items?.length || 0})
        </Text>
        <ScrollView className="flex-1 mb-4" showsVerticalScrollIndicator={false}>
          <View className="space-y-2">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <View
                  key={item.id || index}
                  className="flex-row items-center justify-between py-2 border-b border-gray-100/60"
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-xs font-bold text-gray-900 leading-tight">
                      {item.productName}
                    </Text>
                    <Text className="text-[11px] text-gray-400">
                      {item.quantity} x {formatPrice(Number(item.subtotal) / item.quantity)}
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-gray-900">
                    {formatPrice(item.subtotal)}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-xs text-gray-400 italic py-2">
                Tidak ada rincian item pesanan
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Total & Summary */}
        <View className="pt-3 border-t border-gray-200/90 space-y-1.5 mb-4">
          <View className="flex-row justify-between">
            <Text className="text-xs text-gray-500">Subtotal</Text>
            <Text className="text-xs font-semibold text-gray-800">
              {formatPrice(order.totalAmount || order.grandTotal)}
            </Text>
          </View>
          <View className="flex-row justify-between pt-1 border-t border-dashed border-gray-200">
            <Text className="text-sm font-black text-gray-900">Total Akhir</Text>
            <Text className="text-base font-black text-blue-600">
              {formatPrice(order.grandTotal || order.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row space-x-2">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert('Cetak Ulang', `Mencetak ulang struk #${order.orderNumber}...`)
            }
            className="flex-1 bg-blue-600 py-3 rounded-xl flex-row items-center justify-center active:bg-blue-700 shadow-2xs"
          >
            <Printer size={16} color="#ffffff" className="mr-2" />
            <Text className="text-white font-bold text-xs">Cetak Ulang Struk</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right']}>
      {/* Top Section */}
      <View className="px-5 py-3 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-black text-gray-900 tracking-tight">
            Riwayat Transaksi
          </Text>
          <Text className="text-xs text-gray-500 font-medium">
            Semua struk dan histori penjualan outlet
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => refetch()}
          activeOpacity={0.7}
          className="p-2 bg-gray-100 rounded-lg active:bg-gray-200"
        >
          <RotateCcw size={15} color="#4b5563" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View className="flex-1 flex-row">
        {/* SISI KIRI: DAFTAR TRANSAKSI */}
        <View
          style={{
            flex: isTablet ? 0.45 : 1,
            borderRightWidth: isTablet ? 1 : 0,
            borderRightColor: '#e5e7eb',
          }}
          className="bg-gray-50 p-3"
        >
          {/* Search & Filter */}
          <View className="mb-3">
            <View className="flex-row items-center bg-white border border-gray-200/90 rounded-xl px-3 py-2 shadow-2xs mb-2">
              <Search size={15} color="#9ca3af" className="mr-2" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Cari nomor struk / nama..."
                placeholderTextColor="#9ca3af"
                className="flex-1 text-xs text-gray-900 p-0"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={14} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Filter Pills */}
            <View className="flex-row space-x-1.5">
              {(['ALL', 'PAID', 'UNPAID'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  activeOpacity={0.7}
                  className={`px-3 py-1 rounded-lg border ${
                    statusFilter === status
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-200/80'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      statusFilter === status ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {status === 'ALL' ? 'Semua' : status === 'PAID' ? 'Lunas' : 'Belum Lunas'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* List of Orders */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="small" color="#014FFD" />
              <Text className="text-xs text-gray-400 mt-2 font-medium">Memuat transaksi...</Text>
            </View>
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              title="Tidak Ada Transaksi"
              description="Belum ada data transaksi yang sesuai filter pencarian."
              icon={<Receipt size={32} color="#9ca3af" />}
            />
          ) : (
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: (isTablet ? 24 : 76) + Math.max(insets.bottom, 8),
              }}
            >
              <View className="space-y-2">
                {filteredOrders.map((order) => {
                  const isSelected = isTablet && activeOrder?.id === order.id;

                  return (
                    <TouchableOpacity
                      key={order.id}
                      activeOpacity={0.7}
                      onPress={() => handleSelectOrder(order)}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-500 shadow-xs'
                          : 'bg-white border-gray-200/80 active:bg-gray-50'
                      }`}
                    >
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-xs font-black text-gray-900">
                          #{order.orderNumber}
                        </Text>
                        <Badge
                          label={order.paymentStatus}
                          variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
                          size="sm"
                        />
                      </View>
                      <View className="flex-row items-center justify-between mt-1">
                        <Text className="text-[11px] text-gray-500" numberOfLines={1}>
                          {order.customerName || 'Pelanggan Umum'} • {order.items?.length || 0} item
                        </Text>
                        <Text className="text-xs font-black text-gray-900">
                          {formatPrice(order.grandTotal || order.totalAmount)}
                        </Text>
                      </View>
                      <Text className="text-[10px] text-gray-400 mt-1 font-medium">
                        {formatDate(order.createdAt)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>

        {/* SISI KANAN: DETAIL TRANSAKSI (TABLET SPLIT VIEW) */}
        {isTablet && (
          <View style={{ flex: 0.55 }} className="bg-white">
            {activeOrder ? (
              renderDetailContent(activeOrder)
            ) : (
              <View className="flex-1 items-center justify-center p-8">
                <Receipt size={40} color="#cbd5e1" />
                <Text className="text-xs font-bold text-gray-400 mt-3">
                  Pilih transaksi di sebelah kiri untuk melihat rincian
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* MODAL DETAIL TRANSAKSI UNTUK MOBILE PORTRAIT */}
      {!isTablet && (
        <Modal
          visible={isMobileDetailOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsMobileDetailOpen(false)}
        >
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <Text className="text-base font-black text-gray-900">Detail Transaksi</Text>
              <TouchableOpacity
                onPress={() => setIsMobileDetailOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>
            {activeOrder && renderDetailContent(activeOrder)}
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}
