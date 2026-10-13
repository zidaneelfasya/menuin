# Menuin Platform UI & Design System Source of Truth (SSOT)

Dokumen ini adalah **pedoman desain dan arsitektur visual universal** untuk seluruh ekosistem **Menuin** (Aplikasi Kasir POS, Dashboard Pengelola, Suite Laporan & Analitik, Manajemen Menu, dan Pengaturan Outlet).

Seluruh desainer, frontend engineer, dan AI coding agent **WAJIB MEMATUHI** aturan mutlak dalam dokumen ini tanpa pengecualian.

---

## 1. Prinsip Utama: Anti-AI Slop & High Data-Ink Ratio

Menuin adalah sistem POS dan manajemen restoran berkinerja tinggi. Tampilan Menuin dirancang untuk **kecepatan pembacaan mata, presisi data, dan kenyamanan penggunaan sepanjang hari**.

### 1.1. Aturan Mutlak Anti-AI Slop (The 6 Zero Principles)
1. **Zero Bold (`font-semibold` Ceiling):** Berat font maksimal adalah **`font-semibold`** (600). Dilarang keras menggunakan `font-bold` (700), `font-extrabold` (800), atau `font-black` (900).
2. **Zero Gradients (100% Solid Colors):** Dilarang keras menggunakan warna gradasi linear, radial, mesh gradient, atau aura berpendar. Brand color Menuin adalah **Menuin Royal Blue solid `#0e59f9`**.
3. **Zero Icon Clutter:** Ikon hanya digunakan sebagai *visual anchor* utama (`w-10 h-10 rounded-full`) atau *action trigger* fungsional (search, filter, datepicker, close, eye toggle). Dilarang menaruh ikon dekoratif di samping setiap label teks atau judul kolom tabel.
4. **Zero Badge Fatigue:** Dilarang membungkus sembarang teks, kategori, tanggal, atau angka ke dalam badge/pill ber-border dengan opacity pudar (`border bg-.../10`). Badge HANYA diizinkan untuk **Status Sistem Diskrit** (`Lunas`, `Batal`, `Pending`) dan **Delta Pertumbuhan** (`+12%`, `-5%`).
5. **Zero Verbosity (High Data-Ink Ratio):** Hapus seluruh kalimat instruksional atau teks pembuka yang basa-basi (*"Arahkan kursor ke sini untuk..."*, *"Berikut adalah rangkuman..."*). Data harus berbicara sendiri secara langsung dan bersih.
6. **Zero Mockups on Empty Data:** Saat data riil bernilai 0 atau belum ada data, dilarang menyuntikkan array dummy/grafik palsu. Tampilkan status 0 jujur: persentase `0%`, bar abu solid `bg-slate-200`, dan label `-` / `Rp 0`.

---

## 2. Tipografi & Hierarki Teks

### 2.1. Standar Font Family
- **Font UI Utama:** `Poppins` (`var(--font-poppins)`) untuk judul, teks antarmuka, dan tombol.
- **Font Angka & Finansial:** `Inter` (`var(--font-inter)`) dengan konfigurasi `tabular-nums` (`.font-numeric`, `.font-financial`).

### 2.2. Plafon Berat Huruf (Strict Font Weight Ceiling)
| Kelas Tailwind | Berat | Penggunaan | Status |
| :--- | :--- | :--- | :--- |
| `font-normal` | 400 | Teks isi, deskripsi, baris data tabel, keterangan waktu, label unit, input form | **Wajib untuk Teks Biasa** |
| `font-medium` | 500 | Teks navigasi pasif, sub-label tertentu | **Diizinkan jika perlu** |
| `font-semibold`| 600 | Nominal angka KPI, judul kartu/modal, tombol utama, status badge, label uppercase | **PLAFON MAKSIMAL (CEILING)** |
| `font-bold` | 700 | - | ❌ **DILARANG KERAS** |
| `font-extrabold`| 800 | - | ❌ **DILARANG KERAS** |

