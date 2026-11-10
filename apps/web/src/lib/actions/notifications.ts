'use server';

import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { getCurrentUser } from './auth';

export type NotificationCategory = 'VERIFICATION' | 'BILLING' | 'PROMOTION' | 'ACCOUNT_TEAM';
export type NotificationSeverity = 'INFO' | 'WARNING' | 'ACTION_REQUIRED' | 'SUCCESS';

export type NotificationItem = {
  id: string;
  tenantId: string;
  recipientAccountId: string | null;
  category: NotificationCategory;
  severity: NotificationSeverity;
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
  startDate?: string | Date;
  endDate?: string | Date;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
  // Backward-compatibility
  category?: 'ALL' | NotificationCategory;
  timeRange?: 'all' | 'today' | '7d' | '30d';
};

export type GetNotificationsResult = {
  success: boolean;
  data: NotificationItem[];
  unreadCount: number;
  error?: string;
};

/**
 * Mengambil daftar log notifikasi untuk tenant aktif dengan dukungan filter rentang tanggal
 */
export async function getNotifications(params?: NotificationFilterParams): Promise<GetNotificationsResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, data: [], unreadCount: 0, error: 'Sesi pengguna tidak valid' };
    }

    const tenantId = user.tenantId;
    const conditions = [eq(notifications.tenantId, tenantId)];

    // Filter Kategori (opsional untuk backward compatibility)
    if (params?.category && params.category !== 'ALL') {
      conditions.push(eq(notifications.category, params.category));
    }

    // Filter Belum Dibaca Saja
    if (params?.unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    // Filter Rentang Tanggal Spesifik (Date Range Picker)
    if (params?.startDate) {
      const start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);
      conditions.push(gte(notifications.createdAt, start));
    }

    if (params?.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(notifications.createdAt, end));
    }

    // Fallback Filter Waktu Cepat (jika startDate/endDate tidak diberikan)
    if (!params?.startDate && !params?.endDate && params?.timeRange && params.timeRange !== 'all') {
      const now = new Date();
      if (params.timeRange === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        conditions.push(gte(notifications.createdAt, startOfToday));
      } else if (params.timeRange === '7d') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        conditions.push(gte(notifications.createdAt, sevenDaysAgo));
      } else if (params.timeRange === '30d') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        conditions.push(gte(notifications.createdAt, thirtyDaysAgo));
      }
    }

    const limit = params?.limit ?? 50;
    const offset = params?.offset ?? 0;

    // Ambil daftar notifikasi
    const data = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    // Ambil total notifikasi belum dibaca untuk tenant ini
    const [unreadResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(notifications)
      .where(and(eq(notifications.tenantId, tenantId), eq(notifications.isRead, false)));

    const unreadCount = unreadResult?.count ?? 0;

    // Jika belum ada data sama sekali untuk tenant ini, inisialisasi data kontekstual Menuin
    if (data.length === 0 && (!params || (!params.category && !params.timeRange))) {
      const seeded = await seedInitialNotifications(tenantId, user.outletKey || 'outlet');
      if (seeded.length > 0) {
        return {
          success: true,
          data: seeded,
          unreadCount: seeded.filter(n => !n.isRead).length,
        };
      }
    }

    return {
      success: true,
      data: data as NotificationItem[],
      unreadCount,
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, data: [], unreadCount: 0, error: 'Gagal memuat daftar notifikasi' };
  }
}

/**
 * Tandai satu notifikasi sebagai dibaca
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Sesi pengguna tidak valid' };
    }

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.id, notificationId), eq(notifications.tenantId, user.tenantId)));

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Gagal memperbarui status notifikasi' };
  }
}

/**
 * Tandai seluruh notifikasi yang belum dibaca milik tenant sebagai dibaca
 */
export async function markAllNotificationsAsRead(category?: NotificationCategory): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Sesi pengguna tidak valid' };
    }

    const conditions = [
      eq(notifications.tenantId, user.tenantId),
      eq(notifications.isRead, false),
    ];

    if (category) {
      conditions.push(eq(notifications.category, category));
    }

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(...conditions));

    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: 'Gagal menandai seluruh notifikasi' };
  }
}

/**
 * Hapus satu notifikasi dari riwayat
 */
export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Sesi pengguna tidak valid' };
    }

    await db
      .delete(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.tenantId, user.tenantId)));

    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: 'Gagal menghapus notifikasi' };
  }
}

/**
 * Hapus seluruh notifikasi yang sudah dibaca milik tenant
 */
