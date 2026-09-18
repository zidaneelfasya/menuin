import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Delete,
  Plus,
  Tag,
  FileText,
  Sparkles,
  ShoppingBag,
  RotateCcw,
} from 'lucide-react-native';
import { useCartStore } from '@/store/cart-store';
import { Product } from '@/hooks/use-pos-data';
import { CartSidebar } from '@/components/cart-sidebar';
import { Button } from '@/components/ui';

const PRESET_NAMES = [
  'Item Kustom',
  'Minuman Khusus',
  'Makanan Khusus',
  'Extra Topping',
  'Catering Box',
];

export default function CustomOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isPhoneLandscape = !isTablet && isLandscape;
  const cartWidth = isTablet ? (width >= 1200 ? 380 : 340) : 0;
  const bottomBarPadding = (isPhoneLandscape ? 48 : 58) + Math.max(insets.bottom, 8);

  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Form states
  const [customName, setCustomName] = useState('Item Kustom');
  const [priceString, setPriceString] = useState('0');
  const [notes, setNotes] = useState('');
  const [activePreset, setActivePreset] = useState('Item Kustom');

  const numericPrice = parseInt(priceString, 10) || 0;

  const formatRupiah = useCallback((amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Numpad key handlers
  const handleDigit = (digit: string) => {
    setPriceString((prev) => {
      if (prev === '0') return digit;
      if (prev.length >= 9) return prev; // Limit to 999.999.999
      return prev + digit;
    });
  };

  const handleDoubleZero = () => {
    setPriceString((prev) => {
      if (prev === '0') return '0';
      if (prev.length >= 8) return prev;
      return prev + '00';
    });
  };

  const handleBackspace = () => {
    setPriceString((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setPriceString('0');
  };

  const handleAddToCart = () => {
    if (numericPrice <= 0) {
      Alert.alert('Harga Tidak Valid', 'Silakan masukkan nominal harga lebih dari Rp 0.');
      return;
    }

    const customProduct: Product = {
      id: `custom_${Date.now()}`,
      sku: 'CUSTOM',
      name: customName.trim() || 'Item Kustom',
      price: numericPrice.toString(),
      stock: 999,
      categoryId: 'custom',
      imageUrl: null,
      barcode: null,
      isAvailableOnline: false,
      isFeatured: false,
      modifierGroupIds: [],
    };

    addItem({
      product: customProduct,
      quantity: 1,
      modifiers: [],
      notes: notes.trim() || undefined,
    });

    // Reset input for next custom item
    setPriceString('0');
    setNotes('');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={['top', 'left', 'right']}>
      <View className="flex-1 flex-row">
        {/* ========================================================== */}
        {/* SISI KIRI: INPUT NAMA & KEYPAD ANGKA BESAR (NUMPAD)        */}
        {/* ========================================================== */}
        <View className="flex-1 p-4 justify-between">
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Title */}
            <View className="mb-3">
              <Text className="text-xl font-black text-gray-900 leading-tight">
                Pesanan Kustom
              </Text>
              <Text className="text-xs text-gray-500 font-medium">
                Buat pesanan dengan harga & nama fleksibel di luar katalog
              </Text>
            </View>

            {/* Quick Preset Name Chips */}
            <View className="mb-3">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
              >
                {PRESET_NAMES.map((name) => {
                  const isSelected = activePreset === name && customName === name;
                  return (
                    <TouchableOpacity
                      key={name}
                      activeOpacity={0.7}
                      onPress={() => {
                        setActivePreset(name);
                        setCustomName(name);
                      }}
                      className={`px-3 py-1.5 rounded-full mr-2 border ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-gray-200 active:bg-gray-50'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          isSelected ? 'font-bold text-[#0265DC]' : 'font-medium text-gray-600'
                        }`}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Custom Name Text Input */}
            <View className="bg-white p-3 rounded-2xl border border-gray-200/90 shadow-2xs mb-3">
              <View className="flex-row items-center mb-1">
                <Tag size={14} color="#6b7280" className="mr-1.5" />
                <Text className="text-xs font-bold text-gray-700">Nama Item</Text>
              </View>
              <TextInput
                value={customName}
                onChangeText={(text) => {
                  setCustomName(text);
                  setActivePreset('');
                }}
                placeholder="Masukkan nama item pesanan..."
                placeholderTextColor="#9ca3af"
                className="text-sm font-semibold text-gray-900 py-1"
              />
            </View>

            {/* Price Display Screen (Large Digital Display) */}
            <View className="bg-white p-4 rounded-2xl border-2 border-blue-200 shadow-2xs mb-3 items-center justify-center">
              <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Nominal Harga
              </Text>
              <Text
                className={`text-3xl font-black ${
                  numericPrice > 0 ? 'text-[#0265DC]' : 'text-gray-400'
                }`}
              >
                {formatRupiah(numericPrice)}
              </Text>
            </View>

            {/* Optional Notes Input */}
            <View className="bg-white p-3 rounded-2xl border border-gray-200/90 shadow-2xs mb-4">
              <View className="flex-row items-center mb-1">
                <FileText size={14} color="#6b7280" className="mr-1.5" />
                <Text className="text-xs font-bold text-gray-700">
                  Catatan Tambahan (Opsional)
                </Text>
              </View>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Contoh: Less sugar, extra ice, tanpa sedotan..."
                placeholderTextColor="#9ca3af"
                className="text-xs text-gray-800 py-1"
              />
            </View>

            {/* ======================================================== */}
            {/* KEYPAD ANGKA BESAR (NUMPAD 3x4)                          */}
            {/* ======================================================== */}
            <View className="bg-white p-3 rounded-2xl border border-gray-200/90 shadow-2xs mb-4">
              <View className="gap-2">
                {/* Baris 1: 1, 2, 3 */}
                <View className="flex-row gap-2">
                  {['1', '2', '3'].map((digit) => (
                    <TouchableOpacity
                      key={digit}
                      activeOpacity={0.7}
                      onPress={() => handleDigit(digit)}
                      className={`flex-1 ${isPhoneLandscape ? 'h-10' : 'h-14'} bg-gray-50 border border-gray-200/80 rounded-xl items-center justify-center active:bg-blue-50 active:border-blue-300`}
                    >
                      <Text className={`${isPhoneLandscape ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>{digit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Baris 2: 4, 5, 6 */}
                <View className="flex-row gap-2">
                  {['4', '5', '6'].map((digit) => (
                    <TouchableOpacity
                      key={digit}
                      activeOpacity={0.7}
                      onPress={() => handleDigit(digit)}
                      className={`flex-1 ${isPhoneLandscape ? 'h-10' : 'h-14'} bg-gray-50 border border-gray-200/80 rounded-xl items-center justify-center active:bg-blue-50 active:border-blue-300`}
                    >
                      <Text className={`${isPhoneLandscape ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>{digit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Baris 3: 7, 8, 9 */}
                <View className="flex-row gap-2">
                  {['7', '8', '9'].map((digit) => (
                    <TouchableOpacity
                      key={digit}
                      activeOpacity={0.7}
                      onPress={() => handleDigit(digit)}
                      className={`flex-1 ${isPhoneLandscape ? 'h-10' : 'h-14'} bg-gray-50 border border-gray-200/80 rounded-xl items-center justify-center active:bg-blue-50 active:border-blue-300`}
                    >
                      <Text className={`${isPhoneLandscape ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>{digit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Baris 4: 00, 0, Backspace */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleDoubleZero}
                    className={`flex-1 ${isPhoneLandscape ? 'h-10' : 'h-14'} bg-gray-50 border border-gray-200/80 rounded-xl items-center justify-center active:bg-blue-50 active:border-blue-300`}
                  >
                    <Text className={`${isPhoneLandscape ? 'text-base' : 'text-lg'} font-bold text-gray-800`}>00</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleDigit('0')}
                    className={`flex-1 ${isPhoneLandscape ? 'h-10' : 'h-14'} bg-gray-50 border border-gray-200/80 rounded-xl items-center justify-center active:bg-blue-50 active:border-blue-300`}
                  >
                    <Text className={`${isPhoneLandscape ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>0</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleBackspace}
                    className={`flex-1 ${isPhoneLandscape ? 'h-10' : 'h-14'} bg-red-50/70 border border-red-200/80 rounded-xl items-center justify-center active:bg-red-100`}
                  >
                    <Delete size={isPhoneLandscape ? 17 : 20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reset Price Button */}
              <TouchableOpacity
                onPress={handleClear}
                activeOpacity={0.7}
                className="mt-2.5 py-1.5 items-center justify-center flex-row"
              >
                <RotateCcw size={12} color="#6b7280" className="mr-1" />
                <Text className="text-xs font-semibold text-gray-500">Reset Harga</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* CTA: Tambahkan ke Pesanan */}
          <View style={{ paddingBottom: bottomBarPadding }} className="pt-2">
            <Button
              title={`+ Tambahkan ke Pesanan • ${formatRupiah(numericPrice)}`}
              variant="primary"
              size={isPhoneLandscape ? 'md' : 'lg'}
              className="w-full shadow-sm"
              disabled={numericPrice <= 0}
              onPress={handleAddToCart}
            />
          </View>
        </View>

        {/* ========================================================== */}
        {/* SISI KANAN: CART CHECKOUT SIDEBAR (Konsisten dengan POS)   */}
        {/* ========================================================== */}
        {isTablet && (
          <View
            style={{ width: cartWidth }}
            className="border-l border-gray-200/90 bg-white"
          >
            <CartSidebar />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
