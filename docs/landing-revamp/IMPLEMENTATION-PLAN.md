# Revamp Landing Page Menuin — Implementation Plan

**Branch:** `dev/landing-revamp` (dari `origin/dev/staging`)
**Target file utama:** `apps/web/src/components/landing-page.tsx` (1.771 baris, satu file, `"use client"`)
**Referensi desain:** https://www.apple.com/iphone-duo/ (Apple product showcase)
**Tanggal:** 2026-09-20

---

## 0. Ringkasan Eksekutif

Landing page sekarang **bukan jelek secara asal-asalan** — warnanya sudah konsisten biru `#0E59F9`, spacing sudah lapang, komponen sudah rapi. Yang membuatnya terbaca sebagai "AI slop" adalah tiga hal, dan ketiganya bukan soal selera:

1. **Isi visualnya tidak nyata.** Screenshot hero menampilkan tabel produk **kosong** ("Tidak ada data"), foto produk di-hotlink dari Unsplash, avatar testimoni dari `i.pravatar.cc`, dan logo bank di-hotlink dari Wikimedia. Halaman ini memamerkan produk yang kelihatan belum dipakai siapa pun.
2. **Bahasa visual generiknya khas template.** Tiga blob blur `blur-[90px]`–`blur-[150px]` di belakang hero, `shadow-2xl`, 11 `bg-gradient-*`, gradient text pada heading, tiga kartu fitur seragam bergradasi biru. Ini persis pola yang dihindari oleh manifesto anti-AI-slop di `README_LANDING_PAGE.md`.
3. **Copy-nya bahasa Inggris untuk audiens Indonesia**, dan penuh klaim tanpa angka ("up to 80%", "1.200+ gerai"), sementara `README_LANDING_PAGE.md` sudah menyiapkan naskah Bahasa Indonesia lengkap yang jauh lebih kuat dan belum dipakai sama sekali.

Rencana ini memperbaiki ketiganya sekaligus memecah monolit 1.771 baris menjadi section-component yang bisa dikerjakan paralel.

**Estimasi:** 5 fase, ~8–11 hari kerja 1 frontend + 2–3 hari produksi aset (sebagian bisa paralel).

---

## 1. Audit Mendalam — Temuan Konkret

### 1.1 Kredibilitas konten (prioritas tertinggi, dampak konversi langsung)

| # | Temuan | Lokasi | Dampak |
| :-- | :-- | :-- | :-- |
| C1 | Screenshot hero `img1.png` adalah halaman **Data Produk kosong** — "Tidak ada data", tabel nol baris | `public/img/hero/img1.png`, dipakai di `landing-page.tsx:134` | Pengunjung melihat produk yang terlihat kosong / belum jadi |
| C2 | Foto menu pada showcase POS di-hotlink ke `images.unsplash.com` (6 URL) | `landing-page.tsx:344-395` | Foto stok generik, dependensi pihak ketiga, LCP tak terkontrol, bisa mati sewaktu-waktu |
| C3 | Avatar testimoni memakai `https://i.pravatar.cc/150?u=...` (wajah acak) | `landing-page.tsx:203-256` | Testimoni terbaca palsu — sinyal AI slop paling kuat bagi pembaca Indonesia |
| C4 | Logo QRIS & BCA di-hotlink dari `upload.wikimedia.org` | `landing-page.tsx:124-125` | Melanggar hotlink policy Wikimedia, bisa blank, inkonsisten dengan 6 logo lokal lainnya |
| C5 | Logo **Kemenparekraf**, **Komdigi**, **Pesona Indonesia** di strip "Supported & Integrated With" | `landing-page.tsx:128-130` | Mengesankan endorsement pemerintah. Perlu dasar yang sah, atau harus diganti/dipindah |
| C6 | Klaim tanpa sumber: "Reduces register lines by up to 80%", "1.200+ gerai" | kartu pilar `landing-page.tsx:1287-1325`, README §4 | Klaim bulat tanpa dasar justru menurunkan trust di segmen owner F&B |
| C7 | CTA Enterprise memakai nomor WhatsApp placeholder `628123456789` | `landing-page.tsx:1706` | CTA paling bernilai di halaman ini mati total |

