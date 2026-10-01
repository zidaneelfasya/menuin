# CHANGELOG — Report & Analytics Suite

## [Unreleased] - 2026-09-27

### Added
- **Report & Analytics Navigation:**
  - Ditambahkan Sub-Sidebar Bertingkat (*Dual-Tier Sub-Sidebar*) pada rute `/outlet/[outletKey]/reports/*`.
  - Integrasi tab melengkung (*curved scooped active tab*) pada Primary Sidebar Menuin Blue Rail saat membuka `/reports`.
- **Modul Penjualan (Sales Analytics):**
  - KPI Cards Penjualan Bersih (Net Sales), Total Pesanan, Rata-rata Order (AOV), dan Penerimaan Kasir dengan badge pertumbuhan komparatif (+X%, -Y%).
  - Komponen visualisasi baru **`RoundedBlockBarChart`** yang menampilkan diagram batang interaktif tersusun dari kotak-kotak rounded bertingkat (*stacked rounded square blocks*) sesuai referensi Revenue Analytics.
  - Tinggi setiap kotak rounded ditingkatkan menjadi `h-4 sm:h-5` dengan sudut `rounded-[4px] sm:rounded-[5px]`.
  - Warna default (*idle*) kotak diubah dari hijau/mint menjadi palet khas **Menuin Ice Blue (`bg-[#0e59f9]/20 border border-[#0e59f9]/15`)**, menyatu secara harmonis dengan warna brand Menuin tanpa kontras warna yang bentrok.
  - Saat kolom di-hover, kotak aktif bertransformasi menjadi solid **Menuin Blue (`bg-[#0e59f9]`)** dengan efek bayangan dan elevasi lembut.
  - Garis trendline dihilangkan agar visual tetap bersih, fokus, dan tidak bertumpukan dengan tumpukan balok kotak.
  - Perbaikan area headroom (`112px`) dan penyesuaian sumbu koordinat agar kartu popover tooltip saat kursor mengarah (*hover*) tidak terpotong atau tertutup di batas atas kontainer.
  - Rekapitulasi kanal pembayaran (*payment tenders*) dan performa kanal penjualan (POS vs Storefront QR Meja).
  - Tabel rincian transaksi interaktif dengan pencarian cepat.
- **Modul Operasional (Peak Hours & Menu):**
  - Komponen **`PeakHoursHeatmap`** menampilkan grid 7 hari × 24 jam (Orders Heatmap Day of Week × Hour) dengan shading intensitas pesanan dan jumlah order per sel (berdasarkan referensi GranetPro).
  - 4 Kartu Metrik Utama: Jam Tersibuk (Busiest Hour), Jam Tersepi (Slowest Hour), Hari Tersibuk (Busiest Day), dan Hari Tersepi (Slowest Day).
  - Diagram batang distribusi pesanan per jam dan kontribusi omset per hari dalam seminggu.
  - Tabel peringkat menu terlaris (*Top Selling Products*) berdasarkan volume dan total omset.
- **Modul Keuangan (Finance & Cash Flow):**
  - KPI Arus Kas Masuk (Cash In), Arus Kas Keluar (Cash Out), Arus Kas Bersih (Net Cash Flow), dan Estimasi Laba Kotor.
  - Tabel dan Dialog modal pencatatan pengeluaran operasional kas kecil (*Expense Logging*).
  - Tabel rekonsiliasi shift laci kasir (uang sistem vs uang fisik aktual).
- **Backend & Database:**
  - Entitas database baru `expenses` (kategori, nominal, metode bayar, deskripsi, tanggal, receiptUrl, tenantId).
  - Server actions komprehensif di `apps/web/src/lib/actions/reports.ts` (`getSalesReport`, `getOperationsReport`, `getFinanceReport`, `createExpenseAction`, `deleteExpenseAction`).
- **Ekspor:**
  - Ekspor multi-sheet ke format Microsoft Excel (`.xlsx`) menggunakan library `xlsx`.
  - Format cetak ramah printer / PDF (*print-ready layout*).

## [Unreleased] - 2026-09-30

### Added
- **Scroll & Viewport-Triggered Entrance Animations (`IntersectionObserver` Standard):**
  - Seluruh animasi grafik pada halaman Ringkasan Eksekutif (`/reports`) dan Laporan Penjualan (`/reports/sales`) kini **hanya dimulai saat elemen memasuki viewport (pandangan layar) pengguna** (`IntersectionObserver` threshold `0.1`–`0.15`).
  - Elemen di bawah lipatan layar (*below-the-fold*) tetap berada pada posisi awal `0%` sampai pengguna menggulir (*scroll*) ke posisi kartu terkait, memberikan pengalaman interaksi yang memuaskan dan bertahap (*satisfying tactile entrance*).
  - Berlaku pada:
    1. **MiniSparkline:** Penarikan garis SVG (*stroke draw*) pada 4 kartu KPI utama.
    2. **Hero Capsule Bar Chart:** Gelombang batang kapsul meluncur naik dari garis dasar (*wave stagger entrance*).
    3. **Sub-Cards Progres:** Bilah kasir POS, self-order QR, dan metode pembayaran dominan (`AnimatedHorizontalBar`).
    4. **Doughnut Charts:** Putaran busur lingkaran searah jarum jam pada Komposisi Penjualan dan Metode Pembayaran (`PaymentDoughnutChart` & `CompositionDoughnutChart`).
    5. **Top Menu & Kategori:** Bilah bertingkat (`AnimatedHorizontalBar`) pada menu terlaris, menu evaluasi, kategori teratas, dan pola waktu operasional.
    6. **Buku Kas & Likuiditas:** Peluncuran bilah komparatif proporsional (`AnimatedSegmentedBar`) kas fisik vs saldo rekening digital.
    7. **Speedometer Gauge:** Putaran busur radial efisiensi margin laba kotor.
  - **Efisiensi & Beban Kinerja:**
- **Standardisasi Tipografi Universal (`font-sans`):**
  - Seluruh elemen tipografi pada Ringkasan Eksekutif (`/reports`) kini **100% menggunakan `font-sans`**.
  - Penggunaan `font-mono` pada angka Speedometer Gauge, header jam pada Heatmap Jam Sibuk, rincian Buku Kas (Kas Laci & Rekening Digital), serta kartu Margin Laba telah distandardisasi menjadi `font-sans` agar tampilan selaras, modern, dan konsisten dengan desain sistem Menuin.

