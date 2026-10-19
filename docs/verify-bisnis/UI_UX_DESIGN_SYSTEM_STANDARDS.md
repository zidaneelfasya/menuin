# Standar Desain UI/UX MENUIN (Source of Truth)

**Module:** Global UI/UX Design System, Typography, Components & Verification  
**Status:** ACTIVE — SOURCE OF TRUTH  
**Last Updated:** 18 Oktober 2026  
**Authority:** Product Design & Frontend Architecture  

---

## 1. Prinsip Utama Tipografi & Teks (Strict Rules)

### 1.1. DILARANG Menggunakan `uppercase` dan `tracking-wider`
- **Larangan Keras:** Jangan pernah menambahkan utility class `uppercase` dan `tracking-wider` / `tracking-widest` pada label, header tabel, eyebrow text, badge, maupun sub-header.
- **Rasional:**
  - Huruf kapital penuh (*all-caps*) dengan letter-spacing renggang (`uppercase tracking-wider`) membuat antarmuka terasa kaku, berjarak, dan sulit dipindai (*low readability*) terutama dalam bahasa Indonesia.
  - Standar visual Menuin mengusung kesan modern, bersih, ramah, dan profesional menggunakan **Sentence case** atau **Title Case** natural.
- **Aturan Penggantian:**
  - ❌ `text-[11px] font-semibold text-slate-400 uppercase tracking-wider`
  - ✅ `text-xs font-medium text-slate-500` atau `text-[11px] font-semibold text-slate-500`

---

## 2. Standar Komponen Tabel (Table Component Standard)

### 2.1. Wajib Menggunakan Komponen Resmi `@/components/ui/table`
- **Larangan Keras:** Dilarang membuat tag HTML table mentah (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`) secara ad-hoc dengan styling terpisah.
- **Komponen Standar:**
  ```tsx
  import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
  } from '@/components/ui/table';
  ```
- **Ketentuan Header Tabel (`TableHead`):**
  - Font size: `text-xs`
  - Font weight: `font-semibold`
  - Text color: `text-slate-500`
  - Casing: **Natural case** (misal: "Bank & Nomor Rekening", "Nama Pemilik", "Status Verifikasi", "Aksi").
  - Padding & Alignment: Standard vertical alignment `align-middle py-3 px-4`.
- **Ketentuan Baris Data (`TableRow` & `TableCell`):**
  - Hover state: `hover:bg-slate-50/60`
  - Border separator: `border-b border-slate-100`

---

## 3. Standar Status Indikator pada Section Card (Header Row)

### 3.1. Penempatan Sejajar dengan Title Form (Sebelah Kanan)
Setiap card pengelompokan data atau form detail wajib memiliki indikator status di bagian header card di sebelah kanan, sejajar dengan judul form:

1. **Status Terverifikasi (Sesuai / Valid):**
   - Menggunakan icon **Checklist Fill Berwarna Hijau** (`CheckCircle2` atau container bulat emerald solid dengan centang putih).
   - Warna: `text-emerald-600` / `bg-emerald-500 text-white` atau `bg-emerald-50 text-emerald-700 border border-emerald-200`.
   - Menegaskan bahwa data pada kartu tersebut telah diperiksa dan disetujui kepatuhannya.

2. **Status Perlu Revisi / Kesalahan Data:**
   - Menggunakan icon **Alert / Peringatan** (`AlertCircle` dengan warna amber-600 atau rose-600).
   - Menampilkan tooltip / badge penjelasan kesalahan jika kursor diarahkan ke icon atau diklik.

3. **Status Sedang Ditinjau / Dalam Proses:**
   - Menggunakan icon waktu / jam (`Clock` atau `Loader2`) dengan nuansa biru / slate lembut.

---

## 4. Standar Verifikasi Manual Field Teks & Dokumen di Admin Panel

### 4.1. Verifikasi Field-Level Granular
- Admin verifikasi tidak hanya memeriksa dokumen file, tetapi juga memvalidasi teks penting (NIB, NPWP, NIK, Nama Pemilik, Alamat, Nomor Rekening).
- Setiap field penting menyediakan kontrol ringkas:
  - Tombol `[Sesuai]` (Icon Check)
  - Tombol `[Flag / Salah]` (Icon Alert/X)
- Field yang ditandai salah otomatis tersimpan dalam `flaggedFields: string[]` pada seksi terkait di database (`verificationSectionReviews`).
