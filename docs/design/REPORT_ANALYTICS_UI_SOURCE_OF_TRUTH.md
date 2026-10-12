# Menuin Report & Analytics UI Design Source of Truth (SOT)

Dokumen ini adalah **sumber kebenaran mutlak (Source of Truth)** untuk arsitektur visual, standar komponen UI, palet warna, tipografi, dan hierarki tata letak (layout) di seluruh suite **Report & Analytics** dan aplikasi web **Menuin**:
1. **Ringkasan (Executive Summary)** — `/reports/overview`
2. **Laporan Penjualan (Sales Analytics)** — `/reports`
3. **Laporan Operasional & Peak Hours** — `/reports/operations`
4. **Laporan Keuangan & Arus Kas (Finance & Cashflow)** — `/reports/finance`

Setiap AI agent, frontend engineer, dan desainer **WAJIB MEMATUHI** aturan desain di bawah ini untuk menjaga konsistensi tampilan premium, utilitarian, dan bebas dari *AI slop*.

---

## 1. Filosofi Inti & Manifesto Anti-AI Slop

Menuin adalah sistem POS (*Point of Sale*) dan platform operasional F&B profesional yang digunakan oleh pemilik restoran, manajer outlet, dan kasir setiap hari selama berjam-jam. Antarmuka Menuin dirancang dengan prinsip:
- **Tinggi Rasio Tinta-Data (*High Data-Ink Ratio* - Edward Tufte):** Setiap piksel di layar harus memiliki fungsi dan makna bisnis yang nyata.
- **Bebas Kebisingan Visual (*Zero Visual Noise*):** Tidak ada elemen dekoratif tanpa tujuan fungsional.
- **Tenang, Tegas, dan Bersahaja (*Quiet, Solid, Utilitarian Premium*):** Mengutamakan warna solid, garis rambut halus (*hairline borders*), dan angka tabular yang presisi.

### 1.1. Daftar Larangan Mutlak AI Slop (Banned Patterns)
Jika kode atau antarmuka yang dibuat mengandung salah satu dari pola di bawah ini, desain tersebut **dinyatakan GAGAL**:
1. ❌ **Gradasi Multi-Stop & Mesh Gradient:** Dilarang menggunakan gradasi linear warna-warni (`bg-gradient-to-...`), gradasi pelangi/duotone, aurora glow, atau lingkaran blur berwarna (*glowing blobs*) di latar belakang.
2. ❌ **Berat Font Berlebih (`font-bold` ke atas):** Dilarang keras menggunakan `font-bold` (700), `font-extrabold` (800), atau `font-black` (900). Plafon tertinggi di Menuin adalah **`font-semibold`**.
3. ❌ **Polusi Ikon (Icon Diarrhea / Clutter):** Dilarang menaburkan ikon dekoratif di samping setiap label, teks nama kolom tabel, atau judul metrik jika teksnya sudah jelas dengan sendirinya.
4. ❌ **Inflasi Badge / Pill Fatigue:** Dilarang membungkus sembarang teks, kategori, tanggal, jam, atau angka ke dalam kotak pil ber-border dengan latar belakang transparan pudar (`border border-... bg-.../10`).
5. ❌ **Teks Penjelas Basa-Basi (Patronizing Verbosity):** Dilarang mencantumkan teks panduan atau kalimat instruksi yang menjelaskan hal yang sudah jelas (misal: *"Arahkan kursor ke sini untuk melihat rincian"* atau *"Berikut adalah ringkasan penjualan toko Anda"*).
6. ❌ **Wadah Bersarang Tak Perlu (Russian-Doll Cards):** Dilarang menumpuk kartu di dalam kartu di dalam kartu dengan border berlapis yang mempersempit ruang dan membingungkan hierarki.
7. ❌ **Glassmorphism Liar:** Dilarang menggunakan `backdrop-blur` pada konten biasa yang sedang di-scroll. Efek frosted glass hanya diizinkan untuk elemen fixed/melayang (seperti modal atau sticky bar).
8. ❌ **Data Tiruan / Mockup Saat Kosong:** Dilarang menyuntikkan data sampel khayalan saat angka riil bernilai 0 atau belum ada data. Nilai 0 wajib disajikan secara jujur dan bersih.

---

## 2. Aturan Baku Tipografi & Plafon Berat Huruf