### 1.2 Bahasa & copywriting

- Seluruh halaman berbahasa Inggris ("Smart Cloud POS with Integrated Table QR & Cashier"), padahal target audiens adalah owner F&B Indonesia — dan `<html lang="en">` di `apps/web/src/app/layout.tsx:44`.
- `README_LANDING_PAGE.md` §3 sudah berisi naskah Bahasa Indonesia final per section (hero, 5 pilar, bento, testimoni, harga, FAQ, closing). **Naskah ini belum dipakai sama sekali di kode.** Ini pekerjaan yang sudah selesai dan tinggal dipasang.
- Metadata SEO (`layout.tsx:12-16`) sudah Bahasa Indonesia tapi generik; tidak ada OG description yang menjual, tidak ada JSON-LD.

### 1.3 Bahasa visual / "AI slop signals"

| Sinyal | Bukti | Perlakuan |
| :-- | :-- | :-- |
| Blob gradient blur di hero | 3 blob `blur-[90px]`–`blur-[150px]`, rotate, `rounded-[40%_60%_70%_30%]` — `landing-page.tsx:1156-1165` | **Hapus total.** Ganti latar netral + satu bidang warna terukur |
| Gradient text pada heading | `bg-clip-text bg-gradient-to-r from-[#0E59F9] via-[#2563EB] to-[#0941B8]` — `landing-page.tsx:1381` | Warna solid; hierarki lewat ukuran & tracking |
| Glow shadow berwarna | `shadow-[0_-50px_50px_rgba(14,89,249,0.15)]` — `landing-page.tsx:1223` | Hapus; pakai hairline `border-black/[0.06]` |
| `shadow-2xl` | `landing-page.tsx:173`, `1333` | Turunkan ke shadow terukur satu level |
| 11× `bg-gradient-*` dalam satu file | grep `bg-gradient` | Sisakan maksimal 1, sisanya solid |
| Tiga kartu fitur identik bergradasi biru | `landing-page.tsx:1287-1325` | Ganti jadi bento grid asimetris berbasis angka |
| Marquee logo + marquee testimoni + hero stack auto-rotate + divider SVG | beberapa section bergerak sendiri bersamaan | Kurangi gerakan otomatis; Apple hampir tak pernah memakai marquee |

### 1.4 Arsitektur & performa

- **Monolit:** 1.771 baris dalam satu komponen client. `InteractivePOSShowcase` sendiri 537 baris (`landing-page.tsx:339-875`), ditambah animasi marquee manual berbasis `requestAnimationFrame` (`landing-page.tsx:894-1053`). Sulit direview, sulit dibagi tugasnya, dan seluruh halaman jadi client bundle.
- `public/divider/divider.svg` berukuran **1,2 MB** untuk sekadar ornamen latar (`landing-page.tsx:1367`).
- `unoptimized={true}` pada `next/image` di hero (`landing-page.tsx:196`) dan feature image (`landing-page.tsx:1334`) — mematikan optimisasi Next.js.
- `<img>` mentah untuk logo & divider — tanpa width/height, menyumbang CLS.
- 3 font Google dimuat (Poppins, Montserrat, Quicksand) — `layout.tsx:18-36`. Poppins yang geometric-rounded adalah lawan dari karakter neo-grotesque yang diminta.
- Nav "Home" ber-`href="#"`; tidak ada `aria-label` pada section; hierarki heading lompat.

### 1.5 Yang sudah bagus dan harus dipertahankan