export async function clearReadNotifications(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Sesi pengguna tidak valid' };
    }

    await db
      .delete(notifications)
      .where(and(eq(notifications.tenantId, user.tenantId), eq(notifications.isRead, true)));

    return { success: true };
  } catch (error) {
    console.error('Error clearing read notifications:', error);
    return { success: false, error: 'Gagal membersihkan riwayat notifikasi' };
  }
}

/**
 * Helper internal untuk membuat notifikasi baru dari event manapun di server
 */
export async function createNotification(payload: {
  tenantId: string;
  recipientAccountId?: string | null;
  category: NotificationCategory;
  severity?: NotificationSeverity;
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const [inserted] = await db
      .insert(notifications)
      .values({
        tenantId: payload.tenantId,
        recipientAccountId: payload.recipientAccountId || null,
        category: payload.category,
        severity: payload.severity || 'INFO',
        title: payload.title,
        message: payload.message,
        actionUrl: payload.actionUrl || null,
        actionLabel: payload.actionLabel || null,
        metadata: payload.metadata || null,
      })
      .returning({ id: notifications.id });

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: 'Gagal membuat notifikasi' };
  }
}

/**
 * Mengisi log notifikasi awal bernuansa bisnis Menuin (Verifikasi, Langganan, dan Outlet)
 */
async function seedInitialNotifications(tenantId: string, outletKey: string): Promise<NotificationItem[]> {
  try {
    const initialItems = [
      {
        tenantId,
        category: 'VERIFICATION' as NotificationCategory,
        severity: 'SUCCESS' as NotificationSeverity,
        title: 'Status verifikasi data terbaru',
        message: 'Data profil bisnis Anda telah diverifikasi dan disetujui oleh tim. Layanan pembayaran QRIS dan transaksi online kini telah aktif.',
        actionUrl: `/outlet/${outletKey}/verification`,
        actionLabel: 'Lihat Detail Approval',
        isRead: false,
      },
      {
        tenantId,
        category: 'VERIFICATION' as NotificationCategory,
        severity: 'ACTION_REQUIRED' as NotificationSeverity,
        title: 'Data registrasi Anda belum dapat diverifikasi',
        message: 'Informasi data bisnis belum lolos proses verifikasi. Mohon periksa kembali dokumen yang diunggah.',
        actionUrl: `/outlet/${outletKey}/verification`,
        actionLabel: 'Pelajari Selengkapnya',
        isRead: false,
      },
      {
        tenantId,
        category: 'BILLING' as NotificationCategory,
        severity: 'SUCCESS' as NotificationSeverity,
        title: 'Pembayaran langganan berhasil',
        message: 'Pembayaran langganan paket Pro toko Anda telah berhasil diverifikasi. Masa aktif paket toko Anda berlaku hingga 30 hari ke depan.',
        actionUrl: `/outlet/${outletKey}/settings`,
        actionLabel: 'Lihat Langganan',
        isRead: true,
        readAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        tenantId,
        category: 'ACCOUNT_TEAM' as NotificationCategory,
        severity: 'INFO' as NotificationSeverity,
        title: 'Outlet berhasil dibuat',
        message: 'Outlet baru berhasil ditambahkan ke akun toko Anda dan siap digunakan untuk transaksi operasional kasir serta katalog pesanan.',
        actionUrl: `/outlet/${outletKey}/settings`,
        actionLabel: 'Kelola Outlet',
        isRead: true,
        readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        tenantId,
        category: 'BILLING' as NotificationCategory,
        severity: 'WARNING' as NotificationSeverity,
        title: 'Pengingat perpanjangan langganan',
        message: 'Masa aktif paket langganan toko Anda akan berakhir dalam 7 hari. Pastikan metode pembayaran utama Anda siap untuk perpanjangan otomatis.',
        actionUrl: `/outlet/${outletKey}/settings`,
        actionLabel: 'Kelola Tagihan',
        isRead: true,
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        tenantId,
        category: 'VERIFICATION' as NotificationCategory,
        severity: 'SUCCESS' as NotificationSeverity,
        title: 'Perubahan data telah disetujui',
        message: 'Pembaruan informasi profil bisnis dan rekening operasional toko Anda telah berhasil disetujui oleh tim verifikator.',
        actionUrl: `/outlet/${outletKey}/verification`,
        actionLabel: 'Lihat Detail Approval',
        isRead: true,
        readAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ];

    const inserted = await db
      .insert(notifications)
      .values(initialItems)
      .returning();

    return inserted as NotificationItem[];
  } catch (e) {
    console.warn('Seed initial notifications skipped or failed:', e);
    return [];
  }
}
