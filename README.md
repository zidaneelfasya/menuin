# 🚀 MENUIN - Modern F&B SaaS Platform

**Menuin** adalah platform *Software as a Service* (SaaS) Point of Sale (POS) dan manajemen pesanan cerdas, dirancang khusus untuk bisnis Food & Beverage (F&B) modern seperti kafe, restoran, dan franchise.

Sistem ini mengintegrasikan aplikasi Kasir (POS) berkecepatan tinggi dengan sistem **QR Order Mandiri** (Self-Service) di meja pelanggan, yang semuanya saling sinkron secara real-time ke dapur (Kitchen Display) dan laporan analitik *owner* (Dashboard).

---

## ✨ Fitur Unggulan

Menuin didesain dengan berfokus pada kecepatan operasional, estetika visual (UI/UX yang mewah dan interaktif), serta kelengkapan fitur enterprise:

1. **📱 Smart QR Ordering (Tanpa Aplikasi):** Pelanggan cukup *scan* QR code di meja untuk membuka menu interaktif, menyesuaikan pesanan (catatan, tambahan topping), dan membayar langsung secara online (QRIS/E-Wallet).
2. **⚡ High-Speed POS Cashier:** Sistem kasir terpadu yang didesain meminimalisir jumlah klik, bekerja mulus mencatat transaksi tunai, kartu debit, hingga integrasi pesanan *online food* (GrabFood, GoFood, ShopeeFood).
3. **🔄 Real-Time Kitchen Sync:** Pesanan yang masuk melalui QR meja maupun POS kasir akan seketika (instant) muncul di *Kitchen Display* tanpa perlu mencetak kertas secara manual.
4. **📊 Analytics & Shift Audit:** Pantau pendapatan secara *live*, analisa item paling laku (Best Seller), serta kelola pembukuan Shift (buka/tutup kasir) secara akurat untuk meminimalisir kebocoran kas.
5. **🏢 Multi-Branch & Role Management:** Dapat menaungi banyak outlet/cabang sekaligus, dengan hak akses (Role-Based Access Control) seperti Superadmin, Store Manager, dan Kasir.
6. **🎨 Premium UI/UX:** Transisi antar halaman yang sangat responsif, sistem desain ala *Bento grid*, efek *liquid glass*, animasi mikro (Framer Motion) yang membuat pengalaman pengguna lebih nyata dan berkelas.

---

## 🛠️ Stack Teknologi (Tech Stack)

Aplikasi dibangun di atas pondasi web-modern terbaik saat ini:
- **Framework:** Next.js (App Router), React 19.
- **Styling:** Tailwind CSS + Shadcn UI + Radix UI.
- **Animation:** Framer Motion (Transisi, Micro-interactions).
- **State Management:** Zustand & React Context.
- **Database:** PostgreSQL diakses via Drizzle ORM.
- **Auth & Backend Services:** Supabase (Postgres & Authentication).
- **Payment Gateway:** Integrasi Midtrans (Sandbox & Production ready).

---

## 🗺️ Struktur Route (Navigasi Halaman)

Aplikasi ini dibagi menjadi beberapa *flow* rute:

### 🌐 Publik & Autentikasi
- `/` - **Landing Page**: Beranda pemasaran, presentasi fitur, harga (Pricing), dan testimoni pengguna.
- `/auth/login` - **Sign In**: Masuk ke dalam sistem (baik bagi Kasir maupun Owner).
- `/auth/signup` - **Registrasi**: Mendaftar untuk uji coba gratis (Free Trial) atau tenant baru.

### 🏪 Area Tenant (Dashboard Owner & Kasir)
Semua rute di bawah ini berada di dalam `/tenants/` dan membutuhkan login.

- `/tenants/dashboard` - **Ringkasan (Dashboard)**: Grafik penjualan live, metrik transaksi hari ini.
- `/tenants/pos` - **Aplikasi Kasir (POS)**: Tampilan operasional kasir untuk memproses transaksi.
- `/tenants/orders` - **Pesanan Dapur**: Sinkronisasi tiket pesanan aktif untuk persiapan dapur.
- `/tenants/katalog` - **Katalog**: Pengaturan etalase dan visibilitas produk unggulan (Best Seller).
- `/tenants/items` - **Item/Menu**: Database master seluruh produk makanan dan minuman.
- `/tenants/categories` - **Kategori**: Mengelompokkan item (misal: "Kopi", "Camilan").
- `/tenants/modifiers` - **Kustomisasi (Modifier)**: Ekstra opsional seperti tingkat kemanisan, jenis susu, atau topping.
- `/tenants/inventory` - **Stok**: Pencatatan gudang, *low-stock alerts*, stok keluar/masuk.
- `/tenants/transactions` - **Riwayat Transaksi**: Daftar struk historis dan pencarian nomor pesanan.
- `/tenants/reports` - **Laporan**: Analitik penjualan mendalam, laporan harian, bulanan.
- `/tenants/finance` - **Keuangan**: Settlement dana dan perputaran kas toko.
- `/tenants/promotions` - **Promo**: Mengatur voucher atau persentase diskon.
- `/tenants/users` - **Kasir Toko (Staff)**: Manajemen karyawan dan penetapan akses *role*.
- `/tenants/settings` - **Pengaturan Global**: Konfigurasi nama toko, pajak (PB1 10%), Service Charge, Kredensial Midtrans, dan potongan komisi Ojol.

### 🍽️ Customer Facing (QR Menu)
- `/table/:id` (atau rute setara) - Menu digital unik untuk setiap pelanggan yang melakukan *scan* QR.

---

## 💡 Mengapa Menggunakan Menuin? (Keunggulan)

1. **Zero-Latency Feel:** Navigasi terasa super mulus tanpa blank loading. Menggunakan kustomisasi *Page Transition* (seperti efek layar biru liquid-fill) yang menutupi proses fetch data demi *perceived performance* (kinerja visual) yang tinggi.
2. **Pajak & Potongan Otomatis:** Perhitungan tagihan kasir tidak butuh kalkulator. PB1, *Service Charge*, maupun estimasi pendapatan bersih dari GrabFood/GoFood otomatis terhitung di sistem.
3. **Lebih dari Sekadar POS:** Aplikasi ini menyatukan sistem *Self-Order* pelanggan dan mesin kasir dalam satu *database* terpusat, hal ini mencegah antrean panjang dan menurunkan tingkat kesalahan *human error*.

---

### Cara Menjalankan Secara Lokal (Development)

Pastikan variabel lingkungan (`.env.local`) yang memuat koneksi Postgres, Supabase, dan Drizzle sudah lengkap.

```bash
# 1. Install seluruh dependensi
npm install

# 2. Push / Sync Schema Database
npm run db:push

# 3. (Opsional) Jalankan data seeding
npm run db:seed

# 4. Mulai server Next.js 
npm run dev
```

Buka `http://localhost:3000` di *browser* Anda untuk menjelajahi platform MENUIN.
