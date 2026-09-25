import * as React from 'react';
import {
  Coffee,
  CupSoda,
  GlassWater,
  Wine,
  Beer,
  Milk,
  Utensils,
  UtensilsCrossed,
  Soup,
  Beef,
  Drumstick,
  Fish,
  Sandwich,
  Pizza,
  Cookie,
  Cake,
  IceCream,
  Popcorn,
  Salad,
  Egg,
  Apple,
  Package,
  Sparkles,
  Flame,
  Tag,
  ShoppingBag,
  Boxes,
  Star,
  Tags,
  type LucideIcon,
} from 'lucide-react';

export type CategoryIconItem = {
  name: string;
  label: string;
  group: 'Minuman' | 'Makanan' | 'Snack & Dessert' | 'Paket & Spesial';
  icon: LucideIcon;
};

export const CATEGORY_ICONS: CategoryIconItem[] = [
  // Minuman & Kopi
  { name: 'Coffee', label: 'Kopi & Cafe', group: 'Minuman', icon: Coffee },
  { name: 'CupSoda', label: 'Minuman Dingin / Soda', group: 'Minuman', icon: CupSoda },
  { name: 'GlassWater', label: 'Air Mineral / Fresh', group: 'Minuman', icon: GlassWater },
  { name: 'Milk', label: 'Susu / Boba / Dairy', group: 'Minuman', icon: Milk },
  { name: 'Wine', label: 'Mocktail / Bar', group: 'Minuman', icon: Wine },
  { name: 'Beer', label: 'Minuman Kaleng / Beer', group: 'Minuman', icon: Beer },

  // Makanan Utama
  { name: 'Utensils', label: 'Makanan Umum', group: 'Makanan', icon: Utensils },
  { name: 'UtensilsCrossed', label: 'Resto & Dine In', group: 'Makanan', icon: UtensilsCrossed },
  { name: 'Soup', label: 'Sup / Kuah / Ramen', group: 'Makanan', icon: Soup },
  { name: 'Drumstick', label: 'Ayam / Gorengan', group: 'Makanan', icon: Drumstick },
  { name: 'Beef', label: 'Daging / Steak', group: 'Makanan', icon: Beef },
  { name: 'Fish', label: 'Seafood / Ikan', group: 'Makanan', icon: Fish },
  { name: 'Sandwich', label: 'Roti Lapis / Toast', group: 'Makanan', icon: Sandwich },

  // Snack & Dessert
  { name: 'Pizza', label: 'Pizza & Pasta', group: 'Snack & Dessert', icon: Pizza },
  { name: 'Cookie', label: 'Kue Kering / Cookie', group: 'Snack & Dessert', icon: Cookie },
  { name: 'Cake', label: 'Kue / Bakery', group: 'Snack & Dessert', icon: Cake },
  { name: 'IceCream', label: 'Es Krim / Gelato', group: 'Snack & Dessert', icon: IceCream },
  { name: 'Popcorn', label: 'Camilan / Snack', group: 'Snack & Dessert', icon: Popcorn },
  { name: 'Salad', label: 'Salad / Sehat', group: 'Snack & Dessert', icon: Salad },
  { name: 'Egg', label: 'Sarapan / Telur', group: 'Snack & Dessert', icon: Egg },
  { name: 'Apple', label: 'Buah Segar', group: 'Snack & Dessert', icon: Apple },

  // Paket & Spesial
  { name: 'Package', label: 'Paket Menu / Combo', group: 'Paket & Spesial', icon: Package },
  { name: 'Sparkles', label: 'Menu Signature', group: 'Paket & Spesial', icon: Sparkles },
  { name: 'Flame', label: 'Menu Pedas / Hot', group: 'Paket & Spesial', icon: Flame },
  { name: 'Star', label: 'Best Seller / Favorit', group: 'Paket & Spesial', icon: Star },
  { name: 'Tag', label: 'Diskon / Promo', group: 'Paket & Spesial', icon: Tag },
  { name: 'ShoppingBag', label: 'Takeaway / Paket Bawa', group: 'Paket & Spesial', icon: ShoppingBag },
  { name: 'Boxes', label: 'Bundling / Grosir', group: 'Paket & Spesial', icon: Boxes },
];

export const CATEGORY_ICON_MAP = new Map<string, LucideIcon>(
  CATEGORY_ICONS.map((item) => [item.name, item.icon])
);

export function getCategoryIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Tags;
  return CATEGORY_ICON_MAP.get(iconName) || Tags;
}
