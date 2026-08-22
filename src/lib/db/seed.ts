import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

// GS1 style Barcode generator (EAN-13)
function generateBarcode() {
  const prefix = '899'; // Indonesia
  const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString();
  const code = prefix + randomPart;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit.toString();
}

async function main() {
  console.log('Seeding database...');

  try {
    // 1. Clear existing data
    console.log('Clearing existing data...');
    await db.delete(schema.transactionItems);
    await db.delete(schema.transactions);
    await db.delete(schema.products);
    await db.delete(schema.categories);
    await db.delete(schema.users);

    // 2. Insert Users
    console.log('Inserting users...');
    const userId = uuidv4();
    await db.insert(schema.users).values({
      id: userId,
      name: 'Kasir Utama',
      email: 'kasir@boluanisa.com',
      role: 'CASHIER',
    });

    // 3. Insert Categories
    console.log('Inserting categories...');
    const categoriesToInsert = [
      { id: uuidv4(), name: 'Bolu Panggang', slug: 'bolu-panggang' },
      { id: uuidv4(), name: 'Bolu Kukus', slug: 'bolu-kukus' },
      { id: uuidv4(), name: 'Kue Kering', slug: 'kue-kering' },
      { id: uuidv4(), name: 'Roti Manis', slug: 'roti-manis' },
      { id: uuidv4(), name: 'Minuman', slug: 'minuman' },
    ];
    await db.insert(schema.categories).values(categoriesToInsert);

    // 4. Insert Products
    console.log('Inserting products...');
    const getCategoryId = (name: string) => categoriesToInsert.find((c) => c.name === name)?.id!;

    const productsToInsert = [
      // Bolu Panggang
      { name: 'Bolu Jadul Mocca', sku: 'BLP-001', categoryId: getCategoryId('Bolu Panggang'), price: '45000', costPrice: '25000', stock: 20, minStock: 5, imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80', barcode: generateBarcode() },
      { name: 'Bolu Keju Panggang', sku: 'BLP-002', categoryId: getCategoryId('Bolu Panggang'), price: '50000', costPrice: '30000', stock: 15, minStock: 5, imageUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=400&q=80', barcode: generateBarcode() },
      { name: 'Bolu Marmer', sku: 'BLP-003', categoryId: getCategoryId('Bolu Panggang'), price: '55000', costPrice: '32000', stock: 10, minStock: 3, imageUrl: 'https://images.unsplash.com/photo-1614707664673-8cb962c035f2?auto=format&fit=crop&w=400&q=80', barcode: generateBarcode() },
      
      // Bolu Kukus
      { name: 'Bolu Kukus Pandan', sku: 'BLK-001', categoryId: getCategoryId('Bolu Kukus'), price: '35000', costPrice: '18000', stock: 25, minStock: 5, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1e4006aaeb?auto=format&fit=crop&w=400&q=80', barcode: generateBarcode() },
      { name: 'Bolu Kukus Ketan Hitam', sku: 'BLK-002', categoryId: getCategoryId('Bolu Kukus'), price: '40000', costPrice: '20000', stock: 18, minStock: 5, imageUrl: null, barcode: generateBarcode() },
      
      // Kue Kering
      { name: 'Nastar Nanas', sku: 'KKR-001', categoryId: getCategoryId('Kue Kering'), price: '85000', costPrice: '50000', stock: 30, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80', barcode: generateBarcode() },
      { name: 'Kastengel Keju', sku: 'KKR-002', categoryId: getCategoryId('Kue Kering'), price: '90000', costPrice: '55000', stock: 25, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1596647909339-da5af948192a?auto=format&fit=crop&w=400&q=80', barcode: generateBarcode() },
      { name: 'Putri Salju', sku: 'KKR-003', categoryId: getCategoryId('Kue Kering'), price: '80000', costPrice: '45000', stock: 20, minStock: 10, imageUrl: null, barcode: generateBarcode() },
      
      // Roti Manis
      { name: 'Roti Coklat Lumer', sku: 'RTM-001', categoryId: getCategoryId('Roti Manis'), price: '12000', costPrice: '6000', stock: 50, minStock: 15, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80', barcode: generateBarcode() },
      { name: 'Roti Keju Susu', sku: 'RTM-002', categoryId: getCategoryId('Roti Manis'), price: '12000', costPrice: '6000', stock: 45, minStock: 15, imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=400&q=80', barcode: generateBarcode() },
      { name: 'Roti Sisir Mentega', sku: 'RTM-003', categoryId: getCategoryId('Roti Manis'), price: '15000', costPrice: '7500', stock: 30, minStock: 10, imageUrl: null, barcode: generateBarcode() },
      
      // Minuman
      { name: 'Kopi Susu Aren (Iced)', sku: 'MNM-001', categoryId: getCategoryId('Minuman'), price: '18000', costPrice: '9000', stock: 100, minStock: 20, imageUrl: 'https://images.unsplash.com/photo-1461023058943-0708e52235eb?auto=format&fit=crop&w=400&q=80', barcode: generateBarcode() },
      { name: 'Teh Tarik', sku: 'MNM-002', categoryId: getCategoryId('Minuman'), price: '15000', costPrice: '6000', stock: 100, minStock: 20, imageUrl: 'https://images.unsplash.com/photo-1627492275512-7354ec32f41b?auto=format&fit=crop&w=400&q=80', barcode: generateBarcode() },
      { name: 'Lemon Tea Dingin', sku: 'MNM-003', categoryId: getCategoryId('Minuman'), price: '12000', costPrice: '5000', stock: 80, minStock: 20, imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80', barcode: generateBarcode() },
    ];

    const insertedProducts = await db.insert(schema.products).values(productsToInsert).returning();

    // 5. Insert dummy transactions
    console.log('Inserting dummy transactions...');
    
    // Create 5 random transactions
    for (let i = 0; i < 5; i++) {
      // Pick 2-3 random products
      const shuffled = [...insertedProducts].sort(() => 0.5 - Math.random());
      const selectedProducts = shuffled.slice(0, Math.floor(Math.random() * 2) + 2);
      
      let grandTotal = 0;
      const txItems = [];
      
      for (const prod of selectedProducts) {
        const qty = Math.floor(Math.random() * 3) + 1; // 1-3 qty
        const price = parseInt(prod.price);
        const subtotal = price * qty;
        grandTotal += subtotal;
        
        txItems.push({
          productId: prod.id,
          quantity: qty,
          price: price.toString(),
          subtotal: subtotal.toString(),
        });
      }

      // Past date (between 1 and 7 days ago)
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 7));

      const [newTx] = await db.insert(schema.transactions).values({
        totalAmount: grandTotal.toString(),
        discount: '0',
        tax: '0',
        grandTotal: grandTotal.toString(),
        paymentMethod: Math.random() > 0.5 ? 'cash' : 'qris',
        status: 'COMPLETED',
        createdAt: date,
      }).returning({ id: schema.transactions.id });

      for (const item of txItems) {
        await db.insert(schema.transactionItems).values({
          transactionId: newTx.id,
          ...item,
        });
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

main();
