import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useCartStore } from './stores/use-cart-store';
import { formatCurrency } from '@menuin/utils';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react-native';
import { usePosData, useSubmitOrder } from './api/use-pos-data';
import { CustomizationModal } from '@/components/shared/customization-modal';

export function PosScreen() {
  const { items, addItem, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const { data: posQuery, isLoading, error } = usePosData();
  const submitOrderMutation = useSubmitOrder();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const categories = posQuery?.data?.categories || [];
  const products = posQuery?.data?.products || [];
  const modifierGroups = posQuery?.data?.modifierGroups || [];

  const [selectedProductForModal, setSelectedProductForModal] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCheckout = () => {
    if (items.length === 0) return;

    const payload = {
      totalAmount: getTotal(),
      discount: 0,
      tax: 0,
      grandTotal: getTotal(),
      paymentMethod: 'CASH',
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      }))
    };

    submitOrderMutation.mutate(payload, {
      onSuccess: () => {
        Alert.alert('Sukses', 'Pesanan berhasil dibuat!');
        clearCart();
      },
      onError: (err: any) => {
        Alert.alert('Gagal', err.message || 'Gagal membuat pesanan');
      }
    });
  };

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return products;
    return products.filter((p) => p.categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-slate-500 font-medium">Memuat data POS...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-red-500 font-medium">Gagal memuat data POS.</Text>
      </View>
    );
  }
  return (
    <View className="flex-1 bg-slate-50 flex-row">
      {/* Kiri: Kategori & Produk */}
      <View className="flex-[2] border-r border-slate-200">
        <View className="p-4 bg-white border-b border-slate-200">
          <Text className="text-xl font-bold text-slate-800">Kasir</Text>
        </View>
        
        {/* Kategori */}
        <View className="flex-row p-4 gap-2 border-b border-slate-100">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            <TouchableOpacity 
              onPress={() => setSelectedCategoryId(null)}
              className={`px-4 py-2 rounded-full mr-2 ${!selectedCategoryId ? 'bg-blue-600' : 'bg-slate-100'}`}
            >
              <Text className={`font-medium ${!selectedCategoryId ? 'text-white' : 'text-slate-700'}`}>Semua</Text>
            </TouchableOpacity>
            
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id}
                onPress={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-full mr-2 ${selectedCategoryId === cat.id ? 'bg-blue-600' : 'bg-slate-100'}`}
              >
                <Text className={`font-medium ${selectedCategoryId === cat.id ? 'text-white' : 'text-slate-700'}`}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Produk Grid */}
        <ScrollView className="p-4">
          <View className="flex-row flex-wrap gap-4 pb-20">
            {filteredProducts.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                className="w-[31%] bg-white p-3 rounded-xl shadow-sm border border-slate-100"
                onPress={() => {
                  if (item.modifierGroupIds && item.modifierGroupIds.length > 0) {
                    setSelectedProductForModal(item);
                    setIsModalOpen(true);
                  } else {
                    addItem({
                      productId: item.id,
                      name: item.name,
                      price: Number(item.price),
                      imageUrl: item.imageUrl,
                    });
                  }
                }}
              >
                {item.imageUrl ? (
                  <Image 
                    source={{ uri: item.imageUrl }} 
                    className="w-full h-24 rounded-lg mb-3 bg-slate-100" 
                    resizeMode="cover" 
                  />
                ) : (
                  <View className="w-full h-24 bg-slate-100 rounded-lg mb-3 items-center justify-center">
                    <ShoppingBag color="#cbd5e1" size={32} />
                  </View>
                )}
                <Text className="font-semibold text-slate-800" numberOfLines={2}>{item.name}</Text>
                <Text className="text-blue-600 font-medium mt-1">{formatCurrency(Number(item.price))}</Text>
              </TouchableOpacity>
            ))}
            {filteredProducts.length === 0 && (
              <View className="w-full py-10 items-center">
                <Text className="text-slate-400">Tidak ada produk di kategori ini</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Kanan: Keranjang (Cart) */}
      <View className="flex-1 bg-white">
        <View className="p-4 border-b border-slate-200 bg-slate-50">
          <Text className="text-lg font-bold text-slate-800">Pesanan Saat Ini</Text>
        </View>
        
        <ScrollView className="flex-1 p-4">
          {items.length === 0 ? (
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-slate-400">Keranjang kosong</Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id} className="flex-row justify-between items-center mb-4 pb-4 border-b border-slate-100">
                <View className="flex-1">
                  <Text className="font-medium text-slate-800">{item.name}</Text>
                  <Text className="text-slate-500 text-sm">{formatCurrency(item.price)} x {item.quantity}</Text>
                </View>
                
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity 
                    className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus size={16} color="#64748b" />
                  </TouchableOpacity>
                  
                  <Text className="font-bold text-slate-800">{item.quantity}</Text>
                  
                  <TouchableOpacity 
                    className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center"
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus size={16} color="#2563eb" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    className="w-8 h-8 rounded-full bg-red-50 items-center justify-center ml-2"
                    onPress={() => removeItem(item.id)}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View className="p-4 border-t border-slate-200 bg-slate-50">
          <View className="flex-row justify-between mb-4">
            <Text className="text-slate-600">Total</Text>
            <Text className="text-xl font-bold text-slate-800">{formatCurrency(getTotal())}</Text>
          </View>
          <TouchableOpacity 
            className={`w-full py-4 rounded-xl items-center flex-row justify-center ${items.length > 0 ? 'bg-blue-600' : 'bg-slate-300'}`}
            disabled={items.length === 0 || submitOrderMutation.isPending}
            onPress={handleCheckout}
          >
            {submitOrderMutation.isPending && (
              <ActivityIndicator color="white" className="mr-2" />
            )}
            <Text className="text-white font-bold text-lg">Bayar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CustomizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProductForModal}
        modifierGroups={modifierGroups.filter((g: any) => selectedProductForModal?.modifierGroupIds?.includes(g.id))}
        onAddToCart={(product, selectedMods, notes, quantity) => {
          addItem({
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            imageUrl: product.imageUrl,
            modifiers: selectedMods,
            notes: notes
          }, quantity);
        }}
      />
    </View>
  );
}
