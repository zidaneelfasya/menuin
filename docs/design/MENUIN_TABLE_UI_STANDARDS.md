# Standar Desain UI Tabel & Katalog MENUIN (Source of Truth)

**Modul:** Global Table System, Catalog, Inventory & Transactions  
**Status:** ACTIVE — SOURCE OF TRUTH  
**Last Updated:** 10 November 2026  
**Acuan Emas (Gold Standard):** Halaman Riwayat Transaksi (`/outlet/[outletKey]/transactions`)  

---

## 1. Filosofi & Hirarki Desain Tabel Menuin

Antarmuka tabel di Menuin dirancang untuk **kecepatan pemindaian mata (*scannability*)**, **kerapihan visual (*cleanliness*)**, dan **konsistensi tipografi menyeluruh**. Tabel data Menuin selalu berakar pada prinsip **The 6 Zero Principles**:
1. **Pure White Surface (`bg-white`):** Kontainer tabel selalu berwarna putih bersih dengan elevasi `shadow-sm-md`.
2. **100% Borderless (`border-none`):** Kontainer tabel tidak memiliki garis tepi luar (`border border-slate-200`). Pemisah baris menggunakan garis halus internal `divide-y divide-slate-100`.
3. **Plafon Font Semibold:** Maksimal ketebalan font adalah `font-semibold` (600). Dilarang keras memakai `font-bold` (700) di dalam tabel.
4. **Dwi-Tipografi Natural:** UI teks menggunakan `Poppins` / font default, sedangkan angka nominal, persentase, dan tanggal jam menggunakan `tabular-nums font-numeric` (Inter).
5. **Dilarang All-Caps (`uppercase tracking-wider`):** Seluruh header tabel dan label menggunakan **Sentence case** atau **Title Case** yang ramah dan nyaman dibaca.

---

## 2. Struktur Kontainer & Header Tabel

### 2.1 Kontainer Pembungkus (`TableWrapper`)
```tsx
<div className="rounded-2xl border-none bg-white overflow-hidden shadow-sm-md">
  <div className="relative w-full overflow-x-auto">
    <table className="w-full text-left text-xs">
      ...
    </table>
  </div>
</div>
```
- **Radius Sudut:** Selalu menggunakan `rounded-2xl` (bukan `rounded-3xl` yang terlalu membulat untuk tabular data).
- **Bayangan:** Selalu menggunakan `shadow-sm-md`.

### 2.2 Header Tabel (`<thead>` / `TableHead`)
```tsx
<thead>
  <tr className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-100">
    <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500">Kolom</th>
  </tr>
</thead>
```
- **Latar Header:** `bg-slate-50/70` memberikan kontras lembut terhadap baris putih tanpa terasa kotor.
- **Tipografi Header:** `text-xs font-semibold text-slate-500`. Dilarang menggunakan `text-[11px] text-slate-400` yang terlalu pudar.

---

## 3. Tata Letak Sel Baris Data (2-Baris Vertikal)

Untuk memaksimalkan ruang dan kerapihan informasi, data utama disajikan dalam format **2-Baris Vertikal**:

### 3.1 Identitas Entitas (Item / Pelanggan / Bahan Baku)
```tsx
<div className="flex items-center gap-2.5 min-w-0">
  {/* Icon Avatar Inisial (Wajib Monokrom Biru Menuin) */}
  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0e59f9] flex items-center justify-center text-[11px] font-semibold shrink-0 select-none">
    KS
  </div>
  {/* Nama & Subteks */}
  <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
    <span className="font-medium text-slate-800 text-xs truncate">Nama Utama</span>
    <span className="text-[10px] text-muted-foreground font-mono truncate">Kode / SKU</span>
  </div>
</div>
```

#### 3.1.1 Standar Warna Avatar Inisial (Tema Spektrum Biru Menuin)
Dilarang menggunakan palet warna-warni pelangi (merah, ungu, hijau, oranye) untuk avatar inisial entitas agar tidak bertabrakan dengan warna badge status (*Aman*, *Menipis*, *Habis*, *Batal*, *Sukses*). Seluruh avatar inisial wajib menggunakan variasi **Spektrum Biru Menuin** yang memadukan warna biru pejal bertulisan putih dan biru pastel lembut:
* `bg-[#0e59f9] text-white` — Biru Menuin Solid, Teks Putih
* `bg-blue-700 text-white` — Biru Cobalt Pekat, Teks Putih
* `bg-blue-500 text-white` — Biru Azure Cerah, Teks Putih
* `bg-sky-600 text-white` — Biru Laut / Deep Sky, Teks Putih
* `bg-indigo-600 text-white` — Biru Royal Indigo, Teks Putih
* `bg-blue-100 text-[#0e59f9]` — Biru Muda Menuin, Teks Biru Signature
* `bg-sky-100 text-sky-800` — Biru Langit Lembut, Teks Biru Laut
* `bg-blue-50 text-blue-700` — Biru Es Halus, Teks Biru Tua
```

### 3.2 Kuantitas & Batas Minimum (Stok)
```tsx
<div className="flex flex-col">
  <span className="font-semibold text-slate-900 text-xs tabular-nums font-numeric">
    18.5 Liter
  </span>
  <span className="text-[10px] text-muted-foreground">
    Batas min: 5 Liter
  </span>
