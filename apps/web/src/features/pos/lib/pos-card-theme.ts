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
  type LucideIcon,
} from 'lucide-react';
import { getCategoryIcon } from '@/features/categories/lib/category-icons';

export type PosCardPalette = {
  id: string;
  name: string;
  bgHex: string;
  borderHex: string;
  hoverBorderHex: string;
  textPrimaryHex: string;
  textSecondaryHex: string;
  iconBgHex: string;
  iconColorHex: string;
  badgeBgHex: string;
  badgeTextHex: string;
  activeRingHex: string;
};

// 12 Curated high-contrast pastel palettes matching the modern POS reference image
export const POS_CARD_PALETTES: PosCardPalette[] = [
  {
    id: 'mint-sage',
    name: 'Mint Sage',
    bgHex: '#D6EDE2',
    borderHex: '#B2DEC8',
    hoverBorderHex: '#7FCBA4',
    textPrimaryHex: '#123829',
    textSecondaryHex: '#285741',
    iconBgHex: '#BFDECD',
    iconColorHex: '#123829',
    badgeBgHex: '#C5E2D2',
    badgeTextHex: '#123829',
    activeRingHex: '#2E7D56',
  },
  {
    id: 'lilac-orchid',
    name: 'Lilac Orchid',
    bgHex: '#EBDCF2',
    borderHex: '#D9BFEC',
    hoverBorderHex: '#BD90DF',
    textPrimaryHex: '#381B45',
    textSecondaryHex: '#563165',
    iconBgHex: '#DFC8EA',
    iconColorHex: '#381B45',
    badgeBgHex: '#E2CEEC',
    badgeTextHex: '#381B45',
    activeRingHex: '#773E8A',
  },
  {
    id: 'sky-blue',
    name: 'Sky Blue',
    bgHex: '#D2EAF5',
    borderHex: '#B4DAED',
    hoverBorderHex: '#7ABCE1',
    textPrimaryHex: '#133748',
    textSecondaryHex: '#28576E',
    iconBgHex: '#BCDFEF',
    iconColorHex: '#133748',
    badgeBgHex: '#C3E2F1',
    badgeTextHex: '#133748',
    activeRingHex: '#2A759B',
  },
  {
    id: 'periwinkle',
    name: 'Periwinkle',
    bgHex: '#DDD9F5',
    borderHex: '#C4BEEA',
    hoverBorderHex: '#9B91DE',
    textPrimaryHex: '#241F4F',
    textSecondaryHex: '#3D3678',
    iconBgHex: '#CBC4ED',
    iconColorHex: '#241F4F',
    badgeBgHex: '#D1CBEF',
    badgeTextHex: '#241F4F',
    activeRingHex: '#4F4697',
  },
  {
    id: 'rose-blush',
    name: 'Rose Blush',
    bgHex: '#FCDCE6',
    borderHex: '#F8BDD0',
    hoverBorderHex: '#EE88A8',
    textPrimaryHex: '#4E192D',
    textSecondaryHex: '#742B47',
    iconBgHex: '#F7C6D6',
    iconColorHex: '#4E192D',
    badgeBgHex: '#F9CCD9',
    badgeTextHex: '#4E192D',
    activeRingHex: '#A83762',
  },
  {
    id: 'peach-cream',
    name: 'Peach Cream',
    bgHex: '#FDE7DC',
    borderHex: '#F8CFBA',
    hoverBorderHex: '#EDA47F',
    textPrimaryHex: '#4A2414',
    textSecondaryHex: '#6F3C24',
    iconBgHex: '#F9D7C5',
    iconColorHex: '#4A2414',
    badgeBgHex: '#F9D9C9',
    badgeTextHex: '#4A2414',
    activeRingHex: '#9C512C',
  },
  {
    id: 'coral-melon',
    name: 'Coral Melon',
    bgHex: '#FEDDDA',
    borderHex: '#FAC0BA',
    hoverBorderHex: '#F28C81',
    textPrimaryHex: '#4C1A19',
    textSecondaryHex: '#742C2A',
    iconBgHex: '#F9CAC5',
    iconColorHex: '#4C1A19',
    badgeBgHex: '#F9CCC7',
    badgeTextHex: '#4C1A19',
    activeRingHex: '#9F3532',
  },
  {
    id: 'crisp-emerald',
    name: 'Crisp Emerald',
    bgHex: '#CFF3E6',
    borderHex: '#ADE8D3',
    hoverBorderHex: '#6ED4AF',
    textPrimaryHex: '#103D30',
    textSecondaryHex: '#1F5C4A',
    iconBgHex: '#B8EBDA',
    iconColorHex: '#103D30',
    badgeBgHex: '#BDECDD',
    badgeTextHex: '#103D30',
    activeRingHex: '#268A6B',
  },
  {
    id: 'honey-butter',
    name: 'Honey Butter',
    bgHex: '#FEF1D4',
    borderHex: '#FBE2A7',
    hoverBorderHex: '#EFC45E',
    textPrimaryHex: '#45330D',
    textSecondaryHex: '#6D5319',
    iconBgHex: '#FBE5B4',
    iconColorHex: '#45330D',
    badgeBgHex: '#FCE7BD',
    badgeTextHex: '#45330D',
    activeRingHex: '#916E1F',
  },
  {
    id: 'aqua-lagoon',
    name: 'Aqua Lagoon',
    bgHex: '#D2F2F4',
    borderHex: '#B0E5EA',
    hoverBorderHex: '#6FD1DC',
    textPrimaryHex: '#0E383F',
    textSecondaryHex: '#1A5B65',
    iconBgHex: '#BCE6EC',
    iconColorHex: '#0E383F',
    badgeBgHex: '#C2E8ED',
    badgeTextHex: '#0E383F',
    activeRingHex: '#1E7785',
  },
  {
    id: 'heather-mauve',
    name: 'Heather Mauve',
    bgHex: '#E5DEF4',
    borderHex: '#CEC3EC',
    hoverBorderHex: '#A28FDC',
    textPrimaryHex: '#311E4E',
    textSecondaryHex: '#503577',
    iconBgHex: '#D6CBEB',
    iconColorHex: '#311E4E',
    badgeBgHex: '#DACFEC',
    badgeTextHex: '#311E4E',
    activeRingHex: '#69429E',
  },
  {
    id: 'celadon-sage',
    name: 'Celadon Sage',
    bgHex: '#E2F3DD',
    borderHex: '#C8E8BF',
    hoverBorderHex: '#92D47E',
    textPrimaryHex: '#1B3C14',
    textSecondaryHex: '#2F5E24',
    iconBgHex: '#D3ECCB',
    iconColorHex: '#1B3C14',
    badgeBgHex: '#D7EDD0',
    badgeTextHex: '#1B3C14',
    activeRingHex: '#3D852B',
  },
];

