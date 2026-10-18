# Implementation Plan: Verifikasi Per-Item Kritis, Persistensi Draft Bertahap, & Standarisasi UI Table Menuin

**File ID:** `docs/verify-bisnis/plan-per-item-verification-and-draft.md`  
**Status:** PROPOSED — MENUNGGU REVIEW USER  
**Tanggal:** 17 Oktober 2026  
**Terkait:** `docs/verify-bisnis/PRD-verify-bisnis.md`, `docs/verify-bisnis/decision-log.md`, `docs/verify-bisnis/task-register.md`  

---

## 1. Analisis & Tanggapan Terhadap Pertanyaan Pengguna

### 1.1. Granularitas Verifikasi: Per-Input Field vs Per-Dokumen/Item Kritis vs Per-Step
- **Pertanyaan Pengguna:**  
  *Apakah di setiap input form yang penting bisa verifikasi di setiap inputnya atau cukup per step?*
- **Hasil Analisis & Rekomendasi:**  
  - Memverifikasi setiap input teks kecil secara terpisah (nama usaha, NIK, alamat, kota, kode pos = 25+ tombol ceklis) adalah **anti-pattern** di sistem perbankan/fintech karena menyebabkan **auditor cognitive fatigue** (kelelahan mental) dan memperlambat SLA audit hingga 300%. Selain itu, memverifikasi teks tanpa bukti dokumen tidak memiliki nilai hukum/kepatuhan.
  - Namun, memverifikasi per-step secara global (hanya 1 catatan bebas) sering membingungkan merchant ketika ada kesalahan kecil.
  - **Rekomendasi Best Practice (Standar Stripe/Xendit): Verifikasi Berbasis Item/Aset Kritis (Pair of Data & Document Proof)**:  
    Admin memverifikasi 6 Aset Kepatuhan Utama:
    1. **Legalitas Usaha / NIB** (Nomor NIB + Berkas NIB) -> `[Valid / Perlu Perbaikan]` + Catatan
    2. **NPWP Badan / Usaha** (Nomor NPWP + Berkas NPWP) -> `[Valid / Perlu Perbaikan]` + Catatan
    3. **e-KTP Penanggung Jawab** (Nama + NIK + Foto e-KTP) -> `[Valid / Perlu Perbaikan]` + Catatan
    4. **Rekening Penampungan Settlement** (Nama Bank + No Rekening + a/n Rekening + Dokumen Buku Tabungan + Match Score) -> `[Valid / Tolak]` + Catatan
    5. **Kepatuhan Fisik: Foto Fasad / Depan Gerai** (Foto Tampak Depan + Papan Nama) -> `[Valid / Perlu Perbaikan]` + Catatan
    6. **Kepatuhan Fisik: Foto Kasir & Operasional Gerai** (Foto Meja Kasir / POS) -> `[Valid / Perlu Perbaikan]` + Catatan

---

### 1.2. Pemisahan Data Perwakilan Bisnis (PIC) vs Profil Usaha
- **Pertanyaan Pengguna:**  
  *Apakah perwakilan bisnis perlu dipisah datanya dengan profil usaha, jadi profil usaha dan perwakilan bisnis tidak terikat datanya dan bisa terpisah, contoh misal di suatu outlet perwakilan bisnis dari bisnis yang sama berbeda atau memang untuk memudahkan pengguna cukup dibuat simple saja?*
- **Hasil Analisis & Rekomendasi:**  
  - **Aspek Hukum Perseroan & KYC Perbankan (BI / PJP / DOKU):**  
    Badan usaha (PT, CV, Perorangan) memiliki **Penanggung Jawab Legal Utama (Direktur/Owner)** yang menandatangani perjanjian merchant dan terikat secara hukum dengan NIB & NPWP Badan. Penanggung Jawab Legal ini **WAJIB terikat 1:1 pada Profil Usaha (`business_profiles`)**.
  - **Multi-Outlet (Cabang Bisnis):**  
    Ketika merchant membuka cabang ke-2, ke-3, dst., merchant **TIDAK PERLU** mengunggah KTP Direktur berulang kali. Profil usaha langsung digunakan kembali (*reusable*).
  - **Bagaimana jika di Gerai ada Manajer yang Berbeda?**  
    Itu adalah **PIC Operasional Gerai**, bukan Legal Representative. MENUIN sudah memiliki relasi `memberships` dengan role `MANAGER`, dan kita dapat menambahkan field opsional kontak manajer gerai di Step 4 jika diperlukan.
  - **Kesimpulan:** Tetap satukan data Penanggung Jawab Legal di `business_profiles` agar sederhana dan sesuai aturan hukum.