- Palet biru signature `#0E59F9` dan token warna di `globals.css` — konsisten, jangan diganti.
- `InteractivePOSShowcase` **konsepnya benar**: menampilkan UI produk sungguhan dalam 4 tab. Ini justru elemen paling "Apple" di halaman ini — tinggal dipoles dan diberi data yang jujur.
- `FaqEditorial`, `FooterReadyToBegin`, `FooterSuperfluidStyle` sudah terpisah dan relatif bersih (nol `bg-gradient`).
- Aset Rive status pesanan (`public/animation/status-animation/*.riv`) sudah ada dan bisa dipakai ulang di landing page.

---

## 2. Prinsip Desain — Hasil Pembacaan apple.com/iphone-duo

Struktur halaman referensi (dibaca langsung dari sumbernya):

1. **Hero minimal**: nama produk, tagline dua kata ("Hello, hello."), harga, dua link. Tanpa blob, tanpa badge, tanpa gradient.
2. **"Get the highlights."** — baris chip ringkas (Display, iOS, Titanium frame, A20 Pro chip, Battery) sebagai peta isi halaman.
3. **Section bertema, satu ide per layar**: eyebrow kecil (`Foldable design`) → headline pendek ("A new iPhone enters the fold.") → satu paragraf → visual besar.
4. **Angka sebagai hero**: `3000 nits`, `7.6″`, `50% larger`, `48MP`. Angka besar, label kecil di bawahnya. Tidak ada klaim tanpa angka.
5. **Interaktif yang menjelaskan produk, bukan menghias**: "Take a closer look" dengan switcher pose (Landscape / Portrait / Closed / Seated / Standing).
6. **Tab fitur bernama** ("Smart Take / Duo Preview / Kid Cue / Duo FaceTime") — satu judul + satu kalimat per tab.
7. **Footnote bernomor** untuk setiap klaim teknis.

**Terjemahan untuk Menuin:**

| Pola Apple | Padanan Menuin |
| :-- | :-- |
| Nama produk + tagline dua kata | `Menuin.` + "Satu sentuhan di meja." |
| Chip "Get the highlights" | Chip: QR Meja · Kasir POS · Layar Dapur · Audit Kas · Multi-Outlet (anchor ke section) |
| Pose switcher | Tab perangkat: iPhone tamu / iPad kasir / layar dapur / dashboard owner — pakai `InteractivePOSShowcase` yang sudah ada |
| `3000 nits` | `< 200 ms` sinkronisasi · `Rp 0` selisih kas · `58/80 mm` printer · `0` instalasi aplikasi |
| Footnote bernomor | Footnote untuk klaim latensi, komisi ojol 20%, PB1 10% |

**Aturan keras (anti-AI-slop) untuk seluruh kode baru:**

- Latar: `#FFFFFF` dan `#FAFAFA`/`#F5F5F7` saja. Tanpa blob, mesh gradient, atau glow berwarna.
- Border: hairline `border-black/[0.06]`. Shadow maksimal dua level yang didefinisikan sebagai token; tanpa `shadow-2xl`.
- Teks: hitam `#0A0A0A`, sekunder `#52525B`/`#71717A`, aksen `#0E59F9`. Tanpa gradient text.
- Tipografi: `tracking-[-0.03em]` s/d `-0.05em` pada headline, `clamp()` untuk skala.
- Motion: `fade + translateY(24px)`, spring halus, `prefers-reduced-motion` dihormati. Tanpa marquee, tanpa auto-rotate yang tak bisa dihentikan.
- Setiap section: maksimal **satu** gagasan dan **satu** visual utama.

---

## 3. Information Architecture Baru

