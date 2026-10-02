# MENUIN — Report & Analytics Design Decisions

**Tanggal:** 27 September 2026  
**Modul:** Report & Analytics Suite (Penjualan, Operasional, Keuangan)  
**Author:** Tim Senior Cross-Functional Product & Analytics MENUIN  

---

## 1. Latar Belakang & Masalah Utama
Sebelum implementasi ini, modul laporan pada MENUIN hanya menyajikan satu halaman laporan keuangan dasar dengan kartu omset dan tabel riwayat transaksi flat. Bisnis F&B membutuhkan visualisasi komprehensif yang menjawab tiga pertanyaan fundamental:
1. **Sales (Penjualan):** Berapa omset bersih yang dihasilkan dan bagaimana trennya?
2. **Operations (Operasional):** Kapan jam dan hari tersibuk (peak hours) untuk penjadwalan staf dan manajemen dapur?
3. **Finance (Keuangan):** Berapa arus kas masuk vs kas keluar, apa saja rincian pengeluaran operasional outlet, dan bagaimana rekonsiliasi laci kasir?

---

## 2. Keputusan Desain & Visualisasi

### 2.1 Novel Stacked Rounded-Square Block Bar Chart (Revenue Analytics)
* **Keputusan:** Menggantikan diagram batang solid konvensional dengan kolom vertikal yang tersusun dari kotak-kotak rounded bertingkat (*stacked rounded square blocks*), terinspirasi dari referensi visual Revenue Analytics modern.
* **Tinggi Blok:** Ditingkatkan menjadi `h-4 sm:h-5` dengan sudut `rounded-[4px] sm:rounded-[5px]`.
* **Harmonisasi Warna Brand Menuin:** Warna *idle* kotak yang sebelumnya hijau/mint digantikan dengan warna khas **Menuin Ice Blue (`bg-[#0e59f9]/20`)** dengan bingkai halus `border-[#0e59f9]/15`. Saat kolom di-hover, balok berubah menjadi solid **Menuin Blue (`#0e59f9`)**.
* **Kejernihan Visual:** Garis *trendline* dihilangkan agar tampilan diagram fokus, bersih, tidak tumpang-tindih (*uncluttered*), dan mematuhi estetika desain Menuin.
* **Interaktivitas:** Hover pada kolom mengaktifkan efek Menuin Blue (`#0e59f9`), memunculkan popover card informatif dengan angka penjualan bersih, pesanan, dan target/pembanding, serta menyorot tanggal di sumbu X dengan badge rounded.

### 2.2 Orders Heatmap — Day of Week × Hour (Peak Hours)
* **Keputusan:** Mengadopsi visualisasi heatmap 7 hari × 24 jam (Senin - Minggu × 12am - 11pm) dengan gradasi warna biru bertingkat (*density shading*) dan pencantuman angka pesanan langsung di dalam sel.
* **Rasional F&B:** Memudahkan pemilik resto dan manajer outlet membedakan jam sepi (*slow hours*) dan jam ramai (*rush hours*) secara instan dalam 5 detik.
* **4 Kartu Indikator Utama:** Jam Tersibuk (Busiest Hour), Jam Tersepi (Slowest Hour), Hari Tersibuk (Busiest Day), dan Hari Tersepi (Slowest Day) diletakkan di atas heatmap untuk ringkasan cepat.
* **Diagram Pelengkap:** Dilengkapi distribusi pesanan per jam (hourly distribution) dan kontribusi omset per hari dalam seminggu.

### 2.3 Keuangan & Pengeluaran Kas (Cash Flow & Expense Tracking)
* **Keputusan:** Memperkenalkan entitas `expenses` untuk mencatat biaya operasional kas kecil (bahan baku darurat, gas, air galon, kantong kresek, upah harian) yang otomatis mengurangi arus kas (`cashFlow.totalCashOut`).
* **Batas Akuntansi (Accounting Boundary):** MENUIN secara tegas membedakan **Estimasi Laba Kotor (Theoretical Gross Profit)** dari Net Profit formal. Laba kotor dihitung dari `Net Sales - Estimasi HPP Modal Produk Resep`, dengan disclaimer transparan bahwa ini belum mencakup beban depresiasi atau sewa tempat tahunan.

