import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Plus, Star, Store, Utensils, Coffee, SlidersHorizontal } from 'lucide-react-native';
import { Product } from '@/hooks/use-pos-data';

interface ProductCardProps {
  product: Product;
  cardWidth: number;
  onPress: (product: Product) => void;
  onLongPress?: (product: Product) => void;
  formatPrice: (price: string | number) => string;
}

export const ProductCard = React.memo(function ProductCard({
  product,
  cardWidth,
  onPress,
  onLongPress,
  formatPrice,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const hasImage = Boolean(
    product.imageUrl &&
    product.imageUrl.trim().length > 0 &&
    !imageError
  );

  const hasModifiers = product.modifierGroupIds && product.modifierGroupIds.length > 0;
  const isDeactivated = product.isActive === false;
  const isOutOfStock = !isDeactivated && product.stock !== null && product.stock <= 0;
  const isUnavailable = isDeactivated || isOutOfStock;

  // Choose an appropriate icon based on category/name
  const getFallbackIcon = () => {
    const lower = product.name.toLowerCase();
    if (lower.includes('kopi') || lower.includes('coffee') || lower.includes('latte') || lower.includes('tea') || lower.includes('frappe')) {
      return <Coffee size={24} color="#94a3b8" />;
    }
    if (lower.includes('nasi') || lower.includes('spaghetti') || lower.includes('chicken') || lower.includes('goreng')) {
      return <Utensils size={24} color="#94a3b8" />;
    }
    return <Store size={24} color="#94a3b8" />;
  };

  return (
    <TouchableOpacity
      activeOpacity={isUnavailable ? 1 : 0.75}
      disabled={isUnavailable}
      style={{ width: cardWidth }}
      onPress={() => {
        if (!isUnavailable) {
          onPress(product);
        }
      }}
      className={`bg-white rounded-2xl overflow-hidden border border-gray-200/90 shadow-2xs mb-2.5 active:border-blue-400 active:shadow-sm ${
        isUnavailable ? 'opacity-40 bg-gray-100 border-dashed border-gray-300' : ''
      }`}
    >
      {/* Product Image / Graceful Fallback Container */}
      <View className="h-28 w-full bg-slate-100 items-center justify-center relative overflow-hidden">
        {hasImage ? (
          <ExpoImage
            source={{ uri: product.imageUrl! }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            onError={() => setImageError(true)}
          />
        ) : (
          <View className="items-center justify-center w-full h-full bg-slate-50">
            <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center border border-slate-200/60">
              {getFallbackIcon()}
            </View>
          </View>
        )}

        {/* Best Seller / Populer Badge */}
        {product.isFeatured && (
          <View className="absolute top-2 left-2 bg-amber-500/95 flex-row items-center px-1.5 py-0.5 rounded-md shadow-xs">
            <Star size={9} color="#fff" fill="#fff" />
            <Text className="text-white text-[9px] font-black ml-1 tracking-tight">POPULER</Text>
          </View>
        )}

        {/* Modifier Indicator Pill */}
        {hasModifiers && (
          <View className="absolute top-2 right-2 bg-black/50 px-1.5 py-0.5 rounded-md flex-row items-center">
            <SlidersHorizontal size={8} color="#fff" />
            <Text className="text-white text-[8px] font-bold ml-1">Kustom</Text>
          </View>
        )}

        {/* Out of Stock / Deactivated Overlay */}
        {isDeactivated ? (
          <View className="absolute inset-0 bg-slate-950/80 items-center justify-center p-2 z-10">
            <View className="bg-rose-600 px-2.5 py-1 rounded-md shadow-xs">
              <Text className="text-white font-black text-[10px] tracking-wider uppercase">Tidak Tersedia</Text>
            </View>
          </View>
        ) : isOutOfStock ? (
          <View className="absolute inset-0 bg-slate-950/75 items-center justify-center p-2 z-10">
            <View className="bg-amber-600 px-2.5 py-1 rounded-md shadow-xs">
              <Text className="text-white font-black text-[10px] tracking-wider uppercase">Stok Habis</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Product Info Section */}
      <View className="p-2.5 flex-col justify-between flex-1">
        <View>
          <Text
            className="text-gray-900 font-bold text-xs leading-snug"
            numberOfLines={2}
          >
            {product.name}
          </Text>

          {isDeactivated ? (
            <Text className="text-[10px] mt-0.5 font-bold text-rose-500">
              Tidak Tersedia
            </Text>
          ) : product.stock !== null ? (
            <Text className={`text-[10px] mt-0.5 font-medium ${isOutOfStock ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
              {isOutOfStock ? 'Stok Habis' : `Stok: ${product.stock}`}
            </Text>
          ) : null}
        </View>

        {/* Price & Action */}
        <View className="flex-row items-center justify-between mt-2 pt-1.5 border-t border-gray-100">
          <Text className="text-blue-600 font-black text-xs">
            {formatPrice(product.price)}
          </Text>

          <View
            className={`w-6 h-6 rounded-lg items-center justify-center border ${
              isUnavailable 
                ? 'bg-gray-100 border-gray-200' 
                : 'bg-blue-50 border-blue-100 active:bg-blue-600'
            }`}
          >
            <Plus size={13} color={isUnavailable ? '#9ca3af' : '#2563eb'} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});