---

### 1.3. Persistensi Draft per-Step (Auto-Save on Next) & Kebijakan Antrean Admin
- **Pertanyaan Pengguna:**  
  *Setiap step jika sudah diklik simpan dan lanjutkan maka datanya langsung tersimpan, jika keluar website datanya masih disimpan dan data step 1 juga masuk ke admin, apakah proses ini best practice?*
- **Hasil Analisis & Rekomendasi:**  
  - **Auto-Save Draft ke Database:** **SANGAT BEST PRACTICE.**  
    Setiap kali merchant menekan "Simpan & Lanjutkan", data langsung disimpan ke database dengan status `draft`. Jika koneksi putus, browser ditutup, atau baterai habis, data tidak akan hilang dan wizard langsung membuka langkah terakhir.
  - **Apakah Step 1 yang masih draft masuk ke Antrean Admin?** **TIDAK BOLEH (Anti-Pattern).**  
    - Jika draft masuk ke antrean admin, antrean akan dipenuhi ratusan form yang belum selesai (tanpa KTP/Rekening).
    - Auditor tidak dapat mengambil keputusan atas data yang belum lengkap.
    - Pengajuan baru resmi masuk ke antrean compliance admin setelah merchant menyelesaikan review dan menekan **"Kirim Pengajuan Verifikasi"** di Step 5 (`status = 'submitted'`).

---

### 1.4. Tampilan Antrean Admin: Per-Step vs 2-Tier
- **Pertanyaan Pengguna:**  
  *Tampilan list dari admin yang masuk apakah dipisah setiap step atau hanya dipisah menjadi dua seperti yang sekarang?*
- **Hasil Analisis & Rekomendasi:**  
  - Memisahkan antrean per-step akan membingungkan auditor karena satu pengajuan terpecah ke 5 antrean berbeda.
  - **Pertahankan Arsitektur 2-Tier Saat Ini (`BUSINESS_PROFILE` vs `OUTLET`):**  
    - **Tier 1 (Profil Legal Usaha & Rekening)**: Diverifikasi 1x di level badan usaha.
    - **Tier 2 (Kepatuhan Fisik Gerai)**: Diverifikasi per lokasi gerai cabang (foto toko, meja kasir, titik koordinat).

---

### 1.5. Konsistensi UI/UX: Standarisasi Table Menuin (`AppTable`)
- **Temuan Pengguna:**  
  *Tampilan table yang digunakan pada antrean verifikasi admin belum mengikuti standar komponen table Menuin.*
- **Solusi:**  
  Mengganti raw HTML `<table>` pada `apps/web/src/app/system-admin/verification/admin-verification-queue-client.tsx` dengan komponen standar Menuin `<AppTable<QueueItem>>` dari `@/components/ui/app-table.tsx` lengkap dengan styling card rounded-2xl, pagination terintegrasi, search bar bawaan, dan empty-state standar.

---

## 2. Rencana Eksekusi Bertahap

| Tahap | Modul | Deskripsi Pekerjaan |
| :--- | :--- | :--- |
| **Tahap 1** | **UI/UX Table Standard** | Refactor `admin-verification-queue-client.tsx` menggunakan `AppTable` Menuin (`@/components/ui/app-table`). |
| **Tahap 2** | **Draft Auto-Save per-Step** | Buat server action autosave draft pada setiap klik "Simpan & Lanjutkan" di wizard (Steps 1, 2, 3, 4) dengan status `draft`. Pastikan data reload otomatis saat merchant kembali. |
| **Tahap 3** | **Itemized Asset Review Admin** | Sempurnakan halaman `admin-verification-detail-client.tsx` dengan checklist verifikasi 6 aset kritis (NIB, NPWP, KTP, Bank, Tampak Depan, Kasir) dengan tombol `Valid` / `Perlu Perbaikan` + input note per aset. |
| **Tahap 4** | **Revisi Feedback Loop** | Integrasikan catatan perbaikan admin ke dalam Onboarding Wizard merchant, sehingga saat status `action_required`, merchant langsung diarahkan ke item yang perlu diperbaiki. |
