# Implementation Plan: Menuin Notification System

**Product:** Menuin SaaS POS & Retail Ecosystem  
**Module:** Notification System & Management Center  
**Target Platform:** Web Dashboard (`apps/web`)  
**Status:** In Progress (Fase 1–5 Implemented & Verified)  
**Document Companion:** [PRD: Menuin Notification System](file:///home/zidaneelfasya/D/Github/menuin/docs/notifications/PRD.md) | [Decision Log](file:///home/zidaneelfasya/D/Github/menuin/docs/notifications/decision-log.md)

---

## 1. Arsitektur Teknis & Komponen

Sistem notifikasi Menuin terdiri dari 5 lapisan arsitektur:

```
┌─────────────────────────────────────────────────────────────┐
│                    Lapisan Antarmuka (UI)                   │
│  - Top Bar NotificationPopover (header.tsx)                 │
│  - Halaman Penuh (/outlet/[outletKey]/notifications)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Lapisan Realtime Klien                      │
│  - useNotificationsRealtime (Supabase WebSocket Channel)     │
│  - Optimistic State Updates & Unread Counter Store          │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                 Lapisan Server Actions                       │
│  - getNotifications (Filter kategori, waktu, pagination)     │
│  - markNotificationAsRead / markAllNotificationsAsRead      │
│  - deleteNotification                                       │
│  - createNotification (Internal Event Dispatcher)           │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Lapisan Basis Data                       │
│  - Tabel `notifications` (PostgreSQL / Drizzle ORM)         │
│  - Row-Level Security (RLS) & Multi-Tenant Isolation        │
│  - Publikasi Supabase Realtime (supabase_realtime)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Rencana Tahapan Eksekusi (Phased Roadmap)

---

### Fase 1: Skema Basis Data & Migrasi Drizzle

#### 1.1. Penambahan Definisi Tabel di [`apps/web/src/lib/db/schema.ts`](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/db/schema.ts)
Mendefinisikan tipe enum dan tabel `notifications` dengan dukungan relasi tenant & akun pengguna:

```ts
export const notificationCategoryEnum = pgEnum('notification_category', [
  'VERIFICATION',
  'BILLING',
  'PROMOTION',
  'ACCOUNT_TEAM',
]);

export const notificationSeverityEnum = pgEnum('notification_severity', [
  'INFO',
  'WARNING',
  'ACTION_REQUIRED',
  'SUCCESS',
]);

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, { onDelete: 'cascade' })
    .notNull(),
  recipientAccountId: uuid('recipient_account_id')
    .references(() => accounts.id, { onDelete: 'cascade' }), // Null berarti dapat dilihat oleh seluruh pengelola tenant yang berwenang
  category: notificationCategoryEnum('category').notNull(),
  severity: notificationSeverityEnum('severity').default('INFO').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  actionUrl: text('action_url'),
  actionLabel: text('action_label'),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('notifications_tenant_idx').on(table.tenantId),
  index('notifications_recipient_idx').on(table.recipientAccountId),
  index('notifications_created_idx').on(table.createdAt),
  index('notifications_tenant_unread_idx').on(table.tenantId, table.isRead),
]);
```

#### 1.2. Eksekusi Migrasi SQL & Konfigurasi Supabase Realtime
- Membuat file migrasi database atau menerapkan skrip DDL SQL langsung ke basis data Postgres.
- Menjalankan perintah aktivasi replikasi realtime:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  ```

---

### Fase 2: Server Actions & Query Layer

Membuat file baru: [`apps/web/src/lib/actions/notifications.ts`](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/notifications.ts).

#### 2.1. Tipe & Antarmuka Data
```ts
export type NotificationItem = {
  id: string;
  tenantId: string;
  category: 'VERIFICATION' | 'BILLING' | 'PROMOTION' | 'ACCOUNT_TEAM';
  severity: 'INFO' | 'WARNING' | 'ACTION_REQUIRED' | 'SUCCESS';
  title: string;
  message: string;
  actionUrl: string | null;
  actionLabel: string | null;
  isRead: boolean;
  readAt: Date | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
};

export type NotificationFilterParams = {
  category?: 'ALL' | 'VERIFICATION' | 'BILLING' | 'PROMOTION' | 'ACCOUNT_TEAM';
  timeRange?: 'all' | 'today' | '7d' | '30d';
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
};
```

#### 2.2. Fungsi-Fungsi Server Action
1. **`getNotifications(params: NotificationFilterParams)`:**
   - Memvalidasi sesi pengguna aktif (`getCurrentContext`).
   - Menyaring data berdasarkan tenant, kategori, dan rentang tanggal pembuatan (`createdAt`).
   - Mengembalikan daftar notifikasi beserta total item belum dibaca (`unreadCount`).