| # | Section | Isi | Sumber naskah | Status komponen |
| :-- | :-- | :-- | :-- | :-- |
| 01 | Announcement bar (opsional) | Rilis + CTA trial | README §Bagian 0 | Baru |
| 02 | Nav | Logo, Produk / Solusi / Harga / FAQ, Masuk, Coba Gratis | README §Bagian 1 | Refactor dari nav sekarang |
| 03 | Hero | Eyebrow, headline 3 baris, sub, 2 CTA, jaminan | README §Bagian 2 | Tulis ulang (buang blob) |
| 04 | Highlight chips | 5 chip anchor | Baru | Baru |
| 05 | Ecosystem showcase | Tab 4 perangkat, data jujur | README §Bagian 3 | **Pakai ulang** `InteractivePOSShowcase`, dipoles |
| 06 | Key numbers | `0 detik` · `35%` · `Rp 0` · `0 aplikasi` + footnote | README §Bagian 3 | Baru |
| 07 | Trust strip | Midtrans, QRIS, bank — statis, grayscale, tanpa marquee | README §Bagian 4 | Refactor |
| 08 | Cara lama vs Menuin | Matriks 5 baris, tipografi editorial | README §Bagian 5 | Baru |
| 09 | Pilar 01–05 | Satu section penuh per pilar, kiri teks / kanan visual, bergantian | README §Bagian 6 | Baru (5 section, 1 komponen generik) |
| 10 | Bento spesifikasi | 4 kotak asimetris berbasis angka | README §Bagian 7 | Baru |
| 11 | Testimoni | 3 testimoni editorial, foto asli, tanpa marquee | README §Bagian 8 | Tulis ulang (hapus RAF marquee ±160 baris) |
| 12 | Harga | Pro Rp199.000 + Enterprise | README §Bagian 9 | Refactor kartu yang ada |
| 13 | FAQ | 6 pertanyaan | README §Bagian 10 | **Pakai ulang** `FaqEditorial`, ganti naskah |
| 14 | Grand finale CTA | Headline + 2 CTA + badge | README §Bagian 11 | **Pakai ulang** `FooterReadyToBegin` |
| 15 | Footer | Brand footer | — | **Pakai ulang** `FooterSuperfluidStyle` |

---

## 4. Arsitektur File Target

```
apps/web/src/
├─ app/
│  └─ page.tsx                      # server component, menyusun section (pola sekarang sudah benar)
├─ components/landing/
│  ├─ landing-nav.tsx               # client (mobile menu)
│  ├─ hero.tsx
│  ├─ highlight-chips.tsx
│  ├─ ecosystem-showcase.tsx        # client — hasil pecahan InteractivePOSShowcase
│  │  └─ panels/{qr-order,pos,kds,shift}.tsx
│  ├─ key-numbers.tsx
│  ├─ trust-strip.tsx
│  ├─ comparison-matrix.tsx
│  ├─ pillar-section.tsx            # 1 komponen, 5× data
│  ├─ spec-bento.tsx
│  ├─ testimonials.tsx
│  ├─ pricing.tsx
│  └─ faq.tsx                       # wrapper FaqEditorial
├─ components/landing/primitives/
│  ├─ reveal.tsx                    # pengganti FadeIn, hormati prefers-reduced-motion
│  ├─ section.tsx                   # padding + max-width + eyebrow konsisten
│  ├─ stat.tsx
│  └─ device-frame.tsx              # frame iPhone / iPad / display dapur
└─ content/landing.ts               # SELURUH copy Bahasa Indonesia terpusat, typed
```

**Aturan:** hanya komponen yang benar-benar butuh state yang `"use client"`. Target: landing page mayoritas server component.

**Design token** ditambahkan ke `apps/web/src/app/globals.css` — jangan ubah token produk yang sudah ada, tambahkan namespace `--landing-*`:

```css
--landing-ink: 0 0% 4%;             /* #0A0A0A */
--landing-ink-muted: 240 4% 46%;    /* #71717A */
--landing-surface: 0 0% 100%;
--landing-surface-alt: 240 5% 98%;  /* #FAFAFA */
--landing-accent: 221 95% 52%;      /* #0E59F9 */
```

**Font:** tambahkan satu neo-grotesque (Inter atau Geist) sebagai `--font-display` khusus landing page. Poppins tetap dipakai aplikasi agar tidak ada regresi di dashboard/kasir.

---

## 5. Kebutuhan Aset

### 5.1 Screenshot produk (wajib — ini penentu utama)