### 2.3. Hirarki Visual Tanpa Bold
Hierarki dibangun dari perpaduan ukuran font, warna teks, dan tracking:
- **Nominal Utama:** `text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight font-numeric`
- **Judul Kartu / Modal:** `text-base sm:text-lg font-semibold text-slate-900 tracking-tight`
- **Sub-judul Bahasa Inggris:** `text-sm font-semibold text-slate-900 tracking-tight`
- **Label Bahasa Indonesia (Eyebrow):** `text-[11px] font-semibold text-slate-400 uppercase tracking-wider block`
- **Baris Data Tabel:** `text-xs sm:text-sm font-normal text-slate-700`
- **Keterangan Metadata / Waktu:** `text-[11px] font-normal text-slate-400`

---

## 3. Sistem Warna Solid Menuin (Zero Gradients)

| Token Desain | Hex / Value | Penggunaan |
| :--- | :--- | :--- |
| **Menuin Royal Blue** | `#0e59f9` | Solid Hero Card, tombol primary, link aktif, ikon anchor |
| **Menuin Blue Hover** | `#0b4de0` / `#083cb0` | State hover tombol primary |
| **Canvas Background** | `#f8fafc` / `bg-slate-50/50` | Latar belakang seluruh halaman |
| **Card Surface** | `#ffffff` | Kontainer kartu dan modal |
| **Hairline Border** | `#EAEFF8` | Garis pembatas kartu (`border border-[#EAEFF8]`) |
| **Text Primary** | `text-slate-900` | Judul, nominal metrik |
| **Text Secondary** | `text-slate-600` | Deskripsi, teks pendukung |
| **Text Tertiary / Muted** | `text-slate-400` | Label waktu, placeholder, eyebrow |
| **Status Positif / Inflow** | `bg-emerald-50 text-emerald-700 border-emerald-200` | Status lunas, delta surplus positif |
| **Status Negatif / Defisit** | `bg-rose-50 text-rose-700 border-rose-200` | Status batal, delta defisit negatif |
| **Status Menunggu / Pending**| `bg-amber-50 text-amber-700 border-amber-200` | Transaksi tertunda, open shift |
| **Status Draft / Nonaktif** | `bg-slate-100 text-slate-600 border-slate-200` | Draft produk, outlet nonaktif |

---

## 4. Disiplin Ikonografi (Icon Scarcity)

### 4.1. Elemen yang Diizinkan Menggunakan Ikon
1. **Primary Card Anchor:** Lingkaran `w-10 h-10 rounded-full` pada kartu KPI teratas (`bg-white text-[#0e59f9]` atau `bg-[#0e59f9] text-white`).
2. **Kontrol Interaktif Fungsional:**
   - Kolom pencarian: `Search` (`left-3 text-slate-400 w-4 h-4`)
   - Pemilih tanggal: `CalendarIcon`
   - Filter drawer: `Filter`
   - Visibilitas nilai: `Eye` / `EyeOff`
   - Penutup dialog: `X`
   - Navigasi & akordion: `ChevronDown`, `ChevronRight`
3. **Micro Delta Direction:** Panah `ArrowUpRight` / `ArrowDownRight` di dalam badge delta persentase.

### 4.2. Elemen yang Dilarang Menggunakan Ikon
- ❌ Dilarang meletakkan ikon di samping setiap judul kolom tabel.
- ❌ Dilarang meletakkan ikon di samping nama kategori bar chart (gunakan dot warna `w-1.5 h-1.5 rounded-full` jika butuh pengait warna segmen).
- ❌ Dilarang meletakkan ikon dekoratif di samping teks label biasa yang sudah jelas maknanya.

---

## 5. Regulasi Ketat Badge & Label (Anti-Badge Inflation)

### 5.1. Kriteria Resmi Penggunaan Badge
Badge dengan border dan background opacity (`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border`) **HANYA BOLEH DIGUNAKAN UNTUK:**
1. **Status Sistem Diskrit:**
   - `LUNAS`, `BATAL`, `PENDING`, `DRAFT`, `AKTIF`, `NONAKTIF`.
2. **Delta Tren Pertumbuhan:**
   - `+12%`, `-5%` (dengan panah arah mikro).

