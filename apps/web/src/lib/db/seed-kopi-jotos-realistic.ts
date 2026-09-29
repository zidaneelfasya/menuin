import { db } from './index';
import { transactions, transactionItems, products, tenants } from './schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function seedRealisticKopiJotos() {
  console.log('=== SEEDING REALISTIS KOPI JOTOS (30 HARI TERAKHIR) ===');

  // 1. Dapatkan tenant KOPI JOTOS
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.outletKey, '244aa4d4a30767a442af'))
    .limit(1);

  if (!tenant) {
    console.error('Tenant KOPI JOTOS tidak ditemukan!');
    process.exit(1);
  }
  console.log(`Outlet terdeteksi: ${tenant.name} (ID: ${tenant.id})`);

  // 2. Dapatkan katalog menu yang ada (Menu, Kategori, Harga TIDAK DIUBAH)
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.tenantId, tenant.id));

  console.log(`Memuat ${allProducts.length} produk katalog yang ada.`);
  if (allProducts.length === 0) {
    console.error('Tidak ada produk untuk KOPI JOTOS!');
    process.exit(1);
  }

  // Kategorisasi produk untuk dayparting yang realistis
  const morningProducts = allProducts.filter((p) => {
    const n = p.name.toLowerCase();
    return (
      n.includes('croissant') ||
      n.includes('americano') ||
      n.includes('espresso') ||
      n.includes('latte') ||
      n.includes('kopi susu')
    );
  });

  const heavyMeals = allProducts.filter((p) => {
    const n = p.name.toLowerCase();
    return (
      n.includes('nasi goreng') ||
      n.includes('spaghetti') ||
      n.includes('carbonara') ||
      n.includes('rice bowl') ||
      n.includes('chicken') ||
      n.includes('platter')
    );
  });

  const drinks = allProducts.filter((p) => {
    const n = p.name.toLowerCase();
    return (
      n.includes('tea') ||
      n.includes('frappe') ||
      n.includes('taro') ||
      n.includes('matcha') ||
      n.includes('kopi') ||
      n.includes('latte') ||
      n.includes('americano')
    );
  });

  const snacks = allProducts.filter((p) => {
    const n = p.name.toLowerCase();
    return (
      n.includes('fries') ||
      n.includes('cheesecake') ||
      n.includes('platter') ||
      n.includes('croissant')
    );
  });

  // Fallback jika array kosong
  const getProduct = (list: typeof allProducts) => {
    const src = list.length > 0 ? list : allProducts;
    return src[Math.floor(Math.random() * src.length)];
  };

  // 3. Bersihkan transaksi lama khusus KOPI JOTOS
  console.log('Menghapus data transaksi lama KOPI JOTOS...');
  await db.delete(transactionItems).where(eq(transactionItems.tenantId, tenant.id));
  await db.delete(transactions).where(eq(transactions.tenantId, tenant.id));
  console.log('Data transaksi lama berhasil dibersihkan.');

  // 4. Parameter Seeding 30 Hari
  const customerNames = [
    'Dimas Pratama', 'Siti Rahma', 'Rian Hidayat', 'Anisa Putri', 'Budi Santoso',
    'Fajar Nugraha', 'Maya Indah', 'Reza Pahlevi', 'Dinda Permata', 'Kevin Wijaya',
    'Putri Ayu', 'Agus Setiawan', 'Nadia Safitri', 'Farhan Maulana', 'Tasya Kamila',
    'Yoga Prasetyo', 'Citra Dewi', 'Arif Wibowo', 'Bella Anggraini', 'Rizky Ramadhan',
    'Lestari', 'Eko Saputra', 'Tiara Andini', 'Gita Gutawa', 'Hendra Gunawan'
  ];

  const tableNumbers = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', 'Outdoor 1', 'Outdoor 2', 'VIP'];

  const newTransactions: any[] = [];
  const newTransactionItems: any[] = [];

  const now = new Date();
  // 30 hari kebelakang (1 Sep - 29 Sep / hari 29 mundur ke hari 0)
  const totalDays = 30;
  let globalOrderCount = 1000;

  for (let dayOffset = totalDays - 1; dayOffset >= 0; dayOffset--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - dayOffset);

    const dayOfWeek = targetDate.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

    // Volume pesanan harian:
    // Weekday: 48 - 62 pesanan/hari
    // Weekend: 68 - 92 pesanan/hari
    const dailyVolume = isWeekend
      ? Math.floor(Math.random() * 25) + 68
      : Math.floor(Math.random() * 15) + 48;

    for (let i = 0; i < dailyVolume; i++) {
      globalOrderCount++;

      // Jam operasional: 08:00 - 24:00 (00:00)
      // Distribusi jam realistis (dayparting weighted):
      const randHourWeight = Math.random();
      let hour = 12;

      if (randHourWeight < 0.12) {
        // 08:00 - 10:59 (Pagi / Kopi Santai) -> 12%
        hour = Math.floor(Math.random() * 3) + 8;
      } else if (randHourWeight < 0.36) {
        // 11:00 - 13:59 (Lunch Peak) -> 24%
        hour = Math.floor(Math.random() * 3) + 11;
      } else if (randHourWeight < 0.52) {
        // 14:00 - 16:59 (Afternoon Work / Hangout) -> 16%
        hour = Math.floor(Math.random() * 3) + 14;
      } else if (randHourWeight < 0.86) {
        // 17:00 - 21:59 (Dinner Peak & Evening Nongkrong) -> 34%
        hour = Math.floor(Math.random() * 5) + 17;
      } else {
        // 22:00 - 23:59 (Late Night Hangout) -> 14%
        hour = Math.floor(Math.random() * 2) + 22;
      }

      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);

      const txDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        hour,
        minute,
        second
      );

      // Buat keranjang belanja (1-4 item produk)
      let itemCount = 2;
      if (hour >= 11 && hour <= 14) {
        itemCount = Math.floor(Math.random() * 2) + 2; // 2-3 items di jam makan siang
      } else if (hour >= 17 && hour <= 21) {
        itemCount = Math.floor(Math.random() * 3) + 2; // 2-4 items di jam makan malam
      } else {
        itemCount = Math.floor(Math.random() * 2) + 1; // 1-2 items di pagi/malam
      }

      const selectedBasket: { product: typeof allProducts[0]; qty: number }[] = [];

      for (let j = 0; j < itemCount; j++) {
        let pickedProduct: typeof allProducts[0];
        if (hour < 11) {
          pickedProduct = Math.random() > 0.4 ? getProduct(morningProducts) : getProduct(allProducts);
        } else if ((hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 21)) {
          pickedProduct = j === 0 ? getProduct(heavyMeals) : getProduct(drinks);
        } else {
          pickedProduct = Math.random() > 0.5 ? getProduct(drinks) : getProduct(snacks);
        }

        const qty = Math.random() > 0.8 ? 2 : 1;
        selectedBasket.push({ product: pickedProduct, qty });
      }

      // Hitung subtotal kotor
      let subtotal = 0;
      selectedBasket.forEach((item) => {
        const pPrice = parseFloat(item.product.price || '25000') || 25000;
        subtotal += pPrice * item.qty;
      });

      // Diskon (~10% pesanan dapat diskon member/promo 10%)
      const hasDiscount = Math.random() < 0.1;
      const discount = hasDiscount ? Math.round(subtotal * 0.1) : 0;
      const grandTotal = Math.max(0, subtotal - discount);

      // Metode Pembayaran & Pemisahan MDR Realistis
      // CASH: 42% (MDR 0)
      // QRIS_STATIC: 38% (MDR 0)
      // QRIS_DYNAMIC: 10% (MDR 0.7%)
      // ONLINE: 7% (MDR 0.7%)
      // CARD: 3% (MDR 0)
      const randPay = Math.random();
      let paymentMethod = 'CASH';
      let gatewayFee = 0;
      let source = 'POS';

      if (randPay < 0.42) {
        paymentMethod = 'CASH';
        gatewayFee = 0;
        source = 'POS';
      } else if (randPay < 0.80) {
        // QRIS Statis (Akrilik di meja/kasir toko) -> MDR 0%
        paymentMethod = 'QRIS_STATIC';
        gatewayFee = 0;
        source = Math.random() > 0.3 ? 'POS' : 'QR';
      } else if (randPay < 0.90) {
        // QRIS Dinamis (Kasir POS via DOKU Gateway) -> MDR 0.7%
        paymentMethod = 'QRIS_DYNAMIC';
        gatewayFee = Math.round(grandTotal * 0.007);
        source = 'POS';
      } else if (randPay < 0.97) {
        // Online Gateway via Storefront Self-Order QR Meja -> MDR 0.7%
        paymentMethod = 'ONLINE';
        gatewayFee = Math.round(grandTotal * 0.007);
        source = 'QR';
      } else {
        // Kartu EDC / Debit -> MDR 0%
        paymentMethod = 'CARD';
        gatewayFee = 0;
        source = 'POS';
      }

      const netAmount = Math.max(0, grandTotal - gatewayFee);

      // Tipe Pesanan
      const isTakeaway = Math.random() < 0.2; // 20% Takeaway, 80% Dine In
      const orderType = isTakeaway ? 'TAKEAWAY' : 'DINE_IN';
      const tableNumber = isTakeaway ? null : tableNumbers[Math.floor(Math.random() * tableNumbers.length)];
      const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];

      // Status Transaksi (98.5% Selesai, 1.5% Canceled untuk audit void)
      const isCanceled = Math.random() < 0.015;
      const status = isCanceled ? 'CANCELLED' : 'COMPLETED';
      const paymentStatus = isCanceled ? 'CANCELED' : 'PAID';

      const txId = uuidv4();
      const orderNum = `#KJ-${globalOrderCount}`;

      newTransactions.push({
        id: txId,
        tenantId: tenant.id,
        source,
        totalAmount: String(subtotal),
        discount: String(discount),
        tax: '0',
        serviceCharge: '0',
        platformFee: '0',
        grandTotal: String(grandTotal),
        gatewayFee: String(gatewayFee),
        netAmount: String(netAmount),
        paymentMethod,
        paymentStatus,
        status,
        orderType,
        customerName,
        tableNumber,
        orderNumber: orderNum,
        createdAt: txDate,
      });

      // Item transaksi
      selectedBasket.forEach((item) => {
        const pPrice = parseFloat(item.product.price || '25000') || 25000;
        const itemSubtotal = pPrice * item.qty;

        newTransactionItems.push({
          id: uuidv4(),
          tenantId: tenant.id,
          transactionId: txId,
          productId: item.product.id,
          quantity: item.qty,
          price: String(pPrice),
          subtotal: String(itemSubtotal),
          isCompleted: !isCanceled,
          createdAt: txDate,
        });
      });
    }
  }

  const BATCH_SIZE = 40;
  console.log(`Mengunggah ${newTransactions.length} transaksi ke database (batch size ${BATCH_SIZE})...`);
  for (let i = 0; i < newTransactions.length; i += BATCH_SIZE) {
    const chunk = newTransactions.slice(i, i + BATCH_SIZE);
    await db.insert(transactions).values(chunk);
    if (i % 200 === 0) {
      console.log(`  Progress transaksi: ${i} / ${newTransactions.length}...`);
    }
    await new Promise((resolve) => setTimeout(resolve, 30));
  }

  console.log(`Mengunggah ${newTransactionItems.length} rincian item produk ke database (batch size ${BATCH_SIZE})...`);
  for (let i = 0; i < newTransactionItems.length; i += BATCH_SIZE) {
    const chunk = newTransactionItems.slice(i, i + BATCH_SIZE);
    await db.insert(transactionItems).values(chunk);
    if (i % 400 === 0) {
      console.log(`  Progress item produk: ${i} / ${newTransactionItems.length}...`);
    }
    await new Promise((resolve) => setTimeout(resolve, 30));
  }

  // Hitung ringkasan hasil seed
  let totalGross = 0;
  let totalMDR = 0;
  let totalCash = 0;
  let totalQrisStatic = 0;
  let totalQrisDynamic = 0;
  let totalOnline = 0;

  newTransactions.forEach((t) => {
    if (t.status === 'COMPLETED') {
      const g = parseFloat(t.grandTotal);
      const fee = parseFloat(t.gatewayFee);
      totalGross += g;
      totalMDR += fee;
      if (t.paymentMethod === 'CASH') totalCash += g;
      else if (t.paymentMethod === 'QRIS_STATIC') totalQrisStatic += g;
      else if (t.paymentMethod === 'QRIS_DYNAMIC') totalQrisDynamic += g;
      else if (t.paymentMethod === 'ONLINE') totalOnline += g;
    }
  });

  console.log('=== SEEDING BERHASIL SELESAI DENGAN SEMPURNA! ===');
  console.log(`Total Transaksi: ${newTransactions.length} pesanan (30 hari)`);
  console.log(`Total Omzet Kotor: Rp ${Math.round(totalGross).toLocaleString('id-ID')}`);
  console.log(`  - Tunai (Cash): Rp ${Math.round(totalCash).toLocaleString('id-ID')} (MDR: 0)`);
  console.log(`  - QRIS Statis Toko: Rp ${Math.round(totalQrisStatic).toLocaleString('id-ID')} (MDR: 0)`);
  console.log(`  - QRIS Dinamis Kasir: Rp ${Math.round(totalQrisDynamic).toLocaleString('id-ID')} (MDR 0.7%)`);
  console.log(`  - Online Gateway: Rp ${Math.round(totalOnline).toLocaleString('id-ID')} (MDR 0.7%)`);
  console.log(`Total Fee MDR Terkumpul: Rp ${Math.round(totalMDR).toLocaleString('id-ID')}`);
  console.log(`Net Settlement/Inflow: Rp ${Math.round(totalGross - totalMDR).toLocaleString('id-ID')}`);

  process.exit(0);
}

seedRealisticKopiJotos().catch((err) => {
  console.error('Error saat seeding:', err);
  process.exit(1);
});