Semua screenshot harus dari **data seed yang terisi penuh**, bukan tenant kosong. Siapkan dulu satu tenant demo, misal "Kopi Ruang Teduh": ±24 produk dengan foto, 3 kasir, transaksi hari berjalan.

| ID | Aset | Spesifikasi | Cara produksi |
| :-- | :-- | :-- | :-- |
| A1 | Katalog QR tamu (mobile) | 1170×2532 → WebP | Screenshot `/store/[tenant]` pada viewport iPhone 15 Pro |
| A2 | Modal kustomisasi (oat milk, less sugar) | idem | `components/shared/customization-modal.tsx` |
| A3 | Checkout QRIS dinamis | idem | Halaman checkout — QR & nominal **wajib dummy** |
| A4 | Order stepper live | idem | `/status-demo` |
| A5 | Kasir POS (landscape) | 2732×2048 | Halaman kasir pada viewport iPad Pro |
| A6 | Struk / split bill | 1600×1200 | POS |
| A7 | Kitchen Display | 2560×1440 | KDS dengan 6–8 tiket aktif, meja #12 |
| A8 | Rekonsiliasi shift "Selisih Rp 0" | 2560×1440 | Halaman tutup shift |
| A9 | Dashboard owner multi-outlet | 2560×1440 | Dashboard dengan grafik terisi |
| A10 | Laporan HPP/COGS | 2560×1440 | Halaman laporan |

Ketentuan: light mode, jam konsisten (mis. 12.15), tanpa nama/nomor/email asli, angka rupiah masuk akal (bukan Rp 999.999.999), sidebar & notifikasi bersih. Ekspor WebP + AVIF, 1× dan 2×.

### 5.2 Foto (pengganti Unsplash hotlink)

| ID | Aset | Catatan |
| :-- | :-- | :-- |
| B1 | 8–12 foto menu (kopi, cake, pastry) | Idealnya dari mitra F&B asli + izin tertulis. Alternatif: stok berlisensi yang **di-download dan di-host sendiri**, bukan hotlink |
| B2 | 3 foto owner untuk testimoni | **Harus orang sungguhan dengan consent.** Kalau belum ada: tampilkan nama + jabatan + logo gerai saja. Jangan pakai pravatar |
| B3 | 1 foto suasana meja dengan stiker QR | Untuk Pilar 01 |

### 5.3 Logo & brand

| ID | Aset | Aksi |
| :-- | :-- | :-- |
| C1 | QRIS SVG | **Host lokal** di `public/img/brand_logo/qris.svg`, hentikan hotlink Wikimedia |
| C2 | BCA SVG | idem |
| C3 | Midtrans, Mandiri, BNI | sudah lokal — normalisasi tinggi optis & `viewBox` |
| C4 | Kemenparekraf / Komdigi / Pesona Indonesia | **Butuh keputusan bisnis** — lihat §8 R1 |
| C5 | `menuin.svg` monokrom | Untuk nav & footer; `menuin.png` (219 KB) sebaiknya tidak dipakai di nav |

### 5.4 Ilustrasi & motion

| ID | Aset | Catatan |
| :-- | :-- | :-- |
| D1 | Frame perangkat (iPhone / iPad / display dapur) | **Buat dengan CSS**, bukan PNG. Blueprint sudah ada di `README_LANDING_PAGE.md` §5.1 |
| D2 | Rive status pesanan | Sudah ada di `public/animation/status-animation/*.riv` — pakai ulang di Pilar 01 |
| D3 | Ikon spesifikasi bento | Lucide, stroke 1.5, ukuran seragam 20px. Tanpa ikon custom |
| D4 | Pengganti `divider.svg` (1,2 MB) | Hapus, atau ganti hairline CSS / SVG < 10 KB |

### 5.5 SEO & sosial

