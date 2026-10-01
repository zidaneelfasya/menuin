# Spesifikasi Desain & Logika: Sales Breakdown & Detail Transparansi Penjualan (Menuin)

> **Dokumen Sumber Acuan & Rencana Implementasi (Source of Truth)**  
> **Tujuan:** Memberikan transparansi menyeluruh kepada pemilik bisnis (merchant/business owner) mengenai asal-usul angka penjualan, struktur potongan, serta jembatan perhitungan dari *Gross Sales* ke *Net Sales* dan *Grand Total Collected*.  
> **Status:** Proposal & Analisis Logika Terkini (Untuk Diskusi & Finalisasi Bersama).

---

## 1. Latar Belakang & Filosofi Desain

### 1.1 Masalah Saat Ini
Pada halaman utama **Laporan Penjualan (`/reports/sales`)**, pemilik bisnis disajikan metrik ringkas seperti:
- **Penjualan Bersih (Net Sales):** e.g., `Rp 140.322.824`
- **Total Pesanan:** e.g., `1.420 Order`
- **Rata-rata Order (AOV):** e.g., `Rp 98.818`
- **Total Menu Terjual:** e.g., `3.890 Porsi`

Meskipun ringkas dan cepat dibaca, metrik ini menyisakan pertanyaan mendasar bagi pemilik bisnis:
1. *"Dari mana angka Penjualan Bersih ini didapat?"*
2. *"Berapa total nilai menu kotor sebenarnya sebelum diskon?"*
3. *"Berapa potongan diskon promosi yang telah kita berikan kepada pelanggan?"*
4. *"Berapa biaya transaksi / MDR QRIS yang dipotong oleh gateway pembayaran?"*
5. *"Kenapa angka di laporan penjualan berbeda dengan total uang yang masuk di laci atau rekening bank (karena ada PB1/Pajak & Service Charge)?"*

### 1.2 Pendekatan: Bukan Audit Kecurigaan, Melainkan Transparansi Penuh (Clarity & Peace of Mind)
- **Fokus Utama:** Keterbukaan informasi (*Transparency*), kejelasan perhitungan (*Math Clarity*), dan rasa tenang bagi pemilik bisnis (*Merchant Peace of Mind*).
- Kami tidak menggunakan framing "rekonsiliasi investigatif" yang terkesan mencurigai sistem, melainkan **Anatomi Penjualan (Sales Anatomy & Breakdown)** yang menjelaskan setiap Rupiah dengan visual yang bersih, elegan, dan mudah dipahami dalam 3 detik.

---

## 2. Analisis Data & Logika Formula Terkini (Codebase Ground Truth)

Berdasarkan audit langsung pada skema database (`lib/db/schema.ts`), aksi transaksi POS (`lib/actions/transactions.ts`), pemesanan online (`lib/actions/public-catalog.ts`), serta mesin laporan (`lib/actions/reports.ts`), berikut adalah struktur data aktual yang berlaku di Menuin:

### 2.1 Struktur Komponen Finansial di Database

| Kolom Database | Nama di UI | Deskripsi & Peran Finansial |
| :--- | :--- | :--- |
| `totalAmount` | **Penjualan Kotor (Gross Sales)** | Penjumlahan harga dasar menu (`price × quantity`) ditambah pilihan modifier/topping sebelum dipotong diskon apapun. |
| `discount` | **Potongan Diskon Promosi** | Total nominal potongan harga dari voucher, promo persentase, atau potongan manual kasir. |
| `gatewayFee` | **Biaya Transaksi Gateway (MDR)** | Biaya potongan penyedia pembayaran (MDR 0.7% untuk QRIS Dinamis & Online Payment Gateway; 0% untuk Tunai, EDC, Transfer Bank, dan QRIS Statis). |
| `tax` | **Pajak Restoran (PB1)** | Pajak daerah (biasanya 10%) yang ditagihkan kepada pelanggan atas subtotal kena pajak (`taxableSubtotal`). Bukan omzet outlet. |
| `serviceCharge` | **Biaya Layanan (Service Charge)** | Biaya jasa restoran (biasanya 5%) yang ditagihkan kepada pelanggan. |
| `rounding` | **Pembulatan Kasir** | Nominal pembulatan desimal/pecahan kasir (misal ke kelipatan Rp 100). |
| `grandTotal` | **Total Ditagihkan (Grand Total)** | Uang riil yang dibayarkan oleh pelanggan di kasir/storefront: `(totalAmount - discount) + tax + serviceCharge + rounding`. |
| `netAmount` | **Penerimaan Bersih Transaksi** | Uang bersih yang masuk ke outlet setelah dipotong MDR gateway: `grandTotal - gatewayFee`. |
| `status` & `paymentStatus` | **Status Transaksi** | Jika bernilai `CANCELLED` atau `REFUNDED`, transaksi dikecualikan dari omzet masuk, namun dicatat pada metrik *Loss Prevention / Pembatalan*. |