### 2.1. Plafon Mutlak: `font-semibold` (Maksimal Weight 600)
- **Plafon Tertinggi (Strict Ceiling):** **`font-semibold`** adalah batas maksimal ketebalan font di seluruh antarmuka Menuin.
- ❌ **LARANGAN TOTAL:** DILARANG menggunakan `font-bold` (weight 700+), `font-extrabold`, atau `font-black` di bagian mana pun.
- **Teks Biasa & Pendukung:** Menggunakan **`font-normal`** (weight 400).
- **Elemen yang Menggunakan `font-semibold`:**
  - Nominal metrik utama pada kartu KPI (`text-xl sm:text-2xl font-semibold`).
  - Judul kartu dan judul bagian modul (`text-sm` hingga `text-lg font-semibold`).
  - Label kategori metrik bilingual (`text-[11px] font-semibold uppercase tracking-wider`).
  - Teks tombol aksi utama (`text-xs sm:text-sm font-semibold`).
  - Teks persentase delta pertumbuhan dan status diskrit (`text-[11px] font-semibold`).
- **Elemen yang Wajib Menggunakan `font-normal`:**
  - Teks badan/deskripsi (`text-xs sm:text-sm font-normal text-slate-600`).
  - Keterangan status tambahan, unit, dan catatan kaki (`text-[11px] font-normal text-slate-400`).
  - Seluruh baris data tabel transaksi (`text-xs sm:text-sm font-normal text-slate-700`).
  - Keterangan rentang waktu/tanggal di header kartu (`text-[11px] font-normal text-slate-400`).
  - Teks input formulir, placeholder, dan tombol sekunder.

### 2.2. Membangun Hierarki Visual Tanpa Bold
Hierarki antarmuka Menuin dibangun melalui **skala ukuran font, spasi huruf (tracking), dan kontras warna teks**, BUKAN dengan menaikkan berat font ke bold:
- **Level 1 (Nominal KPI):** `text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight font-numeric`
- **Level 2 (Judul Kartu / Modal):** `text-base sm:text-lg font-semibold text-slate-900 tracking-tight`
- **Level 3 (Sub-judul Bahasa Inggris):** `text-sm font-semibold text-slate-900 tracking-tight`
- **Level 4 (Label Indonesia Eyebrow):** `text-[11px] font-semibold text-slate-400 uppercase tracking-wider block`
- **Level 5 (Teks Data Tabel / Nilai Sekunder):** `text-xs sm:text-sm font-normal text-slate-700`
- **Level 6 (Keterangan Metadata / Waktu):** `text-[11px] font-normal text-slate-400`

### 2.3. Standar Angka Tabular (Tabular Figures)
Seluruh angka nominal uang (Rupiah), kuantitas transaksi, dan persentase **WAJIB** menggunakan font angka bertabular (`font-numeric`, `font-financial`, atau utilitas Tailwind `tabular-nums`). Hal ini memastikan lebar setiap digit seragam sehingga angka tidak bergeser (*layout shift*) saat data diperbarui secara *real-time*.

---

## 3. Disiplin Ikonografi (Anti-Icon Pollution)

Ikon adalah aset fungsional bernilai tinggi, bukan ornamen dinding atau dekorasi acak. Penggunaan ikon yang berlebihan membuat antarmuka terasa ramai dan menurunkan nilai pandu visual.

### 3.1. HANYA TIGA (3) Tempat yang Diizinkan Menggunakan Ikon:
1. **Primary Card Anchor Badge:**
   - Wadah lingkaran `w-10 h-10 rounded-full` pada kartu utama teratas untuk memperjelas topik kartu (misal: icon `Wallet` pada Net Flow Hero Card, atau icon `TrendingUp`/`TrendingDown` pada Inflow/Outflow).
2. **Interactive Controls & Triggers (Aksi Fungsional Nyata):**
   - Ikon pencarian pada kolom input (`Search`).
   - Ikon pemilihan kalender/tanggal (`CalendarIcon`).
   - Ikon toggle filter drawer (`Filter`).
   - Ikon visibilitas saldo (`Eye` / `EyeOff`).
   - Ikon tutup dialog/modal (`X`).
   - Ikon navigasi/akordion (`ChevronDown`, `ChevronRight`).
