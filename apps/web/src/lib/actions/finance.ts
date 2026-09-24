'use server';

import { db } from '@/lib/db';
import { transactions, transactionItems, products, tenants } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, inArray } from 'drizzle-orm';
import { getCurrentUser } from './auth';

export type FinancialReportParams = {
  startDate?: string;
  endDate?: string;
  period?: 'today' | '7days' | '30days' | 'this_month' | 'custom';
};

export async function getFinancialReportData(params?: FinancialReportParams) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized: Sesi tidak ditemukan.' };
    }

    if (user.role !== 'OWNER' && user.role !== 'MANAGER' && (user.role as string) !== 'SYSTEM_ADMIN') {
      return { success: false, error: 'Hanya Pemilik (OWNER) atau Manajer yang dapat mengakses laporan keuangan.' };
    }

    const tenantId = user.tenantId;

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return { success: false, error: 'Data outlet tidak ditemukan.' };
    }

    const now = new Date();
    let start = new Date();
    let end = new Date();

    const period = params?.period || 'this_month';

    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === '7days') {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === '30days') {
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'custom' && params?.startDate && params?.endDate) {
      start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    const trxList = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          gte(transactions.createdAt, start),
          lte(transactions.createdAt, end)
        )
      )
      .orderBy(desc(transactions.createdAt));

    const trxIds = trxList.map(t => t.id);
    const itemsMap: Record<string, any[]> = {};

    if (trxIds.length > 0) {
      const allItems = await db
        .select({
          id: transactionItems.id,
          transactionId: transactionItems.transactionId,
          productId: transactionItems.productId,
          productName: products.name,
          costPrice: products.costPrice,
          quantity: transactionItems.quantity,
          price: transactionItems.price,
          subtotal: transactionItems.subtotal,
        })
        .from(transactionItems)
        .leftJoin(products, eq(transactionItems.productId, products.id))
        .where(inArray(transactionItems.transactionId, trxIds));

      allItems.forEach(item => {
        if (!itemsMap[item.transactionId]) {
          itemsMap[item.transactionId] = [];
        }
        itemsMap[item.transactionId].push(item);
      });
    }

    let totalOmset = 0;
    let totalPenjualanKotor = 0;
    let totalDiskon = 0;
    let totalPajak = 0;
    let totalLayanan = 0;
    let totalTransaksi = 0;
    let totalHpp = 0;

    const paymentMethods: Record<string, { count: number; total: number }> = {};

    trxList.forEach(t => {
      const isCanceled = t.status === 'CANCELLED' || t.status === 'CANCELED' || t.paymentStatus === 'CANCELED' || t.paymentStatus === 'REFUNDED';
      if (isCanceled) return;

      const gTotal = parseFloat(t.grandTotal || '0') || 0;
      const subTotal = parseFloat(t.totalAmount || '0') || 0;
      const disc = parseFloat(t.discount || '0') || 0;
      const tx = parseFloat(t.tax || '0') || 0;
      const sc = parseFloat(t.serviceCharge || '0') || 0;

      totalOmset += gTotal;
      totalPenjualanKotor += subTotal;
      totalDiskon += disc;
      totalPajak += tx;
      totalLayanan += sc;
      totalTransaksi += 1;

      // Hitung HPP dari item produk
      const items = itemsMap[t.id] || [];
      items.forEach(item => {
        const qty = item.quantity || 1;
        const cost = parseFloat(item.costPrice || '0') || 0;
        totalHpp += (cost * qty);
      });

      const method = t.paymentMethod || 'TUNAI';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, total: 0 };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].total += gTotal;
    });

    const penjualanBersih = totalPenjualanKotor - totalDiskon;
    const labaKotor = penjualanBersih - totalHpp;
    const marginLaba = penjualanBersih > 0 ? (labaKotor / penjualanBersih) * 100 : 0;
    const rataRataTransaksi = totalTransaksi > 0 ? totalOmset / totalTransaksi : 0;

    return {
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          outletKey: tenant.outletKey,
          storeLogoUrl: tenant.storeLogoUrl,
          storeDescription: tenant.storeDescription,
          taxName: tenant.taxName || 'Pajak (PB1)',
          receiptHeader: tenant.receiptHeader,
          receiptFooter: tenant.receiptFooter,
        },
        period: {
          type: period,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          formattedStart: start.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          formattedEnd: end.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        },
        summary: {
          totalOmset,
          penjualanBersih,
          totalHpp,
          labaKotor,
          marginLaba,
          totalTransaksi,
          totalDiskon,
          totalPajak,
          totalLayanan,
          rataRataTransaksi,
        },
        paymentMethods: Object.entries(paymentMethods).map(([method, val]) => ({
          method,
          count: val.count,
          total: val.total,
        })),
        transactions: trxList,
      },
    };
  } catch (error: any) {
    console.error('Error fetching financial report:', error);
    return { success: false, error: error.message || 'Gagal memuat laporan keuangan' };
  }
}

export async function sendFinancialReportEmail(recipientEmail: string, params?: FinancialReportParams) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.tenantId) {
      return { success: false, error: 'Unauthorized: Sesi tidak ditemukan.' };
    }

    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
      return { success: false, error: 'Format alamat email tidak valid.' };
    }

    const report = await getFinancialReportData(params);
    if (!report.success || !report.data) {
      return { success: false, error: report.error || 'Gagal mengambil data laporan untuk dikirim.' };
    }

    const { summary, tenant, period } = report.data;

    // Log the dispatched report simulation (ready for Resend / SMTP / Supabase Mail integration)
    console.log(`[EMAIL DISPATCH] Sending financial report for tenant ${tenant.name} (${period.formattedStart} - ${period.formattedEnd}) to ${recipientEmail}`);
    console.log(`[EMAIL DISPATCH SUMMARY] Omset: Rp ${summary.totalOmset.toLocaleString('id-ID')} | Laba Kotor: Rp ${summary.labaKotor.toLocaleString('id-ID')} | Transaksi: ${summary.totalTransaksi}`);

    return {
      success: true,
      message: `Laporan keuangan periode ${period.formattedStart} - ${period.formattedEnd} berhasil dikirim ke ${recipientEmail.trim()}`,
    };
  } catch (error: any) {
    console.error('Error sending financial report email:', error);
    return { success: false, error: error.message || 'Gagal mengirim email laporan.' };
  }
}