### 2.2 Rumus Perhitungan Saat Ini di `reports.ts`

Di backend saat ini (`getSalesReport`):
```ts
// 1. Penjualan Kotor
grossSales = sum(t.totalAmount)

// 2. Total Potongan
totalDeductions = totalDiscount + totalGatewayFee

// 3. Penjualan Bersih (Net Sales)
netSales = grossSales - (totalDiscount + totalGatewayFee)

// 4. Estimasi Laba Kotor (Gross Profit)
grossProfit = netSales - totalHpp (COGS Resep Bahan Baku)

// 5. Total Dana Diterima dari Pelanggan (Collected)
totalCollected = sum(t.grandTotal)
```

> **Catatan Analisis Kritis:**  
> Secara standar akuntansi F&B, **Penjualan Bersih (Net Sales)** produk murni umumnya adalah `Gross Sales - Diskon`.  
> Sedangkan **Biaya Gateway (MDR)** adalah beban transaksi pembayaran (*financial processing expense*).  
> Di Menuin, `netSales` secara konservatif langsung mengurangkan MDR gateway agar pemilik bisnis melihat angka yang sudah *bersih diterima*.  
> **Solusi:** Di halaman Sales Breakdown, kita akan menyajikan **kedua angka ini secara transparan** agar pemilik bisnis memahami kedua perspektif tersebut tanpa kebingungan.

---

## 3. Konsep Arsitektur Halaman: Rincian & Transparansi Penjualan

Halaman ini dapat diakses melalui link **"Lihat Rincian"** pada setiap KPI card di Laporan Penjualan (`/outlet/[outletKey]/reports/sales/detail`).

Berikut susunan 5 bagian utama yang diusulkan:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. HEADER & SINKRONISASI PERIODE                                      │
│    ← Kembali ke Laporan Penjualan | [Harian / Bulanan / Rentang]      │
│    Tombol: [Ekspor Rincian Excel] [Cetak Laporan]                      │
├────────────────────────────────────────────────────────────────────────┤
│ 2. KARTU JEMBATAN PERHITUNGAN TRANSPARAN (THE SALES WATERFALL BRIDGE) │
│    [+] Penjualan Kotor (Gross Sales)                                   │
│    [-] Potongan Diskon Promosi                                         │
│    [=] Penjualan Bersih Produk (Product Net Sales)                     │
│    [-] Biaya Gateway & MDR (0.7% QRIS Dinamis)                         │
│    [=] Omzet Bersih Toko (Merchant Net Revenue)                        │
│    [+] Titipan Pajak PB1 & Service Charge                              │
│    [=] Total Uang Diterima dari Pelanggan (Grand Total Collected)      │
├────────────────────────────────────────────────────────────────────────┤
│ 3. DUA PILAR BEDAH PENJUALAN:                                         │
│    ┌─────────────────────────────┐  ┌────────────────────────────────┐ │
│    │ A. DARI MANA OMZET DIDAPAT? │  │ B. KENAPA ANGKA DIKURANGI?     │ │
│    │ • Menu Utama (Base Price)   │  │ • Rincian Diskon per Promo     │ │
│    │ • Opsi / Modifier Tambahan  │  │ • Rincian Potongan MDR Gateway │ │
│    │ • Kanal (Kasir POS vs QR)   │  │ • Transaksi Batal (Void/Refund)│ │
│    │ • Tipe (Dine-in vs Bungkus) │  │                                │ │
│    └─────────────────────────────┘  └────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ 4. SALURAN PENERIMAAN DANA (CASH VS CASHLESS SETTLEMENT)               │
│    • Uang Tunai Fisik (Laci Kasir) -> Bebas Potongan MDR (100% Utuh)   │
│    • Nontunai Digital (QRIS / EDC) -> Masuk Rekening Bank setelah MDR  │
├────────────────────────────────────────────────────────────────────────┤
│ 5. TABEL TRANSAKSI TRANSPARAN & INSPEKSI STRUK DETAIL                  │
│    Daftar transaksi per invoice dengan kolom transparan:               │
│    [Waktu] [No. Pesanan] [Kanal] [Metode] [Kotor] [Diskon] [MDR] [Bersih]│
│    Klik baris -> Buka Modal Rincian Struk & Simulasi Potongan          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Rincian Desain Setiap Bagian (Section Breakdown)