3. **Micro Trend Direction (Indikator Arah Tren Mikro):**
   - Panah penunjuk arah naik/turun di dalam badge delta persentase (`ArrowUpRight` atau `ArrowDownRight` dengan ukuran ramping `w-3 h-3` atau `w-3.5 h-3.5`).

### 3.2. Larangan Penggunaan Ikon:
- ❌ **Dilarang** menaruh ikon di samping setiap judul kolom tabel (misal ikon jam di samping "Waktu", ikon uang di samping "Total", ikon orang di samping "Kasir"). Cukup teks polos bersih.
- ❌ **Dilarang** menaruh ikon di samping nama kategori bar chart. Cukup gunakan dot warna bulat kecil `w-1.5 h-1.5 rounded-full` jika memerlukan penanda segmen warna, atau teks polos.
- ❌ **Dilarang** menaruh ikon di samping label atau sub-judul jika artinya sudah terbaca jelas dari teks.

---

## 4. Regulasi Ketat Badge & Pill (Anti-Badge Inflation)

### 4.1. Masalah "Badge Fatigue"
Membungkus sembarang teks, kategori, tanggal, jam, atau angka ke dalam pill rounded dengan border tipis dan latar belakang transparan pudar (`border border-blue-200 bg-blue-50/50 text-blue-700` atau `border border-slate-200 bg-slate-100`) adalah anti-pola umum yang membuat layar terlihat penuh stiker dan membingungkan pengguna.

### 4.2. PENGGUNAAN BADGE HANYA DIIZINKAN UNTUK DUA (2) KONDISI:

#### A. Status Sistem Diskrit (Discrete State Machine / Life-Cycle)
Digunakan hanya untuk menandai tahapan proses atau kondisi operasional yang memerlukan atensi:
- **Lunas / Selesai / Surplus / Aktif:**
  ```tsx
  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
    Lunas
  </span>
  ```
- **Batal / Void / Defisit / Gagal:**
  ```tsx
  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
    Batal
  </span>
  ```
- **Menunggu / Pending / Open Shift:**
  ```tsx
  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
    Pending
  </span>
  ```
- **Draft / Arsip / Nonaktif:**
  ```tsx
  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
    Draft
  </span>
  ```

#### B. Delta Pertumbuhan / Tren Persentase
Digunakan untuk indikator delta perbandingan performa antar periode:
- **Pada Kartu Putih Biasa:**
  ```tsx
  <div className={cn(
    "inline-flex items-center gap-0.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border",
    growth >= 0
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-rose-50 text-rose-700 border-rose-200"
  )}>
    {growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
    <span>{growth >= 0 ? `+${Math.round(growth)}%` : `${Math.round(growth)}%`}</span>
  </div>
  ```
- **Pada Hero Blue Card (Frosted Pill):**
  ```tsx
  <div className={cn(
    "inline-flex items-center gap-0.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-xs border",
    growth >= 0
      ? "bg-white/20 text-white border-white/25"
      : "bg-rose-500/30 text-rose-100 border-rose-300/30"
  )}>
    {growth >= 0 ? <ArrowUpRight className="h-3 w-3 text-white" /> : <ArrowDownRight className="h-3 w-3 text-white" />}
    <span>{growth >= 0 ? `+${Math.round(growth)}%` : `${Math.round(growth)}%`}</span>
  </div>
  ```

### 4.3. LARANGAN TOTAL PENGGUNAAN BADGE (Gunakan Teks Polos):
- ❌ **Kategori Produk atau Kategori Pengeluaran:** Wajib disajikan sebagai teks polos bersih (`text-xs font-normal text-slate-700`). Boleh ditambahkan dot warna kecil `w-1.5 h-1.5 rounded-full` jika merujuk pada segmen diagram.
- ❌ **Tanggal, Jam, atau Rentang Waktu:** Wajib disajikan sebagai teks polos (`text-[11px] font-normal text-slate-400`). Dilarang membungkus tanggal ke dalam badge border/abu.
- ❌ **Metode Pembayaran:** Wajib disajikan sebagai teks biasa tanpa pill (`text-xs font-normal text-slate-600`).
- ❌ **Nominal Angka dan Kuantitas Biasa:** Jangan pernah menaruh angka rupiah di dalam kotak border/pill.

---