### 5.2. Larangan Total Penggunaan Badge (Gunakan Teks Biasa)
- ❌ **Kategori Produk & Pengeluaran:** Teks polos `text-xs font-normal text-slate-700`.
- ❌ **Tanggal & Periode:** Teks polos `text-[11px] font-normal text-slate-400`.
- ❌ **Metode Pembayaran:** Teks polos `text-xs font-normal text-slate-600`.
- ❌ **Nominal Angka:** Selalu disajikan sebagai nilai numerik bersih, bukan badge.

---

## 6. Standar Tampilan Data Kosong (Authentic Zero State)

Untuk menjaga kejujuran akuntansi dan audit:
- Jika nilai total transaksi, pemasukan, atau pengeluaran adalah `0` (atau belum ada data):
  - **Nilai Persentase:** `0%`.
  - **Bilah Grafis:** Satu bar kapsul abu netral solid (`w-full h-2 rounded-full bg-slate-200`).
  - **Keterangan Sub-line:** Dot abu `w-1.5 h-1.5 rounded-full bg-slate-300` + nama kategori `-` + nominal `Rp 0`.
  - Dilarang membuat visual buatan atau data perkiraan palsu.

---

## 7. Standar Geometri & Spacing

- **Radius Kartu Utama:** `rounded-2xl` (16px).
- **Radius Elemen Sekunder:** `rounded-xl` (12px) untuk sub-kontainer dan input form.
- **Radius Tombol & Badge:** `rounded-full` (kapsul penuh).
- **Padding Kartu Utama:** `p-5 sm:p-6`.
- **Celah Grid (Gaps):** `gap-4 sm:gap-5`.
- **Micro-Interaction State:** `active:scale-[0.98]` pada tombol, `transition-all duration-200 ease-out`.
- **Hover Bilah Grafis:** Ketinggian bilah tetap terkunci pada `h-2` tanpa perubahan skala (`no scale-y`).

---

## 8. Standar Universal Table View & Data Grid Layout (The Single Source of Truth for Tables)

Seluruh halaman dengan tampilan tabel di platform Menuin (Riwayat Transaksi, Laporan Arus Kas / Finance, Daftar Menu / Katalog, Diskon & Promo, Shift Kasir, dsb.) **WAJIB MENGIKUTI STRUKTUR ANATOMI DAN LAYOUT YANG PERSIS SAMA**.

### 8.1. Anatomi Tata Letak (Universal 3-Zone Architecture)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. TOOLBAR ROW                                                                         │
│ [Tab Semua (7588)] [Tab Sukses (7499)] [Tab Batal (88)]  │ [Search...] [Filter] [Sort] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. TABLE DATA CONTAINER (rounded-2xl border border-slate-200/90 shadow-xs)             │
│  No. Transaksi  │  Identitas / Klien  │  Metode  │  Waktu   │  Nominal  │ Status │ Aksi│
│  #KJ-8573       │  (DP) Dinda Permata │  QRIS    │ 11 Okt   │ Rp 35.000 │ Sukses │ [:] │
│                 │      Meja 04        │  Lunas   │ 22:48    │           │        │     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. FOOTER PAGINATION BAR                                                               │
│ Items Per Page [10 v]                                    │ <  1  [2]  3  4  .. 759  >  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2. Zona 1: Tabs & Toolbar Row
1. **Sisi Kiri: Underline Status Filter Tabs**
   - Menggunakan tombol horizontal dengan transisi warna halus.
   - **Teks Tab:** `text-xs sm:text-sm font-medium`. Saat aktif: `text-blue-600 dark:text-blue-400 font-semibold`. Saat inaktif: `text-slate-500 hover:text-blue-600`.
   - **Pill Hitungan (Count Badge):** `text-xs px-2 py-0.5 rounded-lg font-medium`. Saat aktif: `bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300`. Saat inaktif: `text-slate-400 dark:text-slate-500`.
   - **Garis Bawah Aktif (Underline Indicator):** `motion.div` dari Framer Motion dengan `layoutId` unik, kelas `absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-full`, transisi spring `{ type: "spring", stiffness: 450, damping: 35 }`.
