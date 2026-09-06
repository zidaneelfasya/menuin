import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useOrdersData, useUpdateOrderStatus, OrderDto } from './api/use-orders';
import { formatCurrency, formatDate } from '@menuin/utils';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function OrdersScreen() {
  const { data: queryResult, isLoading, error, refetch, isRefetching } = useOrdersData();
  const updateStatusMutation = useUpdateOrderStatus();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'NEW' | 'PROCESSING' | 'READY'>('NEW');

  // Supabase Realtime setup
  useEffect(() => {
    const channel = supabase
      .channel('mobile-orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          // Any change to transactions triggers a refetch of orders
          queryClient.invalidateQueries({ queryKey: ['active-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-slate-500 font-medium">Memuat pesanan...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-red-500 font-medium">Gagal memuat pesanan.</Text>
        <TouchableOpacity onPress={() => refetch()} className="mt-4 px-4 py-2 bg-slate-200 rounded-lg">
          <Text className="text-slate-700">Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allOrders = queryResult?.data || [];
  
  const getOrdersByTab = (tab: string) => {
    if (tab === 'NEW') return allOrders.filter(o => o.status === 'PENDING' || o.status === 'NEW');
    if (tab === 'PROCESSING') return allOrders.filter(o => o.status === 'PROCESSING');
    if (tab === 'READY') return allOrders.filter(o => o.status === 'READY');
    return [];
  };

  const displayedOrders = getOrdersByTab(activeTab);

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate(
      { orderId, status: newStatus },
      {
        onError: () => {
          Alert.alert('Gagal', 'Tidak dapat mengupdate status pesanan.');
        }
      }
    );
  };

  const renderStatusButton = (order: OrderDto) => {
    if (order.status === 'PENDING' || order.status === 'NEW') {
      return (
        <TouchableOpacity 
          className="bg-blue-600 px-4 py-3 rounded-lg items-center mt-3"
          onPress={() => handleUpdateStatus(order.id, 'PROCESSING')}
          disabled={updateStatusMutation.isPending}
        >
          <Text className="text-white font-bold">Proses Pesanan</Text>
        </TouchableOpacity>
      );
    }
    if (order.status === 'PROCESSING') {
      return (
        <TouchableOpacity 
          className="bg-orange-500 px-4 py-3 rounded-lg items-center mt-3"
          onPress={() => handleUpdateStatus(order.id, 'READY')}
          disabled={updateStatusMutation.isPending}
        >
          <Text className="text-white font-bold">Pesanan Siap</Text>
        </TouchableOpacity>
      );
    }
    if (order.status === 'READY') {
      return (
        <TouchableOpacity 
          className="bg-green-600 px-4 py-3 rounded-lg items-center mt-3"
          onPress={() => handleUpdateStatus(order.id, 'COMPLETED')}
          disabled={updateStatusMutation.isPending}
        >
          <Text className="text-white font-bold">Selesaikan Pesanan</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Tabs */}
      <View className="flex-row bg-white border-b border-slate-200">
        {(['NEW', 'PROCESSING', 'READY'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const count = getOrdersByTab(tab).length;
          const label = tab === 'NEW' ? 'Pesanan Baru' : tab === 'PROCESSING' ? 'Diproses' : 'Siap';
          
          return (
            <TouchableOpacity 
              key={tab}
              className={`flex-1 py-4 items-center border-b-2 ${isActive ? 'border-blue-600' : 'border-transparent'}`}
              onPress={() => setActiveTab(tab)}
            >
              <Text className={`font-semibold ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                {label} {count > 0 && `(${count})`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView 
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {displayedOrders.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <Text className="text-slate-400 text-lg">Tidak ada pesanan</Text>
          </View>
        ) : (
          displayedOrders.map((order) => (
            <View key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4">
              <View className="flex-row justify-between items-start mb-3 border-b border-slate-100 pb-3">
                <View>
                  <Text className="text-lg font-bold text-slate-800">{order.orderNumber || order.id.slice(0, 8)}</Text>
                  <Text className="text-slate-500 text-sm mt-1">
                    {order.orderType === 'DINE_IN' ? `Makan di Tempat - Meja ${order.tableNumber || '-'}` : 'Bawa Pulang'}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="font-semibold text-blue-600">{formatCurrency(Number(order.grandTotal))}</Text>
                  <Text className="text-xs text-slate-400 mt-1">{formatDate(new Date(order.createdAt))}</Text>
                </View>
              </View>

              <View className="space-y-2 mb-3">
                {order.items?.map((item) => (
                  <View key={item.id} className="flex-row justify-between">
                    <Text className="text-slate-700 flex-1">
                      {item.quantity}x {item.productName}
                    </Text>
                  </View>
                ))}
              </View>

              {renderStatusButton(order)}
              
              {order.status === 'NEW' || order.status === 'PENDING' ? (
                 <TouchableOpacity 
                  className="px-4 py-3 rounded-lg items-center mt-2 border border-red-200"
                  onPress={() => {
                    Alert.alert('Batalkan Pesanan?', 'Tindakan ini tidak dapat dikembalikan.', [
                      { text: 'Tidak', style: 'cancel' },
                      { text: 'Ya, Batalkan', style: 'destructive', onPress: () => handleUpdateStatus(order.id, 'CANCELED') }
                    ]);
                  }}
                  disabled={updateStatusMutation.isPending}
                 >
                   <Text className="text-red-500 font-semibold">Tolak Pesanan</Text>
                 </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