## 5. Larangan Mutlak Warna Gradasi & Palet Solid Menuin

### 5.1. Nol Gradasi (100% Pure Solid Colors)
- ❌ **DILARANG KERAS:** Menggunakan class `bg-gradient-to-...`, `from-... via-... to-...`, radial mesh gradient, atau gradasi pada tombol dan kartu.
- ✅ **STANDAR SOLID RESMI:**
  - **Menuin Royal Blue Solid:** **`#0e59f9`** (Hex murni).
  - **Menuin Royal Blue Hover:** **`#0b4de0`** atau **`#083cb0`**.
  - **Hero Card Container:**
    ```tsx
    bg-[#0e59f9] border border-[#0e59f9] text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all rounded-2xl
    ```
  - **Neutral Canvas:** Latar kartu `bg-white`, latar halaman `bg-[#f8fafc]` atau `bg-slate-50/50`.
  - **Hairline Border:** `border-[#EAEFF8]` (ultra-clean, kontras lembut).

### 5.2. Palet Segmen Monokromatik Biru (Untuk Diagram Kategori)
Untuk visualisasi bilah horizontal distribusi (misal kategori kas keluar atau penjualan menu), gunakan palet solid bergradasi tingkat (*solid monochromatic ramp*):
- **Segmen 1 (Rank 1 / Terbesar):** Deep Navy Blue Solid (`#083cb0`)
- **Segmen 2 (Rank 2):** Menuin Royal Blue Solid (`#0e59f9`)
- **Segmen 3 (Rank 3):** Medium Blue Solid (`#3b82f6`)
- **Segmen 4 (Rank 4):** Soft Medium Blue Solid (`#60a5fa`)
- **Segmen 5 (Rank 5):** Light Sky Blue Solid (`#93c5fd`)
- **Segmen 6 (Rank 6):** Subtle Slate Solid (`#cbd5e1`)

---

## 6. Rasio Tinta-Data Tinggi & Larangan Teks Penjelas Redundan

### 6.1. Prinsip Anti-Verbosity
Pengguna sistem POS dan laporan bisnis adalah praktisi yang memahami konteks bisnis mereka. Antarmuka tidak boleh menggurui atau memuat teks basa-basi yang tidak memberi nilai tambah informasi.

### 6.2. Pola yang Dilarang (Banned Microcopy):
- ❌ *"Arahkan kursor ke sini untuk melihat rincian"*
- ❌ *"Berikut ini adalah rangkuman dari seluruh penjualan tokomu"*
- ❌ *"Klik tombol di bawah ini untuk mengunduh laporan"*
- ❌ *"Terbesar: ... ->"* atau *"Detail lebih lanjut dapat dilihat di bawah"*
- ❌ *"Informasi ini diperbarui secara berkala oleh sistem"*

### 6.3. Standar Penyajian yang Ringkas & Padat:
- **Informasi Langsung Terlihat Sejak Diam (*Idle State*):** Pada diagram distribusi kategori, kategori pengeluaran terbesar langsung tersaji di keadaan idle tanpa perlu menunggu kursor digerakkan.
- **Bilingual Clean Format:**
  - Baris atas: `text-[11px] font-semibold text-slate-400 uppercase tracking-wider block` (Indonesia)
  - Baris bawah: `text-sm font-semibold text-slate-900 tracking-tight` (Inggris)
- **Pengecualian Teks Keterangan:** Teks disclaimer HANYA diizinkan jika menyangkut batas akuntansi riil (contoh: *disclaimer* bahwa Laba Kotor belum memperhitungkan biaya sewa dan depresiasi).

---

## 7. Kaidah Integritas Data Riil & Penanganan Nilai Nol

### 7.1. Anti-Mockup / Anti-Data Palsu
❌ Dilarang keras menginjeksi *dummy sample arrays* atau angka persentase khayalan ketika database mengembalikan nilai 0. Memanipulasi visual dengan data palsu merusak integritas audit keuangan.