### 4.1 Bagian 1: Header & Sinkronisasi Filter
- **Tautan Balik:** Tombol navigasi `← Kembali ke Laporan Penjualan`.
- **Badge Status Periode:** Menampilkan tanggal aktif secara jelas (misal `1 Sep 2026 – 30 Sep 2026`).
- **Tombol Ekspor:**
  - `Ekspor Rincian Excel`: Mengunduh workbook Excel yang berisi 2 sheet: *Sheet 1: Jembatan Perhitungan Transparansi*, dan *Sheet 2: Seluruh Transaksi Rinci*.
  - `Cetak`: Format printer yang ramah dokumen kertas (*clean print layout*).

---

### 4.2 Bagian 2: Kartu Jembatan Perhitungan Transparan (The Sales Waterfall Bridge)
Bagian ini adalah **kunci transparansi** yang menjawab kebingungan pemilik bisnis.  
Alih-alih hanya menampilkan 4 angka terpisah, kita tampilkan baris alur matematika yang interaktif (*horizontal or vertical layered stepped cards*):

```
+──────────────────────────────────────────────────────────────────────────────+
│ JEMBATAN PERHITUNGAN TRANSPARAN (SALES WATERFALL)                             │
│ Penjelasan rinci bagaimana omzet Anda dihitung dari pesanan kotor hingga bersih│
+──────────────────────────────────────────────────────────────────────────────+
│  (1) PENJUALAN KOTOR (Gross Sales)                               Rp 150.000.000
│      Akumulasi total harga menu asli + pilihan topping sebelum diskon
│
│  (2) POTONGAN DISKON & PROMOSI                                  -Rp   8.500.000
│      Total potongan diskon voucher, promo persentase, dan potongan kasir
│      (Persentase: 5.6% dari penjualan kotor)
│
│  ────────────────────────────────────────────────────────────────────────────
│  (=) PENJUALAN BERSIH PRODUK (Product Net Sales)                 Rp 141.500.000
│      Omzet penjualan makanan & minuman murni milik restoran Anda
│
│  (3) BIAYA PEMROSESAN PEMBAYARAN (MDR Gateway)                  -Rp   1.177.176
│      Biaya operasional MDR Bank Indonesia 0.7% untuk QRIS Dinamis & PG online
│      (0% untuk Tunai, EDC, Transfer Bank, dan QRIS Statis)
│
│  ════════════════════════════════════════════════════════════════════════════
│  (★) OMZET BERSIH FINAL DITERIMA RESTO                           Rp 140.322.824
│      Dana riil penjualan yang menjadi hak outlet Anda
│
│  ────────────────────────────────────────────────────────────────────────────
│  (+) TITIPAN PAJAK RESTORAN & SERVICE CHARGE                    +Rp  14.032.282
│      • Pajak Restoran (PB1 10%): Rp 14.032.282 (Disetor ke Kas Daerah)
│      • Service Charge (0%): Rp 0
│      • Pembulatan Kasir: Rp 0
│
│  ────────────────────────────────────────────────────────────────────────────
│  (✔) TOTAL UANG DITAGIHKAN KE PELANGGAN (Grand Total)            Rp 154.355.106
│      Total seluruh pembayaran yang masuk dari tangan pelanggan
+──────────────────────────────────────────────────────────────────────────────+
```

#### Nilai Plus untuk Pemilik Bisnis:
1. **Transparan & Jelas:** Pemilik bisnis langsung melihat mengapa angka net sales adalah `Rp 140.322.824`.
2. **Membedakan Omzet vs Pajak:** Pemilik bisnis memahami bahwa Pajak Restoran (PB1) bukan omzet mereka, melainkan uang titipan dari konsumen yang harus disetorkan ke kas daerah.
3. **Paham Potongan MDR:** Pemilik bisnis memahami bahwa Menuin tidak memotong biaya acak; potongan MDR 0.7% hanya terjadi pada metode nontunai tertentu yang menggunakan jaringan QRIS Dinamis Bank Indonesia / Payment Gateway.

