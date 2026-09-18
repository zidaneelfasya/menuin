import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useOrders, Order } from '@/hooks/use-orders';
import { ChefHat, Check, User, Hash, X, Clock } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutUp, SlideInRight, SlideOutRight } from 'react-native-reanimated';

export function GlobalIncomingOrderToast() {
  const { data: ordersData, updateStatus } = useOrders();
  const [dismissedOrderIds, setDismissedOrderIds] = useState<Set<string>>(new Set());
  const [isAccepting, setIsAccepting] = useState(false);
  
  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(price));
  };

  const newOrders = ordersData?.data.filter(o => o.status === 'NEW' && !dismissedOrderIds.has(o.id)) || [];
  const currentOrder = newOrders[0];

  useEffect(() => {
    if (!currentOrder) return;
    
    // Auto dismiss after 10 seconds to not block UI forever
    const timer = setTimeout(() => {
      setDismissedOrderIds(prev => new Set(prev).add(currentOrder.id));
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [currentOrder?.id]);

  if (!currentOrder) return null;

  const handleDismiss = () => {
    setDismissedOrderIds(prev => new Set(prev).add(currentOrder.id));
  };

  const handleAccept = () => {
    setIsAccepting(true);
    updateStatus({ orderId: currentOrder.id, status: 'PROCESSING' }, {
      onSuccess: () => {
        setIsAccepting(false);
        handleDismiss();
      },
      onError: () => {
        setIsAccepting(false);
      }
    });
  };

  return (
    <Animated.View 
      entering={SlideInRight.springify()} 
      exiting={SlideOutRight}
      style={styles.container}
    >
      <View className="bg-white/95 rounded-2xl overflow-hidden border border-gray-200 shadow-xl" style={{ elevation: 10 }}>
        {/* Top blue bar */}
        <View className="h-1.5 w-full bg-blue-600" />
        
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="bg-blue-100 p-1.5 rounded-lg mr-2">
                <ChefHat size={16} color="#2563eb" />
              </View>
              <View>
                <Text className="font-bold text-gray-900 text-sm">Pesanan Baru</Text>
                <Text className="text-[10px] font-bold text-blue-600 uppercase">
                  {currentOrder.orderType.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center">
              {newOrders.length > 1 && (
                <View className="bg-gray-100 px-2 py-0.5 rounded-full mr-2">
                  <Text className="text-[10px] font-bold text-gray-500">1 of {newOrders.length}</Text>
                </View>
              )}
              <TouchableOpacity onPress={handleDismiss} className="p-1">
                <X size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Customer Info */}
          <View className="flex-row items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 mb-3">
            <View className="flex-row items-center">
              {currentOrder.tableNumber ? <Hash size={16} color="#9ca3af" /> : <User size={16} color="#9ca3af" />}
              <View className="ml-2">
                <Text className="text-[10px] font-bold text-gray-500 uppercase">{currentOrder.tableNumber ? 'Meja' : 'Pelanggan'}</Text>
                <Text className="font-extrabold text-gray-900 text-sm">
                  {currentOrder.tableNumber || currentOrder.customerName || 'Tamu'}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-[10px] font-bold text-gray-500 uppercase">Total</Text>
              <Text className="font-black text-blue-600 text-sm">{formatPrice(currentOrder.grandTotal)}</Text>
            </View>
          </View>

          {/* Items */}
          <View className="max-h-24 mb-4">
            <ScrollView showsVerticalScrollIndicator={false}>
              {currentOrder.items.map((item, idx) => (
                <View key={idx} className="flex-row justify-between items-start mb-1">
                  <View className="flex-row flex-1 mr-2">
                    <View className="bg-gray-100 px-1 rounded mr-2 h-4 justify-center">
                      <Text className="font-bold text-gray-700 text-[10px]">{item.quantity}x</Text>
                    </View>
                    <Text className="font-semibold text-gray-700 text-xs flex-1" numberOfLines={1}>{item.productName}</Text>
                  </View>
                  <Text className="text-gray-500 font-medium text-xs">{formatPrice(item.subtotal)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Actions */}
          <View className="flex-row justify-between mt-1">
            <TouchableOpacity 
              onPress={handleDismiss}
              className="flex-1 py-2.5 bg-white border-2 border-gray-200 rounded-xl flex-row items-center justify-center mr-2"
            >
              <Clock size={14} color="#4b5563" />
              <Text className="text-xs font-bold text-gray-600 ml-1.5">Nanti Saja</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleAccept}
              disabled={isAccepting}
              className="flex-1 py-2.5 bg-blue-600 border-2 border-blue-600 rounded-xl flex-row items-center justify-center"
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={14} color="#ffffff" />
                  <Text className="text-xs font-bold text-white ml-1.5">Terima</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Account for safe area / header
    right: 16,
    width: 320,
    zIndex: 9999,
  }
});
