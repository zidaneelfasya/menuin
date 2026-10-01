# Plan Implementasi DOKU — Status & Langkah Lanjutan

Branch: `claude/peaceful-davinci-927vqi`
Acuan teknis lengkap: [`doku_payment_gateway_migration_source_of_truth.md`](./doku_payment_gateway_migration_source_of_truth.md)

## Keputusan yang sudah diambil

- **Model akun:** Platform + Sub Account (Model A). Kredensial DOKU hanya ada di env server. Tiap outlet hanya menyimpan `doku_sub_account_id`.
- **Lingkungan:** semua fase dikerjakan dan dites di **sandbox**. Production di bagian paling akhir.
- **Fase 0** (hotfix Midtrans) **dilewati**, karena aplikasi belum rilis dan Midtrans langsung diganti.
- **Produk:** DOKU Checkout untuk storefront dan langganan. SNAP QRIS untuk POS (Fase 3).

---

## Fase 1: Checkout storefront ✅ SELESAI (commit `3dcdd69`)

- `lib/payments/doku/*`: config, signature, client, checkout, status, sub account, notification
- `lib/payments/payment.service.ts`, `state-machine.ts`, `utils.ts`
- `/api/webhook/doku` dan `/api/cron/payment-reconcile`
- Tabel `payment_attempts` dan `payment_webhook_events` (`drizzle/doku_payments.sql`)
- Storefront memakai redirect ke DOKU. Pengaturan memakai aktivasi Sub Account. Cek status kasir (web dan mobile) sudah memakai DOKU.
- Pengujian: 59 unit test dan 11 integration test (Postgres lokal) lolos, `tsc` dan `next build` bersih.
- **Belum diuji live ke DOKU sandbox**, karena network environment memblokir `api-sandbox.doku.com`.

---

## Fase 2: Langganan Menuin via DOKU 🟡 KODE DITULIS, BELUM DIUJI

### Sudah dikerjakan (ikut di commit WIP ini, `tsc` lolos)
- [x] Katalog harga di server: `lib/billing/plans.ts` (`starter` → BASIC Rp99.000, `business` → PRO Rp199.000, 30 hari) beserta `computeSubscriptionPeriod` (sisa hari dibawa ke periode berikutnya).
- [x] Tabel `subscription_invoices`. `payment_attempts` digeneralisasi: kolom `purpose` (`ORDER`/`SUBSCRIPTION`), `transaction_id` nullable, kolom `subscription_invoice_id`, dan CHECK constraint target. Migrasinya di `drizzle/doku_subscriptions.sql`, dijalankan oleh `scripts/migrate-doku-payments.mjs` setelah file Fase 1.
- [x] `payment.service.ts` di-refactor: satu mesin `startPayment` untuk dua target.
  - `startOrderPayment` mengarahkan dana ke Sub Account outlet.
  - `startSubscriptionPayment` mengarahkan dana ke akun platform, prefix invoice `SUB-`, batas bayar 60 menit.
  - Saat PAID, `applySubscriptionPaid` mengunci langganan aktif, menutup langganan lama (EXPIRED), membuat langganan ACTIVE baru, mengisi invoice PAID, dan memperbarui `tenants.subscription_tier`.
  - Fungsi baru `syncSubscriptionInvoicePayment` untuk halaman status.
- [x] `decideSubscriptionOnPaid` di `state-machine.ts`: bayar ganda tidak mengaktifkan dua kali. Invoice yang sudah dibatalkan tetap diaktifkan bila uangnya masuk, dengan flag `LATE_PAYMENT`.
- [x] Server action `lib/actions/billing.ts`:
  - `startSubscriptionCheckout(planCode)`: hanya OWNER, harga dari server, row tenant di-lock, invoice PENDING dipakai ulang, ganti paket membatalkan invoice lama.
  - `getSubscriptionCheckoutStatus(invoiceId)`: hanya untuk tenant sendiri.
- [x] Halaman `/checkout` ditulis ulang:
  - server component, wajib login, tanpa `?email=`
  - client: `app/checkout/checkout-client.tsx`
  - halaman baru `/checkout/status?invoice=…` dengan polling
- [x] `components/payment-gate.tsx` membaca dari `BILLING_PLANS`.
- [x] `getEntitlements` sekarang mengecek `currentPeriodEnd`. Langganan yang lewat periodenya dikunci. Nilai `null` berarti tanpa batas (pemberian admin).
- [x] `getAppOrigin` dipindah ke `lib/utils/app-origin.ts`, dipakai bersama storefront dan billing.
- [x] **Celah keamanan yang dihapus:**
  - `markTenantAsPaidAction(email)`: server action publik yang mengaktifkan PRO tanpa bayar.
  - `getTenantDetailsByEmail(email)`: membocorkan data tenant berdasarkan email.
  - `createOrUpdateSubscription`: OWNER/MANAGER bisa memberi diri sendiri langganan gratis.
  - `/api/checkout`, `/api/webhook/midtrans`, `/api/webhook/midtrans-subscription`.
- [x] Teks Midtrans di landing (security section, FAQ), label laporan, dan payment gate diganti ke DOKU. Logo Midtrans dihapus dari daftar mitra (ada TODO untuk menambahkan logo DOKU).