| ID | Aset | Spesifikasi |
| :-- | :-- | :-- |
| E1 | OG image | 1200×630 — screenshot produk + tagline Indonesia (periksa ulang `opengraph-image.png` yang ada) |
| E2 | Twitter image | 1200×675 |
| E3 | Favicon / apple-touch-icon | 32, 180, 512 |
| E4 | JSON-LD | `SoftwareApplication` + `FAQPage` + `Organization` |

### 5.6 Anggaran performa

| Metrik | Target |
| :-- | :-- |
| Gambar above-the-fold | ≤ 250 KB |
| Total gambar satu halaman | ≤ 1,2 MB (sekarang divider saja sudah 1,2 MB) |
| LCP (mobile, 4G) | < 2,5 s |
| CLS | < 0,05 |
| Lighthouse Perf / A11y / SEO | ≥ 90 / ≥ 95 / ≥ 95 |

---

## 6. Fase Implementasi

### Fase 0 — Fondasi (0,5 hari)
- Buat `content/landing.ts` berisi seluruh naskah dari `README_LANDING_PAGE.md` §3, typed.
- Tambahkan token `--landing-*` di `globals.css` dan font display.
- Buat primitives: `Section`, `Reveal` (dengan `prefers-reduced-motion`), `Stat`, `DeviceFrame`.
- *Belum mengubah tampilan apa pun — aman di-merge lebih dulu.*

### Fase 1 — Nav + Hero + Highlight chips (1,5 hari)
- Tulis ulang hero tanpa blob/gradient; headline 3 baris Bahasa Indonesia.
- Hero visual: satu `DeviceFrame` dengan screenshot **berisi data** (A1 atau A5), bukan stack auto-rotate 3 layer.
- Nav: anchor benar, mobile menu, state login dipertahankan.
- *Checkpoint review desain pertama di sini.*

### Fase 2 — Showcase + Angka + Trust (2 hari)
- Pecah `InteractivePOSShowcase` menjadi `ecosystem-showcase/` + 4 panel; ganti semua foto Unsplash ke aset lokal B1; naskah ke Bahasa Indonesia; tab bisa diakses via keyboard.
- `KeyNumbers` dengan footnote bernomor.
- Trust strip statis (marquee dihapus), semua logo lokal.

### Fase 3 — Pilar 01–05 + Bento + Matriks (2,5 hari)
- `PillarSection` generik, 5× data dari `content/landing.ts`, layout bergantian kiri/kanan.
- `SpecBento` 4 kotak asimetris.
- Matriks cara lama vs Menuin.

### Fase 4 — Testimoni + Harga + FAQ + Finale (2 hari)
- Hapus marquee RAF (`landing-page.tsx:894-1053`) → 3 kartu testimoni editorial.
- Harga: naskah Indonesia, nomor WhatsApp asli, daftar fitur dari README §9.
- FAQ: 6 pertanyaan Indonesia via `FaqEditorial`.
- Finale + footer: pakai komponen yang sudah ada, naskah diganti.

### Fase 5 — Performa, a11y, SEO, QA (1,5 hari)
- Hapus `unoptimized`, konversi WebP/AVIF, `sizes` benar, `priority` hanya pada elemen LCP.
- Hapus/ganti `divider.svg`.
- Landmark & hierarki heading, kontras AA, focus ring, keyboard nav pada tab showcase.
- Metadata + JSON-LD + OG image.
- Uji di 360 / 390 / 768 / 1024 / 1440 / 1920, Safari iOS + Chrome Android.

---

## 7. Definition of Done

**Checklist anti-AI-slop (harus nol):**
- [ ] 0 background blob / mesh gradient
- [ ] 0 gradient text
- [ ] 0 `shadow-2xl` / drop-shadow tebal
- [ ] 0 gambar pihak ketiga yang di-hotlink (Unsplash, pravatar, Wikimedia)
- [ ] 0 screenshot dengan empty state
- [ ] 0 nomor/email/link placeholder
- [ ] 0 klaim angka tanpa footnote atau dasar

