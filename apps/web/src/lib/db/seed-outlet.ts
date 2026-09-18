import { config } from 'dotenv';
config({ path: '../../.env.local' });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { tenants, categories, products, modifierGroups, modifiers, productModifierGroups } from './schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const client = postgres(process.env.DATABASE_URL!, { prepare: false, ssl: 'require' });
const db = drizzle(client, { schema });

async function seedOutletProducts() {
  const targetOutletKey = '244aa4d4a30767a442af';
  
  const tenantList = await db.select().from(tenants).where(eq(tenants.outletKey, targetOutletKey)).limit(1);
  if (tenantList.length === 0) {
    console.error('Outlet with key ' + targetOutletKey + ' not found.');
    process.exit(1);
  }
  
  const tenantId = tenantList[0].id;
  console.log('Found tenant:', tenantList[0].name, '(' + tenantId + ')');

  console.log('Cleaning existing product data...');
  const { sql } = await import('drizzle-orm');
  await db.execute(sql`DELETE FROM product_modifier_groups WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ${tenantId})`);
  await db.delete(products).where(eq(products.tenantId, tenantId));
  await db.delete(modifiers).where(eq(modifiers.tenantId, tenantId));
  await db.delete(modifierGroups).where(eq(modifierGroups.tenantId, tenantId));
  await db.delete(categories).where(eq(categories.tenantId, tenantId));
  
  console.log('Seeding categories...');
  const catCoffee = uuidv4();
  const catNonCoffee = uuidv4();
  const catTea = uuidv4();
  const catFood = uuidv4();
  const catSnacks = uuidv4();

  await db.insert(categories).values([
    { id: catCoffee, tenantId, name: 'Espresso & Coffee', slug: 'coffee', displayOrder: 1 },
    { id: catNonCoffee, tenantId, name: 'Non-Coffee & Frappe', slug: 'non-coffee', displayOrder: 2 },
    { id: catTea, tenantId, name: 'Tea & Refresher', slug: 'tea', displayOrder: 3 },
    { id: catFood, tenantId, name: 'Main Course', slug: 'main-course', displayOrder: 4 },
    { id: catSnacks, tenantId, name: 'Snacks & Pastry', slug: 'snacks-pastry', displayOrder: 5 },
  ]);

  console.log('Seeding modifier groups...');
  const mgSizeId = uuidv4();
  const mgSugarId = uuidv4();
  const mgIceId = uuidv4();
  const mgMilkId = uuidv4();
  const mgShotId = uuidv4();
  const mgToppingId = uuidv4();
  const mgLevelPedasId = uuidv4();
  const mgTelurId = uuidv4();

  await db.insert(modifierGroups).values([
    { id: mgSizeId, tenantId, name: 'Ukuran Gelas', isRequired: true, minSelections: 1, maxSelections: 1 },
    { id: mgSugarId, tenantId, name: 'Tingkat Kemanisan', isRequired: true, minSelections: 1, maxSelections: 1 },
    { id: mgIceId, tenantId, name: 'Tingkat Es', isRequired: true, minSelections: 1, maxSelections: 1 },
    { id: mgMilkId, tenantId, name: 'Pilihan Susu', isRequired: false, minSelections: 0, maxSelections: 1 },
    { id: mgShotId, tenantId, name: 'Tambahan Espresso', isRequired: false, minSelections: 0, maxSelections: 3 },
    { id: mgToppingId, tenantId, name: 'Extra Topping', isRequired: false, minSelections: 0, maxSelections: 5 },
    { id: mgLevelPedasId, tenantId, name: 'Level Pedas', isRequired: true, minSelections: 1, maxSelections: 1 },
    { id: mgTelurId, tenantId, name: 'Tambahan Telur', isRequired: false, minSelections: 0, maxSelections: 2 },
  ]);

  console.log('Seeding modifiers...');
  await db.insert(modifiers).values([
    // Size
    { id: uuidv4(), tenantId, groupId: mgSizeId, name: 'Regular', price: '0' },
    { id: uuidv4(), tenantId, groupId: mgSizeId, name: 'Large', price: '5000' },
    // Sugar
    { id: uuidv4(), tenantId, groupId: mgSugarId, name: 'Normal Sugar', price: '0' },
    { id: uuidv4(), tenantId, groupId: mgSugarId, name: 'Less Sugar', price: '0' },
    { id: uuidv4(), tenantId, groupId: mgSugarId, name: 'No Sugar', price: '0' },
    // Ice
    { id: uuidv4(), tenantId, groupId: mgIceId, name: 'Normal Ice', price: '0' },
    { id: uuidv4(), tenantId, groupId: mgIceId, name: 'Less Ice', price: '0' },
    { id: uuidv4(), tenantId, groupId: mgIceId, name: 'No Ice (Hot)', price: '0' },
    // Milk
    { id: uuidv4(), tenantId, groupId: mgMilkId, name: 'Oat Milk (Oatside)', price: '8000' },
    { id: uuidv4(), tenantId, groupId: mgMilkId, name: 'Almond Milk', price: '10000' },
    { id: uuidv4(), tenantId, groupId: mgMilkId, name: 'Soy Milk', price: '5000' },
    // Espresso
    { id: uuidv4(), tenantId, groupId: mgShotId, name: 'Extra Shot Espresso', price: '6000' },
    // Topping
    { id: uuidv4(), tenantId, groupId: mgToppingId, name: 'Boba', price: '4000' },
    { id: uuidv4(), tenantId, groupId: mgToppingId, name: 'Lychee Jelly', price: '5000' },
    { id: uuidv4(), tenantId, groupId: mgToppingId, name: 'Coffee Jelly', price: '5000' },
    { id: uuidv4(), tenantId, groupId: mgToppingId, name: 'Vanilla Ice Cream', price: '8000' },
    // Level Pedas
    { id: uuidv4(), tenantId, groupId: mgLevelPedasId, name: 'Tidak Pedas', price: '0' },
    { id: uuidv4(), tenantId, groupId: mgLevelPedasId, name: 'Pedas Sedang', price: '0' },
    { id: uuidv4(), tenantId, groupId: mgLevelPedasId, name: 'Sangat Pedas', price: '0' },
    // Telur
    { id: uuidv4(), tenantId, groupId: mgTelurId, name: 'Telur Dadar', price: '5000' },
    { id: uuidv4(), tenantId, groupId: mgTelurId, name: 'Telur Mata Sapi', price: '5000' },
  ]);

  console.log('Seeding products...');
  const productsData = [
    // --- COFFEE ---
    {
      id: uuidv4(), categoryId: catCoffee, name: 'Caffe Latte', sku: 'COF-001', slug: 'caffe-latte',
      description: 'Espresso blend khas dipadukan dengan susu segar yang creamy.',
      price: '28000', costPrice: '12000', stock: 100, isAvailableOnline: true, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1551806235-a05d8f6312a0?auto=format&fit=crop&w=500&q=80',
      modifiers: [mgSizeId, mgSugarId, mgIceId, mgMilkId, mgShotId]
    },
    {
      id: uuidv4(), categoryId: catCoffee, name: 'Americano', sku: 'COF-002', slug: 'americano',
      description: 'Double shot espresso dengan air murni untuk pecinta kopi hitam sejati.',
      price: '22000', costPrice: '8000', stock: 100, isAvailableOnline: true, isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=500&q=80',
      modifiers: [mgSizeId, mgSugarId, mgIceId, mgShotId]
    },
    {
      id: uuidv4(), categoryId: catCoffee, name: 'Caramel Macchiato', sku: 'COF-003', slug: 'caramel-macchiato',
      description: 'Susu segar dengan sirup vanilla, espresso, dan saus karamel premium.',
      price: '35000', costPrice: '15000', stock: 80, isAvailableOnline: true, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=500&q=80',
      modifiers: [mgSizeId, mgSugarId, mgIceId, mgMilkId, mgShotId]
    },
    {
      id: uuidv4(), categoryId: catCoffee, name: 'Kopi Susu Gula Aren', sku: 'COF-004', slug: 'kopi-susu-gula-aren',
      description: 'Signature kopi susu dengan gula aren asli nusantara yang legit.',
      price: '25000', costPrice: '10000', stock: 150, isAvailableOnline: true, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1595166297059-e314649de1e3?auto=format&fit=crop&w=500&q=80',
      modifiers: [mgSizeId, mgIceId, mgMilkId, mgShotId]
    },
    {
      id: uuidv4(), categoryId: catCoffee, name: 'Mocha Frappe', sku: 'COF-005', slug: 'mocha-frappe',
      description: 'Espresso diblend dengan coklat premium dan susu, disajikan dengan whipped cream.',
      price: '38000', costPrice: '16000', stock: 50, isAvailableOnline: true, isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75bb69c?auto=format&fit=crop&w=500&q=80',
      modifiers: [mgSizeId, mgMilkId]
    },

    // --- NON-COFFEE ---
    {
      id: uuidv4(), categoryId: catNonCoffee, name: 'Matcha Latte', sku: 'NCOF-001', slug: 'matcha-latte',
      description: 'Bubuk green tea matcha asli Jepang dipadukan dengan susu segar.',
      price: '32000', costPrice: '14000', stock: 70, isAvailableOnline: true, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=500&q=80',
      modifiers: [mgSizeId, mgSugarId, mgIceId, mgMilkId, mgToppingId]
    },
    {
      id: uuidv4(), categoryId: catNonCoffee, name: 'Taro Latte', sku: 'NCOF-002', slug: 'taro-latte',
      description: 'Rasa taro manis yang lembut dengan campuran susu pilihan.',
      price: '28000', costPrice: '12000', stock: 60, isAvailableOnline: true, isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1620189507195-68309c04c4d0?auto=format&fit=crop&w=500&q=80',
      modifiers: [mgSizeId, mgSugarId, mgIceId, mgMilkId, mgToppingId]
    },
    {
      id: uuidv4(), categoryId: catNonCoffee, name: 'Cookies & Cream Frappe', sku: 'NCOF-003', slug: 'cookies-cream-frappe',
      description: 'Susu segar diblend dengan biskuit Oreo dan whipped cream yang melimpah.',
      price: '35000', costPrice: '15000', stock: 50, isAvailableOnline: true, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1578644888126-73591605f636?auto=format&fit=crop&w=500&q=80',
      modifiers: [mgSizeId, mgMilkId]
    },

    // --- TEA ---
    {
      id: uuidv4(), categoryId: catTea, name: 'Lychee Tea', sku: 'TEA-001', slug: 'lychee-tea',
      description: 'Teh hitam segar dengan sirup leci dan buah leci asli.',
      price: '22000', costPrice: '8000', stock: 90, isAvailableOnline: true, isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=500&q=80',
      modifiers: [mgSizeId, mgSugarId, mgIceId, mgToppingId]
    },
    {
      id: uuidv4(), categoryId: catTea, name: 'Thai Tea', sku: 'TEA-002', slug: 'thai-tea',
      description: 'Teh asli Thailand dengan campuran susu kental manis yang otentik.',
      price: '20000', costPrice: '7000', stock: 100, isAvailableOnline: true, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?auto=format&fit=crop&w=500&q=80',
      modifiers: [mgSizeId, mgIceId, mgToppingId]
    },

    // --- FOOD ---
    {
      id: uuidv4(), categoryId: catFood, name: 'Nasi Goreng Kampung', sku: 'FOD-001', slug: 'nasi-goreng-kampung',
      description: 'Nasi goreng bumbu tradisional disajikan dengan kerupuk, ayam suwir, dan sate ayam.',
      price: '38000', costPrice: '15000', stock: 40, isAvailableOnline: true, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=500&q=80',
      modifiers: [mgLevelPedasId, mgTelurId]
    },
    {
      id: uuidv4(), categoryId: catFood, name: 'Spaghetti Carbonara', sku: 'FOD-002', slug: 'spaghetti-carbonara',
      description: 'Pasta klasik Italia dengan saus krim yang gurih, jamur, dan smoked beef.',
      price: '45000', costPrice: '18000', stock: 30, isAvailableOnline: true, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1612874687561-c852449a5621?auto=format&fit=crop&w=500&q=80',
      modifiers: []
    },
    {
      id: uuidv4(), categoryId: catFood, name: 'Rice Bowl Chicken Teriyaki', sku: 'FOD-003', slug: 'rice-bowl-teriyaki',
      description: 'Nasi hangat dengan ayam panggang bumbu teriyaki manis gurih khas Jepang.',
      price: '35000', costPrice: '14000', stock: 50, isAvailableOnline: true, isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=500&q=80',
      modifiers: [mgTelurId]
    },
    {
      id: uuidv4(), categoryId: catFood, name: 'Chicken Cordon Bleu', sku: 'FOD-004', slug: 'chicken-cordon-bleu',
      description: 'Dada ayam gulung isi keju mozarella dan smoked beef, disajikan dengan kentang.',
      price: '55000', costPrice: '22000', stock: 20, isAvailableOnline: true, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=500&q=80',
      modifiers: []
    },

    // --- SNACKS ---
    {
      id: uuidv4(), categoryId: catSnacks, name: 'Truffle French Fries', sku: 'SNK-001', slug: 'truffle-french-fries',
      description: 'Kentang goreng renyah ditaburi truffle oil dan keju parmesan.',
      price: '28000', costPrice: '10000', stock: 80, isAvailableOnline: true, isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=500&q=80',
      modifiers: []
    },
    {
      id: uuidv4(), categoryId: catSnacks, name: 'Butter Croissant', sku: 'SNK-002', slug: 'butter-croissant',
      description: 'Croissant klasik ala Perancis dengan wangi butter yang kuat, fresh dari oven.',
      price: '20000', costPrice: '8000', stock: 40, isAvailableOnline: true, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=80',
      modifiers: []
    },
    {
      id: uuidv4(), categoryId: catSnacks, name: 'Mix Platter', sku: 'SNK-003', slug: 'mix-platter',
      description: 'Pilihan camilan terdiri dari sosis, kentang, dan onion ring.',
      price: '45000', costPrice: '16000', stock: 30, isAvailableOnline: true, isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=80',
      modifiers: []
    },
    {
      id: uuidv4(), categoryId: catSnacks, name: 'New York Cheesecake', sku: 'SNK-004', slug: 'ny-cheesecake',
      description: 'Sepotong cheesecake lembut dengan lapisan biskuit crumble yang lumer di mulut.',
      price: '38000', costPrice: '15000', stock: 25, isAvailableOnline: true, isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=500&q=80',
      modifiers: []
    },
  ];

  await db.insert(products).values(productsData.map(p => ({
    id: p.id,
    tenantId,
    categoryId: p.categoryId,
    name: p.name,
    sku: p.sku,
    slug: p.slug,
    description: p.description,
    price: p.price,
    costPrice: p.costPrice,
    stock: p.stock,
    imageUrl: p.imageUrl,
    isAvailableOnline: p.isAvailableOnline,
    isFeatured: p.isFeatured,
  })));

  console.log('Seeding product modifiers mapping...');
  const pmMapping = [];
  for (const product of productsData) {
    for (const modId of product.modifiers) {
      pmMapping.push({
        tenantId,
        productId: product.id,
        modifierGroupId: modId,
      });
    }
  }

  if (pmMapping.length > 0) {
    await db.insert(productModifierGroups).values(pmMapping);
  }

  console.log('Pitching seed complete! Awesome menu is ready.');
  process.exit(0);
}

seedOutletProducts().catch((err) => {
  console.error(err);
  process.exit(1);
});
