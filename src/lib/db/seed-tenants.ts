import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

// GS1 style Barcode generator (EAN-13 Indonesia 899 prefix)
function generateBarcode() {
  const prefix = '899';
  const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString();
  const code = prefix + randomPart;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit.toString();
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to register user in Supabase Auth if URL & Key are available
async function registerSupabaseAuth(email: string, password: string = 'password123', name: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return;

  try {
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
  } catch (err) {
    // Ignore if already registered
  }
}

// -------------------------------------------------------------
// TENANTS DEFINITIONS
// -------------------------------------------------------------
interface ProductDef {
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  imageUrl?: string | null;
}

interface CategoryDef {
  name: string;
  slug: string;
  products: ProductDef[];
}

interface TenantDef {
  name: string;
  isPaid: boolean;
  users: {
    name: string;
    email: string;
    role: 'SUPERADMIN' | 'CASHIER';
  }[];
  categories: CategoryDef[];
}

const TENANTS_DATA: TenantDef[] = [
  // 1. KOPI SENJA UTAMA (Cafe & Specialty Coffee)
  {
    name: 'Kopi Senja Utama',
    isPaid: true,
    users: [
      { name: 'Zidane Elfasya', email: 'elfasyazidan1@gmail.com', role: 'SUPERADMIN' },
      { name: 'Budi Santoso (Owner)', email: 'owner.kopi@menuin.com', role: 'SUPERADMIN' },
      { name: 'Rian Pratama (Kasir Pagi)', email: 'kasir.kopi@menuin.com', role: 'CASHIER' },
      { name: 'Siti Rahma (Kasir Sore)', email: 'kasir2.kopi@menuin.com', role: 'CASHIER' },
    ],
    categories: [
      {
        name: 'Espresso Based',
        slug: 'espresso-based',
        products: [
          { name: 'Kopi Susu Gula Aren', sku: 'KSJ-ESP-001', price: 22000, costPrice: 9000, stock: 120, minStock: 20, imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' },
          { name: 'Caffe Latte Double Shot', sku: 'KSJ-ESP-002', price: 28000, costPrice: 11000, stock: 85, minStock: 15, imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80' },
          { name: 'Caramel Macchiato Iced', sku: 'KSJ-ESP-003', price: 32000, costPrice: 13000, stock: 60, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80' },
          { name: 'Americano Ice Reserve', sku: 'KSJ-ESP-004', price: 20000, costPrice: 6000, stock: 150, minStock: 20, imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80' },
          { name: 'Cappuccino Cinnamon', sku: 'KSJ-ESP-005', price: 28000, costPrice: 10000, stock: 70, minStock: 15, imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80' },
        ],
      },
      {
        name: 'Manual Brew & Filter',
        slug: 'manual-brew',
        products: [
          { name: 'V60 Gayo Natural', sku: 'KSJ-MBW-001', price: 35000, costPrice: 15000, stock: 40, minStock: 8, imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80' },
          { name: 'Japanese Cold Drip Ethiopia', sku: 'KSJ-MBW-002', price: 38000, costPrice: 16000, stock: 35, minStock: 5, imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80' },
          { name: 'Aeropress Toraja Sapan', sku: 'KSJ-MBW-003', price: 33000, costPrice: 14000, stock: 30, minStock: 5, imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=600&q=80' },
        ],
      },
      {
        name: 'Non-Coffee & Mocktails',
        slug: 'non-coffee',
        products: [
          { name: 'Matcha Latte Uji Kyoto', sku: 'KSJ-NCF-001', price: 30000, costPrice: 12000, stock: 90, minStock: 15, imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80' },
          { name: 'Earl Grey Milk Tea Grass Jelly', sku: 'KSJ-NCF-002', price: 26000, costPrice: 10000, stock: 75, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1558857563-b37dfef6b896?auto=format&fit=crop&w=600&q=80' },
          { name: 'Berry Sunset Sparkler (Mocktail)', sku: 'KSJ-NCF-003', price: 28000, costPrice: 9000, stock: 65, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80' },
          { name: 'Dark Chocolate Hazelnut Ice', sku: 'KSJ-NCF-004', price: 29000, costPrice: 11000, stock: 80, minStock: 15, imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80' },
        ],
      },
      {
        name: 'Pastry & Light Bites',
        slug: 'pastry-toast',
        products: [
          { name: 'Butter Croissant French Style', sku: 'KSJ-PST-001', price: 25000, costPrice: 12000, stock: 45, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1e4006aaeb?auto=format&fit=crop&w=600&q=80' },
          { name: 'Almond Pain au Chocolat', sku: 'KSJ-PST-002', price: 32000, costPrice: 16000, stock: 30, minStock: 8, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
          { name: 'Truffle Fries with Aioli', sku: 'KSJ-PST-003', price: 30000, costPrice: 11000, stock: 60, minStock: 12, imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80' },
          { name: 'Cinnamon Roll Cream Cheese', sku: 'KSJ-PST-004', price: 26000, costPrice: 12000, stock: 35, minStock: 8, imageUrl: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=600&q=80' },
        ],
      },
      {
        name: 'Main Course & Bowls',
        slug: 'main-course',
        products: [
          { name: 'Beef Gyudon Truffle Mayo', sku: 'KSJ-MNC-001', price: 48000, costPrice: 24000, stock: 40, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80' },
          { name: 'Spaghetti Aglio Olio Smoked Beef', sku: 'KSJ-MNC-002', price: 42000, costPrice: 19000, stock: 35, minStock: 8, imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80' },
          { name: 'Chicken Nanban Rice Bowl', sku: 'KSJ-MNC-003', price: 45000, costPrice: 20000, stock: 50, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80' },
        ],
      },
    ],
  },

  // 2. RESTO PADANG SEDERHANA MINANG (Indonesian Cuisine)
  {
    name: 'Resto Padang Sederhana Minang',
    isPaid: true,
    users: [
      { name: 'H. Syahril Efendi (Owner)', email: 'owner.padang@menuin.com', role: 'SUPERADMIN' },
      { name: 'Ahmad Fauzi (Kasir)', email: 'kasir.padang@menuin.com', role: 'CASHIER' },
    ],
    categories: [
      {
        name: 'Aneka Lauk Daging',
        slug: 'lauk-daging',
        products: [
          { name: 'Rendang Sapi Daging Pilihan (Porsi)', sku: 'PDG-DGG-001', price: 26000, costPrice: 16000, stock: 80, minStock: 15, imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80' },
          { name: 'Dendeng Batokok Cabe Merah', sku: 'PDG-DGG-002', price: 25000, costPrice: 15000, stock: 60, minStock: 12, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80' },
          { name: 'Gulai Tunjang Sapi Gurih', sku: 'PDG-DGG-003', price: 28000, costPrice: 17000, stock: 45, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=600&q=80' },
          { name: 'Cincang Daging Kuah Pedas', sku: 'PDG-DGG-004', price: 24000, costPrice: 14000, stock: 50, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' },
        ],
      },
      {
        name: 'Aneka Ayam & Bebek',
        slug: 'lauk-ayam',
        products: [
          { name: 'Ayam Pop Sambalado', sku: 'PDG-AYM-001', price: 22000, costPrice: 13000, stock: 90, minStock: 20, imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80' },
          { name: 'Ayam Bakar Padang Bumbu Rempah', sku: 'PDG-AYM-002', price: 22000, costPrice: 13000, stock: 75, minStock: 15, imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80' },
          { name: 'Gulai Ayam Kampung Kuah Kuning', sku: 'PDG-AYM-003', price: 24000, costPrice: 14000, stock: 60, minStock: 12, imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80' },
          { name: 'Bebek Goreng Cabe Ijo', sku: 'PDG-AYM-004', price: 32000, costPrice: 19000, stock: 40, minStock: 8, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
        ],
      },
      {
        name: 'Ikan & Seafood',
        slug: 'ikan-seafood',
        products: [
          { name: 'Gulai Kepala Kakap Merah Jumbo', sku: 'PDG-SEA-001', price: 65000, costPrice: 38000, stock: 25, minStock: 5, imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80' },
          { name: 'Ikan Kembung Bakar Padang', sku: 'PDG-SEA-002', price: 18000, costPrice: 10000, stock: 60, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80' },
          { name: 'Cumi Balado Merah Kenyal', sku: 'PDG-SEA-003', price: 26000, costPrice: 15000, stock: 45, minStock: 8, imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80' },
        ],
      },
      {
        name: 'Sayur & Pelengkap',
        slug: 'sayur-pelengkap',
        products: [
          { name: 'Nasi Putih Pulen Porsi', sku: 'PDG-SYR-001', price: 8000, costPrice: 3000, stock: 200, minStock: 30, imageUrl: null },
          { name: 'Gulai Daun Singkong & Nangka', sku: 'PDG-SYR-002', price: 7000, costPrice: 2500, stock: 100, minStock: 15, imageUrl: null },
          { name: 'Perkedel Kentang Padang Gurih', sku: 'PDG-SYR-003', price: 6000, costPrice: 2000, stock: 120, minStock: 20, imageUrl: null },
          { name: 'Telur Dadar Padang Crispy Tebal', sku: 'PDG-SYR-004', price: 12000, costPrice: 5000, stock: 90, minStock: 15, imageUrl: null },
        ],
      },
      {
        name: 'Minuman Segar',
        slug: 'minuman-padang',
        products: [
          { name: 'Es Teh Manis Padang Jumbo', sku: 'PDG-MNM-001', price: 6000, costPrice: 1500, stock: 300, minStock: 50, imageUrl: null },
          { name: 'Teh Talua (Teh Telur Khas Minang)', sku: 'PDG-MNM-002', price: 16000, costPrice: 6000, stock: 50, minStock: 10, imageUrl: null },
          { name: 'Jus Alpukat Kocok Kental Cokelat', sku: 'PDG-MNM-003', price: 18000, costPrice: 8000, stock: 60, minStock: 12, imageUrl: null },
          { name: 'Es Jeruk Peras Segar Asli', sku: 'PDG-MNM-004', price: 10000, costPrice: 4000, stock: 100, minStock: 20, imageUrl: null },
        ],
      },
    ],
  },

  // 3. BOLU & BAKERY IBU ANISA (Pastry, Cake & Bakery)
  {
    name: 'Bolu & Bakery Ibu Anisa',
    isPaid: true,
    users: [
      { name: 'Ibu Anisa Permata (Owner)', email: 'owner.bakery@menuin.com', role: 'SUPERADMIN' },
      { name: 'Dewi Lestari (Kasir)', email: 'kasir.bakery@menuin.com', role: 'CASHIER' },
    ],
    categories: [
      {
        name: 'Bolu Panggang & Marmer',
        slug: 'bolu-panggang',
        products: [
          { name: 'Bolu Jadul Mocca Ceres Special', sku: 'ANISA-BLP-001', price: 48000, costPrice: 24000, stock: 35, minStock: 8, imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80' },
          { name: 'Bolu Keju Panggang Cheddar', sku: 'ANISA-BLP-002', price: 55000, costPrice: 28000, stock: 30, minStock: 6, imageUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=600&q=80' },
          { name: 'Bolu Marmer Wijsman Klasik', sku: 'ANISA-BLP-003', price: 65000, costPrice: 34000, stock: 25, minStock: 5, imageUrl: 'https://images.unsplash.com/photo-1614707664673-8cb962c035f2?auto=format&fit=crop&w=600&q=80' },
          { name: 'Banana Cake Choco Crunchy', sku: 'ANISA-BLP-004', price: 42000, costPrice: 20000, stock: 40, minStock: 8, imageUrl: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=80' },
        ],
      },
      {
        name: 'Bolu Kukus Lembut',
        slug: 'bolu-kukus',
        products: [
          { name: 'Bolu Kukus Pandan Wangi Santan', sku: 'ANISA-BLK-001', price: 38000, costPrice: 18000, stock: 45, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
          { name: 'Bolu Kukus Ketan Hitam Kelapa', sku: 'ANISA-BLK-002', price: 42000, costPrice: 20000, stock: 35, minStock: 8, imageUrl: null },
          { name: 'Lapis Talas Keju Bogor', sku: 'ANISA-BLK-003', price: 45000, costPrice: 22000, stock: 30, minStock: 6, imageUrl: null },
        ],
      },
      {
        name: 'Kue Kering & Hampers',
        slug: 'kue-kering',
        products: [
          { name: 'Nastar Wisman Nanas Lumer (Toples 500g)', sku: 'ANISA-KKR-001', price: 95000, costPrice: 52000, stock: 50, minStock: 12, imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80' },
          { name: 'Kastengel Keju Edam Gurih (Toples 500g)', sku: 'ANISA-KKR-002', price: 105000, costPrice: 58000, stock: 40, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1596647909339-da5af948192a?auto=format&fit=crop&w=600&q=80' },
          { name: 'Putri Salju Mete Premium (Toples 500g)', sku: 'ANISA-KKR-003', price: 88000, costPrice: 46000, stock: 35, minStock: 8, imageUrl: null },
          { name: 'Lidah Kucing Crispy Butter (Toples 400g)', sku: 'ANISA-KKR-004', price: 75000, costPrice: 38000, stock: 45, minStock: 10, imageUrl: null },
        ],
      },
      {
        name: 'Roti Manis & Sobek',
        slug: 'roti-manis',
        products: [
          { name: 'Roti Cokelat Belgia Lumer', sku: 'ANISA-RTI-001', price: 14000, costPrice: 6500, stock: 80, minStock: 15, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
          { name: 'Roti Keju Susu Hokkaido', sku: 'ANISA-RTI-002', price: 14000, costPrice: 6500, stock: 75, minStock: 15, imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=600&q=80' },
          { name: 'Roti Sobek Butter Cream Daging Asap', sku: 'ANISA-RTI-003', price: 28000, costPrice: 13000, stock: 40, minStock: 8, imageUrl: null },
          { name: 'Roti Sisir Mentega Gula Klasik', sku: 'ANISA-RTI-004', price: 16000, costPrice: 7000, stock: 50, minStock: 10, imageUrl: null },
        ],
      },
    ],
  },

  // 4. WARUNG SEMBAKO BERKAH JAYA (Retail & FMCG)
  {
    name: 'Warung Sembako Berkah Jaya',
    isPaid: true,
    users: [
      { name: 'Pak Joko Widodo (Owner)', email: 'owner.sembako@menuin.com', role: 'SUPERADMIN' },
      { name: 'Agus Setiawan (Kasir)', email: 'kasir.sembako@menuin.com', role: 'CASHIER' },
    ],
    categories: [
      {
        name: 'Bahan Pokok & Sembako',
        slug: 'sembako',
        products: [
          { name: 'Beras Pandan Wangi Super 5kg', sku: 'SBK-POK-001', price: 82000, costPrice: 74000, stock: 65, minStock: 15, imageUrl: null },
          { name: 'Minyak Goreng Bimoli Pouch 2L', sku: 'SBK-POK-002', price: 37500, costPrice: 34000, stock: 80, minStock: 20, imageUrl: null },
          { name: 'Gula Pasir Gulaku 1kg', sku: 'SBK-POK-003', price: 17500, costPrice: 15500, stock: 110, minStock: 25, imageUrl: null },
          { name: 'Tepung Terigu Segitiga Biru 1kg', sku: 'SBK-POK-004', price: 13500, costPrice: 11800, stock: 95, minStock: 20, imageUrl: null },
          { name: 'Telur Ayam Negeri Fresh (1kg)', sku: 'SBK-POK-005', price: 29000, costPrice: 26000, stock: 70, minStock: 15, imageUrl: null },
        ],
      },
      {
        name: 'Mie Instan & Makanan Cepat',
        slug: 'mie-instan',
        products: [
          { name: 'Indomie Goreng Original (Dus/40pcs)', sku: 'SBK-MIE-001', price: 118000, costPrice: 108000, stock: 40, minStock: 10, imageUrl: null },
          { name: 'Indomie Ayam Bawang (Satuan)', sku: 'SBK-MIE-002', price: 3500, costPrice: 2800, stock: 350, minStock: 50, imageUrl: null },
          { name: 'Sedaap Mie Kuah Soto (Satuan)', sku: 'SBK-MIE-003', price: 3500, costPrice: 2800, stock: 280, minStock: 50, imageUrl: null },
          { name: 'Sarden ABC Saus Tomat 425g', sku: 'SBK-MIE-004', price: 23000, costPrice: 19500, stock: 60, minStock: 12, imageUrl: null },
        ],
      },
      {
        name: 'Minuman Kemasan Dingin & Botol',
        slug: 'minuman-kemasan',
        products: [
          { name: 'Aqua Air Mineral Botol 600ml', sku: 'SBK-MNM-001', price: 4000, costPrice: 2500, stock: 240, minStock: 48, imageUrl: null },
          { name: 'Teh Botol Sosro Kotak 250ml', sku: 'SBK-MNM-002', price: 4500, costPrice: 3200, stock: 180, minStock: 30, imageUrl: null },
          { name: 'Ultra Milk Cokelat 250ml', sku: 'SBK-MNM-003', price: 6500, costPrice: 5200, stock: 150, minStock: 25, imageUrl: null },
          { name: 'Pocari Sweat Can 330ml', sku: 'SBK-MNM-004', price: 8000, costPrice: 6500, stock: 90, minStock: 20, imageUrl: null },
        ],
      },
      {
        name: 'Kebutuhan Rumah & Kebersihan',
        slug: 'household',
        products: [
          { name: 'Sunlight Pencuci Piring Jeruk Nipis 750ml', sku: 'SBK-HSD-001', price: 16000, costPrice: 13500, stock: 70, minStock: 15, imageUrl: null },
          { name: 'Rinso Detergent Bubuk Molto 800g', sku: 'SBK-HSD-002', price: 24000, costPrice: 20500, stock: 55, minStock: 10, imageUrl: null },
          { name: 'Lifebuoy Sabun Cair Total 10 Pouch 450ml', sku: 'SBK-HSD-003', price: 22500, costPrice: 18500, stock: 60, minStock: 12, imageUrl: null },
        ],
      },
    ],
  },

  // 5. KEDAI SEBLAK & BOBA VIRAL (Street Food & Fast Casual - Free Trial)
  {
    name: 'Kedai Seblak & Boba Viral',
    isPaid: false, // Free Trial Tenant
    users: [
      { name: 'Rina Marlina (Owner)', email: 'owner.seblak@menuin.com', role: 'SUPERADMIN' },
      { name: 'Dimas Anggara (Kasir)', email: 'kasir.seblak@menuin.com', role: 'CASHIER' },
    ],
    categories: [
      {
        name: 'Seblak Komplit Prasmanan',
        slug: 'seblak-komplit',
        products: [
          { name: 'Seblak Komplit Juara Level 3 (Telur, Ceker, Sosis, Bakso, Kerupuk)', sku: 'SBL-SBL-001', price: 22000, costPrice: 9000, stock: 80, minStock: 15, imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80' },
          { name: 'Seblak Seafood Mercon Level 5 (Dumpling, Chikuwa, Crabstick)', sku: 'SBL-SBL-002', price: 27000, costPrice: 12000, stock: 60, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80' },
          { name: 'Seblak Tulang Rawan Pedas Nampol', sku: 'SBL-SBL-003', price: 24000, costPrice: 10000, stock: 50, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=600&q=80' },
        ],
      },
      {
        name: 'Snack & Gorengan Crispy',
        slug: 'snack-gorengan',
        products: [
          { name: 'Cireng Krispy Bumbu Rujak Pedas', sku: 'SBL-SNK-001', price: 15000, costPrice: 5000, stock: 90, minStock: 15, imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80' },
          { name: 'Basreng Pedas Daun Jeruk 150g', sku: 'SBL-SNK-002', price: 12000, costPrice: 4500, stock: 110, minStock: 20, imageUrl: null },
          { name: 'Tahu Walik Crispy Sambal Kecap', sku: 'SBL-SNK-003', price: 16000, costPrice: 6000, stock: 70, minStock: 12, imageUrl: null },
        ],
      },
      {
        name: 'Boba Tea & Milkshake',
        slug: 'boba-milktea',
        products: [
          { name: 'Brown Sugar Boba Fresh Milk Jumbo', sku: 'SBL-BOB-001', price: 20000, costPrice: 7500, stock: 130, minStock: 25, imageUrl: 'https://images.unsplash.com/photo-1558857563-b37dfef6b896?auto=format&fit=crop&w=600&q=80' },
          { name: 'Taro Milk Tea with Egg Pudding', sku: 'SBL-BOB-002', price: 19000, costPrice: 7000, stock: 95, minStock: 15, imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80' },
          { name: 'Thai Tea Cream Cheese Foam', sku: 'SBL-BOB-003', price: 18000, costPrice: 6500, stock: 100, minStock: 20, imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80' },
          { name: 'Mango Yakult Popping Boba', sku: 'SBL-BOB-004', price: 21000, costPrice: 8000, stock: 85, minStock: 15, imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80' },
        ],
      },
    ],
  },
];

async function seedTenants() {
  console.log('🚀 Memulai Multi-Tenant Seeding untuk Supabase Platform...');

  try {
    // 1. Bersihkan transaksi, produk, kategori lama
    console.log('🧹 Membersihkan database lama...');
    await db.delete(schema.transactionItems);
    await db.delete(schema.transactions);
    await db.delete(schema.products);
    await db.delete(schema.categories);
    await db.delete(schema.users);
    await db.delete(schema.tenants);

    // 2. Buat / Pastikan System Admin ada
    console.log('👑 Menyiapkan akun System Administrator...');
    const sysAdminEmail = 'sysadmin@menuin.com';
    await registerSupabaseAuth(sysAdminEmail, 'password123', 'System Administrator');
    await db.insert(schema.users).values({
      name: 'System Administrator',
      email: sysAdminEmail,
      role: 'SYSTEM_ADMIN',
      tenantId: null,
    });
    console.log(`   ✅ Akun System Admin: ${sysAdminEmail} (Password: password123)`);

    // 3. Iterasi tiap Tenant
    for (const tenantData of TENANTS_DATA) {
      console.log(`\n🏢 Memproses Tenant: "${tenantData.name}" (${tenantData.isPaid ? 'PAID' : 'FREE TRIAL'})...`);

      // 3a. Buat Dashboard / Tenant
      const [newDashboard] = await db
        .insert(schema.tenants)
        .values({
          name: tenantData.name,
          isPaid: tenantData.isPaid,
        })
        .returning();

      const tenantId = newDashboard.id;

      // 3b. Buat Pengguna (Owner Superadmin & Kasir)
      const tenantUsers: (typeof schema.users.$inferSelect)[] = [];
      for (const u of tenantData.users) {
        await registerSupabaseAuth(u.email, 'password123', u.name);
        const [createdUser] = await db
          .insert(schema.users)
          .values({
            tenantId,
            name: u.name,
            email: u.email,
            role: u.role,
          })
          .returning();
        tenantUsers.push(createdUser);
        console.log(`   👤 User [${u.role}]: ${u.email} (Password: password123)`);
      }

      const cashierUser = tenantUsers.find((u) => u.role === 'CASHIER') || tenantUsers[0];

      // 3c. Buat Kategori & Produk
      const allCreatedProducts: { id: string; name: string; price: string; costPrice: string }[] = [];

      for (const cat of tenantData.categories) {
        const [createdCat] = await db
          .insert(schema.categories)
          .values({
            tenantId,
            name: cat.name,
            slug: cat.slug,
          })
          .returning();

        const prodsToInsert = cat.products.map((p) => ({
          tenantId,
          categoryId: createdCat.id,
          name: p.name,
          sku: p.sku,
          barcode: generateBarcode(),
          price: p.price.toString(),
          costPrice: p.costPrice.toString(),
          stock: p.stock,
          minStock: p.minStock,
          imageUrl: p.imageUrl || null,
        }));

        const insertedProds = await db.insert(schema.products).values(prodsToInsert).returning();
        allCreatedProducts.push(...insertedProds);
      }

      console.log(`   📦 Disimpan: ${tenantData.categories.length} Kategori, ${allCreatedProducts.length} Produk.`);

      // 3d. Simulasi Transaksi 30 Hari Terakhir
      console.log(`   🛒 Membuat simulasi transaksi 30 hari terakhir...`);
      const transactionsToInsert: any[] = [];
      const transactionItemsToInsert: any[] = [];

      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      // Iterasi per hari
      for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
        // Setiap hari ada 8-25 transaksi per tenant
        const txCount = randomInt(8, 25);

        for (let t = 0; t < txCount; t++) {
          const txId = crypto.randomUUID();

          // Jam operasional antara 08:00 - 21:00 (peak jam makan siang 12:00-14:00 atau malam 18:00-20:00)
          let hour = randomInt(8, 21);
          if (Math.random() > 0.4) {
            // Berikan probabilitas lebih tinggi ke peak hour
            hour = Math.random() > 0.5 ? randomInt(11, 14) : randomInt(17, 20);
          }

          const txDate = new Date(d);
          txDate.setHours(hour, randomInt(0, 59), randomInt(0, 59));

          // Pilih 1 - 4 jenis produk dalam 1 transaksi
          const itemCount = Math.min(randomInt(1, 4), allCreatedProducts.length);
          const shuffled = [...allCreatedProducts].sort(() => 0.5 - Math.random());
          const selectedProducts = shuffled.slice(0, itemCount);

          let grandTotal = 0;
          for (const prod of selectedProducts) {
            const qty = randomInt(1, 3);
            const price = parseFloat(prod.price);
            const subtotal = price * qty;
            grandTotal += subtotal;

            transactionItemsToInsert.push({
              id: crypto.randomUUID(),
              transactionId: txId,
              productId: prod.id,
              quantity: qty,
              price: price.toString(),
              subtotal: subtotal.toString(),
              createdAt: txDate,
            });
          }

          const isQris = Math.random() > 0.45;
          const paymentMethod = isQris ? 'qris' : 'cash';

          transactionsToInsert.push({
            id: txId,
            tenantId,
            userId: cashierUser.id,
            totalAmount: grandTotal.toString(),
            discount: '0',
            tax: '0',
            grandTotal: grandTotal.toString(),
            paymentMethod,
            status: 'COMPLETED',
            createdAt: txDate,
          });
        }
      }

      // Insert Transactions in batches
      for (let i = 0; i < transactionsToInsert.length; i += 300) {
        await db.insert(schema.transactions).values(transactionsToInsert.slice(i, i + 300));
      }

      // Insert Items in batches
      for (let i = 0; i < transactionItemsToInsert.length; i += 300) {
        await db.insert(schema.transactionItems).values(transactionItemsToInsert.slice(i, i + 300));
      }

      console.log(`   💰 Berhasil menanam ${transactionsToInsert.length} transaksi & ${transactionItemsToInsert.length} item terjual.`);
    }

    console.log('\n======================================================');
    console.log('🎉 SEEDING SELESAI DENGAN SUKSES KE SUPABASE!');
    console.log('======================================================');
    console.log('\n🔑 DAFTAR AKUN LOGIN DEMO (Password semua akun: password123):');
    console.log('1. System Admin:');
    console.log('   - Email: sysadmin@menuin.com');
    console.log('2. Tenant 1 - Kopi Senja Utama (Paid):');
    console.log('   - Superadmin / Owner: owner.kopi@menuin.com');
    console.log('   - Kasir: kasir.kopi@menuin.com');
    console.log('3. Tenant 2 - Resto Padang Sederhana Minang (Paid):');
    console.log('   - Superadmin / Owner: owner.padang@menuin.com');
    console.log('   - Kasir: kasir.padang@menuin.com');
    console.log('4. Tenant 3 - Bolu & Bakery Ibu Anisa (Paid):');
    console.log('   - Superadmin / Owner: owner.bakery@menuin.com');
    console.log('   - Kasir: kasir.bakery@menuin.com');
    console.log('5. Tenant 4 - Warung Sembako Berkah Jaya (Paid):');
    console.log('   - Superadmin / Owner: owner.sembako@menuin.com');
    console.log('   - Kasir: kasir.sembako@menuin.com');
    console.log('6. Tenant 5 - Kedai Seblak & Boba Viral (Free Trial):');
    console.log('   - Superadmin / Owner: owner.seblak@menuin.com');
    console.log('   - Kasir: kasir.seblak@menuin.com');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat seeding ke Supabase:', error);
    process.exit(1);
  }
}

seedTenants();