2. **`markNotificationAsRead(notificationId: string)`:**
   - Mengubah status `isRead` menjadi `true` dan mengisi `readAt = new Date()`.
3. **`markAllNotificationsAsRead(category?: string)`:**
   - Menandai semua notifikasi milik tenant (atau kategori tertentu) menjadi dibaca dalam satu operasi atomic.
4. **`deleteNotification(notificationId: string)`:**
   - Menghapus item notifikasi berdasarkan ID.
5. **`createNotification(payload: Omit<NotificationItem, 'id' | 'isRead' | 'readAt' | 'createdAt'>)`:**
   - Fungsi internal yang dapat dipanggil oleh event handler di seluruh sistem untuk menyisipkan notifikasi baru ke database.

---

### Fase 3: Komponen Floating Popover pada Header

#### 3.1. File Baru: `apps/web/src/components/layout/notification-popover.tsx`
- Menggunakan `@radix-ui/react-popover` untuk memastikan aksesibilitas keyboard dan penutupan saat klik di luar area (*click outside*).
- **Styling:**
  - Latar belakang putih bersih (`bg-white`).
  - Sudut membulat modern (`rounded-2xl`).
  - Tanpa border garis kaku (`border-none`).
  - Bayangan multi-stop halus: `shadow-neu-raised-md`.
- **Fitur Interaktif:**
  - Menampilkan 5 item notifikasi terbaru.
  - Indikator belum dibaca: Lingkaran biru minimalis di samping judul notifikasi.
  - Tombol aksi cepat: "Tandai semua dibaca" dengan pembaruan UI optimistik.
  - Bagian bawah memuat tautan: *"Lihat semua notifikasi →"* yang mengarahkan ke halaman penuh `/outlet/[outletKey]/notifications`.

#### 3.2. Integrasi ke [`apps/web/src/components/layout/header.tsx`](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/components/layout/header.tsx)
- Menggantikan tombol lonceng statis dengan komponen `<NotificationPopover />`.
- Menampilkan titik merah indikator (*red dot indicator*) pada tombol lonceng saat terdapat notifikasi belum dibaca.

---

### Fase 4: Halaman Dedikasi Notifikasi Penuh

#### 4.1. File Halaman:
1. Server Component: [`apps/web/src/app/outlet/[outletKey]/notifications/page.tsx`](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/outlet/[outletKey]/notifications/page.tsx)
   - Mengambil data awal notifikasi secara *server-side* untuk performa optimal dan SEO/initial render cepat.
2. Client Component: [`apps/web/src/app/outlet/[outletKey]/notifications/notifications-client.tsx`](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/outlet/[outletKey]/notifications/notifications-client.tsx)
   - Mengelola interaksi filter dan transisi tampilan.

#### 4.2. Fitur Halaman Lengkap (Konsep Log Notifikasi ala DOKU):
1. **Header & Subjudul Ringkas:**
   - Judul: **Log Notifikasi**
   - Subjudul: *Lihat semua notifikasi Anda dan update terbaru*
   - Indikator jumlah belum dibaca: *X belum dibaca*
2. **Filter Rentang Tanggal Standar Menuin (Date Range Picker):**
   - Mengadopsi komponen dari Report & Analytics: Kapsul tombol raised dengan Popover Kalender `react-day-picker` (`mode="range"`).
   - Preset Cepat: *Semua*, *Hari Ini*, *7 Hari*, *Bulan Ini*, *Bulan Lalu*.
   - Kalender interaktif dan tombol *Batal* / *Terapkan*.
3. **Toolbar Aksi Cepat:**
   - Tombol *Tandai semua sudah dibaca*.
   - Tombol toggle *Belum dibaca saja*.
   - Tombol *Bersihkan yang dibaca*.
4. **Kartu Baris Log Notifikasi (Struktur DOKU & Standar Neumorphism):**
   - Baris metadata atas: `[Label Konteks] • [Tanggal & Waktu WIB]` (e.g. `Verifikasi Bisnis • 25 Oktober 2026, 14:30 WIB`).
   - Baris utama: Judul tebal di kiri dan tautan aksi langsung `Lihat Detail ↗` di sisi kanan.
   - Isi pesan deskripsi ringkas.
   - Status belum dibaca berlatar belakang lembut `bg-blue-50/30` dengan badge *Baru*, sedangkan status sudah dibaca berlatar putih bersih `bg-white`.
5. **Status Kosong (Empty State):**
   - Tampilan bersih saat tidak ada catatan notifikasi pada rentang tanggal yang dipilih.

---

### Fase 5: Integrasi Realtime WebSocket (Supabase)