2. **Sisi Kanan: Alat Pencarian & Filter**
   - **Search Input:**
     - Lebar responsif: `w-full sm:w-56`.
     - Ketinggian & bentuk: `h-9 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`.
     - Ikon `Search` di kiri (`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`).
     - Tombol clear `X` di kanan saat input terisi.
   - **Filter Popover Button (Funnel Icon):**
     - Ukuran: `h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800`.
     - Indikator Aktif: Dot biru solid `w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900` di pojok kanan atas (`top-1.5 right-1.5`) saat filter non-default diterapkan.
     - Konten Popover: `w-80 p-4 rounded-xl shadow-xl space-y-4`. Header memuat judul `text-xs font-semibold` dan link `Reset Filter` (`text-[11px] text-blue-600 hover:underline`). Bagian filter menggunakan grid tombol preset (`rounded-xl py-1.5 text-xs border`). Tombol eksekusi `Terapkan` di pojok kanan bawah.
   - **Sort Dropdown Button (SlidersHorizontal Icon):**
     - Ukuran: `h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800`.
     - Menu Dropdown: `w-48 p-1 rounded-xl shadow-lg border-slate-200 dark:border-slate-800`.
     - Item terpilih ditandai `font-semibold text-blue-600`.
   - **Primary Action Button (Opsional):**
     - Jika ada aksi pembuatan data baru (misal: "Tambah Biaya", "Tambah Menu"), tombol ditempatkan berdampingan: `h-9 px-4 text-xs font-semibold rounded-xl bg-[#0e59f9] hover:bg-blue-600 text-white shadow-xs`.

### 8.3. Zona 2: Table Data Container & Cells
1. **Wadah Tabel (Surface Container):**
   - `rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-xs`.
   - Menggunakan pembungkus `relative w-full overflow-x-auto` agar ramah layar sentuh / mobile.
2. **Kepala Kolom (`<thead>` & `<th>`):**
   - Baris: `bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200/80 dark:border-slate-800`.
   - Sel: `py-3.5 px-4 text-xs font-semibold whitespace-nowrap tracking-tight` (Zero bold!). Dilarang menyematkan ikon dekoratif di samping nama kolom.
3. **Baris Data (`<tbody>` & `<tr>`):**
   - Pembatas baris: `divide-y divide-slate-100 dark:divide-slate-800/80`.
   - Interaksi hover: `hover:bg-blue-50/50 dark:hover:bg-blue-950/25 transition-colors cursor-pointer`.
   - Padding sel: `py-3.5 px-4 text-xs align-middle whitespace-nowrap text-slate-700 dark:text-slate-300`.
4. **Format Standar Isi Sel (Cell Data Standards):**
   - **Kolom Identitas / Klien vs Transaksi / Item:**
     - **Entitas Pengguna/Pelanggan (Orang):** Menggunakan avatar bulat inisial `w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0` dengan palet warna terkurasi, teks utama `font-medium text-slate-800 dark:text-slate-200 truncate`, dan subteks `text-[10px] text-muted-foreground truncate`.
     - **Entitas Transaksi Keuangan / Produk / Non-Orang:** **Tidak menggunakan avatar inisial**. Langsung menggunakan tata letak 2-baris yang bersih (baris atas: judul `font-semibold text-slate-900 dark:text-slate-100 text-xs truncate`, baris bawah: kategori `text-[10px] text-slate-400 dark:text-slate-500 truncate`). Hal ini memberikan ruang baca teks yang lebih luas dan tidak rancu dengan profil pengguna.
   - **Kolom Waktu & Tanggal:**
     - Tanggal: `text-slate-700 dark:text-slate-300 font-medium text-xs`.
     - Jam: `text-[10px] text-muted-foreground` di bawahnya.
   - **Kolom Nilai Keuangan (Nominal):**
     - Wajib menggunakan `font-financial tabular-nums`.
     - Nilai biasa: `font-semibold text-xs text-slate-900 dark:text-slate-100`.
     - Pemasukan kas / inflow: `text-emerald-600 font-semibold` dengan awalan `+`.
     - Pengeluaran kas / outflow: `text-slate-900 font-semibold` atau `text-rose-600 font-semibold` dengan awalan `-`.
   - **Kolom Status Diskrit:**
     - Wajib menggunakan pill badge lembut tanpa border: `inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium`.
     - **Dilarang menambahkan bulatan/dot berwarna** di dalam badge status tabel agar tampilan bersih dan minimalis sesuai screenshot history transaksi.
     - Palet status:
       - Sukses / Lunas: `bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300` (Teks: "Sukses")
       - Diproses / Aktif: `bg-purple-100/80 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300` (Teks: "On Process")
       - Menunggu Bayar: `bg-sky-100/80 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300`
       - Batal / Void: `bg-rose-100/70 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300`
   - **Kolom Metode Pembayaran & Tipe Aliran (Badge Kategori/Metode):**
     - Wajib tanpa border (`border-none`): `inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium`.
     - Menggunakan palet lembut yang menyatu dengan tema Menuin (hindari warna terlalu kontras seperti kuning/amber pekat):
       - Kasir Tunai / Cash: `bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300` (Netral & harmonis).
       - Digital / QRIS / Transfer Bank: `bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300` (Menuin Royal Blue pastel).
       - Cash In (Pemasukan): `bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300` (disertai ikon `ArrowDownLeft`).
       - Cash Out (Pengeluaran): `bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300` (disertai ikon `ArrowUpRight`).
   - **Kolom Aksi (Action Menu):**
     - Rata kanan (`text-right`), memuat tombol dropdown `MoreVertical` (`h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg`).
     - Isi dropdown: menu tindakan terstruktur (`w-48 p-1 rounded-xl shadow-lg border-slate-200`).