---

### 4.3 Bagian 3: Dua Pilar Bedah Penjualan

Untuk memberikan penjelasan mendalam namun tetap terstruktur dan rapi, kita membagi analisis ke dalam 2 pilar berdampingan (Grid 2 Kolom):

#### Pilar A: Dari Mana Sales Dihasilkan? (Revenue Generation)
1. **Komposisi Menu Pokok vs Topping/Modifier:**
   - *Menu Makanan & Minuman Pokok (Base Subtotal):* e.g., Rp 138.000.000 (92%)
   - *Extra Pilihan / Topping / Level Pedas:* e.g., Rp 12.000.000 (8%)
2. **Kontribusi Kanal Penjualan (Channels):**
   - *Kasir POS:* e.g., 950 transaksi (Rp 95.000.000 - 63%)
   - *Self-Order QR Meja (Storefront):* e.g., 470 transaksi (Rp 55.000.000 - 37%)
3. **Kontribusi Tipe Layanan (Order Types):**
   - *Makan di Tempat (Dine-in):* e.g., 80%
   - *Bawa Pulang (Takeaway):* e.g., 18%
   - *Delivery:* e.g., 2%

#### Pilar B: Kenapa Angka Dikurangi? (Deductions & Adjustments)
1. **Rincian Diskon Promosi:**
   - Tabel/daftar ringkas yang menampilkan promo apa saja yang aktif digunakan:
     - `PROMO-GAJIAN`: 120x dipakai, total potongan: Rp 4.500.000
     - `DISCOUNT-SENIN`: 45x dipakai, total potongan: Rp 2.250.000
     - `Voucher Manual Kasir`: 30x dipakai, total potongan: Rp 1.750.000
   - Pemilik bisnis dapat langsung melihat keefektifan program promosi mereka.
2. **Rincian Biaya Transaksi / MDR Gateway:**
   - Menjelaskan tarif potongan setiap metode bayar:
     - *QRIS Dinamis Kasir & Online:* 0.7% MDR (Diproses otomatis)
     - *Tunai (Cash):* 0% (Bebas biaya MDR)
     - *Transfer Bank Langsung:* 0% (Bebas biaya MDR)
     - *EDC / Kartu Debit Bank:* 0% (Diproses mesin EDC fisik merchant)
3. **Transparansi Transaksi Batal (Void / Refund):**
   - *Jumlah Pesanan Dibatalkan:* e.g., 8 transaksi
   - *Potensi Nilai yang Dibatalkan:* e.g., Rp 620.000
   - *Alasan Pembatalan Utama:* Menampilkan alasan terbanyak (misal "Pelanggan salah pesan", "Stok bahan habis", "Perubahan pesanan").
   - Ini memberikan rasa aman bahwa transaksi yang dibatalkan tidak disembunyikan atau membuat angka laporan menjadi selisih.

---

### 4.4 Bagian 4: Distribusi Penerimaan Dana (Cash vs Digital Bank Settlement)

Pemilik bisnis seringkali mencocokkan laporan penjualan dengan uang yang mereka pegang:
- **Kas Laci Toko (Tunai Fisik):**
  - Total transaksi tunai: Rp 65.000.000
  - Potongan MDR: Rp 0 (100% diterima penuh)
  - Lokasi uang: Berada di laci fisik kasir outlet (*cash drawer*).
- **Kas Digital (Rekening Bank / QRIS Dinamis):**
  - Total transaksi nontunai: Rp 89.355.106
  - Potongan MDR (0.7%): -Rp 1.177.176
  - Uang cair ke rekening bank: Rp 88.177.930
  - Lokasi uang: Ditransfer secara berkala (*settlement*) oleh penyedia pembayaran langsung ke rekening bank outlet.

Dengan pemisahan ini, pemilik bisnis dapat langsung memverifikasi uang fisik di laci kasir dan uang digital yang masuk ke mutasi rekening bank mereka.

---

### 4.5 Bagian 5: Tabel Transaksi Transparan dengan Modal Inspeksi Struk