1. **Penyelarasan Saluran (Channel Alignment):**
   - Menggunakan hook reaktif `useNotificationsRealtime(tenantId)`.
   - Menggunakan channel tunggal `tenant-notifications-${tenantId}`.
   - Mendengarkan event `INSERT` dan `UPDATE` pada tabel `notifications`.
2. **Perilaku Klien:**
   - Saat ada notifikasi baru masuk, badge lonceng di header menyala secara instan tanpa perlu memuat ulang (*refresh*) halaman.
   - Jika pengguna sedang membuka halaman notifikasi atau popover, item baru langsung disisipkan di posisi paling atas secara halus.

---

### Fase 6: Integrasi Pemicu Event Nyata (Business Domain Triggers)

Menghubungkan pemanggilan `createNotification` ke dalam alur transaksi dan bisnis Menuin yang sudah berjalan:

1. **Alur Verifikasi Bisnis ([`apps/web/src/lib/actions/merchant-verification.ts`](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/merchant-verification.ts)):**
   - Pemicu: Admin menyetujui / menolak verifikasi merchant atau rekening bank settlement.
   - Kategori: `VERIFICATION`.
2. **Alur Langganan & Tagihan ([`apps/web/src/lib/actions/billing.ts`](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/billing.ts)):**
   - Pemicu: Pembayaran langganan berhasil diproses oleh webhook, atau pengecekan cron harian menemukan invoice jatuh tempo (H-7 / H-3).
   - Kategori: `BILLING`.
3. **Alur Promosi ([`apps/web/src/lib/actions/promotions.ts`](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/promotions.ts)):**
   - Pemicu: Kuota kupon promo telah mencapai batas 90% atau habis total setelah transaksi pelanggan selesai.
   - Kategori: `PROMOTION`.
4. **Alur Tutup Shift Kasir ([`apps/web/src/lib/actions/shifts.ts`](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/shifts.ts)):**
   - Pemicu: Kasir menutup shift dan sistem mendeteksi selisih fisik uang laci (*cash discrepancy*).
   - Kategori: `ACCOUNT_TEAM`.

---

## 3. Daftar File yang Dibuat & Dimodifikasi

| No | Tipe Aksi | Jalur File (File Path) | Deskripsi Perubahan | Status |
| :---: | :---: | :--- | :--- | :---: |
| 1 | Modifikasi | `apps/web/src/lib/db/schema.ts` | Menambahkan tabel `notifications` dan enum kategori & severity | Selesai |
| 2 | Buat Baru | `apps/web/src/lib/actions/notifications.ts` | Server actions untuk query, mutasi, filter, dan helper pemicu | Selesai |
| 3 | Buat Baru | `apps/web/src/components/layout/notification-popover.tsx` | Komponen floating popover lonceng notifikasi di top bar | Selesai |
| 4 | Modifikasi | `apps/web/src/components/layout/header.tsx` | Mengintegrasikan NotificationPopover menggantikan tombol statis | Selesai |
| 5 | Buat Baru | `apps/web/src/app/outlet/[outletKey]/notifications/page.tsx` | Halaman server component pusat notifikasi | Selesai |
| 6 | Buat Baru | `apps/web/src/app/outlet/[outletKey]/notifications/notifications-client.tsx` | Client component interaktif dengan filter kategori & waktu | Selesai |
| 7 | Modifikasi | Modul pemicu (Verification, Billing, Promo, Shift) | Menghubungkan pemanggilan `createNotification` pada status perubahan | Siap |

---

## 4. Panduan Verifikasi & Quality Assurance (QA)

Sebelum fitur diserahkan ke pengguna, pengujian berikut wajib dilakukan:
1. **Pemeriksaan Kompilasi TypeScript:**
   - Jalankan `npx tsc --noEmit` di `apps/web` (wajib 0 error).
2. **Uji Fungsionalitas Interaksi:**
   - Klik lonceng di header: Popover terbuka mulus tanpa merusak tata letak.
   - Klik "Tandai semua dibaca" di popover: Badge unread langsung hilang secara instan.
   - Klik "Lihat semua notifikasi": Navigasi mulus ke `/outlet/[outletKey]/notifications`.
   - Uji filter kategori: Memastikan hanya notifikasi kategori terpilih yang muncul.
   - Uji filter waktu: Memastikan penyaringan 'Hari Ini', '7 Hari', dan '30 Hari' akurat.
3. **Uji Kepatuhan Desain & Tipografi:**
   - Memastikan tidak ada teks uppercase yang tidak pada tempatnya.
   - Memastikan tidak ada spasi huruf artifisial (`tracking-wider`/`tracking-widest`).
   - Memastikan kartu berlatar putih murni (`#ffffff`), tanpa garis border kaku, dan bayangan bernuansa slate-periwinkle lembut.