**Checklist positif:**
- [ ] Seluruh copy Bahasa Indonesia, `lang="id"` untuk route landing
- [ ] Setiap section punya satu gagasan dan satu visual utama
- [ ] Setiap angka yang ditampilkan bisa dijelaskan asalnya
- [ ] Landing page mayoritas server component; monolit `landing-page.tsx` dihapus
- [ ] Target performa §5.6 tercapai
- [ ] `npm run lint` dan `npm run build` bersih

---

## 8. Risiko & Keputusan yang Perlu Diambil

| # | Isu | Perlu keputusan |
| :-- | :-- | :-- |
| R1 | Logo **Kemenparekraf, Komdigi, Pesona Indonesia** ditampilkan sebagai "Supported & Integrated With" | Ada surat/program resmi yang mendasari? Kalau tidak, logo harus dilepas — risiko hukum dan kredibilitas lebih besar daripada manfaatnya |
| R2 | **Testimoni** saat ini fiktif (nama + avatar generated) | Butuh 3 mitra F&B asli yang bersedia dikutip + foto. Kalau belum ada: ganti jadi studi kasus tanpa nama orang, atau tunda section-nya |
| R3 | **Angka klaim** ("35% table turnover", "< 200 ms", "80% antrean berkurang") | Perlu sumber: data internal, pilot customer, atau benchmark. Yang tak terverifikasi dibuang, bukan diperhalus |
| R4 | Screenshot berpotensi memuat data tenant nyata | Wajib pakai tenant demo dengan data fiktif tapi realistis |
| R5 | Nomor WhatsApp & email sales | Perlu nomor asli sebelum rilis |
| R6 | Bahasa: full Indonesia atau bilingual | Rekomendasi: full Indonesia dulu; i18n menyusul |

---

## 9. Langkah Berikutnya

1. Review dokumen ini, putuskan R1–R6.
2. Jalankan Fase 0 (fondasi + `content/landing.ts`) — tidak mengubah tampilan, aman.
3. Paralel: siapkan tenant demo + ambil 10 screenshot (§5.1).
4. Fase 1 → checkpoint review desain sebelum lanjut ke Fase 2–5.

---

## 10. Catatan Aset (pembaruan 2026-09-20)

Empat aset dari folder Drive tim sudah masuk repo di `apps/web/public/img/landing/`
(dikompres ke WebP, total 372 KB):

| File | Asal | Dipakai di |
| :-- | :-- | :-- |
| `hero-kasir.webp` (81 KB) | `menuin-use.jpeg` | Visual hero |
| `pos-ipad.webp` (123 KB) | `group3.png` | Pilar 02 — Kasir Cloud POS |
| `katalog-iphone.webp` (47 KB) | `group4 (2).png` | Pilar 01 — QR Self-Order |
| `dashboard-macbook.webp` (108 KB) | `group5.png` | Pilar 05 — Multi-Outlet |

Yang perlu diperhatikan pada aset ini:

1. **Empat file `ChatGPT Image …` di folder itu sengaja tidak dipakai.** Halaman ini
   justru sedang dibersihkan dari kesan AI-generated; memakai mockup tangan hasil
   generate berisiko merusak kredibilitas yang sedang dibangun.
2. **`dashboard-macbook.webp` memuat URL `kopijotos.localhost:3000`** di breadcrumb.
   Terbaca kalau gambar ditampilkan besar. Sebaiknya diambil ulang dengan domain
   yang pantas.
3. **`pos-ipad.webp` dan `katalog-iphone.webp` memuat tombol gear biru melayang**
   (FAB debug) yang menutupi sebagian kartu produk. Perlu di-retake tanpa tombol itu.
4. **`hero-kasir.webp` perlu dipastikan status hak pakainya** — apakah foto asli
   milik tim atau hasil komposit. Kalau hasil generate, sebaiknya diganti foto nyata.

Kebutuhan aset di §5.1 yang belum tersedia (KDS, tutup shift, laporan HPP) sementara
digantikan panel yang dibangun dari markup di `landing-page.tsx`, bukan screenshot.