Di bagian bawah, disediakan tabel transaksi yang telah diperkaya:
- **Pencarian Cepat:** Berdasarkan nomor pesanan, nama pelanggan, atau nomor meja.
- **Filter Fleksibel:** Berdasarkan Kanal (POS/QR), Metode Bayar, dan Status.
- **Kolom Transparan:**
  1. *Waktu Transaksi* (Tanggal & Jam)
  2. *No. Pesanan* (e.g. `#ORD-88219`)
  3. *Meja / Pelanggan*
  4. *Kanal* (Kasir POS vs Self QR)
  5. *Metode Pembayaran* (Tunai, QRIS Dinamis, Transfer, dll)
  6. *Kotor (Subtotal)*
  7. *Diskon Promo* (dengan teks merah ` -Rp X`)
  8. *Biaya Gateway MDR* (jika ada)
  9. *Bersih Diterima* (nominal bersih yang menjadi omzet)
  10. *Status* (Selesai vs Dibatalkan)
  11. *Aksi:* Tombol **"Rincian"**
- **Modal Inspeksi Transaksi Interaktif:**
  Saat tombol "Rincian" diklik, modal menampilkan:
  - Rincian item menu yang dipesan beserta topping/modifier.
  - Simulasi perhitungan struk: Subtotal Kotor → Diskon Voucher (jika ada) → Biaya MDR → Pajak Restoran (PB1) → Grand Total dibayar pelanggan.
  - Waktu transaksi dan nama kasir yang melayani.

---

## 5. Keputusan Desain yang Telah Disepakati Bersama

Berdasarkan kesepakatan dan preferensi yang telah ditentukan bersama:

1. **Format Jembatan Perhitungan Transparan (The Sales Waterfall Bridge):**
   - **Keputusan:** **Kartu Berjenjang Berlapis (Stepped Cards)**.
   - Menggunakan baris alur matematika yang jelas (`+ Kotor`, `- Diskon`, `- MDR`, `= Bersih Toko`, `+ Pajak PB1 Titipan`, `= Total Uang Tertagih`). Dilengkapi indikator warna elegan (Biru, Merah Mawar, Emerald, dan Slate) sesuai standar visual Menuin.
2. **Penyajian Rincian Diskon & Promosi:**
   - **Keputusan:** **Kartu Rincian Promosi Khusus**.
   - Menyajikan daftar nama promo, kode voucher, frekuensi penggunaan, dan total nominal potongan sehingga pemilik bisnis langsung mengetahui program diskon mana yang memotong omzet dan seberapa efektif program tersebut.
3. **Penyajian Pajak (PB1) & Service Charge:**
   - **Keputusan:** **Eksplisit sebagai Komponen Titipan**.
   - Dijelaskan secara gamblang bahwa pajak restoran (PB1) bukan bagian dari omzet bersih restoran, melainkan uang konsumen yang dititipkan untuk disetor ke kas daerah.
4. **Penempatan Halaman:**
   - **Keputusan:** **Halaman Terdedikasi (`/reports/sales/detail`)**.
   - Diakses melalui tautan *"Lihat Rincian"* pada setiap kartu KPI Laporan Penjualan utama, memberikan ruang kerja yang leluasa untuk membaca data transaksi dan jembatan transparansi.


---

## 6. Rencana Langkah Implementasi Teknis

Setelah kita menyepakati pilihan di atas, langkah-langkah implementasinya adalah:
1. **Penyesuaian Action / Query Data (`reports.ts`):**
   - Menambahkan agregasi rincian promo (`promotionsBreakdown`: kode promo, jumlah transaksi, total diskon).
   - Menambahkan pembagian subtotal menu dasar vs modifier/topping.
   - Mengoptimalkan data rincian transaksi agar menyertakan detail item dan modifier untuk modal struk.
2. **Revamp Komponen Client (`sales-detail-client.tsx`):**
   - Membangun komponen **The Sales Waterfall Card** sesuai panduan UI Menuin (Inter font, clean borders `#EAEFF8`, flat-layered, no AI slop).
   - Membangun grid 2 pilar (Dari Mana Sales Didapat vs Kenapa Angka Dikurangi).
   - Membangun kartu distribusi penerimaan (Laci Kasir Tunai vs Rekening Bank Nontunai).
   - Memperbarui tabel transaksi dengan filter cerdas dan modal rincian struk.
3. **Penyempurnaan Ekspor Excel:**
   - Menyertakan sheet khusus ringkasan jembatan perhitungan transparansi agar pemilik bisnis dapat menyimpannya sebagai arsip bulanan.
4. **Verifikasi & QA:**
   - Memastikan seluruh perhitungan matematis konsisten antara kotor, diskon, fee, pajak, dan bersih di semua periode (harian, bulanan, tahunan, custom).
