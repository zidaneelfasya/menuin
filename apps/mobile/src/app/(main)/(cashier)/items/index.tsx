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
  Switch,
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
import { usePosData, useUpdateProductActiveStatus, useUpdateModifierAvailability, Product, Category, ModifierGroup } from '@/hooks/use-pos-data';
import { Badge, EmptyState } from '@/components/ui';

export default function ItemsListScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { data: posData, isLoading, refetch } = usePosData();
  const updateProductStatusMutation = useUpdateProductActiveStatus();
  const updateModifierMutation = useUpdateModifierAvailability();
  const products: Product[] = posData?.data?.products || [];
  const categories: Category[] = posData?.data?.categories || [];
  const modifierGroups: ModifierGroup[] = posData?.data?.modifierGroups || [];

  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'MODIFIERS'>('PRODUCTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [modifierSearchQuery, setModifierSearchQuery] = useState('');
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
        selectedCategoryId === 'ALL'
          ? true
          : selectedCategoryId === 'INACTIVE'
          ? item.isActive === false
          : item.categoryId === selectedCategoryId;
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

  // Out of stock modifiers counter
  const outOfStockModifiersCount = useMemo(() => {
    let count = 0;
    modifierGroups.forEach((g) => {
      g.options?.forEach((opt) => {
        if (opt.isAvailable === false) count++;
      });
    });
    return count;
  }, [modifierGroups]);

  // Filtered modifier groups for the modifier management tab
  const filteredModifierGroups = useMemo(() => {
    if (!modifierSearchQuery.trim()) return modifierGroups;
    const q = modifierSearchQuery.toLowerCase();
    return modifierGroups
      .map((g) => {
        const matchesGroupName = g.name.toLowerCase().includes(q);
        const matchingOptions = g.options?.filter((opt) =>
          opt.name.toLowerCase().includes(q)
        );
        if (matchesGroupName) return g;
        if (matchingOptions && matchingOptions.length > 0) {
          return { ...g, options: matchingOptions };
        }
        return null;
      })
      .filter(Boolean) as ModifierGroup[];
  }, [modifierGroups, modifierSearchQuery]);

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

        {/* Status Ketersediaan Item (Shortcut Switch) */}
        <View
          className={`p-4 rounded-2xl border mb-4 ${
            product.isActive !== false
              ? 'bg-emerald-50/70 border-emerald-200/90'
              : 'bg-rose-50/70 border-rose-200/90'
          }`}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center gap-1.5 mb-1">
                <View
                  className={`w-2.5 h-2.5 rounded-full ${
                    product.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <Text
                  className={`text-xs font-black uppercase tracking-wider ${
                    product.isActive !== false ? 'text-emerald-800' : 'text-rose-800'
                  }`}
                >
                  {product.isActive !== false ? 'Menu Tersedia' : 'Menu Tidak Tersedia'}
                </Text>
              </View>
              <Text className="text-[11px] text-gray-600 leading-snug">
                {product.isActive !== false 
                  ? 'Item aktif dan dapat dipesan pelanggan di kasir POS & katalog online.' 
                  : 'Item dimatikan (Habis). Tidak dapat dipesan oleh pelanggan.'}
              </Text>
            </View>

            <Switch
              value={product.isActive !== false}
              onValueChange={(val) => {
                updateProductStatusMutation.mutate({
                  productId: product.id,
                  isActive: val,
                });
              }}
              trackColor={{ false: '#fecdd3', true: '#86efac' }}
              thumbColor={product.isActive !== false ? '#16a34a' : '#e11d48'}
              ios_backgroundColor="#fecdd3"
              style={{ transform: [{ scaleX: 1.05 }, { scaleY: 1.05 }] }}
            />
          </View>
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
        <View className="mb-6">
          <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Pilihan Variasi / Topping ({productModifiers.length})
          </Text>
          {productModifiers.length > 0 ? (
            <View>
              {productModifiers.map((modGroup) => (
                <View
                  key={modGroup.id}
                  className="p-4 bg-white border border-gray-200/90 rounded-2xl mb-4 shadow-2xs"
                >
                  <View className="flex-row justify-between items-center pb-2.5 mb-3 border-b border-gray-100">
                    <Text className="text-sm font-black text-gray-900 tracking-tight">{modGroup.name}</Text>
                    <Text className="text-[11px] text-gray-400 font-semibold">
                      {modGroup.isRequired ? 'Wajib' : 'Opsional'}
                    </Text>
                  </View>
                  <View>
                    {modGroup.options.map((opt, optIdx) => {
                      const isAvailable = opt.isAvailable !== false;
                      const isLastOpt = optIdx === modGroup.options.length - 1;
                      return (
                        <View
                          key={opt.id}
                          className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                            !isLastOpt ? 'mb-2.5' : ''
                          } ${
                            isAvailable
                              ? 'bg-gray-50/70 border-gray-200/80'
                              : 'bg-rose-50/60 border-rose-200'
                          }`}
                        >
                          <View className="flex-1 pr-3">
                            <View className="flex-row items-center gap-2">
                              <Text
                                className={`text-sm font-bold ${
                                  isAvailable ? 'text-gray-900' : 'text-rose-900 line-through'
                                }`}
                              >
                                {opt.name}
                              </Text>
                              {!isAvailable && (
                                <View className="px-1.5 py-0.5 bg-rose-100 rounded border border-rose-200">
                                  <Text className="text-[10px] font-bold text-rose-700">Habis</Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-xs font-semibold text-gray-500 mt-1">
                              {opt.price > 0 ? `+${formatPrice(opt.price)}` : 'Gratis'}
                            </Text>
                          </View>

                          <Switch
                            value={isAvailable}
                            onValueChange={(val) => {
                              updateModifierMutation.mutate({
                                modifierId: opt.id,
                                isAvailable: val,
                              });
                            }}
                            trackColor={{ false: '#fecdd3', true: '#86efac' }}
                            thumbColor={isAvailable ? '#16a34a' : '#e11d48'}
                            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                          />
                        </View>
                      );
                    })}
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
            Katalog & Bahan Kasir
          </Text>
          <Text className="text-xs text-gray-500 font-medium">
            Kelola ketersediaan menu produk dan stok bahan modifier
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

      {/* Segmented Control Tabs: Menu Produk vs Bahan & Modifier */}
      <View className="flex-row bg-gray-100 p-1 rounded-xl mx-4 my-2.5 border border-gray-200/80">
        <TouchableOpacity
          onPress={() => setActiveTab('PRODUCTS')}
          activeOpacity={0.8}
          className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
            activeTab === 'PRODUCTS' ? 'bg-white shadow-xs' : 'bg-transparent'
          }`}
        >
          <Package size={14} color={activeTab === 'PRODUCTS' ? '#2563eb' : '#6b7280'} className="mr-1.5" />
          <Text
            className={`text-xs font-bold ${
              activeTab === 'PRODUCTS' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            Menu Produk ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('MODIFIERS')}
          activeOpacity={0.8}
          className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
            activeTab === 'MODIFIERS' ? 'bg-white shadow-xs' : 'bg-transparent'
          }`}
        >
          <Layers size={14} color={activeTab === 'MODIFIERS' ? '#2563eb' : '#6b7280'} className="mr-1.5" />
          <Text
            className={`text-xs font-bold ${
              activeTab === 'MODIFIERS' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            Bahan & Modifier
          </Text>
          {outOfStockModifiersCount > 0 ? (
            <View className="ml-1.5 px-1.5 py-0.2 bg-rose-500 rounded-full">
              <Text className="text-[10px] font-black text-white">{outOfStockModifiersCount} Habis</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {activeTab === 'PRODUCTS' ? (
        /* Main Master-Detail Split Area for Products */
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

              {/* Pill filter 'Tidak Tersedia' */}
              <TouchableOpacity
                onPress={() => setSelectedCategoryId('INACTIVE')}
                activeOpacity={0.7}
                className={`px-3 py-1 rounded-lg border ${
                  selectedCategoryId === 'INACTIVE'
                    ? 'bg-slate-800 border-slate-800'
                    : 'bg-white border-gray-200/80'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    selectedCategoryId === 'INACTIVE' ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  Tidak Tersedia ({products.filter(p => p.isActive === false).length})
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
                <View className="bg-white border border-gray-200/90 rounded-xl overflow-hidden shadow-2xs">
                  {filteredProducts.map((item, index) => {
                    const isSelected = isTablet && activeProduct?.id === item.id;
                    const isLast = index === filteredProducts.length - 1;
                    const itemCat = categories.find((c) => c.id === item.categoryId);

                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        onPress={() => handleSelectItem(item)}
                        style={{
                          borderLeftWidth: 3.5,
                          borderLeftColor: isSelected ? '#014FFD' : 'transparent',
                        }}
                        className={`px-3.5 py-3 flex-row items-center justify-between transition-all ${
                          !isLast ? 'border-b border-gray-100' : ''
                        } ${isSelected ? 'bg-blue-50/80' : 'bg-white active:bg-gray-50'}`}
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

                        <View className="items-end flex-row items-center gap-2">
                          <View className="items-end">
                            <Text className="text-xs font-black text-blue-600">
                              {formatPrice(item.price)}
                            </Text>
                            <Text
                              className={`text-[10px] font-bold ${
                                item.isActive === false
                                  ? 'text-rose-600'
                                  : item.stock === null || item.stock > 5
                                  ? 'text-gray-400'
                                  : item.stock > 0
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {item.isActive === false
                                ? 'Tidak Tersedia'
                                : item.stock === null
                                ? 'Tersedia'
                                : item.stock > 0
                                ? `${item.stock} unit`
                                : 'Habis'}
                            </Text>
                          </View>
                          <Switch
                            value={item.isActive !== false}
                            onValueChange={(val) => {
                              updateProductStatusMutation.mutate({
                                productId: item.id,
                                isActive: val,
                              });
                            }}
                            trackColor={{ false: '#fecdd3', true: '#86efac' }}
                            thumbColor={item.isActive !== false ? '#16a34a' : '#e11d48'}
                            ios_backgroundColor="#fecdd3"
                            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                          />
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
      ) : (
        /* TAB MODIFIERS: PENGELOLAAN STOK BAHAN & TOPPING UNTUK KASIR */
        <View className="flex-1 p-4 bg-gray-50">
          {/* Search Modifier */}
          <View className="flex-row items-center bg-white border border-gray-200/90 rounded-xl px-3.5 py-2.5 shadow-2xs mb-3">
            <Search size={15} color="#9ca3af" className="mr-2" />
            <TextInput
              value={modifierSearchQuery}
              onChangeText={setModifierSearchQuery}
              placeholder="Cari topping / bahan (misal: Boba, Oat Milk)..."
              placeholderTextColor="#9ca3af"
              className="flex-1 text-xs text-gray-900 p-0"
            />
            {modifierSearchQuery ? (
              <TouchableOpacity onPress={() => setModifierSearchQuery('')}>
                <X size={14} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Info Banner */}
          <View className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
              <Text className="text-xs text-blue-900 font-medium leading-tight">
                Matikan bahan yang habis. Menu di POS Kasir & Web langsung otomatis terkunci.
              </Text>
            </View>
            {outOfStockModifiersCount > 0 ? (
              <View className="px-2 py-0.5 bg-rose-100 rounded-full border border-rose-200">
                <Text className="text-[10px] font-black text-rose-700">
                  {outOfStockModifiersCount} Bahan Habis
                </Text>
              </View>
            ) : (
              <View className="px-2 py-0.5 bg-emerald-100 rounded-full border border-emerald-200">
                <Text className="text-[10px] font-black text-emerald-700">
                  Semua Tersedia
                </Text>
              </View>
            )}
          </View>

          {/* Modifier Groups List */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="small" color="#014FFD" />
              <Text className="text-xs text-gray-400 mt-2 font-medium">Memuat bahan & modifier...</Text>
            </View>
          ) : filteredModifierGroups.length === 0 ? (
            <EmptyState
              title="Bahan Tidak Ditemukan"
              description="Tidak ada grup atau opsi bahan yang cocok dengan pencarian."
              icon={<Layers size={32} color="#9ca3af" />}
            />
          ) : (
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: (isTablet ? 24 : 76) + Math.max(insets.bottom, 8),
              }}
            >
              <View className="space-y-3">
                {filteredModifierGroups.map((group) => (
                  <View
                    key={group.id}
                    className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs mb-4"
                  >
                    {/* Group Header */}
                    <View className="flex-row justify-between items-center pb-2.5 mb-3 border-b border-gray-100">
                      <View>
                        <Text className="text-sm font-black text-gray-900 tracking-tight">{group.name}</Text>
                        <Text className="text-[11px] text-gray-400 font-medium">
                          {group.isRequired ? 'Wajib Pilih' : 'Opsional'} • Min {group.minSelections} • Max {group.maxSelections}
                        </Text>
                      </View>
                      <View className="px-2 py-0.5 rounded-md bg-gray-100">
                        <Text className="text-[10px] font-bold text-gray-600">
                          {group.options?.length || 0} Opsi
                        </Text>
                      </View>
                    </View>

                    {/* Options Rows */}
                    <View>
                      {group.options?.map((opt, optIdx) => {
                        const isAvailable = opt.isAvailable !== false;
                        const isLastOpt = optIdx === (group.options?.length || 0) - 1;

                        return (
                          <View
                            key={opt.id}
                            className={`flex-row items-center justify-between p-3.5 rounded-xl border ${
                              !isLastOpt ? 'mb-2.5' : ''
                            } ${
                              isAvailable
                                ? 'bg-gray-50/70 border-gray-200/70'
                                : 'bg-rose-50/60 border-rose-200'
                            }`}
                          >
                            <View className="flex-1 pr-3">
                              <View className="flex-row items-center gap-2 mb-0.5">
                                <View
                                  className={`w-2 h-2 rounded-full ${
                                    isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}
                                />
                                <Text
                                  className={`text-sm font-bold ${
                                    isAvailable ? 'text-gray-900' : 'text-rose-900 line-through'
                                  }`}
                                >
                                  {opt.name}
                                </Text>
                                {!isAvailable && (
                                  <View className="px-1.5 py-0.5 bg-rose-100 rounded border border-rose-200">
                                    <Text className="text-[10px] font-bold text-rose-700">Habis</Text>
                                  </View>
                                )}
                              </View>
                              <Text className="text-xs font-semibold text-blue-600 mt-1">
                                {opt.price > 0 ? `+${formatPrice(opt.price)}` : 'Gratis'}
                              </Text>
                            </View>

                            <View className="flex-row items-center gap-2.5">
                              <Text
                                className={`text-[11px] font-bold ${
                                  isAvailable ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {isAvailable ? 'Tersedia' : 'Habis'}
                              </Text>
                              <Switch
                                value={isAvailable}
                                onValueChange={(val) => {
                                  updateModifierMutation.mutate({
                                    modifierId: opt.id,
                                    isAvailable: val,
                                  });
                                }}
                                trackColor={{ false: '#fecdd3', true: '#86efac' }}
                                thumbColor={isAvailable ? '#16a34a' : '#e11d48'}
                                ios_backgroundColor="#fecdd3"
                                style={{ transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }] }}
                              />
                            </View>
                          </View>
                        );
                      })}

                      {(!group.options || group.options.length === 0) && (
                        <Text className="text-xs text-gray-400 italic py-2">
                          Belum ada opsi pada grup modifier ini.
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* MODAL DETAIL ITEM UNTUK MOBILE PORTRAIT */}
      {!isTablet && activeTab === 'PRODUCTS' && (
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
