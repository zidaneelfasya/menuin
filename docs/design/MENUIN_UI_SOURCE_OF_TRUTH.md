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

## 8. Panduan Eksekusi bagi AI Coding Agent

Sebelum menyerahkan kode frontend ke pengguna:
1. Pastikan **tidak ada `font-bold`** di seluruh berkas yang dimodifikasi.
2. Pastikan **tidak ada `bg-gradient-...`**.
3. Pastikan tidak ada ikon hiasan di samping judul kolom tabel atau nama kategori.
4. Pastikan tidak ada border badge berlebihan pada tanggal, jam, atau nama kategori.
5. Pastikan tidak ada kalimat instruksional yang menggurui (*"Arahkan kursor...", "Berikut adalah..."*).
6. Jalankan validasi `npx tsc --noEmit` untuk menjamin tidak ada kesalahan tipe TypeScript.