</div>
```

### 3.3 Nominal Finansial / Harga
```tsx
<div className="flex flex-col">
  <span className="font-semibold text-slate-900 text-xs tabular-nums font-numeric">
    Rp 18.000
  </span>
  <span className="text-[10px] text-muted-foreground">
    per Liter
  </span>
</div>
```

---

## 4. Standar Warna Status Badge (Pastel Soft Borderless)

Badge status pada seluruh tabel Menuin wajib menggunakan pill membulat penuh tanpa border dengan warna pastel lembut:
```tsx
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border-none"
```

| Makna Status | Class Tailwind | Contoh Penggunaan |
| :--- | :--- | :--- |
| **Positif / Aman / Sukses** | `bg-emerald-100/80 text-emerald-700 font-medium border-none` | Sukses, Stok Aman, Lunas, Aktif |
| **Peringatan / Menipis / Menunggu** | `bg-amber-100/80 text-amber-700 font-medium border-none` | Menunggu Bayar, Stok Menipis, Sedang Dikirim |
| **Negatif / Habis / Batal** | `bg-rose-100/70 text-rose-700 font-medium border-none` | Batal, Stok Habis, Gagal, Nonaktif |
| **Proses / Baru / Antrean** | `bg-purple-100/80 text-purple-700 font-medium border-none` | On Process, Pesanan Baru, Dapur |
| **Info / Netral** | `bg-sky-100/80 text-sky-700 font-medium border-none` | Draft, QRIS, Reservasi |

---

## 5. Underline Status Filter Tabs & Counter Badge

```tsx
<button
  type="button"
  className={cn(
    "relative pb-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap",
    isActive ? "text-[#0e59f9] font-semibold" : "text-slate-500 hover:text-[#0e59f9]"
  )}
>
  <span>{tab.label}</span>
  <span className={cn(
    "text-xs px-2 py-0.5 rounded-full font-medium transition-colors",
    isActive ? "bg-blue-50 text-[#0e59f9] font-semibold" : "text-slate-400 bg-slate-100"
  )}>
    {tab.count}
  </span>
  {isActive && (
    <motion.div
      layoutId="activeTabUnderline"
      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0e59f9] rounded-full"
    />
  )}
</button>
```
> **Aturan Mutlak:** Angka hitungan (*counter badge*) pada tab yang tidak aktif **SELALU** berwarna netral `text-slate-400 bg-slate-100`. Dilarang mewarnai counter badge tab tidak aktif dengan warna mencolok (merah/kuning).

---

## 6. Tombol Aksi Cepat & Opsi Menu Baris Tabel

- **Aksi Cepat (+ / -):** Menggunakan icon button compact `h-7 w-7 rounded-full bg-slate-100/80 text-slate-600 hover:bg-[#0e59f9] hover:text-white transition-all border-none`.
- **Menu Opsi 3-Titik:** Menggunakan button `h-7 w-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors`.

---

## 7. Standar Tampilan Kartu Katalog Kasir (POS Card Display Standards)

Katalog Kasir (POS) Menuin mendukung 3 mode tampilan kartu produk:
1. **Mode Gambar (`image`):** Gambar horizontal di bagian atas kartu dengan rasio 4:3, teks nama dan harga di bawah.
2. **Mode Gambar Samping (`side-image`) — Tata Letak Horizontal Split (Berdasarkan Referensi Kasir):**
   - **Kontainer:** Pure white `bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border-none shadow-sm-md flex items-stretch justify-between gap-3 h-[195px] sm:h-[205px] overflow-hidden` (bebas efek hover seperti pergeseran atau lonjakan bayangan).
   - **Tinggi Seragam & Terkunci:** Grid menggunakan `auto-rows-[195px] sm:auto-rows-[205px]` dan kartu memiliki tinggi pasti `h-[195px] sm:h-[205px]` sehingga seluruh kartu di semua baris tinggi, kokoh, dan presisi.
   - **Sisi Kanan:** Gambar produk ramping/portrait vertikal (`w-[84px] sm:w-[90px] md:w-[96px] h-full self-stretch shrink-0 rounded-xl overflow-hidden object-cover`). Jika foto produk tidak tersedia atau gagal dimuat, wajib menampilkan placeholder inisial nama produk (`text-3xl font-semibold text-slate-400 bg-slate-100`).
   - **Sisi Kiri:**
     - **Atas:** Slot ketinggian `h-6` terstandarisasi. Bila produk merupakan rekomendasi (`isFeatured`), menampilkan icon jempol (`ThumbsUp` warna `#0e59f9` tanpa background / circle background).
     - **Tengah:** Nama produk (`font-semibold text-sm line-clamp-2 leading-snug`) dan kategori di bawahnya (`text-[11px] text-slate-400 font-normal`).
     - **Bawah:** Tombol bulat biru dinamis compact (`w-6 h-6 rounded-full bg-[#0e59f9] text-white`). Saat belum di keranjang menampilkan icon `Plus`, dan saat sudah di keranjang menampilkan angka kuantitas (`cartQuantity` text-[11px]). Berdampingan dengan label harga produk (`font-semibold text-sm tracking-tight font-financial tabular-nums`). Ukuran tipografi dan tombol bulat sepenuhnya diselaraskan dengan standar mode gambar.
3. **Mode Warna (`color`):** Tanpa foto, menggunakan kartu pastel bertema spektrum biru/netral dengan icon representatif produk.




