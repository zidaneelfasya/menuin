import { db } from './index';
import { 
  tenants, 
  memberships, 
  accounts, 
  products, 
  categories, 
  modifiers, 
  modifierGroups, 
  transactions, 
  transactionItems, 
  payments, 
  shifts, 
  cashMovements, 
  expenses, 
  incomes 
} from './schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function seedReports2026() {
  console.log('========================================================');
  console.log('  SEEDER REALISTIS MENUIN (01 JANUARI 2026 - 11 OKTOBER 2026)');
  console.log('========================================================\n');

  // 1. Identifikasi Tenant KOPI JOTOS milik zidaneelfasya@gmail.com
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.outletKey, '244aa4d4a30767a442af'))
    .limit(1);

  if (!tenant) {
    console.error('ERROR: Tenant KOPI JOTOS (outletKey: 244aa4d4a30767a442af) tidak ditemukan!');
    process.exit(1);
  }

  // Verifikasi pemilik tenant
  const [ownerMembership] = await db
    .select({
      id: memberships.id,
      role: memberships.role,
      email: accounts.email,
      name: accounts.name
    })
    .from(memberships)
    .leftJoin(accounts, eq(memberships.accountId, accounts.id))
    .where(and(eq(memberships.tenantId, tenant.id), eq(memberships.role, 'OWNER')))
    .limit(1);

  console.log(`Outlet Terpilih : ${tenant.name} (ID: ${tenant.id})`);
  console.log(`Pemilik Outlet  : ${ownerMembership?.name} (${ownerMembership?.email})`);

  if (!ownerMembership || ownerMembership.email !== 'zidaneelfasya@gmail.com') {
    console.error('ERROR: Pemilik outlet bukan zidaneelfasya@gmail.com. Pembatalan untuk keamanan data!');
    process.exit(1);
  }

  // Dapatkan membership kasir & manager untuk shift & pencatatan biaya
  const allMemberships = await db
    .select()
    .from(memberships)
    .where(eq(memberships.tenantId, tenant.id));

  const cashierMember = allMemberships.find(m => m.role === 'CASHIER') || allMemberships[0];
  const managerMember = allMemberships.find(m => m.role === 'MANAGER') || ownerMembership;

  // 2. Bersihkan HANYA data laporan lama khusus tenant KOPI JOTOS
  console.log('\n[1/5] Membersihkan data laporan lama KOPI JOTOS...');
  await db.delete(payments).where(eq(payments.tenantId, tenant.id));
  await db.delete(transactionItems).where(eq(transactionItems.tenantId, tenant.id));
  await db.delete(transactions).where(eq(transactions.tenantId, tenant.id));
  await db.delete(cashMovements).where(eq(cashMovements.tenantId, tenant.id));
  await db.delete(shifts).where(eq(shifts.tenantId, tenant.id));
  await db.delete(expenses).where(eq(expenses.tenantId, tenant.id));
  await db.delete(incomes).where(eq(incomes.tenantId, tenant.id));
  console.log('✓ Data laporan lama KOPI JOTOS berhasil dibersihkan tanpa menyentuh katalog master.');

  // 3. Muat Data Master (Produk, Kategori, Modifiers)
  console.log('\n[2/5] Memuat master katalog produk dan varian...');
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.tenantId, tenant.id));

  const allModifiers = await db
    .select()
    .from(modifiers)
    .where(eq(modifiers.tenantId, tenant.id));

  console.log(`✓ Dimuat: ${allProducts.length} produk katalog dan ${allModifiers.length} opsi modifier.`);

  const morningProducts = allProducts.filter(p => {
    const n = p.name.toLowerCase();
    return n.includes('croissant') || n.includes('americano') || n.includes('latte') || n.includes('kopi susu');
  });

  const heavyMeals = allProducts.filter(p => {
    const n = p.name.toLowerCase();
    return n.includes('nasi goreng') || n.includes('spaghetti') || n.includes('carbonara') || n.includes('rice bowl') || n.includes('chicken') || n.includes('platter');
  });

  const beverages = allProducts.filter(p => {
    const n = p.name.toLowerCase();
    return n.includes('tea') || n.includes('frappe') || n.includes('taro') || n.includes('matcha') || n.includes('kopi') || n.includes('latte') || n.includes('americano') || n.includes('macchiato');
  });

  const snacks = allProducts.filter(p => {
    const n = p.name.toLowerCase();
    return n.includes('fries') || n.includes('cheesecake') || n.includes('platter') || n.includes('croissant');
  });

  const pick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

  const customerNames = [
    'Dimas Pratama', 'Siti Rahma', 'Rian Hidayat', 'Anisa Putri', 'Budi Santoso',
    'Fajar Nugraha', 'Maya Indah', 'Reza Pahlevi', 'Dinda Permata', 'Kevin Wijaya',
    'Putri Ayu', 'Agus Setiawan', 'Nadia Safitri', 'Farhan Maulana', 'Tasya Kamila',
    'Yoga Prasetyo', 'Citra Dewi', 'Arif Wibowo', 'Bella Anggraini', 'Rizky Ramadhan',
    'Lestari', 'Eko Saputra', 'Tiara Andini', 'Gita Gutawa', 'Hendra Gunawan',
    'Aditya Pratama', 'Salsabila', 'Naufal Ilham', 'Alifia Zahra', 'Bayu Samudra'
  ];

  const tableNumbers = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'Outdoor 1', 'Outdoor 2', 'Outdoor 3', 'VIP'];

  // 4. Rentang Waktu: 01 Januari 2026 s/d 11 Oktober 2026 (284 Hari)
  const startDate = new Date(2026, 0, 1, 0, 0, 0, 0); // 1 Jan 2026
  const endDate = new Date(2026, 9, 11, 23, 59, 59, 999); // 11 Okt 2026
  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  console.log(`\nRentang Waktu: 1 Jan 2026 s/d 11 Okt 2026 (${totalDays} hari operasional)`);

  const newShifts: any[] = [];
  const newCashMovements: any[] = [];
  const newTransactions: any[] = [];
  const newTransactionItems: any[] = [];
  const newExpenses: any[] = [];
  const newIncomes: any[] = [];

  let globalOrderCount = 1000;

  // -------------------------------------------------------------
  // A. GENERATE MODAL AWAL & PEMASUKAN NON-SALES (INCOMES)
  // -------------------------------------------------------------
  console.log('\n[3/5] Menyiapkan data pemasukan non-sales (incomes) & pengeluaran (expenses)...');
  
  // Setoran Modal Awal
  newIncomes.push({
    id: uuidv4(),
    tenantId: tenant.id,
    category: 'MODAL',
    amount: '35000000.00',
    paymentMethod: 'BANK_TRANSFER',
    description: 'Setoran modal kerja awal tahun 2026 oleh pemilik',
    date: new Date(2026, 0, 2, 9, 30, 0),
    createdByMembershipId: ownerMembership.id,
    createdAt: new Date(2026, 0, 2, 9, 30, 0),
    updatedAt: new Date(2026, 0, 2, 9, 30, 0),
  });

  // Suntikan Modal Ekspansi Outdoor
  newIncomes.push({
    id: uuidv4(),
    tenantId: tenant.id,
    category: 'MODAL',
    amount: '15000000.00',
    paymentMethod: 'BANK_TRANSFER',
    description: 'Injeksi modal ekspansi area outdoor & tambahan seating capacity',
    date: new Date(2026, 5, 12, 10, 0, 0),
    createdByMembershipId: ownerMembership.id,
    createdAt: new Date(2026, 5, 12, 10, 0, 0),
    updatedAt: new Date(2026, 5, 12, 10, 0, 0),
  });

  // Pemasukan berkala (rebate supplier kopi & daur ulang kardus)
  const periodicRebates = [
    { month: 1, day: 28, amt: 280000, desc: 'Penjualan limbah kardus packaging & jerigen sirup' },
    { month: 3, day: 25, amt: 450000, desc: 'Cashback reward kuartal 1 distributor biji kopi' },
    { month: 5, day: 29, amt: 320000, desc: 'Penjualan kardus bekas packaging cup' },
    { month: 7, day: 27, amt: 520000, desc: 'Bonus rebate kuartal 2 supplier susu segar' },
    { month: 9, day: 5, amt: 210000, desc: 'Penjualan limbah kardus packaging & botol kaca' },
  ];
  periodicRebates.forEach(r => {
    newIncomes.push({
      id: uuidv4(),
      tenantId: tenant.id,
      category: 'LAINNYA',
      amount: r.amt.toFixed(2),
      paymentMethod: 'TUNAI',
      description: r.desc,
      date: new Date(2026, r.month, r.day, 14, 0, 0),
      createdByMembershipId: managerMember.id,
      createdAt: new Date(2026, r.month, r.day, 14, 0, 0),
      updatedAt: new Date(2026, r.month, r.day, 14, 0, 0),
    });
  });

  // -------------------------------------------------------------
  // B. GENERATE EXPENSES (GAJI, UTILITAS, BAHAN BAKU, PACKAGING, DLL)
  // -------------------------------------------------------------
  // Gaji Karyawan Bulanan tiap tanggal 25 (Jan s/d Sep 2026)
  for (let m = 0; m <= 8; m++) {
    const isLebaranMonth = m === 3; // April 2026 (Lebaran THR)
    const salaryAmt = isLebaranMonth ? 22500000 : 11800000 + Math.floor(Math.random() * 800000);
    const salaryDesc = isLebaranMonth
      ? 'Payroll gaji bulanan + Tunjangan Hari Raya (THR) Idul Fitri 4 staf outlet'
      : 'Payroll gaji 4 staf outlet (2 Barista, 1 Cook, 1 Kasir/Server)';

    newExpenses.push({
      id: uuidv4(),
      tenantId: tenant.id,
      category: 'GAJI',
      amount: salaryAmt.toFixed(2),
      paymentMethod: 'BANK_TRANSFER',
      description: salaryDesc,
      date: new Date(2026, m, 25, 11, 0, 0),
      createdByMembershipId: ownerMembership.id,
      createdAt: new Date(2026, m, 25, 11, 0, 0),
      updatedAt: new Date(2026, m, 25, 11, 0, 0),
    });
  }

  // Utilitas Bulanan (PLN, WiFi Biznet, PDAM, LPG) tiap awal bulan (Jan s/d Okt 2026)
  for (let m = 0; m <= 9; m++) {
    // Listrik PLN (tgl 6)
    const plnAmt = 1450000 + Math.floor(Math.random() * 300000);
    newExpenses.push({
      id: uuidv4(),
      tenantId: tenant.id,
      category: 'OPERASIONAL',
      amount: plnAmt.toFixed(2),
      paymentMethod: 'BANK_TRANSFER',
      description: 'Tagihan listrik PLN pascabayar outlet',
      date: new Date(2026, m, 6, 10, 0, 0),
      createdByMembershipId: managerMember.id,
      createdAt: new Date(2026, m, 6, 10, 0, 0),
      updatedAt: new Date(2026, m, 6, 10, 0, 0),
    });

    // Internet Biznet WiFi (tgl 7)
    newExpenses.push({
      id: uuidv4(),
      tenantId: tenant.id,
      category: 'OPERASIONAL',
      amount: '550000.00',
      paymentMethod: 'BANK_TRANSFER',
      description: 'Langganan internet Biznet Dedicated & WiFi pelanggan',
      date: new Date(2026, m, 7, 10, 30, 0),
      createdByMembershipId: managerMember.id,
      createdAt: new Date(2026, m, 7, 10, 30, 0),
      updatedAt: new Date(2026, m, 7, 10, 30, 0),
    });

    // PDAM Air (tgl 8)
    const pdamAmt = 260000 + Math.floor(Math.random() * 80000);
    newExpenses.push({
      id: uuidv4(),
      tenantId: tenant.id,
      category: 'OPERASIONAL',
      amount: pdamAmt.toFixed(2),
      paymentMethod: 'BANK_TRANSFER',
      description: 'Tagihan air bersih PDAM & galon air mineral operasional',
      date: new Date(2026, m, 8, 11, 0, 0),
      createdByMembershipId: managerMember.id,
      createdAt: new Date(2026, m, 8, 11, 0, 0),
      updatedAt: new Date(2026, m, 8, 11, 0, 0),
    });

    // Gas LPG dapur (tgl 16)
    if (m < 9 || (m === 9 && 16 <= 11)) {
      newExpenses.push({
        id: uuidv4(),
        tenantId: tenant.id,
        category: 'OPERASIONAL',
        amount: '380000.00',
        paymentMethod: 'TUNAI',
        description: 'Pembelian tabung gas LPG 12kg & 3kg operasional dapur',
        date: new Date(2026, m, 16, 14, 0, 0),
        createdByMembershipId: managerMember.id,
        createdAt: new Date(2026, m, 16, 14, 0, 0),
        updatedAt: new Date(2026, m, 16, 14, 0, 0),
      });
    }

    // Marketing Instagram Ads (tgl 10)
    newExpenses.push({
      id: uuidv4(),
      tenantId: tenant.id,
      category: 'MARKETING',
      amount: (350000 + Math.floor(Math.random() * 200000)).toFixed(2),
      paymentMethod: 'BANK_TRANSFER',
      description: 'Iklan bersponsor Instagram Ads & konten video lokal promo',
      date: new Date(2026, m, 10, 15, 0, 0),
      createdByMembershipId: managerMember.id,
      createdAt: new Date(2026, m, 10, 15, 0, 0),
      updatedAt: new Date(2026, m, 10, 15, 0, 0),
    });
  }

  // Pemeliharaan Mesin & AC (Berkala 2 bulan sekali)
  const maintenanceSchedules = [
    { m: 1, d: 15, desc: 'Servis berkala & descaling mesin espresso Nuova Simonelli', amt: 650000 },
    { m: 3, d: 12, desc: 'Cuci rutin 3 unit AC indoor & penggantian filter udara', amt: 300000 },
    { m: 5, d: 8, desc: 'Perbaikan instalasi pipa pembuangan sink bar & kitchen', amt: 450000 },
    { m: 7, d: 18, desc: 'Servis grinder kopi & kalibrasi burr set espresso', amt: 350000 },
    { m: 8, d: 22, desc: 'Cuci rutin 3 unit AC & pembersihan exhaust kitchen', amt: 350000 },
  ];
  maintenanceSchedules.forEach(ms => {
    newExpenses.push({
      id: uuidv4(),
      tenantId: tenant.id,
      category: 'PEMELIHARAAN',
      amount: ms.amt.toFixed(2),
      paymentMethod: 'BANK_TRANSFER',
      description: ms.desc,
      date: new Date(2026, ms.m, ms.d, 11, 0, 0),
      createdByMembershipId: managerMember.id,
      createdAt: new Date(2026, ms.m, ms.d, 11, 0, 0),
      updatedAt: new Date(2026, ms.m, ms.d, 11, 0, 0),
    });
  });

  // -------------------------------------------------------------
  // C. SIMULASI TRANSAKSI HARIAN & SHIFT KASIR (284 HARI)
  // -------------------------------------------------------------
  console.log('\n[4/5] Menghasilkan 284 hari transaksi realistis & shift kasir...');

  const dateCursor = new Date(startDate);
  let dayIndex = 0;

  while (dateCursor <= endDate) {
    dayIndex++;
    const currentYear = dateCursor.getFullYear();
    const currentMonth = dateCursor.getMonth();
    const currentDay = dateCursor.getDate();
    const dayOfWeek = dateCursor.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const isToday = currentYear === 2026 && currentMonth === 9 && currentDay === 11;

    // --- Biaya Rutin Bahan Baku & Packaging Harian/Mingguan ---
    // Tiap 3 hari: Pembelian bahan baku
    if (dayIndex % 3 === 0) {
      const isMeatOrDairy = dayIndex % 6 === 0;
      const bAmt = isMeatOrDairy ? (600000 + Math.floor(Math.random() * 300000)) : (450000 + Math.floor(Math.random() * 250000));
      const bDesc = isMeatOrDairy
        ? 'Restock susu segar Diamond & Greenfields 2 karton + sirup gourmet'
        : 'Restock biji kopi espresso blend (Arabica Gayo & Robusta Temanggung 3kg)';

      newExpenses.push({
        id: uuidv4(),
        tenantId: tenant.id,
        category: 'BAHAN_BAKU',
        amount: bAmt.toFixed(2),
        paymentMethod: Math.random() > 0.4 ? 'BANK_TRANSFER' : 'TUNAI',
        description: bDesc,
        date: new Date(currentYear, currentMonth, currentDay, 8, 30, 0),
        createdByMembershipId: managerMember.id,
        createdAt: new Date(currentYear, currentMonth, currentDay, 8, 30, 0),
        updatedAt: new Date(currentYear, currentMonth, currentDay, 8, 30, 0),
      });
    }

    // Tiap 4 hari: Bahan dapur basah
    if (dayIndex % 4 === 1) {
      const kAmt = 350000 + Math.floor(Math.random() * 200000);
      newExpenses.push({
        id: uuidv4(),
        tenantId: tenant.id,
        category: 'BAHAN_BAKU',
        amount: kAmt.toFixed(2),
        paymentMethod: 'TUNAI',
        description: 'Bahan dapur basah: beras, telur ayam, ayam fillet & sayuran segar',
        date: new Date(currentYear, currentMonth, currentDay, 7, 15, 0),
        createdByMembershipId: cashierMember.id,
        createdAt: new Date(currentYear, currentMonth, currentDay, 7, 15, 0),
        updatedAt: new Date(currentYear, currentMonth, currentDay, 7, 15, 0),
      });
    }

    // Tiap 12 hari: Packaging
    if (dayIndex % 12 === 2) {
      const pAmt = 650000 + Math.floor(Math.random() * 250000);
      newExpenses.push({
        id: uuidv4(),
        tenantId: tenant.id,
        category: 'PACKAGING',
        amount: pAmt.toFixed(2),
        paymentMethod: 'BANK_TRANSFER',
        description: 'Restock paper cup, cold cup 16oz + seal logo, sedotan & paper bag',
        date: new Date(currentYear, currentMonth, currentDay, 13, 0, 0),
        createdByMembershipId: managerMember.id,
        createdAt: new Date(currentYear, currentMonth, currentDay, 13, 0, 0),
        updatedAt: new Date(currentYear, currentMonth, currentDay, 13, 0, 0),
      });
    }

    // Tiap 7 hari: Perlengkapan kebersihan toko (LAINNYA)
    if (dayIndex % 7 === 4) {
      newExpenses.push({
        id: uuidv4(),
        tenantId: tenant.id,
        category: 'LAINNYA',
        amount: (75000 + Math.floor(Math.random() * 45000)).toFixed(2),
        paymentMethod: 'TUNAI',
        description: 'Belanja perlengkapan sanitasi bar: sunlight, tisu, plastik sampah',
        date: new Date(currentYear, currentMonth, currentDay, 16, 30, 0),
        createdByMembershipId: cashierMember.id,
        createdAt: new Date(currentYear, currentMonth, currentDay, 16, 30, 0),
        updatedAt: new Date(currentYear, currentMonth, currentDay, 16, 30, 0),
      });
    }

    // --- Shift Kasir Harian (2 Shift) ---
    // Shift 1: 07:30 - 15:30
    const shift1Id = uuidv4();
    const shift1Start = new Date(currentYear, currentMonth, currentDay, 7, 30, 0);
    const shift1End = new Date(currentYear, currentMonth, currentDay, 15, 30, 0);

    // Shift 2: 15:30 - 23:30
    const shift2Id = uuidv4();
    const shift2Start = new Date(currentYear, currentMonth, currentDay, 15, 30, 0);
    const shift2End = isToday ? null : new Date(currentYear, currentMonth, currentDay, 23, 30, 0);

    let shift1CashCollected = 0;
    let shift2CashCollected = 0;

    // --- Volume Transaksi Harian (Calibrated Realistis ~20-25 trx/hari) ---
    // Pertumbuhan organik bertahap dari Jan s/d Okt
    const growthFactor = 0.85 + (dayIndex / totalDays) * 0.35; // 0.85 di Jan naik jadi 1.2 di Okt
    const baseDailyVolume = isWeekend ? (28 + Math.floor(Math.random() * 10)) : (18 + Math.floor(Math.random() * 8));
    const dailyVolume = Math.round(baseDailyVolume * growthFactor);

    // Iterasi setiap transaksi di hari ini
    for (let i = 0; i < dailyVolume; i++) {
      globalOrderCount++;

      // Jam pesanan (Dayparting Realistis)
      const randHour = Math.random();
      let hour = 12;
      if (randHour < 0.15) {
        hour = 8 + Math.floor(Math.random() * 3); // 08:00 - 10:59 (Pagi)
      } else if (randHour < 0.42) {
        hour = 11 + Math.floor(Math.random() * 3); // 11:00 - 13:59 (Makan Siang)
      } else if (randHour < 0.58) {
        hour = 14 + Math.floor(Math.random() * 3); // 14:00 - 16:59 (Sore Nongkrong)
      } else if (randHour < 0.88) {
        hour = 17 + Math.floor(Math.random() * 5); // 17:00 - 21:59 (Makan Malam)
      } else {
        hour = 22 + Math.floor(Math.random() * 2); // 22:00 - 23:30 (Late Night)
      }

      // Jangan lampaui jam saat ini jika hari ini
      if (isToday && hour > 22) {
        hour = 20;
      }

      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);
      const txDate = new Date(currentYear, currentMonth, currentDay, hour, minute, second);

      // Tentukan shift transaksi
      const isShift1 = hour < 15 || (hour === 15 && minute <= 30);
      const currentShiftId = isShift1 ? shift1Id : shift2Id;

      // Item dalam keranjang (1 - 3 item)
      let itemCount = 1;
      if ((hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 21)) {
        itemCount = Math.random() > 0.4 ? 2 : 3;
      } else {
        itemCount = Math.random() > 0.6 ? 2 : 1;
      }

      const basket: { product: typeof allProducts[0]; qty: number; mods: any[] }[] = [];
      for (let j = 0; j < itemCount; j++) {
        let chosenProd: typeof allProducts[0];
        if (hour < 11) {
          chosenProd = j === 0 ? pick(morningProducts) : pick(beverages);
        } else if ((hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 21)) {
          chosenProd = j === 0 ? pick(heavyMeals) : pick(beverages);
        } else {
          chosenProd = j === 0 ? pick(beverages) : pick(snacks);
        }

        // Modifiers varian
        const selectedMods: any[] = [];
        const catName = (chosenProd as any).categoryName || '';
        if (catName.includes('Coffee') || catName.includes('Tea')) {
          if (Math.random() > 0.3) {
            selectedMods.push({ id: 'mod-ice', name: 'Less Ice', price: 0 });
          }
          if (Math.random() > 0.4) {
            selectedMods.push({ id: 'mod-sugar', name: 'Less Sugar', price: 0 });
          }
          if (Math.random() > 0.75) {
            selectedMods.push({ id: 'mod-extra-shot', name: 'Extra Shot Espresso', price: 6000 });
          }
        }
        if (catName.includes('Main Course')) {
          selectedMods.push({ id: 'mod-spicy', name: Math.random() > 0.5 ? 'Pedas Sedang' : 'Tidak Pedas', price: 0 });
          if (Math.random() > 0.6) {
            selectedMods.push({ id: 'mod-egg', name: 'Telur Mata Sapi', price: 5000 });
          }
        }

        basket.push({
          product: chosenProd,
          qty: 1,
          mods: selectedMods
        });
      }

      // Hitung subtotal
      let subtotal = 0;
      basket.forEach(item => {
        const basePrice = parseFloat(item.product.price || '25000') || 25000;
        const modPrice = item.mods.reduce((acc, m) => acc + (m.price || 0), 0);
        subtotal += (basePrice + modPrice) * item.qty;
      });

      // Diskon (8% transaksi mendapatkan promo diskon 10%)
      const hasDiscount = Math.random() < 0.08;
      const discount = hasDiscount ? Math.round(subtotal * 0.1) : 0;
      const grandTotal = Math.max(0, subtotal - discount);

      // Metode Pembayaran Realistis
      const randMethod = Math.random();
      let paymentMethod = 'CASH';
      let gatewayFee = 0;
      let source = 'POS';

      if (randMethod < 0.40) {
        paymentMethod = 'CASH';
        gatewayFee = 0;
        source = 'POS';
      } else if (randMethod < 0.78) {
        paymentMethod = 'QRIS_STATIC';
        gatewayFee = 0;
        source = Math.random() > 0.25 ? 'POS' : 'QR';
      } else if (randMethod < 0.90) {
        paymentMethod = 'QRIS_DYNAMIC';
        gatewayFee = Math.round(grandTotal * 0.007); // 0.7% MDR DOKU
        source = 'POS';
      } else if (randMethod < 0.97) {
        paymentMethod = 'ONLINE';
        gatewayFee = Math.round(grandTotal * 0.007);
        source = 'QR';
      } else {
        paymentMethod = 'CARD';
        gatewayFee = 0;
        source = 'POS';
      }

      const netAmount = Math.max(0, grandTotal - gatewayFee);

      // Status Transaksi (98.8% Selesai, 1.2% Canceled)
      const isCanceled = Math.random() < 0.012;
      const status = isCanceled ? 'CANCELLED' : 'COMPLETED';
      const paymentStatus = isCanceled ? 'CANCELED' : 'PAID';

      // Catat ke laci uang tunai shift jika lunas & tunai
      if (!isCanceled && paymentMethod === 'CASH') {
        if (isShift1) {
          shift1CashCollected += grandTotal;
        } else {
          shift2CashCollected += grandTotal;
        }
      }

      const isTakeaway = Math.random() < 0.2;
      const txId = uuidv4();
      const orderNum = `#KJ-${globalOrderCount}`;

      newTransactions.push({
        id: txId,
        tenantId: tenant.id,
        source,
        shiftId: currentShiftId,
        cashierMembershipId: cashierMember.id,
        totalAmount: String(subtotal),
        discount: String(discount),
        tax: '0',
        serviceCharge: '0',
        platformFee: '0',
        rounding: '0',
        grandTotal: String(grandTotal),
        gatewayFee: String(gatewayFee),
        netAmount: String(netAmount),
        paymentMethod,
        paymentStatus,
        status,
        orderType: isTakeaway ? 'TAKEAWAY' : 'DINE_IN',
        customerName: pick(customerNames),
        tableNumber: isTakeaway ? null : pick(tableNumbers),
        orderNumber: orderNum,
        voidReason: isCanceled ? 'Pelanggan membatalkan pesanan sebelum dibuat' : null,
        createdAt: txDate,
      });

      // Rincian item produk
      basket.forEach(item => {
        const basePrice = parseFloat(item.product.price || '25000') || 25000;
        const modPrice = item.mods.reduce((acc, m) => acc + (m.price || 0), 0);
        const itemUnitPrice = basePrice + modPrice;
        const itemSubtotal = itemUnitPrice * item.qty;

        newTransactionItems.push({
          id: uuidv4(),
          tenantId: tenant.id,
          transactionId: txId,
          productId: item.product.id,
          quantity: item.qty,
          price: String(itemUnitPrice),
          subtotal: String(itemSubtotal),
          modifiers: item.mods.length > 0 ? item.mods : null,
          isCompleted: !isCanceled,
          createdAt: txDate,
        });
      });
    }

    // --- Simpan Shift 1 & Shift 2 ---
    const startingCash = 300000;
    // Shift 1
    const shift1Expected = startingCash + shift1CashCollected;
    const shift1Diff = Math.random() > 0.95 ? (Math.random() > 0.5 ? 1000 : -2000) : 0;
    const shift1Actual = shift1Expected + shift1Diff;

    newShifts.push({
      id: shift1Id,
      tenantId: tenant.id,
      membershipId: cashierMember.id,
      startTime: shift1Start,
      endTime: shift1End,
      startingCash: startingCash.toFixed(2),
      expectedCash: shift1Expected.toFixed(2),
      actualCash: shift1Actual.toFixed(2),
      cashDifference: shift1Diff.toFixed(2),
      status: 'ENDED',
      createdAt: shift1Start,
      updatedAt: shift1End,
    });

    // Shift 2
    const shift2Expected = startingCash + shift2CashCollected;
    const shift2Diff = isToday ? null : (Math.random() > 0.95 ? (Math.random() > 0.5 ? 2000 : -1000) : 0);
    const shift2Actual = isToday ? null : (shift2Expected + (shift2Diff || 0));

    newShifts.push({
      id: shift2Id,
      tenantId: tenant.id,
      membershipId: cashierMember.id,
      startTime: shift2Start,
      endTime: shift2End,
      startingCash: startingCash.toFixed(2),
      expectedCash: shift2Expected.toFixed(2),
      actualCash: shift2Actual !== null ? shift2Actual.toFixed(2) : null,
      cashDifference: shift2Diff !== null ? shift2Diff.toFixed(2) : null,
      status: isToday ? 'ACTIVE' : 'ENDED',
      createdAt: shift2Start,
      updatedAt: isToday ? shift2Start : (shift2End as Date),
    });

    // Kemajuan tanggal
    dateCursor.setDate(dateCursor.getDate() + 1);
  }

  // -------------------------------------------------------------
  // 5. UPLOAD KE DATABASE DENGAN BATCHING EFISIEN
  // -------------------------------------------------------------
  console.log(`\n[5/5] Mengunggah seluruh data ke database:`);
  console.log(`  - Incomes      : ${newIncomes.length} baris`);
  console.log(`  - Expenses     : ${newExpenses.length} baris`);
  console.log(`  - Shifts       : ${newShifts.length} baris`);
  console.log(`  - Transactions : ${newTransactions.length} baris`);
  console.log(`  - Items        : ${newTransactionItems.length} baris\n`);

  // Upload Incomes
  if (newIncomes.length > 0) {
    await db.insert(incomes).values(newIncomes);
    console.log(`✓ ${newIncomes.length} data Incomes berhasil disimpan.`);
  }

  // Upload Expenses
  const EXP_BATCH = 100;
  for (let i = 0; i < newExpenses.length; i += EXP_BATCH) {
    await db.insert(expenses).values(newExpenses.slice(i, i + EXP_BATCH));
  }
  console.log(`✓ ${newExpenses.length} data Expenses berhasil disimpan.`);

  // Upload Shifts
  const SHIFT_BATCH = 100;
  for (let i = 0; i < newShifts.length; i += SHIFT_BATCH) {
    await db.insert(shifts).values(newShifts.slice(i, i + SHIFT_BATCH));
  }
  console.log(`✓ ${newShifts.length} data Shifts berhasil disimpan.`);

  // Upload Transactions
  const TRX_BATCH = 100;
  console.log(`Mengunggah transaksi (${newTransactions.length} data)...`);
  for (let i = 0; i < newTransactions.length; i += TRX_BATCH) {
    await db.insert(transactions).values(newTransactions.slice(i, i + TRX_BATCH));
    if (i % 1000 === 0 && i > 0) {
      console.log(`  Progress transaksi: ${i} / ${newTransactions.length}...`);
    }
  }
  console.log(`✓ ${newTransactions.length} data Transaksi berhasil disimpan.`);

  // Upload Transaction Items
  const ITEM_BATCH = 150;
  console.log(`Mengunggah rincian item produk (${newTransactionItems.length} data)...`);
  for (let i = 0; i < newTransactionItems.length; i += ITEM_BATCH) {
    await db.insert(transactionItems).values(newTransactionItems.slice(i, i + ITEM_BATCH));
    if (i % 2000 === 0 && i > 0) {
      console.log(`  Progress item produk: ${i} / ${newTransactionItems.length}...`);
    }
  }
  console.log(`✓ ${newTransactionItems.length} data Rincian Item berhasil disimpan.`);

  // -------------------------------------------------------------
  // RINGKASAN REKONSILIASI KEUANGAN & ARUS KAS
  // -------------------------------------------------------------
  let totalGrossSales = 0;
  let totalMdrFees = 0;
  let totalCashInflow = 0;
  let totalNonCashInflow = 0;

  newTransactions.forEach(t => {
    if (t.status === 'COMPLETED') {
      const g = parseFloat(t.grandTotal);
      const f = parseFloat(t.gatewayFee);
      totalGrossSales += g;
      totalMdrFees += f;
      if (t.paymentMethod === 'CASH') {
        totalCashInflow += g;
      } else {
        totalNonCashInflow += (g - f);
      }
    }
  });

  const totalManualIncomes = newIncomes.reduce((acc, inc) => acc + parseFloat(inc.amount), 0);
  const totalExpensesAmount = newExpenses.reduce((acc, exp) => acc + parseFloat(exp.amount), 0);
  const totalAllCashIn = totalCashInflow + totalNonCashInflow + totalManualIncomes;
  const netCashFlow = totalAllCashIn - totalExpensesAmount;

  console.log('\n========================================================');
  console.log('       RINGKASAN LAPORAN KEUANGAN & CASH FLOW (2026)');
  console.log('========================================================');
  console.log(`Total Transaksi Berhasil : ${newTransactions.filter(t => t.status === 'COMPLETED').length} pesanan`);
  console.log(`Total Penjualan Kotor    : Rp ${Math.round(totalGrossSales).toLocaleString('id-ID')}`);
  console.log(`Total Fee Gateway (MDR)  : Rp ${Math.round(totalMdrFees).toLocaleString('id-ID')}`);
  console.log(`Arus Kas Masuk (Sales)   : Rp ${Math.round(totalCashInflow + totalNonCashInflow).toLocaleString('id-ID')}`);
  console.log(`  - Tunai (Laci Kasir)   : Rp ${Math.round(totalCashInflow).toLocaleString('id-ID')}`);
  console.log(`  - Non-Tunai (Rekening) : Rp ${Math.round(totalNonCashInflow).toLocaleString('id-ID')}`);
  console.log(`Pemasukan Non-Sales/Modal: Rp ${Math.round(totalManualIncomes).toLocaleString('id-ID')}`);
  console.log(`TOTAL ARUS KAS MASUK     : Rp ${Math.round(totalAllCashIn).toLocaleString('id-ID')}`);
  console.log(`TOTAL ARUS KAS KELUAR    : Rp ${Math.round(totalExpensesAmount).toLocaleString('id-ID')}`);
  console.log(`ARUS KAS BERSIH (NET)    : Rp ${Math.round(netCashFlow).toLocaleString('id-ID')} (${((netCashFlow / totalAllCashIn) * 100).toFixed(1)}% margin)`);
  console.log('========================================================\n');

  process.exit(0);
}

seedReports2026().catch(err => {
  console.error('Fatal error saat seeding:', err);
  process.exit(1);
});