### 8.4. Zona 3: Footer Pagination Bar
1. **Struktur Kontainer:**
   - `flex flex-col sm:flex-row items-center justify-between gap-4 pt-1`.
2. **Sisi Kiri: Pemilih Ukuran Halaman (Items Per Page):**
   - Label: `text-xs text-slate-500`.
   - Trigger: `Button variant="outline" size="sm" className="h-8 px-3 rounded-xl border-slate-200 text-xs font-medium gap-1.5 cursor-pointer"`.
   - Pilihan: `[10, 20, 50, 100]`.
3. **Sisi Kanan: Pengendali Nomor Halaman:**
   - Tombol Prev & Next: `Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50"`.
   - Tombol Angka Halaman:
     - Halaman aktif: `bg-blue-600 text-white shadow-xs font-medium h-8 min-w-[32px] px-2 text-xs rounded-lg`.
     - Halaman lain: `text-slate-600 hover:bg-blue-50 hover:text-blue-600 h-8 min-w-[32px] px-2 text-xs rounded-lg font-medium`.
     - Pemotong elipsis: `span className="px-1.5 text-xs text-slate-400"` dengan teks `...`.

### 8.5. Standar State Kosong (Authentic Empty State)
Saat hasil pencarian atau filter bernilai 0:
- Ikon: `<PackageSearch className="w-9 h-9 text-slate-300 dark:text-slate-600" />`.
- Judul: `text-sm font-semibold text-slate-800 dark:text-slate-200`.
- Subteks: `text-xs text-muted-foreground max-w-sm`.
- Padding wadah: `py-16 text-center`.

---

## 9. Panduan Eksekusi bagi AI Coding Agent

Sebelum menyerahkan kode frontend ke pengguna:
1. Pastikan **tidak ada `font-bold`** di seluruh berkas yang dimodifikasi.
2. Pastikan **tidak ada `bg-gradient-...`**.
3. Pastikan tidak ada ikon hiasan di samping judul kolom tabel atau nama kategori.
4. Pastikan tidak ada border badge berlebihan pada tanggal, jam, atau nama kategori.
5. Pastikan seluruh tabel mengikuti **Standar 3-Zona** (Underline Tabs di kiri, Search/Filter/Sort di kanan, Tabel Card rounded-2xl, Footer Pagination Items Per Page & Page Numbers).
6. Pastikan tidak ada kalimat instruksional yang menggurui (*"Arahkan kursor...", "Berikut adalah..."*).
7. Jalankan validasi `npx tsc --noEmit` untuk menjamin tidak ada kesalahan tipe TypeScript.

