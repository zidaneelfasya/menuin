import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash2, ShieldCheck, Store, ShoppingBag } from 'lucide-react-native';
import { useCartStore } from '@/store/cart-store';
import { getApiUrl } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QuantityStepper, Button, EmptyState } from '@/components/ui';

export default function CartScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { items, removeItem, updateQuantity, clearCart, getCartTotal } = useCartStore();
  const sessionToken = useAuthStore(state => state.sessionToken);

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(price));
  };

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const total = getCartTotal();
      
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
        'Transaksi berhasil disimpan!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      Alert.alert('Gagal', error.message || 'Terjadi kesalahan saat checkout');
    }
  });

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Perhatian', 'Keranjang belanja kosong');
      return;
    }

    Alert.alert(
      'Konfirmasi Transaksi',
      `Lanjutkan pembayaran tunai sebesar ${formatPrice(getCartTotal())}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Bayar Sekarang', 
          onPress: () => checkoutMutation.mutate()
        }
      ]
    );
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
        <View className="flex-row items-center p-4 border-b border-gray-100 bg-white">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <Text className="text-base font-bold text-gray-900">Keranjang Belanja</Text>
        </View>
        <EmptyState
          icon={<ShoppingBag size={32} color="#9ca3af" />}
          title="Keranjang Kosong"
          description="Belum ada item yang ditambahkan. Silakan pilih menu pada kasir."
          actionTitle="Kembali ke POS"
          onAction={() => router.back()}
          className="flex-1"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shadow-2xs">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-1.5 -ml-1.5 mr-2 bg-gray-50 rounded-full">
            <ArrowLeft size={18} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text className="text-base font-bold text-gray-900">Keranjang</Text>
            <Text className="text-[11px] text-gray-500 font-medium">{totalItemsCount} item dipilih</Text>
          </View>
        </View>
        <TouchableOpacity 
          activeOpacity={0.7}
          className="bg-red-50 px-2.5 py-1.5 rounded-lg flex-row items-center"
          onPress={() => {
            Alert.alert('Kosongkan Keranjang', 'Apakah Anda yakin ingin menghapus semua item?', [
              { text: 'Batal', style: 'cancel' },
              { text: 'Kosongkan', style: 'destructive', onPress: clearCart }
            ]);
          }}
        >
          <Trash2 size={12} color="#ef4444" className="mr-1" />
          <Text className="text-red-600 font-bold text-xs">Kosongkan</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items List */}
      <ScrollView className="flex-1 px-4 pt-3" showsVerticalScrollIndicator={false}>
        <View className="space-y-2.5 pb-6">
          {items.map((item) => {
            const itemBasePrice = Number(item.product.price);
            const itemModTotal = item.modifiers.reduce((sum, mod) => sum + mod.selectedOption.price, 0);
            const itemSubtotal = (itemBasePrice + itemModTotal) * item.quantity;

            return (
              <View key={item.id} className="bg-white p-3.5 rounded-2xl border border-gray-200/90 shadow-2xs mb-2.5">
                <View className="flex-row items-start">
                  {/* Thumbnail */}
                  <View className="w-14 h-14 rounded-xl bg-gray-100 mr-3 overflow-hidden items-center justify-center border border-gray-100">
                    {item.product.imageUrl ? (
                      <ExpoImage
                        source={{ uri: item.product.imageUrl }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <Store size={20} color="#cbd5e1" />
                    )}
                  </View>

                  {/* Details */}
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start">
                      <Text className="text-gray-900 font-bold text-sm flex-1 mr-2" numberOfLines={2}>
                        {item.product.name}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => removeItem(item.id)} 
                        className="w-7 h-7 rounded-lg bg-gray-50 items-center justify-center"
                      >
                        <Trash2 size={14} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>
                    
                    {item.modifiers.length > 0 && (
                      <View className="mt-1 mb-1">
                        {item.modifiers.map((mod, i) => (
                          <Text key={i} className="text-gray-500 text-xs font-medium">
                            • {mod.selectedOption.name} {mod.selectedOption.price > 0 ? `(+${formatPrice(mod.selectedOption.price)})` : ''}
                          </Text>
                        ))}
                      </View>
                    )}

                    <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-gray-50">
                      <QuantityStepper
                        size="md"
                        value={item.quantity}
                        onIncrement={() => updateQuantity(item.id, 1)}
                        onDecrement={() => updateQuantity(item.id, -1)}
                      />
                      
                      <Text className="text-blue-600 font-black text-sm">
                        {formatPrice(itemSubtotal)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Checkout Sticky Footer */}
      <View className="bg-white p-4 border-t border-gray-200 shadow-sm">
        <View className="flex-row justify-between mb-1.5">
          <Text className="text-gray-500 text-xs font-semibold">Subtotal ({totalItemsCount} item)</Text>
          <Text className="text-gray-900 font-bold text-xs">{formatPrice(getCartTotal())}</Text>
        </View>
        
        <View className="flex-row justify-between mb-3 border-t border-gray-100 pt-2">
          <Text className="text-gray-900 font-black text-sm">Total Pembayaran</Text>
          <Text className="text-blue-600 font-black text-lg">{formatPrice(getCartTotal())}</Text>
        </View>

        <View className="flex-row items-center justify-center mb-3">
          <ShieldCheck size={13} color="#10b981" className="mr-1" />
          <Text className="text-gray-400 text-[10px] font-medium">Metode: Tunai (Cash) di kasir</Text>
        </View>
        
        <Button 
          title="Bayar Sekarang (Tunai)"
          variant="primary"
          size="lg"
          className="w-full shadow-sm"
          isLoading={checkoutMutation.isPending}
          onPress={handleCheckout}
        />
      </View>
    </SafeAreaView>
  );
}