### 7.2. Standar Tampilan Saat Data Kosong / Rp 0 (Zero State):
Jika total nominal pengeluaran atau pemasukan bernilai `Rp 0` atau belum ada data tercatat:
1. **Header Kanan:** Menampilkan angka **`0%`**.
2. **Bilah Visual Horizontal:** Berupa satu kapsul solid abu netral penuh (`w-full h-2 rounded-full bg-slate-200`).
3. **Sub-line Bawah:** Menampilkan dot abu (`w-1.5 h-1.5 rounded-full bg-slate-300`) + label kategori **`-`** + nominal **`Rp 0`**.
4. Tidak ada baris error, tidak ada ilustrasi kartun kosong yang berlebihan, dan tidak ada data buatan.

---

## 8. Spesifikasi Khusus Top KPI Cards & Layout Halaman

### 8.1. Layout Asimetris Modul Keuangan (`/reports/finance`)
Modul keuangan menggunakan struktur 3 kartu baris atas asimetris yang seragam tinggi (`min-h-[220px]`):
```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
  {/* Card 1: Net Flow Hero Blue (6 cols / 50%) */}
  {/* Card 2: Inflows White Card (3 cols / 25%) */}
  {/* Card 3: Outflows White Card (3 cols / 25%) */}
</div>
```

### 8.2. Anatomi Net Flow Hero Blue Card
1. **Header Row:**
   - **Kiri:** Lingkaran putih solid `w-10 h-10 rounded-full bg-white text-[#0e59f9] flex items-center justify-center shadow-xs flex-shrink-0` berisi icon `Wallet` + Judul ganda di kanannya:
     - Bahasa Indonesia: `text-[11px] font-semibold text-white/80 uppercase tracking-wider block` ("Arus Kas Bersih")
     - Bahasa Inggris: `text-sm font-semibold text-white tracking-tight` ("Net Flow")
   - **Kanan:** Tombol filter rentang waktu in-card (`text-white font-normal text-xs`).
2. **Metric Row:**
   - **Nominal Saldo:** `text-xl sm:text-2xl font-semibold text-white tracking-tight whitespace-nowrap` + Eye toggle.
   - **Badge Perbandingan di Bawah Nominal:** Frosted badge persentase (`bg-white/20 text-white border border-white/25 px-2.5 py-0.5 rounded-full text-[11px] font-semibold`) + Keterangan status `text-xs text-white/80 font-normal`.
   - **Trendline Sparkline:** SVG Catmull-Rom spline dengan kurva putih solid (`color="#ffffff"`).
3. **Bottom Action Row:**
   - Tombol operasional cepat:
     - **Pemasukan (Primary):** `h-8 px-3.5 rounded-full bg-white text-[#0e59f9] hover:bg-white/95 font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs`
     - **Pengeluaran (Secondary):** `h-8 px-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-normal text-xs inline-flex items-center gap-1.5 border border-white/20 backdrop-blur-xs`
     - **Rekonsiliasi (Secondary):** `h-8 px-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-normal text-xs inline-flex items-center gap-1.5 border border-white/20 backdrop-blur-xs`

### 8.3. Anatomi Kartu Sibling Putih (Inflows & Outflows)
1. **Header Row:**
   - **Kiri:** Lingkaran biru Menuin `w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0` + Judul ganda di kanannya:
     - Bahasa Indonesia: `text-[11px] font-semibold text-slate-400 uppercase tracking-wider block` ("Kas Masuk" / "Kas Keluar")
     - Bahasa Inggris: `text-sm font-semibold text-slate-900 tracking-tight` ("Inflows" / "Outflows")
   - **Kanan:** Rentang waktu periode (`text-[11px] font-normal text-slate-400 capitalize`).
2. **Metric Row:**
   - **Nominal:** `text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight whitespace-nowrap font-numeric`.
   - **Badge Perbandingan di Bawah Nominal:** Indikator delta persentase dinamis (`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border`).
3. **Bottom Row (Bilah Kapsul Segmentasi Kategori):**
   - Menggunakan bilah kapsul horizontal ramping `h-2` dengan celah pemisah `gap-1`.
   - Tanpa garis pembatas (`border-t`) yang memotong kartu.
   - Tanpa tooltip/popup mengambang yang menutupi kartu.
   - Tinggi bilah tetap `h-2` saat di-hover (tidak ada lompatan tinggi / *no scaling*).

### 8.4. Tiga Kategori Pemasukan Baku (Standard Cash Inflow SSOT)
1. **Penjualan (`PENJUALAN`):** Terhubung otomatis dari transaksi kasir POS berstatus lunas.
2. **Setoran Modal (`MODAL`):** Setoran modal pemilik outlet atau investor yang dicatat manual.
3. **Pemasukan Lainnya (`LAINNYA`):** Pendapatan operasional lain (bunga, komisi, titipan kas).

