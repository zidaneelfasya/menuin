# Menuin Financial & Sales Reporting Source of Truth (SOT)

Dokumen ini adalah **sumber kebenaran mutlak (Source of Truth)** untuk seluruh perhitungan keuangan, pelaporan penjualan, akuntansi restoran, dan visualisasi dashboard di ekosistem **Menuin**. 

Setiap AI agent, developer, dan pengembang sistem **WAJIB MEMATUHI** aturan dan rumus di bawah ini tanpa pengecualian.

---

## 1. Prinsip Fundamental: Hakikat "Bruto" dan "Gross Sales"

1. **`Bruto == Gross Sales (Penjualan Kotor)`**:
   - Kata **Bruto** (bahasa Indonesia/Latin) dan **Gross** (bahasa Inggris) adalah **entitas yang sama persis**.
   - Gross Sales adalah **angka asli nilai penjualan menu** sebelum ada potongan promo/diskon apa pun, dan **TIDAK TERMASUK PAJAK**.
   - Secara matematis di nota kasir:
     $$\mathbf{Gross\ Sales\ (Bruto)} = \mathbf{Subtotal\ Bayar\ Setelah\ Diskon} + \mathbf{Potongan\ Diskon}$$
2. **Larangan Double Counting (BANNED PATTERN):**
   - ❌ **DILARANG KERAS** membuat angka artifisial bernama "Bruto" dengan cara menjumlahkan `Gross Sales + Total Potongan`. 
   - Karena `Gross Sales` di database **memang belum pernah dipotong diskon**, menambahkan diskon lagi di atas Gross Sales akan menyebabkan potongan terhitung dua kali (*double deduction*) saat diturunkan kembali ke Net Sales.

---

## 2. Anatomi Database Transaksi & Alur Uang Riil

Di database Menuin (tabel `transactions` dan `transaction_items`), setiap pesanan memiliki struktur sebagai berikut:

```
[Katalog Menu / Porsi Terjual]
       │
       ▼  (Harga Jual Menu × Kuantitas)
[1. transactions.total_amount]  <── INILAH GROSS SALES (PENJUALAN KOTOR / BRUTO)
       │
       ▼  (Dipotong Voucher / Promo Kode)
[2. transactions.discount]      <── POTONGAN DISKON
       │
       ▼  (Ditambahkan jika outlet mengaktifkan Pajak & Service Charge)
[3. transactions.tax & service_charge] <── TITIPAN KAS PEMDA (BUKAN OMZET TOKO!)
       │
       ▼  (Nilai akhir di struk kasir yang dibayarkan konsumen)
[4. transactions.grand_total]   <── GRAND TOTAL / TOTAL TERTANGIH DI NOTA
       │
       ▼  (Dipotong fee gateway jika metode bayar QRIS Dinamis / Online)
[5. transactions.gateway_fee]   <── BIAYA MDR TRANSAKSI DIGITAL
       │
       ▼  (Uang bersih yang cair ke laci kasir atau saldo bank merchant)
[6. transactions.net_amount]    <── NET CASH INFLOW (UANG MASUK KAS BERSIH)
```

---

## 3. Kamus Istilah Resmi & Rumus Baku (*Standard Metrics*)

### 3.1. Gross Sales (Penjualan Bruto / Penjualan Kotor)
- **Definisi:** Akumulasi nilai jual seluruh porsi menu yang dipesan pelanggan pada harga normal, **sebelum diskon dan tanpa pajak**.
- **Rumus:**
  $$\text{Gross Sales} = \sum (\text{item.price} \times \text{item.quantity}) = \sum (\text{transactions.total\_amount})$$
- **Karakter:** Basis 100% dari potensi omzet menu. Tidak terpengaruh oleh diskon nota maupun MDR.

### 3.2. Total Potongan (Sales Deductions)
- **Definisi:** Seluruh faktor yang mengurangi perolehan uang dari penjualan.
- **Komponen:**
  1. `totalDiscount`: Total diskon voucher, kode promo, dan diskon manual nota.
  2. `totalGatewayFee` (MDR): Biaya pemrosesan transaksi pembayaran digital (QRIS Dinamis 0.7%, Online Payment Gateway 0.7%). *Catatan: Tunai, QRIS Statis fisik, dan Transfer Bank memiliki MDR 0.*
- **Rumus:**
  $$\text{Total Potongan} = \text{totalDiscount} + \text{totalGatewayFee}$$

### 3.3. Net Sales (Penjualan Bersih Toko)
- **Definisi:** Nilai penjualan riil yang menjadi hak sah pendapatan usaha merchant setelah dipotong promo dan biaya pemrosesan transaksi.
- **Rumus:**
  $$\text{Net Sales} = \text{Gross Sales} - \text{Total Potongan} = \text{Gross Sales} - \text{totalDiscount} - \text{totalGatewayFee}$$

### 3.4. Grand Total (Total Tertagih di Nota / Struk)
- **Definisi:** Jumlah uang yang tercetak di bagian bawah nota kasir dan dibayarkan oleh pelanggan.
- **Rumus:**
  $$\text{Grand Total} = \text{Gross Sales} - \text{totalDiscount} + \text{Pajak (PB1)} + \text{Service Charge}$$

