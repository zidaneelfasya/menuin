import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Plus, Star, Store, Utensils, Coffee, SlidersHorizontal } from 'lucide-react-native';
import { Product } from '@/hooks/use-pos-data';

interface ProductCardProps {
  product: Product;
  cardWidth: number;
  onPress: (product: Product) => void;
  formatPrice: (price: string | number) => string;
}

export const ProductCard = React.memo(function ProductCard({
  product,
  cardWidth,
  onPress,
  formatPrice,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const hasImage = Boolean(
    product.imageUrl &&
    product.imageUrl.trim().length > 0 &&
    !imageError
  );

  const hasModifiers = product.modifierGroupIds && product.modifierGroupIds.length > 0;
  const isOutOfStock = product.stock !== null && product.stock <= 0;

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
      activeOpacity={0.75}
      style={{ width: cardWidth }}
      disabled={isOutOfStock}
      onPress={() => onPress(product)}
      className={`bg-white rounded-2xl overflow-hidden border border-gray-200/90 shadow-2xs mb-2.5 active:border-blue-400 active:shadow-sm ${
        isOutOfStock ? 'opacity-50' : ''
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

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <View className="absolute inset-0 bg-black/60 items-center justify-center">
            <Text className="text-white font-black text-xs tracking-wider uppercase">Habis</Text>
          </View>
        )}
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

          {product.stock !== null && (
            <Text className={`text-[10px] mt-0.5 font-medium ${isOutOfStock ? 'text-rose-500 font-bold' : 'text-gray-400'}`}>
              {isOutOfStock ? 'Stok Habis' : `Stok: ${product.stock}`}
            </Text>
          )}
        </View>

        {/* Price & Quick Add Button */}
        <View className="flex-row items-center justify-between mt-2 pt-1.5 border-t border-gray-100">
          <Text className="text-blue-600 font-black text-xs">
            {formatPrice(product.price)}
          </Text>

          <View className="w-6 h-6 bg-blue-50 rounded-lg items-center justify-center border border-blue-100 active:bg-blue-600">
            <Plus size={13} color="#2563eb" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});
