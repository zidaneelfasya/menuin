export type BusinessCategoryId =
  | 'coffee_shop'
  | 'restaurant'
  | 'fast_food'
  | 'boba_drink'
  | 'bakery_dessert'
  | 'street_food';

export interface ModifierTemplate {
  name: string;
  price: string;
}

export interface ModifierGroupTemplate {
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  modifiers: ModifierTemplate[];
}

export interface BusinessCategoryConfig {
  id: BusinessCategoryId;
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  modifierGroups: ModifierGroupTemplate[];
}

export const BUSINESS_CATEGORIES: BusinessCategoryConfig[] = [
  {
    id: 'coffee_shop',
    title: 'Coffee Shop',
    subtitle: 'Kedai kopi, manual brew, cafe espresso, dan beverage bar.',
    badge: 'Coffee Shop',
    icon: 'coffee',
    modifierGroups: [
      {
        name: 'Ukuran Gelas',
        isRequired: true,
        minSelections: 1,
        maxSelections: 1,
        modifiers: [
          { name: 'Regular', price: '0' },
          { name: 'Large', price: '5000' },
        ],
      },
      {
        name: 'Tingkat Kemanisan',
        isRequired: true,
        minSelections: 1,
        maxSelections: 1,
        modifiers: [
          { name: 'Normal Sugar', price: '0' },
          { name: 'Less Sugar (50%)', price: '0' },
          { name: 'No Sugar (0%)', price: '0' },
        ],
      },
      {
        name: 'Tingkat Es',
        isRequired: true,
        minSelections: 1,
        maxSelections: 1,
        modifiers: [
          { name: 'Normal Ice', price: '0' },
          { name: 'Less Ice', price: '0' },
          { name: 'Panas / Hot', price: '0' },
        ],
      },
      {
        name: 'Pilihan Susu',
        isRequired: false,
        minSelections: 0,
        maxSelections: 1,
        modifiers: [
          { name: 'Fresh Milk', price: '0' },
          { name: 'Oat Milk (Oatside)', price: '8000' },
          { name: 'Almond Milk', price: '10000' },
        ],
      },
      {
        name: 'Tambahan Espresso',
        isRequired: false,
        minSelections: 0,
        maxSelections: 2,
        modifiers: [
          { name: 'Extra 1 Shot Espresso', price: '6000' },
          { name: 'Extra 2 Shot Espresso', price: '12000' },
        ],
      },
    ],
  },
  {
    id: 'restaurant',
    title: 'Restoran & Cafe',
    subtitle: 'Restoran keluarga, bistro santai, dan aneka makanan berat.',
    badge: 'Restoran',
    icon: 'restaurant',
    modifierGroups: [
      {
        name: 'Level Pedas',
        isRequired: true,
        minSelections: 1,
        maxSelections: 1,
        modifiers: [
          { name: 'Level 0 (Tidak Pedas)', price: '0' },
          { name: 'Level 1 (Sedang)', price: '0' },
          { name: 'Level 2 (Pedas)', price: '0' },
          { name: 'Level 3 (Ekstra Pedas)', price: '0' },
        ],
      },
      {
        name: 'Pilihan Karbohidrat',
        isRequired: false,
        minSelections: 0,
        maxSelections: 1,
        modifiers: [
          { name: 'Nasi Putih', price: '0' },
          { name: 'Nasi Uduk / Gurih', price: '4000' },
          { name: 'Tanpa Nasi', price: '0' },
        ],
      },
      {
        name: 'Tambahan Telur',
        isRequired: false,
        minSelections: 0,
        maxSelections: 2,
        modifiers: [
          { name: 'Telur Ceplok (Mata Sapi)', price: '5000' },
          { name: 'Telur Dadar Gurih', price: '5000' },
        ],
      },
      {
        name: 'Porsi Makanan',
        isRequired: true,
        minSelections: 1,
        maxSelections: 1,
        modifiers: [
          { name: 'Porsi Standar', price: '0' },
          { name: 'Porsi Jumbo', price: '8000' },
        ],
      },
    ],
  },
  {
    id: 'fast_food',
    title: 'Fast Food',
    subtitle: 'Ayam goreng, burger, rice bowl, dan makanan cepat saji.',
    badge: 'Fast Food',
    icon: 'fast_food',
    modifierGroups: [
      {
        name: 'Pilihan Saus & Sambal',
        isRequired: false,
        minSelections: 0,
        maxSelections: 3,
        modifiers: [
          { name: 'Sambal Bawang Pedas', price: '0' },
          { name: 'Sambal Matah Segar', price: '3000' },
          { name: 'Saus Keju Gurih', price: '4000' },
          { name: 'Smoky BBQ Sauce', price: '4000' },
        ],
      },
      {
        name: 'Upgrade Sisi / Sides',
        isRequired: false,
        minSelections: 0,
        maxSelections: 1,
        modifiers: [
          { name: 'French Fries Regular', price: '0' },
          { name: 'Upgrade Large Fries', price: '5000' },
          { name: 'Onion Rings Crispy', price: '7000' },
        ],
      },
    ],
  },
  {
    id: 'boba_drink',
    title: 'Boba & Minuman',
    subtitle: 'Minuman boba kekinian, teh, jus segar, dan aneka minuman dingin.',
    badge: 'Boba & Minuman',
    icon: 'boba_drink',
    modifierGroups: [
      {
        name: 'Topping Boba & Jelly',
        isRequired: false,
        minSelections: 0,
        maxSelections: 4,
        modifiers: [
          { name: 'Brown Sugar Boba', price: '4000' },
          { name: 'Grass Jelly (Cincau)', price: '4000' },
          { name: 'Egg Pudding Lembut', price: '5000' },
          { name: 'Cheese Foam Creamy', price: '6000' },
          { name: 'Nata de Coco', price: '4000' },
        ],
      },
      {
        name: 'Tingkat Kemanisan',
        isRequired: true,
        minSelections: 1,
        maxSelections: 1,
        modifiers: [
          { name: 'Normal Sugar (100%)', price: '0' },
          { name: 'Less Sugar (70%)', price: '0' },
          { name: 'Half Sugar (50%)', price: '0' },
          { name: 'No Sugar (0%)', price: '0' },
        ],
      },
    ],
  },
  {
    id: 'bakery_dessert',
    title: 'Bakery & Dessert',
    subtitle: 'Toko roti, pastry, cake, donat, waffle, dan aneka es krim.',
    badge: 'Bakery & Dessert',
    icon: 'bakery_dessert',
    modifierGroups: [
      {
        name: 'Penyajian Roti & Pastry',
        isRequired: false,
        minSelections: 0,
        maxSelections: 1,
        modifiers: [
          { name: 'Hangat / Dipanggang (Toasted)', price: '0' },
          { name: 'Suhu Ruang', price: '0' },
        ],
      },
      {
        name: 'Extra Topping & Saus Manis',
        isRequired: false,
        minSelections: 0,
        maxSelections: 3,
        modifiers: [
          { name: 'Saus Cokelat Belgia', price: '5000' },
          { name: 'Caramel Drizzle', price: '4000' },
          { name: 'Vanilla Ice Cream Scoop', price: '8000' },
        ],
      },
    ],
  },
  {
    id: 'street_food',
    title: 'Street Food & Bakso',
    subtitle: 'Bakso, mie ayam, soto, sate, martabak, dan kuliner nusantara.',
    badge: 'Street Food',
    icon: 'street_food',
    modifierGroups: [
      {
        name: 'Pilihan Mie & Bihun',
        isRequired: false,
        minSelections: 0,
        maxSelections: 1,
        modifiers: [
          { name: 'Campur (Bihun + Mie Kuning)', price: '0' },
          { name: 'Bihun Saja', price: '0' },
          { name: 'Mie Kuning Saja', price: '0' },
          { name: 'Tanpa Karbo (Sayur Saja)', price: '0' },
        ],
      },
      {
        name: 'Pelengkap Tambahan',
        isRequired: false,
        minSelections: 0,
        maxSelections: 5,
        modifiers: [
          { name: 'Pangsit Goreng Renyah', price: '3000' },
          { name: 'Bakso Goreng Bulat', price: '4000' },
          { name: 'Tahu Bakso Kukus', price: '3000' },
          { name: 'Kerupuk Putih Kaleng', price: '2000' },
        ],
      },
      {
        name: 'Pilihan Kuah & Pedas',
        isRequired: true,
        minSelections: 1,
        maxSelections: 1,
        modifiers: [
          { name: 'Kuah Kaldu Gurih (Biasa)', price: '0' },
          { name: 'Kuah Pedas Sedang', price: '0' },
          { name: 'Kuah Pedas Super', price: '0' },
        ],
      },
    ],
  },
];

/**
 * Helper to compile deduplicated modifier group templates based on selected category IDs.
 */
export function getModifierTemplatesForCategories(categoryIds: string[]): ModifierGroupTemplate[] {
  const selectedCategories = BUSINESS_CATEGORIES.filter((c) => categoryIds.includes(c.id));
  const seenGroupNames = new Set<string>();
  const result: ModifierGroupTemplate[] = [];

  for (const cat of selectedCategories) {
    for (const group of cat.modifierGroups) {
      const normalizedName = group.name.trim().toLowerCase();
      if (!seenGroupNames.has(normalizedName)) {
        seenGroupNames.add(normalizedName);
        result.push(group);
      }
    }
  }

  return result;
}
