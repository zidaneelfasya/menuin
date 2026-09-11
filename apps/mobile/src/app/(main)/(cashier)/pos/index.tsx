import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Alert, useWindowDimensions } from 'react-native';
import { ShoppingCart, X, AlertCircle } from 'lucide-react-native';
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
  type ModifierSelection = { id: string; name: string; price: number };
  const [modifierSelections, setModifierSelections] = useState<Record<string, ModifierSelection[]>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const cartTotalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

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
    const requiredGroups = posData?.data.modifierGroups.filter(g => selectedProduct.modifierGroupIds?.includes(g.id) && g.isRequired) || [];
    
    for (const group of requiredGroups) {
      const selections = modifierSelections[group.id] || [];
      if (selections.length === 0) {
        Alert.alert('Perhatian', `Silakan pilih ${group.name} terlebih dahulu.`);
        return;
      }
      if (selections.length < group.minSelections) {
        Alert.alert('Perhatian', `Pilih minimal ${group.minSelections} opsi untuk ${group.name}.`);
        return;
      }
    }

    for (const [groupId, selections] of Object.entries(modifierSelections)) {
      const group = posData?.data.modifierGroups.find(g => g.id === groupId);
      if (group) {
        for (const selection of selections) {
          modifiers.push({
            modifierGroupId: groupId,
            name: group.name,
            selectedOption: selection
          });
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
    for (const selections of Object.values(modifierSelections)) {
      for (const sel of selections) {
        sum += sel.price || 0;
      }
    }
    return sum;
  }, [modifierSelections]);

  const currentModalItemTotal = useMemo(() => {
    if (!selectedProduct) return 0;
    return Number(selectedProduct.price) + modifierAddedTotal;
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
                  <Text className="text-white font-black text-sm">{formatPrice(getCartTotal())}</Text>
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

                return (
                  <View key={group.id} className="mb-5 bg-gray-50/60 p-3.5 rounded-2xl border border-gray-200/80">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-1 mr-2">
                        <Text className="text-sm font-bold text-gray-900">{group.name}</Text>
                        <Text className="text-[11px] text-gray-500 mt-0.5">
                          {group.maxSelections === 1 ? 'Pilih 1 opsi' : `Pilih hingga ${group.maxSelections} opsi`}
                        </Text>
                      </View>
                      {group.isRequired ? (
                        <Badge label="Wajib" variant="error" size="sm" />
                      ) : (
                        <Badge label="Opsional" variant="default" size="sm" />
                      )}
                    </View>
                    
                    <View className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                      {group.options?.map((opt, i) => {
                        const isSelected = modifierSelections[group.id]?.some(s => s.id === opt.id) || false;
                        const isSingle = group.maxSelections === 1;

                        return (
                          <TouchableOpacity
                            key={i}
                            activeOpacity={0.7}
                            className={`flex-row items-center justify-between py-3 px-3.5 ${isSelected ? 'bg-blue-50/40' : 'bg-white'}`}
                            onPress={() => {
                              setModifierSelections(prev => {
                                const currentSelections = prev[group.id] || [];
                                
                                if (isSingle) {
                                  return { ...prev, [group.id]: [opt] };
                                } else {
                                  if (isSelected) {
                                    return { ...prev, [group.id]: currentSelections.filter(s => s.id !== opt.id) };
                                  } else {
                                    if (currentSelections.length >= group.maxSelections) {
                                      return prev;
                                    }
                                    return { ...prev, [group.id]: [...currentSelections, opt] };
                                  }
                                }
                              });
                            }}
                          >
                            <Text className={`text-xs ${isSelected ? 'font-bold text-blue-900' : 'font-medium text-gray-800'}`}>
                              {opt.name}
                            </Text>
                            <View className="flex-row items-center">
                              {opt.price > 0 && (
                                <Text className="text-gray-500 text-xs font-semibold mr-3">+{formatPrice(opt.price)}</Text>
                              )}
                              
                              {isSingle ? (
                                <View className={`w-4 h-4 rounded-full border items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                                  {isSelected && <View className="w-2 h-2 rounded-full bg-blue-600" />}
                                </View>
                              ) : (
                                <View className={`w-4 h-4 rounded border items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                                  {isSelected && <Text className="text-white text-[9px] font-bold">✓</Text>}
                                </View>
                              )}
                            </View>
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