/**
 * Assigns a deterministic palette so adjacent cards have different colors,
 * mimicking the colorful mosaic in the reference screenshot.
 */
export function getPosCardPalette(index: number): PosCardPalette {
  return POS_CARD_PALETTES[Math.abs(index) % POS_CARD_PALETTES.length];
}

/**
 * Assigns a deterministic palette based on product name hash as a fallback.
 */
export function getPosCardPaletteByName(name: string): PosCardPalette {
  if (!name) return POS_CARD_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return POS_CARD_PALETTES[Math.abs(hash) % POS_CARD_PALETTES.length];
}

/**
 * Returns 1 or 2 letter initials for a product name (e.g., 'Mix Platter' -> 'MP').
 */
export function getProductInitials(name: string): string {
  if (!name) return '?';
  const clean = name.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

/**
 * Intelligently maps product names and category to a relevant Lucide icon.
 */
export function getProductCardIcon(
  productName: string,
  categoryIconName?: string | null
): LucideIcon {
  const name = productName.toLowerCase();

  // Beverages & Coffee
  if (name.includes('kopi') || name.includes('coffee') || name.includes('espresso') || name.includes('latte') || name.includes('cappuccino') || name.includes('americano') || name.includes('mocha')) {
    return Coffee;
  }
  if (name.includes('teh') || name.includes('tea') || name.includes('matcha') || name.includes('boba') || name.includes('milk') || name.includes('susu')) {
    return Milk;
  }
  if (name.includes('soda') || name.includes('cola') || name.includes('fanta') || name.includes('sprite') || name.includes('lemon') || name.includes('juice') || name.includes('jus') || name.includes('es ') || name.includes('ice') || name.includes('frappe')) {
    return CupSoda;
  }
  if (name.includes('air') || name.includes('mineral') || name.includes('aqua') || name.includes('water')) {
    return GlassWater;
  }
  if (name.includes('wine') || name.includes('cocktail') || name.includes('mocktail') || name.includes('alkohol') || name.includes('alcohol')) {
    return Wine;
  }
  if (name.includes('beer') || name.includes('bir')) {
    return Beer;
  }

  // Soups & Noodles
  if (name.includes('soup') || name.includes('sup') || name.includes('soto') || name.includes('ramen') || name.includes('bakso') || name.includes('rawon') || name.includes('kuah') || name.includes('tom yum')) {
    return Soup;
  }

  // Meats & Poultry
  if (name.includes('ayam') || name.includes('chicken') || name.includes('bebek') || name.includes('duck') || name.includes('drumstick') || name.includes('wings') || name.includes('sayap')) {
    return Drumstick;
  }
  if (name.includes('daging') || name.includes('beef') || name.includes('steak') || name.includes('rendang') || name.includes('sapi') || name.includes('iga') || name.includes('ribs')) {
    return Beef;
  }

  // Seafood
  if (name.includes('ikan') || name.includes('fish') || name.includes('seafood') || name.includes('udang') || name.includes('cumi') || name.includes('salmon') || name.includes('sushi') || name.includes('tuna') || name.includes('shrimp')) {
    return Fish;
  }

  // Bakery & Toast
  if (name.includes('burger') || name.includes('sandwich') || name.includes('toast') || name.includes('hotdog') || name.includes('roti') || name.includes('bread') || name.includes('croissant')) {
    return Sandwich;
  }

  // Pizza & Pasta
  if (name.includes('pizza') || name.includes('pasta') || name.includes('spaghetti') || name.includes('lasagna') || name.includes('fettuccine') || name.includes('macaroni')) {
    return Pizza;
  }

  // Desserts & Sweets
  if (name.includes('kue') || name.includes('cake') || name.includes('brownies') || name.includes('tart') || name.includes('muffin') || name.includes('cupcake')) {
    return Cake;
  }
  if (name.includes('cookie') || name.includes('cookies') || name.includes('biskuit')) {
    return Cookie;
  }
  if (name.includes('es krim') || name.includes('ice cream') || name.includes('gelato') || name.includes('sundae')) {
    return IceCream;
  }
  if (name.includes('snack') || name.includes('camilan') || name.includes('kentang') || name.includes('fries') || name.includes('popcorn') || name.includes('keripik') || name.includes('chips')) {
    return Popcorn;
  }
  if (name.includes('salad') || name.includes('sayur') || name.includes('vegetable')) {
    return Salad;
  }
  if (name.includes('telur') || name.includes('egg') || name.includes('sarapan') || name.includes('breakfast') || name.includes('omelet')) {
    return Egg;
  }
  if (name.includes('buah') || name.includes('fruit') || name.includes('apple') || name.includes('pisang') || name.includes('banana')) {
    return Apple;
  }

  // Special / Combos
  if (name.includes('paket') || name.includes('combo') || name.includes('set') || name.includes('bundling')) {
    return Package;
  }
  if (name.includes('pedas') || name.includes('spicy') || name.includes('hot') || name.includes('fire')) {
    return Flame;
  }
  if (name.includes('spesial') || name.includes('special') || name.includes('signature')) {
    return Sparkles;
  }
  if (name.includes('nasi') || name.includes('rice') || name.includes('mie') || name.includes('noodle') || name.includes('bihun') || name.includes('kwetiau')) {
    return UtensilsCrossed;
  }

  // Fallback to category icon if set
  if (categoryIconName) {
    return getCategoryIcon(categoryIconName);
  }

  return Utensils;
}
