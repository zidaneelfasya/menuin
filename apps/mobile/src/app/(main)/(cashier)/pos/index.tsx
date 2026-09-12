import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Alert, useWindowDimensions } from 'react-native';
import { ShoppingCart, X, AlertCircle, Plus, Minus } from 'lucide-react-native';
import { usePosData, Product, ModifierGroup } from '@/hooks/use-pos-data';
import { useCartStore, CartItemModifier } from '@/store/cart-store';
import { useRouter } from 'expo-router';
import { useActiveShift } from '@/hooks/use-shifts';
import { CartSidebar } from '@/components/cart-sidebar';
import { SearchInput, Badge, Button, EmptyState } from '@/components/ui';
import { ProductCard } from '@/components/pos/product-card';

export default function PosScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isPhoneLandscape = !isTablet && isLandscape;
  const cartWidth = isTablet ? (width >= 1200 ? 380 : 340) : 0;
  
  // Calculate dynamic responsive columns
  const contentWidth = width - cartWidth - 32;
  const getCols = () => {
    if (contentWidth >= 1150) return 6; // 1600x900 widescreen POS
    if (contentWidth >= 900) return 5;  // Wide tablet landscape
    if (contentWidth >= 680) return 4;  // Standard tablet landscape
    if (contentWidth >= 480) return 3;  // Large phone / compact tablet
    return 2;                           // Standard phone portrait
  };
  const cols = getCols();
  const gap = 10;
  const cardWidth = Math.floor((contentWidth - (gap * (cols - 1))) / cols);

  const { data: shiftData, isLoading: isShiftLoading } = useActiveShift();
  const activeShift = shiftData?.data;

  const { data: posData, isLoading: isPosLoading, error, refetch } = usePosData();
  const cartItems = useCartStore(state => state.items);
  const getCartTotal = useCartStore(state => state.getCartTotal);
  const addItem = useCartStore(state => state.addItem);
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // Mapping: groupId -> { [optionId]: quantity }
  const [modifierSelections, setModifierSelections] = useState<Record<string, Record<string, number>>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const cartTotalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const itemBasePrice = Number(item.product?.price || 0);
      const itemModTotal = (item.modifiers || []).reduce(
        (sum, mod) => sum + (Number(mod.selectedOption?.price) || 0),
        0
      );
      return acc + (itemBasePrice + itemModTotal) * (item.quantity || 1);
    }, 0);
  }, [cartItems]);

  const formatPrice = useCallback((price: string | number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(price));
  }, []);

  const filteredProducts = useMemo(() => {
    if (!posData?.data.products) return [];
    let products = posData.data.products;
    
    if (selectedCategory) {
      products = products.filter(p => p.categoryId === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q)));
    }
    
    return products;
  }, [posData, selectedCategory, searchQuery]);

  const handleProductPress = useCallback((product: Product) => {
    if (!activeShift) {
      Alert.alert(
        'Shift Belum Dibuka',
        'Buka sesi kasir di menu Manajemen Shift untuk mulai melakukan transaksi penjualan.',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Buka Shift', onPress: () => router.push('/(main)/(cashier)/shift') },
        ]
      );
      return;
    }
    if (product.modifierGroupIds && product.modifierGroupIds.length > 0) {
      setSelectedProduct(product);
      setModifierSelections({});
    } else {
      addItem({
        product,
        quantity: 1,
        modifiers: []
      });
    }
  }, [activeShift, addItem, router]);

  // Single choice: instant switch between boxes
  const handleSingleSelect = useCallback((groupId: string, optionId: string, isRequired: boolean) => {
    setModifierSelections(prev => {
      const currentQty = prev[groupId]?.[optionId] || 0;
      if (currentQty > 0 && !isRequired) {
        const nextGroup = { ...prev[groupId] };
        delete nextGroup[optionId];
        return { ...prev, [groupId]: nextGroup };
      }
      return {
        ...prev,
        [groupId]: { [optionId]: 1 }
      };
    });
  }, []);

  // Multi choice: click to add / increment (1 -> 2 -> 3)
  const handleMultiIncrement = useCallback((group: ModifierGroup, optionId: string) => {
    setModifierSelections(prev => {
      const groupMap = prev[group.id] || {};
      const currentTotal = Object.values(groupMap).reduce((sum, q) => sum + q, 0);
      const currentQty = groupMap[optionId] || 0;

      if (currentTotal >= group.maxSelections) {
        Alert.alert(
          'Batas Maksimal',
          `Maksimal pilihan untuk ${group.name} adalah ${group.maxSelections} opsi.`
        );
        return prev;
      }

      return {
        ...prev,
        [group.id]: {
          ...groupMap,
          [optionId]: currentQty + 1
        }
      };
    });
  }, []);

  // Multi choice: decrement quantity or unselect when reaching 0
  const handleMultiDecrement = useCallback((groupId: string, optionId: string) => {
    setModifierSelections(prev => {
      const groupMap = prev[groupId] || {};
      const currentQty = groupMap[optionId] || 0;
      if (currentQty <= 1) {
        const nextGroup = { ...groupMap };
        delete nextGroup[optionId];
        return { ...prev, [groupId]: nextGroup };
      }
      return {
        ...prev,
        [groupId]: {
          ...groupMap,
          [optionId]: currentQty - 1
        }
      };
    });
  }, []);

  const handleAddToCartWithModifiers = () => {
    if (!selectedProduct) return;
    
    if (!activeShift) {
      Alert.alert(
        'Shift Belum Dibuka',
        'Buka sesi kasir di menu Manajemen Shift untuk mulai melakukan transaksi penjualan.',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Buka Shift', onPress: () => router.push('/(main)/(cashier)/shift') },
        ]
      );
      return;
    }

    const modifiers: CartItemModifier[] = [];
    const requiredGroups = posData?.data.modifierGroups.filter(
      g => selectedProduct.modifierGroupIds?.includes(g.id) && g.isRequired
    ) || [];
    
    for (const group of requiredGroups) {
      const optMap = modifierSelections[group.id] || {};
      const totalQty = Object.values(optMap).reduce((sum, q) => sum + q, 0);
      if (totalQty === 0) {
        Alert.alert('Perhatian', `Silakan pilih ${group.name} terlebih dahulu.`);
        return;
      }
      if (totalQty < group.minSelections) {
        Alert.alert('Perhatian', `Pilih minimal ${group.minSelections} opsi untuk ${group.name}.`);
        return;
      }
    }

    for (const [groupId, optMap] of Object.entries(modifierSelections)) {
      const group = posData?.data.modifierGroups.find(g => g.id === groupId);
      if (group) {
        for (const [optId, qty] of Object.entries(optMap)) {
          if (qty > 0) {
            const opt = group.options?.find(o => o.id === optId);
            if (opt) {
              for (let i = 0; i < qty; i++) {
                modifiers.push({
                  modifierGroupId: groupId,
                  name: group.name,
                  selectedOption: {
                    id: opt.id,
                    name: opt.name,
                    price: Number(opt.price) || 0
                  }
                });
              }
            }
          }
        }
      }
    }

    addItem({
      product: selectedProduct,
      quantity: 1,
      modifiers
    });

    setSelectedProduct(null);
    setModifierSelections({});
  };

  // Calculate modifier dynamic subtotal
  const modifierAddedTotal = useMemo(() => {
    let sum = 0;
    if (!posData?.data.modifierGroups) return 0;
    for (const [groupId, optMap] of Object.entries(modifierSelections)) {
      const group = posData.data.modifierGroups.find(g => g.id === groupId);
      if (!group) continue;
      for (const [optId, qty] of Object.entries(optMap)) {
        if (qty > 0) {
          const opt = group.options?.find(o => o.id === optId);
          if (opt) {
            sum += (Number(opt.price) || 0) * qty;
          }
        }
      }
    }
    return sum;
  }, [modifierSelections, posData]);

  const currentModalItemTotal = useMemo(() => {
    if (!selectedProduct) return 0;
    return (Number(selectedProduct.price) || 0) + modifierAddedTotal;
  }, [selectedProduct, modifierAddedTotal]);

  if (isShiftLoading || isPosLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
        <EmptyState
          title="Gagal Memuat Menu"
          description="Terjadi kendala saat memuat katalog produk. Periksa koneksi internet Anda."
          actionTitle="Coba Lagi"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 flex-row" edges={['left', 'right']}>
      
      {/* Left Pane: Products */}
      <View className="flex-1 bg-gray-50 flex-col">
        {/* Banner if Shift is not active */}
        {!activeShift && (
          <View className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <AlertCircle size={15} color="#d97706" />
              <Text className="text-xs font-medium text-amber-900 ml-2 flex-1" numberOfLines={1}>
                Sesi shift belum dibuka. Buka shift untuk memproses transaksi.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(main)/(cashier)/shift')}
              activeOpacity={0.7}
              className="bg-amber-600 px-2.5 py-1 rounded-lg"
            >
              <Text className="text-white text-[11px] font-bold">Buka Shift</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Bar */}
        <View className="bg-white px-4 pt-3 pb-2 border-b border-gray-100">
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari produk atau scan barcode..."
          />
        </View>

        {/* Category Pills */}
        <View className="bg-white border-b border-gray-200 py-2.5">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
          >
            <TouchableOpacity 
              activeOpacity={0.7}
              className={`px-3.5 py-1.5 rounded-full mr-2 border ${
                !selectedCategory ? 'bg-blue-600 border-blue-600 shadow-xs' : 'bg-gray-50 border-gray-200 active:bg-gray-100'
              }`}
              onPress={() => setSelectedCategory(null)}
            >
              <Text className={`text-xs font-bold ${!selectedCategory ? 'text-white' : 'text-gray-700'}`}>Semua</Text>
            </TouchableOpacity>
            {posData?.data.categories.map((cat) => {
              const isCatActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity 
                  key={cat.id}
                  activeOpacity={0.7}
                  className={`px-3.5 py-1.5 rounded-full mr-2 border ${
                    isCatActive ? 'bg-blue-600 border-blue-600 shadow-xs' : 'bg-gray-50 border-gray-200 active:bg-gray-100'
                  }`}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text className={`text-xs font-bold ${isCatActive ? 'text-white' : 'text-gray-700'}`}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Product Grid */}
        <ScrollView 
          className="flex-1 px-4 pt-3" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: isTablet
              ? 24
              : (cartTotalItems > 0 ? 130 : 70) + Math.max(insets.bottom, 8),
          }}
        >
          <View className="flex-row flex-wrap" style={{ gap }}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                cardWidth={cardWidth}
                onPress={handleProductPress}
                formatPrice={formatPrice}
              />
            ))}
            {filteredProducts.length === 0 && (
              <View className="w-full py-16 items-center">
                <EmptyState
                  title="Produk Tidak Ditemukan"
                  description="Coba gunakan kata kunci lain atau pilih kategori berbeda."
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Compact Floating Cart Dock (Phone Only - elevated above AdaptiveBottomBar) */}
        {!isTablet && cartTotalItems > 0 && (
          <View
            style={{ bottom: (isPhoneLandscape ? 48 : 58) + Math.max(insets.bottom, 8) }}
            className="absolute left-3 right-3 z-50"
          >
            <TouchableOpacity 
              activeOpacity={0.9}
              className="bg-gray-900 flex-row items-center justify-between px-4 py-3 rounded-2xl shadow-lg border border-gray-800"
              onPress={() => router.push('/(main)/(cashier)/cart')}
            >
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-blue-600 rounded-xl items-center justify-center mr-3 shadow-xs">
                  <Text className="text-white font-black text-xs">{cartTotalItems}</Text>
                </View>
                <View>
                  <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Total Pesanan</Text>
                  <Text className="text-white font-black text-sm">{formatPrice(cartSubtotal)}</Text>
                </View>
              </View>
              <View className="flex-row items-center bg-white/10 px-3 py-1.5 rounded-xl">
                <Text className="text-white font-bold text-xs mr-1.5">Keranjang</Text>
                <ShoppingCart size={15} color="#ffffff" />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Right Pane: Cart Sidebar (Tablet Only) */}
      {isTablet && (
        <View style={{ width: cartWidth }} className="bg-white border-l border-gray-200">
          <CartSidebar />
        </View>
      )}

      {/* Modifier Bottom Sheet Modal */}
      <Modal
        visible={!!selectedProduct}
        transparent
        animationType="slide"
        supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className={`bg-white rounded-t-3xl ${isPhoneLandscape ? 'max-h-[95%]' : 'max-h-[85%]'}`}>
            {/* Sheet Handle */}
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-gray-300" />
            </View>

            <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100">
              <View className="flex-1 pr-3">
                <Text className="text-base font-bold text-gray-900" numberOfLines={1}>{selectedProduct?.name}</Text>
                <Text className="text-xs text-blue-600 font-bold mt-0.5">
                  {selectedProduct ? formatPrice(selectedProduct.price) : ''}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setSelectedProduct(null)} 
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>
            
            <ScrollView className="p-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {selectedProduct?.modifierGroupIds?.map(groupId => {
                const group = posData?.data.modifierGroups.find(g => g.id === groupId);
                if (!group) return null;

                const groupSelections = modifierSelections[group.id] || {};
                const totalGroupQty = Object.values(groupSelections).reduce((sum, q) => sum + q, 0);
                const isSingle = group.maxSelections === 1;

                return (
                  <View key={group.id} className="mb-5 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-1 mr-2">
                        <Text className="text-sm font-bold text-gray-900">{group.name}</Text>
                        <Text className="text-[11px] text-gray-500 mt-0.5">
                          {isSingle
                            ? 'Pilih 1 opsi'
                            : `Pilih hingga ${group.maxSelections} opsi (Terpilih: ${totalGroupQty}/${group.maxSelections})`}
                        </Text>
                      </View>
                      {group.isRequired ? (
                        <Badge label="Wajib" variant="error" size="sm" />
                      ) : (
                        <Badge label="Opsional" variant="default" size="sm" />
                      )}
                    </View>
                    
                    {/* Kotak-Kotak (Compact Responsive Grid) */}
                    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                      {group.options?.map((opt) => {
                        const qty = groupSelections[opt.id] || 0;
                        const isSelected = qty > 0;

                        return (
                          <TouchableOpacity
                            key={opt.id}
                            activeOpacity={0.7}
                            onPress={() => {
                              if (isSingle) {
                                handleSingleSelect(group.id, opt.id, group.isRequired);
                              } else {
                                handleMultiIncrement(group, opt.id);
                              }
                            }}
                            style={{
                              width: isTablet ? '31.8%' : '48.2%',
                            }}
                            className={`min-h-[80px] p-3 rounded-xl border flex-col justify-between ${
                              isSelected
                                ? 'bg-blue-50/70 border-blue-600 shadow-2xs'
                                : 'bg-white border-gray-200 active:bg-gray-50'
                            }`}
                          >
                            {/* Top Row: Option Name & Status Badge */}
                            <View className="flex-row items-start justify-between">
                              <Text
                                className={`text-xs flex-1 mr-1.5 ${
                                  isSelected ? 'font-bold text-blue-950' : 'font-semibold text-gray-800'
                                }`}
                                numberOfLines={2}
                              >
                                {opt.name}
                              </Text>

                              {isSingle ? (
                                <View
                                  className={`w-4 h-4 rounded-full border items-center justify-center mt-0.5 ${
                                    isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-gray-50'
                                  }`}
                                >
                                  {isSelected && <View className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </View>
                              ) : isSelected ? (
                                <View className="bg-blue-600 px-1.5 py-0.5 rounded-md items-center justify-center">
                                  <Text className="text-white text-[10px] font-black">{qty}x</Text>
                                </View>
                              ) : (
                                <View className="w-4 h-4 rounded-md border border-gray-300 bg-gray-50 items-center justify-center mt-0.5">
                                  <Plus size={10} color="#9ca3af" />
                                </View>
                              )}
                            </View>

                            {/* Bottom Row: Price or Stepper */}
                            {isSingle || !isSelected ? (
                              <View className="mt-2 pt-1.5 border-t border-gray-100 flex-row items-center justify-between">
                                <Text
                                  className={`text-[11px] font-bold ${
                                    isSelected ? 'text-blue-700' : 'text-gray-500'
                                  }`}
                                >
                                  {opt.price > 0 ? `+${formatPrice(opt.price)}` : 'Standar'}
                                </Text>
                              </View>
                            ) : (
                              /* Multi Choice Active: Stepper with [-] and [+] */
                              <View className="mt-2 pt-1.5 border-t border-blue-200/80 flex-row items-center justify-between">
                                <Text className="text-[11px] font-bold text-blue-700">
                                  {opt.price > 0 ? `+${formatPrice(opt.price * qty)}` : 'Standar'}
                                </Text>
                                <View className="flex-row items-center bg-white rounded-lg border border-blue-200 p-0.5">
                                  <TouchableOpacity
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      handleMultiDecrement(group.id, opt.id);
                                    }}
                                    activeOpacity={0.7}
                                    className="w-5 h-5 rounded items-center justify-center bg-blue-50 active:bg-red-100"
                                  >
                                    <Minus size={11} color="#2563eb" />
                                  </TouchableOpacity>
                                  <Text className="text-blue-900 font-black text-xs px-1.5">
                                    {qty}
                                  </Text>
                                  <TouchableOpacity
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      handleMultiIncrement(group, opt.id);
                                    }}
                                    activeOpacity={0.7}
                                    disabled={totalGroupQty >= group.maxSelections}
                                    className={`w-5 h-5 rounded items-center justify-center ${
                                      totalGroupQty >= group.maxSelections ? 'bg-gray-100 opacity-40' : 'bg-blue-600 active:bg-blue-700'
                                    }`}
                                  >
                                    <Plus size={11} color="#ffffff" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            
            <View className="p-4 border-t border-gray-100 bg-white">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xs text-gray-500 font-semibold">Subtotal Item</Text>
                <Text className="text-base font-black text-blue-600">{formatPrice(currentModalItemTotal)}</Text>
              </View>

              <Button 
                title="Tambahkan ke Pesanan"
                variant="primary"
                size="lg"
                className="w-full shadow-sm"
                onPress={handleAddToCartWithModifiers}
              />
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