### 8.5. Anatomi Diverging Bipolar Cashflow Bar Chart (Garis Nol Tengah)
Untuk membedakan arus kas masuk (*Inflows*) dan kas keluar (*Outflows*) secara intuitif, bersih, dan hemat ruang:
1. **Garis Baseline Nol di Tengah:** Membagi grafik menjadi dua kuadran simetris. Garis tengah solid `border-b border-slate-300` sebagai jangkar netral $0$.
2. **Kas Masuk (Inflows - Tumbuh ke Atas):**
   - Kapsul `rounded-t-full rounded-b-none` bertumbuh ke atas dari garis nol.
   - Warna: `#D8E8FE` (Ice Blue) saat diam, `#0e59f9` (Solid Menuin Blue) saat di-hover.
3. **Kas Keluar (Outflows - Tumbuh ke Bawah):**
   - Kapsul `rounded-b-full rounded-t-none` bertumbuh ke bawah dari garis nol.
   - Warna: `#fecdd3` (Soft Rose) saat diam, `#f43f5e` (Solid Rose) saat di-hover.
4. **Sumbu Y 5-Titik Simetris:** `+Max`, `+Half`, `0`, `-Half`, `-Max`.
5. **Sampling Sumbu X Bebas Tabrakan:**
   - Menampilkan nomor hari saja (`1, 5, 10, 15, 20, 25, 30`) saat tampilan bulanan, diletakkan di bawah grafik dengan jarak yang nyaman.
   - Dilarang merender 31 string penuh secara bertumpukan.
6. **Kejujuran Nilai Nol:** Jika hari tersebut tidak ada pergerakan kas, tinggi batang murni `0%` (rata pada garis nol), tanpa titik-titik melayang semu.
7. **Baris Status Bawah:** Menampilkan label awal (kiri), `{n} Titik • Hari` (tengah), dan label akhir (kanan) selaras dengan Laporan Penjualan.

---

## 9. Standar Komponen Umum (Tabel, Formulir, Tombol)

### 9.1. Tabel Transaksi & Audit
- **Header Kolom:** `bg-slate-50/75 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-3 px-4`.
- **Baris Data:** `border-b border-slate-100/70 hover:bg-slate-50/50 transition-colors py-3 px-4 text-xs font-normal text-slate-700`.
- **Nominal Kolom:** `font-semibold font-numeric text-slate-900`.
- **Tanpa Ikon Kolom:** Tidak ada ikon hiasan di samping nama kolom.

### 9.2. Formulir & Input Pencarian
- **Input Field:** `bg-white border-slate-200 rounded-xl text-xs sm:text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:border-[#0e59f9] focus:ring-2 focus:ring-[#0e59f9]/15 transition-all`.
- **Ikon Input:** Hanya ikon pencarian (`Search`) di posisi `left-3` dengan warna `text-slate-400`.

### 9.3. Tombol Aksi (Buttons)
- **Primary Action:** `rounded-full bg-[#0e59f9] text-white font-semibold hover:bg-[#0b4de0] active:scale-[0.98] shadow-xs transition-all h-8 sm:h-9 px-4 text-xs sm:text-sm`.
- **Secondary Action:** `rounded-full bg-white text-slate-700 border border-slate-200 font-normal hover:bg-slate-50 active:scale-[0.98] transition-all h-8 sm:h-9 px-4 text-xs sm:text-sm`.
- **Icon Button:** `w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors`.

---

## 10. Standar Baku Top Header & Toolbar Controls Suite Report & Analytics

Seluruh modul dalam suite Report & Analytics (`/reports` [Ringkasan Eksekutif], `/reports/sales` [Laporan Penjualan], `/reports/operations` [Laporan Operasional], `/reports/finance` [Laporan Keuangan & Cashflow]) **WAJIB MENERAPKAN** arsitektur satu baris header terpadu (*1-Row Unified Editorial Header & Toolbar*) untuk menghemat ruang vertikal dan menjaga konsistensi mental model:

### 10.1. Tata Letak 1-Baris Terpadu
- **Sisi Kiri (Title & Identitas):**
  - Judul modul: `text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900`.
  - Eyebrow outlet/kategori (opsional/ringkas): `text-[11px] font-medium text-slate-400 uppercase tracking-widest`.
- **Sisi Kanan (Toolbar Controls):**
  - Elemen toolbar disusun rapi horizontal: `flex items-center gap-2 sm:gap-2.5 flex-wrap`.
  - Urutan standar: `[ Date Picker Trigger ]` -> `[ Export Dropdown ]` -> `[ Refresh Button ]`.
- ❌ **LARANGAN MUTLAK:** Dilarang menggunakan wadah kartu box filter bar putih bertingkat terpisah (`bg-white rounded-2xl border border-[#EAEFF8] p-3 sm:p-3.5`) yang memotong vertikalitas halaman sebesar 140px-160px.

### 10.2. Standar Tombol Pemicu Tanggal (Date Picker Trigger Button)
- Komponen pemicu popover: `h-9 px-3 rounded-xl bg-white border border-[#EAEFF8] text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer`.
- Dilengkapi ikon `CalendarIcon` (`w-3.5 h-3.5 text-slate-400`) dan panah bawah `ChevronDown`.
- **Format Label Tombol:**
  - Menampilkan `"Hari Ini"` jika mode hari ini aktif.
  - Menampilkan nama bulan & tahun (misal: `"Okt 2026"`) jika periode bulanan aktif.
  - Menampilkan rentang ringkas (misal: `"1 Okt - 12 Okt"`) jika rentang kustom aktif.
  - Memberikan border aktif `border-blue-300 bg-blue-50/40 text-[#0e59f9] font-semibold` saat rentang kustom dipilih.

### 10.3. Standar Popover Rentang Tanggal & Grid Preset
- Popover kalender (`PopoverContent align="end" className="w-auto p-0 rounded-2xl shadow-xl border border-[#EAEFF8]"`) memiliki 4 bagian:
  1. **Header:** Judul `"Pilih Jangka Waktu Laporan"` + tombol `"Reset ke Hari Ini"` jika rentang kustom aktif.
  2. **Grid Preset Cepat:**
     - Pada laporan operasional, penjualan, dan ringkasan eksekutif: Grid 4 tombol (`grid-cols-2 sm:grid-cols-4 gap-1`): `[Hari Ini]` `[Bulan Ini]` `[Bulan Lalu]` `[Tahun Ini]`.
     - Pada laporan keuangan/cashflow bulanan: Grid 3 tombol: `[Bulan Ini]` `[Bulan Lalu]` `[Tahun Ini]`.
     - Tombol aktif menggunakan `bg-[#0e59f9] text-white font-semibold`, tombol nonaktif `bg-slate-50 hover:bg-slate-100 text-slate-700`.
  3. **Area Kalender:** Komponen `Calendar` `mode="range"` dengan `locale={localeId}` (Bahasa Indonesia).
  4. **Footer:** Pratinjau rentang tanggal terpilih di kiri + tombol `Batal` (`variant="ghost"`) dan `Terapkan` (`bg-[#0e59f9] text-white rounded-xl`) di kanan.

### 10.4. Standar Dropdown Ekspor Terpadu (Export Dropdown)
- Tombol pemicu hitam Menuin: `h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer`.
- Dilengkapi ikon `Download` dan `ChevronDown`.
- Dropdown menu berisi dua aksi standar:
  1. **Unduh Excel (.xlsx):** Ikon `FileSpreadsheet` (`text-emerald-600`).
  2. **Cetak Laporan:** Ikon `Printer` (`text-slate-500`).

### 10.5. Standar Tombol Refresh (Segarkan)
- Tombol ikon minimalis: `w-9 h-9 rounded-xl border border-[#EAEFF8] bg-white hover:bg-slate-50 text-slate-600 shadow-xs flex items-center justify-center transition-colors cursor-pointer`.
- Ikon `RefreshCw` berputar (`animate-spin`) saat `isLoading === true`.

---

## 11. Standar Indikator State Sistem & Pemuatan Data (Feedback Lifecycle)

Pengguna **WAJIB** segera menyadari ketika sistem sedang memproses atau memutakhirkan data saat filter rentang waktu diubah secara mulus (*seamless*), rapi, estetik, dan tetap elegan tanpa glitch visual:

### 11.1. Tiga Level Sinyal Visual Loading Terpadu:
1. **Level 1 — Integrated Inline Micro Status Badge:**
   - Menampilkan badge mikro elegan di samping eyebrow/judul header modul:
     ```tsx
     {isLoading && (
       <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[10px] font-medium text-[#0e59f9] transition-all">
         <span className="w-1.5 h-1.5 rounded-full bg-[#0e59f9] animate-pulse" />
         Memperbarui...
       </span>
     )}
     ```
   - ❌ **LARANGAN MUTLAK:** Dilarang menggunakan elemen garis melayang global (`fixed top-0 left-0 right-0`) di tepi atas monitor karena memotong global navbar dan sidebar dashboard sehingga terlihat seperti bug/glitch tampilan.
2. **Level 2 — Content Opacity Veil (Peredupan Konten 50% & Pointer-Events Off):**
   - Seluruh kontainer data (kartu metrik KPI, grafik distribusi, dan tabel/heatmap) di bawah header diberikan kelas transisi halus:
     ```tsx
     className={cn(
       "space-y-6 transition-opacity duration-300 ease-in-out",
       isLoading && "opacity-50 pointer-events-none select-none"
     )}
     ```
   - Memberi sinyal intuitif bahwa angka yang tampil adalah data historis yang sedang dimutakhirkan, sekaligus mencegah klik ganda (*race condition*).
3. **Level 3 — Contextual Spinner pada Tombol Pemicu:**
   - Menampilkan ikon spinner mikro `RefreshCw animate-spin text-[#0e59f9]` menggantikan `ChevronDown` di dalam tombol pemicu tanggal selama fetch berlangsung.
   - Tombol refresh berputar halus dengan sorotan latar lembut (`border-blue-200 bg-blue-50/40 text-[#0e59f9]`).

---

## 12. Checklist Kepatuhan AI Agent (*Agent Pre-Flight Checklist*)

Sebelum menyelesaikan implementasi antarmuka pada Menuin, AI agent **WAJIB MENGECEK** parameter berikut:
- [ ] **Batas Berat Huruf:** Apakah ada kelas `font-bold`? Jika ada, ganti segera menjadi `font-semibold`.
- [ ] **Teks Pendukung:** Apakah teks biasa, deskripsi, baris tabel, dan label waktu menggunakan `font-normal`?
- [ ] **Kelangkaan Ikon:** Apakah ada ikon dekoratif yang tidak perlu? Hapus semua ikon di samping judul kolom tabel dan nama kategori.
- [ ] **Regulasi Badge:** Apakah badge hanya digunakan untuk status sistem diskrit (`Lunas`, `Batal`, dll.) dan delta pertumbuhan (`+12%`)? Hapus badge yang membungkus tanggal, jam, atau nama kategori biasa.
- [ ] **Bebas Gradasi:** Apakah ada `bg-gradient-...`? Ganti dengan solid `#0e59f9` atau palet solid neutral.
- [ ] **Bebas Teks Redundan:** Apakah ada kalimat instruksional yang menggurui (*"Arahkan kursor...", "Berikut adalah..."*)? Hapus teks tersebut.
- [ ] **Bebas Data Tiruan:** Jika total nilai adalah 0, apakah bilah abu solid dan label `-` / `Rp 0` ditampilkan tanpa menyuntikkan array dummy?
- [ ] **Angka Bertabular:** Apakah seluruh nominal dan persentase menggunakan font tabular (`font-numeric`, `tabular-nums`)?
- [ ] **Struktur Asimetris 3-Card:** Apakah kartu Net Flow, Inflow, dan Outflow memiliki tinggi yang seragam dan proporsi 50%:25%:25% di desktop?
- [ ] **Header 1-Baris & Kontrol Baku:** Apakah header menggunakan satu baris terpadu dengan Date Picker Popover, Export Dropdown, dan Refresh icon tanpa filter box card terpisah?
- [ ] **Loading Feedback Tanpa Bug:** Apakah loading feedback menggunakan Content Opacity Veil 50% dan Contextual Spinner tanpa ada garis fixed top-0 yang memotong layar?
- [ ] **TypeScript Bebas Error:** Jalankan `npx tsc --noEmit` untuk memastikan tidak ada kesalahan tipe data.