### 2.4 Navigasi Sub-Sidebar Bertingkat (Dual-Tier Sub-Sidebar)
* **Keputusan:** Menerapkan sub-sidebar putih (`w-60 bg-white border-r border-[#EAEFF8]`) yang menempel langsung (*flush*) pada rel sidebar biru Menuin dengan lekukan scoop corner melengkung (`curved-tab-active`).
* **Struktur Navigasi:**
  ```text
  Report & Analytics
  ├── Penjualan (Sales) — /outlet/[outletKey]/reports
  ├── Operasional & Peak Hours — /outlet/[outletKey]/reports/operations
  └── Keuangan & Arus Kas — /outlet/[outletKey]/reports/finance
  ```

### 2.5 Standardisasi Layout Top KPI Cards & Minimalist Header Typography
* **Keputusan:** Menyelaraskan tata letak 4 kartu KPI teratas di seluruh suite laporan (Sales, Operations):
  - **Icon:** Dipindahkan ke pojok kanan atas dalam kontainer lingkaran (`w-10 h-10 rounded-full flex items-center justify-center`).
  - **Judul Metrik:** Diposisikan di pojok kiri atas (`text-[11px] font-semibold uppercase tracking-wider`).
  - **Nilai & Subteks:** Berada di pojok kiri bawah (`text-xl sm:text-2xl font-semibold` dengan currency compact `formatKpiCurrency`).
  - **Visual Sparkline:** Berada di pojok kanan bawah (**`MiniSparkline`** SVG Catmull-Rom spline dengan `IntersectionObserver`). Pada Hero Blue Card menggunakan `color="#ffffff"`.
  - **Pemberantasan AI Slop & Badge Clutter:** Menghapus seluruh pill badge di pojok kanan atas kartu KPI dan mengganti label `Puncak: [Hari]` pada grafik dengan teks datar clean format **`[Hari] : [Nominal]`**.

### 2.6 Layout Asimetris KPI Finansial (Net Flow Hero, Inflow, Outflow)
* **Keputusan:** Pada modul Laporan Keuangan & Arus Kas (`/reports/finance`), kartu KPI teratas direstrukturisasi dari grid simetris 4 kartu menjadi **Grid Asimetris 3 Kartu (50% : 25% : 25%)**:
  1. **Net Flow Hero Blue Card (`lg:col-span-2`):** Fokus pada likuiditas kas riil bisnis (`Arus Kas Bersih`). Dilengkapi nominal besar, baseline status surplus/defisit, kurva trendline SVG putih (`MiniSparkline`), dan tombol aksi cepat operasional (*+ Catat Biaya*, *Ekspor Excel*, *Cetak*).
  2. **Inflow Card (`lg:col-span-1`):** Fokus pada realisasi kas masuk dengan pemisahan sub-metrik ganda (*Dual-Split Sub-Metrics*) antara penerimaan fisik *Kasir Tunai* vs saldo digital *QRIS & Bank*.
  3. **Outflow Card (`lg:col-span-1`):** Fokus pada beban pengeluaran dengan bilah distribusi proporsional (*Segmented Progress Bar*) kas kecil laci kasir vs transfer rekening bank.

---

## 3. Ekspor Data & Auditability
* Mendukung ekspor menyeluruh ke spreadsheet Excel (`.xlsx`) multi-sheet (Ringkasan, Harian, Metode Pembayaran, Pengeluaran, dan Rekonsiliasi Shift Kasir).
* Mendukung cetak langsung / cetak PDF (`window.print()`) dengan layout dokumen resmi bersih tanpa elemen kontrol UI.
