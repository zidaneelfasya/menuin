import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Trash2, ShieldCheck, ShoppingBag, Store } from 'lucide-react-native';
import { useCartStore } from '@/store/cart-store';
import { getApiUrl } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QuantityStepper, Button, EmptyState } from '@/components/ui';

export function CartSidebar() {
  const queryClient = useQueryClient();
  const { items, removeItem, updateQuantity, clearCart, getCartTotal } = useCartStore();
  const sessionToken = useAuthStore(state => state.sessionToken);

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const cartSubtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const itemBasePrice = Number(item.product?.price || 0);
      const itemModTotal = (item.modifiers || []).reduce(
        (sum, mod) => sum + (Number(mod.selectedOption?.price) || 0),
        0
      );
      return acc + (itemBasePrice + itemModTotal) * (item.quantity || 1);
    }, 0);
  }, [items]);

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(price));
  };

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const total = cartSubtotal;
      
      const payload = {
        totalAmount: total,
        discount: 0,
        tax: 0,
        serviceCharge: 0,
        platformFee: 0,
        grandTotal: total,
        paymentMethod: 'CASH', 
        orderType: 'DINE_IN',
        items: items.map(item => {
          const itemPrice = Number(item.product.price);
          const modPrice = item.modifiers.reduce((sum, m) => sum + m.selectedOption.price, 0);
          const itemTotal = (itemPrice + modPrice) * item.quantity;
          
          return {
            productId: item.product.id,
            quantity: item.quantity,
            price: itemPrice,
            subtotal: itemTotal,
            notes: item.notes,
            modifiers: item.modifiers.map(m => ({
              modifierGroupId: m.modifierGroupId,
              name: m.selectedOption.name,
              price: m.selectedOption.price
            }))
          };
        }),
      };

      const response = await fetch(getApiUrl('/api/mobile/v1/pos'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat pesanan');
      }

      return data;
    },
    onSuccess: () => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      Alert.alert(
        'Sukses', 
        'Transaksi berhasil disimpan!'
      );
    },
    onError: (error: any) => {
      Alert.alert('Gagal', error.message || 'Terjadi kesalahan saat checkout');
    }
  });

  const handleCheckout = () => {
    if (items.length === 0) return;

    Alert.alert(
      'Konfirmasi',
      `Lanjutkan pembayaran sebesar ${formatPrice(cartSubtotal)}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Bayar (Cash)', 
          onPress: () => checkoutMutation.mutate()
        }
      ]
    );
  };

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <View className="p-4 border-b border-gray-100 flex-row items-center">
          <Text className="text-base font-bold text-gray-900">Keranjang</Text>
          <View className="bg-gray-100 rounded-full px-2 py-0.5 ml-2">
            <Text className="text-gray-600 font-bold text-xs">0</Text>
          </View>
        </View>
        <EmptyState
          icon={<ShoppingBag size={28} color="#9ca3af" />}
          title="Keranjang Kosong"
          description="Pilih menu di samping untuk menambahkan item ke transaksi."
          className="flex-1"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white flex-col justify-between">
      {/* Top Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-100 bg-white">
        <View className="flex-row items-center">
          <Text className="text-base font-bold text-gray-900">Keranjang</Text>
          <View className="bg-blue-100 rounded-full px-2 py-0.5 ml-2">
            <Text className="text-blue-700 font-bold text-xs">{totalItemsCount}</Text>
          </View>
        </View>
        <TouchableOpacity 
          activeOpacity={0.7}
          className="flex-row items-center bg-red-50 px-2.5 py-1 rounded-lg"
          onPress={() => {
            Alert.alert('Kosongkan Keranjang', 'Apakah Anda yakin ingin menghapus semua item?', [
              { text: 'Batal', style: 'cancel' },
              { text: 'Kosongkan', style: 'destructive', onPress: clearCart }
            ]);
          }}
        >
          <Trash2 size={12} color="#ef4444" className="mr-1" />
          <Text className="text-red-600 font-bold text-xs">Hapus Semua</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items List */}
      <ScrollView className="flex-1 bg-gray-50/40 px-3 py-3" showsVerticalScrollIndicator={false}>
        {items.map((item) => {
          const itemBasePrice = Number(item.product.price);
          const itemModTotal = item.modifiers.reduce((sum, mod) => sum + mod.selectedOption.price, 0);
          const itemSubtotal = (itemBasePrice + itemModTotal) * item.quantity;

          return (
            <View key={item.id} className="bg-white p-3 rounded-2xl border border-gray-200/90 shadow-2xs mb-2.5">
              <View className="flex-row items-start">
                {/* Product Thumbnail */}
                <View className="w-12 h-12 rounded-xl bg-gray-100 mr-2.5 overflow-hidden items-center justify-center border border-gray-100">
                  {item.product.imageUrl ? (
                    <ExpoImage
                      source={{ uri: item.product.imageUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <Store size={18} color="#cbd5e1" />
                  )}
                </View>

                {/* Item Details */}
                <View className="flex-1">
                  <View className="flex-row justify-between items-start">
                    <Text className="text-gray-900 font-bold text-xs flex-1 mr-2" numberOfLines={2}>
                      {item.product.name}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => removeItem(item.id)} 
                      className="w-6 h-6 rounded-lg bg-gray-50 items-center justify-center"
                    >
                      <Trash2 size={12} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  
                  {item.modifiers.length > 0 && (
                    <View className="mt-1 mb-1">
                      {Object.values(
                        item.modifiers.reduce<Record<string, { name: string; price: number; count: number }>>((acc, m) => {
                          const key = `${m.modifierGroupId}-${m.selectedOption.id || m.selectedOption.name}`;
                          if (!acc[key]) {
                            acc[key] = { name: m.selectedOption.name, price: Number(m.selectedOption.price) || 0, count: 0 };
                          }
                          acc[key].count += 1;
                          return acc;
                        }, {})
                      ).map((m, i) => (
                        <Text key={i} className="text-gray-500 text-[11px] font-medium leading-tight">
                          • {m.name}{m.count > 1 ? ` (x${m.count})` : ''} {m.price > 0 ? `(+${formatPrice(m.price * m.count)})` : ''}
                        </Text>
                      ))}
                    </View>
                  )}

                  <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <QuantityStepper
                      size="sm"
                      value={item.quantity}
                      onIncrement={() => updateQuantity(item.id, 1)}
                      onDecrement={() => updateQuantity(item.id, -1)}
                    />
                    
                    <Text className="text-gray-900 font-extrabold text-xs">
                      {formatPrice(itemSubtotal)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Checkout Footer */}
      <View className="bg-white p-4 border-t border-gray-200">
        <View className="flex-row justify-between mb-1.5">
          <Text className="text-gray-500 text-xs font-semibold">Subtotal</Text>
          <Text className="text-gray-900 font-bold text-xs">{formatPrice(cartSubtotal)}</Text>
        </View>
        
        <View className="flex-row justify-between mb-3 border-t border-gray-100 pt-2">
          <Text className="text-gray-900 font-black text-sm">Total Bayar</Text>
          <Text className="text-blue-600 font-black text-base">{formatPrice(cartSubtotal)}</Text>
        </View>

        <View className="flex-row items-center justify-center mb-3">
          <ShieldCheck size={13} color="#10b981" className="mr-1" />
          <Text className="text-gray-400 text-[10px] font-medium">Transaksi tersimpan dan aman</Text>
        </View>
        
        <Button 
          title="Bayar Sekarang"
          variant="primary"
          size="lg"
          className="w-full shadow-sm"
          isLoading={checkoutMutation.isPending}
          onPress={handleCheckout}
        />
      </View>
    </View>
  );
}
