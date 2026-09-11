import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, useWindowDimensions, Modal, Alert } from 'react-native';
import { useOrders, Order } from '@/hooks/use-orders';
import { X, Check, CheckCircle2, ChevronRight, RefreshCcw, Clock, Utensils, AlertCircle } from 'lucide-react-native';
import { Badge, Button, EmptyState, BadgeVariant } from '@/components/ui';

const KANBAN_COLUMNS: { id: string; title: string; badgeVariant: BadgeVariant }[] = [
  { id: 'PENDING', title: 'Belum Bayar', badgeVariant: 'purple' },
  { id: 'NEW', title: 'Pesanan Baru', badgeVariant: 'primary' },
  { id: 'PROCESSING', title: 'Diproses', badgeVariant: 'warning' },
  { id: 'READY', title: 'Siap Saji', badgeVariant: 'success' },
  { id: 'COMPLETED', title: 'Selesai', badgeVariant: 'default' },
];

export default function OrdersScreen() {
  const { data: ordersData, isLoading, error, refetch, isRefetching, updateStatus, updateItemStatus, isUpdatingStatus } = useOrders();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isPhoneLandscape = !isTablet && isLandscape;
  
  const [activeTab, setActiveTab] = useState('NEW');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(price));
  };

  const handleStatusChange = (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'PENDING') nextStatus = 'NEW';
    else if (currentStatus === 'NEW') nextStatus = 'PROCESSING';
    else if (currentStatus === 'PROCESSING') nextStatus = 'READY';
    else if (currentStatus === 'READY') nextStatus = 'COMPLETED';

    if (nextStatus) {
      updateStatus({ orderId, status: nextStatus }, {
        onSuccess: () => {
          if (selectedOrder?.id === orderId) {
            setSelectedOrder(null);
          }
        }
      });
    }
  };

  const handleCancelOrder = (orderId: string) => {
    Alert.alert('Batal Pesanan', 'Apakah Anda yakin ingin membatalkan pesanan ini?', [
      { text: 'Tidak', style: 'cancel' },
      { 
        text: 'Ya, Batalkan', 
        style: 'destructive', 
        onPress: () => {
          updateStatus({ orderId, status: 'CANCELLED' }, {
            onSuccess: () => setSelectedOrder(null)
          });
        }
      }
    ]);
  };

  const handleToggleItem = (itemId: string, currentCompleted: boolean) => {
    updateItemStatus({ itemId, isCompleted: !currentCompleted });
    
    if (selectedOrder) {
      setSelectedOrder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(i => i.id === itemId ? { ...i, isCompleted: !currentCompleted } : i)
        };
      });
    }
  };

  const getNextActionText = (status: string) => {
    switch(status) {
      case 'PENDING': return 'Konfirmasi';
      case 'NEW': return 'Mulai Proses';
      case 'PROCESSING': return 'Siap Saji';
      case 'READY': return 'Selesaikan';
      default: return '';
    }
  };

  const renderOrderCard = (order: Order) => (
    <TouchableOpacity 
      key={order.id} 
      activeOpacity={0.8}
      className="bg-white p-3.5 rounded-2xl mb-2.5 border border-gray-200/90 shadow-2xs active:border-blue-300"
      onPress={() => setSelectedOrder(order)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View>
          <View className="flex-row items-center mb-0.5">
            <Text className="font-black text-gray-900 text-sm mr-2">{order.orderNumber}</Text>
            {order.paymentStatus === 'PAID' ? (
              <Badge label="LUNAS" variant="success" size="sm" />
            ) : (
              <Badge label="BELUM LUNAS" variant="warning" size="sm" />
            )}
          </View>
          <Text className="font-bold text-gray-700 text-xs mt-0.5">
            {order.tableNumber ? `Meja ${order.tableNumber}` : order.orderType.replace('_', ' ')}
          </Text>
          {order.customerName && (
            <Text className="text-gray-400 text-[11px] font-medium mt-0.5">An. {order.customerName}</Text>
          )}
        </View>
        <View className="flex-row items-center bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
          <Clock size={11} color="#6b7280" />
          <Text className="text-gray-500 text-[10px] font-bold ml-1">
            {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
      
      {/* Items preview */}
      <View className="my-2 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
        {order.items.slice(0, 3).map((item, idx) => (
          <Text key={idx} className={`text-xs ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'} mb-1`} numberOfLines={1}>
            <Text className="font-bold text-gray-900">{item.quantity}x</Text> {item.productName}
          </Text>
        ))}
        {order.items.length > 3 && (
          <Text className="text-gray-400 text-[10px] font-medium italic mt-0.5">
            +{order.items.length - 3} item lainnya
          </Text>
        )}
      </View>

      <View className="flex-row justify-between items-center border-t border-gray-50 pt-2">
        <Text className="text-gray-900 font-black text-xs">{formatPrice(order.grandTotal)}</Text>
        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
          <Button
            size="sm"
            variant={order.status === 'NEW' ? 'primary' : order.status === 'PROCESSING' ? 'secondary' : 'primary'}
            title={getNextActionText(order.status)}
            icon={<ChevronRight size={12} color={order.status === 'NEW' ? '#fff' : '#111827'} />}
            iconPosition="right"
            disabled={isUpdatingStatus}
            onPress={() => handleStatusChange(order.id, order.status)}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderColumn = (col: typeof KANBAN_COLUMNS[0]) => {
    const orders = ordersData?.data.filter(o => o.status === col.id) || [];
    
    return (
      <View key={col.id} className={`${isTablet ? 'w-80 mr-3' : 'flex-1'} h-full bg-gray-50/50 rounded-2xl p-3 border border-gray-200/80`}>
        <View className="flex-row items-center justify-between mb-3 pb-2.5 border-b border-gray-200">
          <Text className="font-black text-xs uppercase tracking-wider text-gray-800">{col.title}</Text>
          <Badge label={String(orders.length)} variant={col.badgeVariant} size="sm" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: (isPhoneLandscape ? 56 : 76) + Math.max(insets.bottom, 8),
          }}
        >
          {orders.length === 0 ? (
            <EmptyState
              title="Tidak Ada Pesanan"
              description={`Belum ada pesanan pada status ${col.title.toLowerCase()}.`}
              className="py-12"
            />
          ) : (
            orders.map(order => renderOrderCard(order))
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
      {/* Sub Header Toolbar */}
      <View className="flex-row justify-between items-center px-4 py-2.5 border-b border-gray-100 bg-white">
        <View>
          <Text className="text-sm font-black text-gray-900 tracking-tight">Antrean Dapur & Pesanan</Text>
          <Text className="text-gray-500 text-[11px]">Pantau progres pesanan secara realtime</Text>
        </View>
        <TouchableOpacity 
          onPress={() => refetch()}
          activeOpacity={0.7}
          className="w-8 h-8 bg-gray-50 rounded-lg border border-gray-200 items-center justify-center active:bg-gray-100"
          disabled={isRefetching}
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <RefreshCcw size={15} color="#374151" />
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs (Phone Only) */}
      {!isTablet && (
        <View className="border-b border-gray-100 bg-white py-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'center' }}>
            {KANBAN_COLUMNS.map(col => {
              const isActive = activeTab === col.id;
              const orderCount = ordersData?.data.filter(o => o.status === col.id).length || 0;
              return (
                <TouchableOpacity 
                  key={col.id}
                  activeOpacity={0.7}
                  className={`flex-row items-center px-3.5 py-1.5 rounded-full mr-1.5 border ${
                    isActive ? 'bg-blue-600 border-blue-600 shadow-xs' : 'bg-gray-50 border-gray-200'
                  }`}
                  onPress={() => setActiveTab(col.id)}
                >
                  <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>{col.title}</Text>
                  {orderCount > 0 && (
                    <View className={`ml-1.5 px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-200'}`}>
                      <Text className={`text-[9px] font-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>{orderCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Kanban Board Area */}
      <View className="flex-1 p-3 bg-gray-50/40">
        {isTablet ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingRight: 16 }}>
            {KANBAN_COLUMNS.map(col => renderColumn(col))}
          </ScrollView>
        ) : (
          renderColumn(KANBAN_COLUMNS.find(c => c.id === activeTab)!)
        )}
      </View>

      {/* Order Detail Modal (Responsive: Centered Dialog on Tablet, Bottom Sheet on Phone) */}
      <Modal
        visible={!!selectedOrder}
        transparent
        animationType={isTablet ? 'fade' : 'slide'}
        supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
      >
        <View className={`flex-1 ${isTablet ? 'justify-center items-center p-4 bg-black/50' : 'justify-end bg-black/40'}`}>
          <View className={`bg-white ${isTablet ? 'w-full max-w-lg rounded-3xl shadow-xl' : `rounded-t-3xl ${isPhoneLandscape ? 'max-h-[96%]' : 'max-h-[88%]'}`}`}>
            {/* Sheet Handle (Phone only) */}
            {!isTablet && (
              <View className="items-center pt-3 pb-1">
                <View className="w-10 h-1 rounded-full bg-gray-300" />
              </View>
            )}

            <View className="flex-row items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <View>
                <Text className="text-base font-black text-gray-900">Pesanan #{selectedOrder?.orderNumber}</Text>
                <Text className="text-xs text-gray-500 font-medium">Detail informasi pesanan & checklist</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedOrder(null)} className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
                <X size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Order Context Card */}
              <View className="flex-row justify-between bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/80 mb-5">
                <View>
                  <Text className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Tipe Pesanan</Text>
                  <Text className="font-bold text-gray-900 text-sm">
                    {selectedOrder?.tableNumber ? `Meja ${selectedOrder.tableNumber}` : selectedOrder?.orderType.replace('_', ' ')}
                  </Text>
                </View>
                {selectedOrder?.customerName && (
                  <View className="items-end">
                    <Text className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Atas Nama</Text>
                    <Text className="font-bold text-gray-900 text-sm">{selectedOrder.customerName}</Text>
                  </View>
                )}
              </View>

              {/* Menu Items Checklist */}
              <View className="mb-5">
                <View className="flex-row justify-between items-end border-b border-gray-100 pb-2 mb-3">
                  <Text className="font-bold text-sm text-gray-900">Daftar Menu</Text>
                  <Text className="text-xs text-gray-500 font-medium">
                    {selectedOrder?.items.filter(i => i.isCompleted).length} / {selectedOrder?.items.length} siap
                  </Text>
                </View>

                <View className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                  {selectedOrder?.items.map(item => (
                    <TouchableOpacity 
                      key={item.id} 
                      activeOpacity={0.7}
                      className={`flex-row items-center py-3 px-3.5 ${item.isCompleted ? 'bg-emerald-50/30' : 'bg-white'}`}
                      onPress={() => handleToggleItem(item.id, item.isCompleted)}
                    >
                      <View className={`w-5 h-5 rounded-md mr-3 items-center justify-center ${item.isCompleted ? 'bg-emerald-600' : 'border border-gray-300 bg-white'}`}>
                        {item.isCompleted && <Check size={12} color="#fff" />}
                      </View>
                      <View className="flex-1">
                        <Text className={`text-xs ${item.isCompleted ? 'text-gray-400 line-through' : 'font-bold text-gray-800'}`}>
                          <Text className="font-black text-gray-900">{item.quantity}x</Text> {item.productName}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="pt-2">
                {selectedOrder && selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                  <Button
                    variant="primary"
                    size="lg"
                    title={
                      selectedOrder.status === 'PENDING' ? 'Konfirmasi Pembayaran' :
                      selectedOrder.status === 'NEW' ? 'Mulai Proses Pesanan' :
                      selectedOrder.status === 'PROCESSING' ? 'Tandai Siap Saji' : 'Selesaikan Pesanan'
                    }
                    icon={<CheckCircle2 size={18} color="#fff" />}
                    isLoading={isUpdatingStatus}
                    className="w-full mb-2.5 shadow-sm"
                    onPress={() => handleStatusChange(selectedOrder.id, selectedOrder.status)}
                  />
                )}
                
                {selectedOrder && selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                  <Button
                    variant="ghost"
                    size="md"
                    title="Batalkan Pesanan"
                    className="w-full text-red-600"
                    disabled={isUpdatingStatus}
                    onPress={() => handleCancelOrder(selectedOrder.id)}
                  />
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