### 3.5. Net Cash Inflow (Uang Masuk Kas & Rekening Bank)
- **Definisi:** Uang tunai riil di laci kasir ditambah saldo bersih mutasi bank yang cair ke rekening merchant.
- **Rumus:**
  $$\text{Net Cash Inflow} = \text{Grand Total} - \text{totalGatewayFee}$$
- **Hubungan dengan Net Sales:**
  $$\text{Net Cash Inflow} = \text{Net Sales} + \text{Pajak} + \text{Service Charge}$$
  *(Uang masuk kas lebih besar dari Net Sales karena di dalamnya ada uang titipan pajak pemerintah yang belum disetor).*

### 3.6. COGS / HPP (Harga Pokok Penjualan / Modal Resep)
- **Definisi:** Beban modal bahan baku yang keluar dari inventori dapur untuk memproduksi menu yang terjual.
- **Rumus:**
  $$\text{HPP (COGS)} = \sum (\text{modal\_resep\_bahan} \times \text{kuantitas\_terjual})$$

### 3.7. Gross Profit (Laba Kotor) & Margin
- **Definisi:** Keuntungan kotor yang diperoleh toko dari selisih omzet bersih terhadap modal bahan baku (sebelum dikurangi biaya operasional seperti gaji karyawan, listrik, dan sewa tempat).
- **Rumus:**
  $$\text{Gross Profit} = \text{Net Sales} - \text{HPP (COGS)}$$
  $$\text{Gross Profit Margin (\%)} = \left(\frac{\text{Gross Profit}}{\text{Net Sales}}\right) \times 100\%$$

---

## 4. Dua Sudut Pandang Laporan Keuangan di Menuin

Dashboard Menuin membagi laporan keuangan ke dalam 2 perspektif terpisah agar merchant tidak bingung:

### Perspektif 1: Sales & Profitability Analytics (Laba Rugi Omzet)
Digunakan pada card **Sales Analytics** untuk mengevaluasi efisiensi penjualan:
$$\mathbf{Gross\ Sales} \xrightarrow{-\ Potongan\ (Diskon+MDR)} \mathbf{Net\ Sales} \xrightarrow{-\ Modal\ HPP} \mathbf{Gross\ Profit\ (Margin\ \%)}$$

### Perspektif 2: Cash Flow & Settlement (Arus Kas Masuk)
Digunakan pada card **Metode Pembayaran** untuk rekonsiliasi uang kas:
$$\mathbf{Total\ Transaksi\ Ditagih\ (Grand\ Total)} \xrightarrow{-\ Fee\ MDR\ Gateway} \mathbf{Net\ Inflow\ (Kas\ Masuk\ Bersih)}$$

---

## 5. Standar Tampilan 4 Card Finansial (Sales Analytics)

Saat merender 4 mini-card di bawah grafik *Sales Analytics*, wajib menggunakan hierarki berikut:

1. **Card 1: Gross Sales (Penjualan Bruto)**
   - Warna: Putih (`bg-slate-50/70 border-slate-100`)
   - Nominal: `formatRupiah(kpis.grossSales)`
   - Subline: Basis Acuan Omzet Asli (spacer tanpa pengurang)
   - Progress Bar: **100%** (Basis Penuh)
2. **Card 2: Net Sales (Penjualan Bersih - Hero Realisasi Penjualan)**
   - Warna: **Biru Menuin Solid** (`bg-[#0e59f9] text-white shadow-sm shadow-blue-500/20`) &mdash; *Highlight Utama Realisasi Omzet Toko*
   - Nominal: `formatRupiah(kpis.netSales)` di baris atas
   - Subline: `-{formatRupiah(totalDiscount + totalGatewayFee)}` (`text-blue-100 font-medium`)
   - Progress Bar: Putih di atas track transparan (`bg-white/25`), proporsional terhadap Gross Sales (contoh: `98.9%`)
3. **Card 3: Beban HPP / COGS (Modal Resep)**
   - Warna: Putih (`bg-slate-50/70 border-slate-100`)
   - Nominal: `formatRupiah(totalHpp)`
   - Subline: Modal Bahan Baku Terjual
   - Progress Bar: Proporsional terhadap Gross Sales (contoh: `40.0%`)
4. **Card 4: Gross Profit (Laba Kotor & Margin)**
   - Warna: **Biru Menuin Solid** (`bg-[#0e59f9] text-white shadow-sm shadow-blue-500/20`) &mdash; *Highlight Utama Keuntungan Bersih Toko*
   - Nominal: `formatRupiah(kpis.grossProfit)` di baris atas
   - Subline: **`Margin: XX.X%`** di baris bawah (`text-blue-100 font-medium`)
   - Progress Bar: Putih di atas track transparan (`bg-white/25`), proporsional terhadap Gross Sales (contoh: `58.9%`)

---

## 6. Aturan Keras Bagi AI Agent (*Strict Agent Invariants*)

1. **JANGAN PERNAH** memodifikasi `Gross Sales` dengan menambahkan `Potongan Diskon` di atasnya.
2. **JANGAN PERNAH** memasukkan nilai `tax` (PB1) ke dalam perhitungan `Gross Sales` atau `Net Sales`.
3. **SELALU GUNAKAN** `total_amount` dari tabel `transactions` sebagai representasi `Gross Sales`.
4. **SELALU PISAHKAN** antara `Net Sales` (omzet hak toko) dengan `Net Cash Inflow` (uang kas masuk fisik/bank yang masih mengandung titipan pajak).
