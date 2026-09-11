import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  Package,
  Layers,
  Barcode,
  Tag,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Sparkles,
  DollarSign,
} from 'lucide-react-native';
import { usePosData, Product, Category } from '@/hooks/use-pos-data';
import { Badge, EmptyState } from '@/components/ui';

export default function ItemsListScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { data: posData, isLoading, refetch } = usePosData();
  const products: Product[] = posData?.data?.products || [];
  const categories: Category[] = posData?.data?.categories || [];
  const modifierGroups = posData?.data?.modifierGroups || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // Filtered items
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.barcode && item.barcode.includes(searchQuery));
      const matchesCategory =
        selectedCategoryId === 'ALL' || item.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  // Active product for detail pane
  const activeProduct = useMemo(() => {
    if (selectedProductId) {
      const found = products.find((p) => p.id === selectedProductId);
      if (found) return found;
    }
    return filteredProducts[0] || null;
  }, [selectedProductId, products, filteredProducts]);

  const activeCategory = useMemo(() => {
    if (!activeProduct) return null;
    return categories.find((c) => c.id === activeProduct.categoryId) || null;
  }, [activeProduct, categories]);

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(price || 0));
  };

  const handleSelectItem = (item: Product) => {
    setSelectedProductId(item.id);
    if (!isTablet) {
      setIsMobileDetailOpen(true);
    }
  };

  const renderDetailContent = (product: Product) => {
    const categoryName = activeCategory?.name || 'Katalog Kasir';
    const isOutOfStock = product.stock !== null && product.stock <= 0;
    const isLowStock = product.stock !== null && product.stock > 0 && product.stock <= 5;

    // Attached modifier groups
    const productModifiers = modifierGroups.filter((g) =>
      product.modifierGroupIds?.includes(g.id)
    );

    return (
      <ScrollView
        className="flex-1 bg-white p-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Product Image / Icon Banner */}
        <View className="w-full h-44 rounded-2xl bg-gray-100 items-center justify-center mb-4 overflow-hidden border border-gray-200/80">
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="items-center">
              <Package size={48} color="#9ca3af" />
              <Text className="text-xs text-gray-400 font-semibold mt-2">Tidak ada foto produk</Text>
            </View>
          )}
        </View>

        {/* Title & Category */}
        <View className="mb-4 pb-3 border-b border-gray-100">
          <View className="flex-row items-center space-x-2 mb-1">
            <Badge label={categoryName} variant="primary" size="sm" />
            {product.isFeatured && (
              <Badge label="Unggulan" variant="warning" size="sm" />
            )}
            {product.isAvailableOnline && (
              <Badge label="Online" variant="success" size="sm" />
            )}
          </View>
          <Text className="text-xl font-black text-gray-900 tracking-tight mt-1">
            {product.name}
          </Text>
          <Text className="text-xl font-black text-blue-600 mt-1">
            {formatPrice(product.price)}
          </Text>
        </View>

        {/* Stock & Identifiers */}
        <View className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 mb-4 space-y-2">
          <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
            Inventaris & Status
          </Text>
          <View className="flex-row justify-between items-center py-1">
            <Text className="text-xs text-gray-500 font-medium">Status Stok</Text>
            <Badge
              label={
                product.stock === null
                  ? 'Stok Tak Terbatas'
                  : isOutOfStock
                  ? 'Habis'
                  : isLowStock
                  ? `Sisa ${product.stock} (Menipis)`
                  : `Tersedia (${product.stock})`
              }
              variant={
                product.stock === null || (!isOutOfStock && !isLowStock)
                  ? 'success'
                  : isLowStock
                  ? 'warning'
                  : 'error'
              }
              size="sm"
            />
          </View>

          {product.sku && (
            <View className="flex-row justify-between items-center py-1 border-t border-gray-200/50">
              <Text className="text-xs text-gray-500 font-medium">Kode SKU</Text>
              <Text className="text-xs font-mono font-bold text-gray-800">{product.sku}</Text>
            </View>
          )}

          {product.barcode && (
            <View className="flex-row justify-between items-center py-1 border-t border-gray-200/50">
              <Text className="text-xs text-gray-500 font-medium">Barcode Scanner</Text>
              <Text className="text-xs font-mono font-bold text-gray-800">{product.barcode}</Text>
            </View>
          )}
        </View>

        {/* Modifier Groups / Toppings */}
        <View className="mb-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Pilihan Variasi / Topping ({productModifiers.length})
          </Text>
          {productModifiers.length > 0 ? (
            <View className="space-y-2">
              {productModifiers.map((modGroup) => (
                <View
                  key={modGroup.id}
                  className="p-3 bg-white border border-gray-200/80 rounded-xl"
                >
                  <View className="flex-row justify-between items-center mb-1.5">
                    <Text className="text-xs font-black text-gray-900">{modGroup.name}</Text>
                    <Text className="text-[10px] text-gray-400 font-semibold">
                      {modGroup.isRequired ? 'Wajib' : 'Opsional'}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-1.5 mt-1">
                    {modGroup.options.map((opt) => (
                      <View
                        key={opt.id}
                        className="bg-gray-100 px-2 py-1 rounded-md flex-row items-center space-x-1"
                      >
                        <Text className="text-[11px] text-gray-700 font-medium">{opt.name}</Text>
                        {opt.price > 0 && (
                          <Text className="text-[10px] font-bold text-blue-600">
                            +{formatPrice(opt.price)}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-xs text-gray-400 italic py-1">
              Produk ini tidak memiliki opsi modifier atau topping tambahan.
            </Text>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right']}>
      {/* Top Section */}
      <View className="px-5 py-3 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-black text-gray-900 tracking-tight">
            List of Items
          </Text>
          <Text className="text-xs text-gray-500 font-medium">
            Katalog produk, harga, dan ketersediaan stok
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

      {/* Main Master-Detail Split Area */}
      <View className="flex-1 flex-row">
        {/* SISI KIRI: DAFTAR PRODUK */}
        <View
          style={{
            flex: isTablet ? 0.45 : 1,
            borderRightWidth: isTablet ? 1 : 0,
            borderRightColor: '#e5e7eb',
          }}
          className="bg-gray-50 p-3"
        >
          {/* Search */}
          <View className="flex-row items-center bg-white border border-gray-200/90 rounded-xl px-3 py-2 shadow-2xs mb-2">
            <Search size={15} color="#9ca3af" className="mr-2" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Cari nama produk / SKU..."
              placeholderTextColor="#9ca3af"
              className="flex-1 text-xs text-gray-900 p-0"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={14} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Category Horizontal Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3 max-h-8"
            contentContainerStyle={{ paddingRight: 12, gap: 6 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedCategoryId('ALL')}
              activeOpacity={0.7}
              className={`px-3 py-1 rounded-lg border ${
                selectedCategoryId === 'ALL'
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-gray-200/80'
              }`}
            >
              <Text
                className={`text-[11px] font-bold ${
                  selectedCategoryId === 'ALL' ? 'text-white' : 'text-gray-600'
                }`}
              >
                Semua ({products.length})
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategoryId(cat.id)}
                activeOpacity={0.7}
                className={`px-3 py-1 rounded-lg border ${
                  selectedCategoryId === cat.id
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-200/80'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    selectedCategoryId === cat.id ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Product Cards List */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="small" color="#014FFD" />
              <Text className="text-xs text-gray-400 mt-2 font-medium">Memuat katalog produk...</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title="Item Tidak Ditemukan"
              description="Tidak ada item yang cocok dengan kata kunci atau filter kategori."
              icon={<Package size={32} color="#9ca3af" />}
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
                {filteredProducts.map((item) => {
                  const isSelected = isTablet && activeProduct?.id === item.id;
                  const itemCat = categories.find((c) => c.id === item.categoryId);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.7}
                      onPress={() => handleSelectItem(item)}
                      className={`p-3 rounded-xl border flex-row items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-500 shadow-xs'
                          : 'bg-white border-gray-200/80 active:bg-gray-50'
                      }`}
                    >
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200/60 items-center justify-center mr-3 overflow-hidden">
                          {item.imageUrl ? (
                            <Image
                              source={{ uri: item.imageUrl }}
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          ) : (
                            <Package size={18} color="#9ca3af" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-black text-gray-900 leading-tight" numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text className="text-[10px] text-gray-400 font-medium">
                            {itemCat?.name || 'Katalog'} {item.sku ? `• SKU: ${item.sku}` : ''}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end">
                        <Text className="text-xs font-black text-blue-600">
                          {formatPrice(item.price)}
                        </Text>
                        <Text
                          className={`text-[10px] font-bold ${
                            item.stock === null || item.stock > 5
                              ? 'text-gray-400'
                              : item.stock > 0
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {item.stock === null ? 'Tersedia' : item.stock > 0 ? `${item.stock} unit` : 'Habis'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>

        {/* SISI KANAN: DETAIL PRODUK (TABLET SPLIT VIEW) */}
        {isTablet && (
          <View style={{ flex: 0.55 }} className="bg-white">
            {activeProduct ? (
              renderDetailContent(activeProduct)
            ) : (
              <View className="flex-1 items-center justify-center p-8">
                <Package size={40} color="#cbd5e1" />
                <Text className="text-xs font-bold text-gray-400 mt-3">
                  Pilih item di sebelah kiri untuk melihat rincian produk
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* MODAL DETAIL ITEM UNTUK MOBILE PORTRAIT */}
      {!isTablet && (
        <Modal
          visible={isMobileDetailOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsMobileDetailOpen(false)}
        >
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <Text className="text-base font-black text-gray-900">Detail Item</Text>
              <TouchableOpacity
                onPress={() => setIsMobileDetailOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>
            {activeProduct && renderDetailContent(activeProduct)}
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}