### Belum dikerjakan (lanjutkan dari sini)
1. **Uji migrasi Fase 2 ke Postgres lokal**
   - Push skema, drop tabel pembayaran, jalankan `node scripts/migrate-doku-payments.mjs` **dua kali**.
   - Pastikan `drizzle-kit push --verbose` tidak menunjukkan drift untuk `payment_attempts` dan `subscription_invoices`. Drift bawaan pada composite unique/FK tabel lama memang selalu muncul, abaikan.
2. **Unit test baru:**
   - `lib/billing/plans.test.ts`: `getBillingPlan`, `computeSubscriptionPeriod` (tanpa langganan, dengan sisa hari, dengan periode yang sudah lewat).
   - `state-machine.test.ts`: `decideSubscriptionOnPaid` untuk PENDING, PAID, CANCELED, dan kasus terlambat.
   - `getEntitlements`: periode lewat dikunci, `null` tidak dikunci. Perlu mock `@/lib/supabase/server`, `next/headers`, dan `@/lib/db`.
3. **Integration test langganan** (lanjutan `payment.service.integration.test.ts`, DOKU di-mock):
   - [ ] Webhook SUCCESS: invoice PAID, langganan ACTIVE dengan periode 30 hari, `tenants.subscription_tier` ikut berubah.
   - [ ] Perpanjangan saat masih aktif: sisa hari ikut terbawa, langganan lama berubah EXPIRED, hanya ada satu ACTIVE.
   - [ ] Notifikasi ganda atau webhook yang bersamaan dengan cek status: hanya satu langganan yang dibuat.
   - [ ] Invoice dibatalkan (ganti paket) lalu tetap dibayar: tetap aktif dengan flag `LATE_PAYMENT`.
   - [ ] Dua invoice sama-sama dibayar: yang kedua diberi flag `ALREADY_PAID_OTHER_METHOD` dan tidak mengaktifkan ulang.
   - [ ] Amount tidak cocok: tidak aktif.
   - [ ] Update fixture test Fase 1 kalau ada yang rusak karena kolom `purpose`.
4. **Jalankan semua pengecekan:** `npm test --workspace=web` (ditambah `TEST_DATABASE_URL=…`), `npx tsc --noEmit`, `npx eslint` pada file yang berubah, dan `npx next build`. Hapus `.next` dulu kalau ada error tipe dari route yang sudah dihapus.
5. **Update dokumen** `doku_payment_gateway_migration_source_of_truth.md`: alur langganan, tabel `subscription_invoices`, dan tandai Fase 2 ✅.
6. **Keputusan produk yang masih terbuka:** harga billing (Starter 99rb / Business 199rb) **berbeda** dari harga di landing (`components/landing/pricing-data.ts`: Kasir 49.900, Kasir Plus 74.900, Lengkap 149.000, ditandai "belum final"). Begitu harga final, cukup ubah `lib/billing/plans.ts`. Kalau jumlah paket berubah, mapping ke tier BASIC/PRO di `getEntitlements` juga perlu disesuaikan.

---

## Fase 3: POS QRIS dinamis (SNAP) ⏳
- Generate RSA key pair sendiri, lalu upload public key ke DOKU. Private key disimpan di env (`DOKU_PRIVATE_KEY`). Simpan juga `DOKU_PUBLIC_KEY` milik DOKU.
  - Catatan: dua public key yang dikirim di chat **identik**, jadi salah satunya keliru.
- Token B2B: `X-SIGNATURE = SHA256withRSA(clientId|timestamp)`, di-cache sampai expired dikurangi 60 detik.
- `POST /snap-adapter/b2b/v1.0/qr/qr-mpm-generate` menghasilkan `qrContent` yang ditampilkan di `features/pos/components/payment-modal.tsx` (opsi `qris_dynamic`).
- Notifikasi SNAP diverifikasi dengan public key DOKU (asymmetric). Fallback-nya `qr-mpm-query`.
- Pakai ulang `payment_attempts` dengan `product = 'SNAP_QRIS'` dan state machine yang sama.

## Fase 4: Rekonsiliasi & operasional ⏳
- Settlement report harian: isi `fee_amount`/`net_amount` riil (`fee_source = SETTLEMENT`).
- Dashboard admin untuk attempt dengan `requires_review = true` (bayar ganda, telat, amount mismatch).
- Alur refund, manual dulu.

## Go-live ⏳
- Lengkapi legal dan kontrak platform dengan DOKU. Buat kredensial production **baru**, karena key sandbox sudah pernah ditempel di chat.
- `DOKU_ENV=production` membuat Sub Account otomatis wajib. Daftarkan Notification URL production. Buat Sub Account production per outlet.

---

## Yang perlu disiapkan pemilik project
- [ ] Env deployment: `DOKU_ENV`, `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `APP_BASE_URL`, `CRON_SECRET`.
- [ ] Jalankan migrasi: `DATABASE_URL=… npm run db:migrate:doku --workspace=web`.
- [ ] Dashboard DOKU sandbox: Notification URL `https://<domain>/api/webhook/doku`. Aktifkan Checkout dan Sub Account.
- [ ] Scheduler cron 5 menit untuk `GET /api/cron/payment-reconcile` dengan header `Authorization: Bearer <CRON_SECRET>`.
- [ ] Supaya Claude bisa ikut tes live: tambahkan `api-sandbox.doku.com` dan `developers.doku.com` ke network allowlist environment, lalu isi env DOKU di pengaturan environment.
- [ ] Putuskan harga final paket langganan (lihat Fase 2 poin 6).
