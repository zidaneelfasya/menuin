import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatOrderTypeLabel, formatPaymentMethodLabel } from '@/lib/utils/format';
import { toast } from 'sonner';

export interface ShiftExportData {
  shift: any;
  metrics: any;
  transactions?: any[];
  soldProducts?: any[];
  cashMovements?: any[];
}

/**
 * Ekspor seluruh detail sesi shift ke workbook Excel (.xlsx) multihalaman
 */
export function exportShiftDetailToExcel(data: ShiftExportData, outletName?: string) {
  try {
    const { shift, metrics, transactions = [], soldProducts = [], cashMovements = [] } = data;
    const wb = XLSX.utils.book_new();

    const shiftIdShort = (shift?.id || '').slice(0, 8).toUpperCase();
    const startDateFormatted = shift?.startTime
      ? format(new Date(shift.startTime), 'dd MMMM yyyy, HH:mm', { locale: id })
      : '-';
    const endDateFormatted = shift?.endTime
      ? format(new Date(shift.endTime), 'dd MMMM yyyy, HH:mm', { locale: id })
      : 'Masih Berjalan';

    const diff = Number(shift?.cashDifference || 0);
    const diffStatus = diff === 0 ? 'Sesuai (Pas)' : diff < 0 ? `Kurang (Minus Rp ${Math.abs(diff).toLocaleString('id-ID')})` : `Lebih (Plus Rp ${diff.toLocaleString('id-ID')})`;

    // ==========================================
    // 1. SHEET RINGKASAN SHIFT
    // ==========================================
    const summaryRows = [
      { Indikator: 'ID Shift', Nilai: `#${shiftIdShort}` },
      { Indikator: 'Outlet / Gerai', Nilai: outletName || shift?.restaurantName || '-' },
      { Indikator: 'Nama Kasir', Nilai: shift?.cashierName || 'Kasir' },
      { Indikator: 'Status Sesi', Nilai: shift?.status === 'ACTIVE' ? 'Sedang Berjalan' : 'Selesai' },
      { Indikator: 'Waktu Mulai', Nilai: startDateFormatted },
      { Indikator: 'Waktu Selesai', Nilai: endDateFormatted },
      { Indikator: '', Nilai: '' },
      { Indikator: '--- REKONSILIASI KAS LACI ---', Nilai: '' },
      { Indikator: 'Modal Awal Kasir (Rp)', Nilai: Math.round(Number(shift?.startingCash || 0)) },
      { Indikator: 'Total Penjualan Tunai (Rp)', Nilai: Math.round(Number(metrics?.totalCashSales || 0)) },
      { Indikator: 'Total Kas Masuk Laci (Rp)', Nilai: Math.round(Number(metrics?.totalCashIn || 0)) },
      { Indikator: 'Total Kas Keluar Laci (Rp)', Nilai: Math.round(Number(metrics?.totalCashOut || 0)) },
      { Indikator: 'Ekspektasi Kas Sistem (Rp)', Nilai: Math.round(Number(metrics?.expectedCash || shift?.expectedCash || 0)) },
      { Indikator: 'Kas Fisik Aktual (Rp)', Nilai: Math.round(Number(shift?.actualCash || 0)) },
      { Indikator: 'Selisih Kas (Rp)', Nilai: Math.round(diff) },
      { Indikator: 'Status Rekonsiliasi Kas', Nilai: diffStatus },
      { Indikator: '', Nilai: '' },
      { Indikator: '--- PERFORMA PENJUALAN ---', Nilai: '' },
      { Indikator: 'Total Omset Penjualan (Rp)', Nilai: Math.round(Number(metrics?.totalSales || 0)) },
      { Indikator: 'Total Transaksi Selesai', Nilai: Number(metrics?.totalTransactions || 0) },
      { Indikator: 'Rata-rata Order / AOV (Rp)', Nilai: Math.round(Number(metrics?.averageOrderValue || 0)) },
      { Indikator: 'Total Item Menu Terjual', Nilai: Number(metrics?.totalItemsSold || 0) },
      { Indikator: 'Pesanan POS Kasir', Nilai: Number(metrics?.totalPosOrders || 0) },
      { Indikator: 'Pesanan Digital / Online', Nilai: Number(metrics?.totalOnlineOrders || 0) },
      { Indikator: '', Nilai: '' },
      { Indikator: '--- METODE PEMBAYARAN ---', Nilai: '' },
      { Indikator: 'Tunai (Cash)', Nilai: Math.round(Number(metrics?.totalCashSales || 0)) },
      { Indikator: 'Total QRIS', Nilai: Math.round(Number(metrics?.totalQrisSales || 0)) },
      { Indikator: 'QRIS Dinamis', Nilai: Math.round(Number(metrics?.totalQrisDynamicSales || 0)) },
      { Indikator: 'QRIS Statis', Nilai: Math.round(Number(metrics?.totalQrisStaticSales || 0)) },
      { Indikator: 'Kartu Debit / EDC', Nilai: Math.round(Number(metrics?.totalDebitSales || 0)) },
      { Indikator: 'Transfer Bank', Nilai: Math.round(Number(metrics?.totalTransferSales || 0)) },
      { Indikator: 'Payment Gateway Online', Nilai: Math.round(Number(metrics?.totalGatewaySales || 0)) },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 32 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Shift');

    // ==========================================
    // 2. SHEET DAFTAR TRANSAKSI
    // ==========================================
    if (transactions.length > 0) {
      const txRows = transactions.map((t, idx) => ({
        No: idx + 1,
        'No. Order': t.orderNumber || `#${t.id?.slice(0, 8) || '-'}`,
        Waktu: t.createdAt ? format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm') : '-',
        'Tipe Pesanan': formatOrderTypeLabel(t.orderType),
        Meja: t.tableNumber ? `Meja ${t.tableNumber}` : '-',
        'Metode Bayar': formatPaymentMethodLabel(t.paymentMethod),
        'Status Bayar': t.paymentStatus || 'PAID',
        'Subtotal (Rp)': Math.round(Number(t.subtotal || t.totalAmount || 0)),
        'Pajak (Rp)': Math.round(Number(t.taxAmount || 0)),
        'Biaya Layanan (Rp)': Math.round(Number(t.serviceFee || 0)),
        'Diskon (Rp)': Math.round(Number(t.discountAmount || 0)),
        'Grand Total (Rp)': Math.round(Number(t.grandTotal || t.totalAmount || 0)),
      }));
      const wsTx = XLSX.utils.json_to_sheet(txRows);
      wsTx['!cols'] = [
        { wch: 6 },
        { wch: 16 },
        { wch: 18 },
        { wch: 16 },
        { wch: 10 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
        { wch: 16 },
        { wch: 12 },
        { wch: 16 },
      ];
      XLSX.utils.book_append_sheet(wb, wsTx, 'Daftar Transaksi');
    }

    // ==========================================
    // 3. SHEET PRODUK TERJUAL
    // ==========================================
    if (soldProducts.length > 0) {
      const productRows = soldProducts.map((p, idx) => ({
        No: idx + 1,
        'Nama Produk': p.name || 'Produk',
        Kategori: p.categoryName || '-',
        'Jumlah Terjual (Qty)': Number(p.quantity || p.totalQty || 0),
        'Harga Satuan (Rp)': Math.round(Number(p.price || 0)),
        'Total Omset (Rp)': Math.round(Number(p.totalRevenue || p.totalAmount || 0)),
      }));
      const wsProducts = XLSX.utils.json_to_sheet(productRows);
      wsProducts['!cols'] = [
        { wch: 6 },
        { wch: 28 },
        { wch: 18 },
        { wch: 20 },
        { wch: 18 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Menu Terjual');
    }

    // ==========================================
    // 4. SHEET MUTASI KAS LACI
    // ==========================================
    if (cashMovements.length > 0) {
      const movementRows = cashMovements.map((m, idx) => ({
        No: idx + 1,
        Waktu: m.createdAt ? format(new Date(m.createdAt), 'dd/MM/yyyy HH:mm') : '-',
        Jenis: m.type === 'IN' ? 'Kas Masuk (In)' : 'Kas Keluar (Out)',
        'Nominal (Rp)': Math.round(Number(m.amount || 0)),
        'Keterangan / Keperluan': m.description || '-',
      }));
      const wsMovements = XLSX.utils.json_to_sheet(movementRows);
      wsMovements['!cols'] = [
        { wch: 6 },
        { wch: 18 },
        { wch: 18 },
        { wch: 16 },
        { wch: 36 },
      ];
      XLSX.utils.book_append_sheet(wb, wsMovements, 'Mutasi Kas Laci');
    }

    const dateStr = shift?.startTime
      ? format(new Date(shift.startTime), 'yyyyMMdd_HHmm')
      : format(new Date(), 'yyyyMMdd');
    const fileName = `Rekap_Shift_${shiftIdShort}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
    toast.success('File Excel rekap shift berhasil diunduh');
  } catch (err: any) {
    console.error('Error exporting shift to excel:', err);
    toast.error('Gagal mengekspor data shift ke Excel');
  }
}

/**
 * Ekspor daftar riwayat shift ke file Excel (.xlsx)
 */
export function exportShiftHistoryToExcel(history: any[], outletName?: string) {
  try {
    if (!history || history.length === 0) {
      toast.error('Tidak ada data riwayat shift untuk diekspor');
      return;
    }

    const wb = XLSX.utils.book_new();
    const rows = history.map((s, idx) => {
      const diff = Number(s.cashDifference || 0);
      const diffStatus = diff === 0 ? 'Sesuai' : diff < 0 ? `Kurang Rp ${Math.abs(diff).toLocaleString('id-ID')}` : `Lebih Rp ${diff.toLocaleString('id-ID')}`;

      return {
        No: idx + 1,
        'ID Shift': `#${(s.id || '').slice(0, 8).toUpperCase()}`,
        Kasir: s.cashierName || 'Kasir',
        'Waktu Mulai': s.startTime ? format(new Date(s.startTime), 'dd/MM/yyyy HH:mm') : '-',
        'Waktu Selesai': s.endTime ? format(new Date(s.endTime), 'dd/MM/yyyy HH:mm') : 'Berjalan',
        Status: s.status === 'ACTIVE' ? 'Aktif' : 'Selesai',
        'Modal Awal (Rp)': Math.round(Number(s.startingCash || 0)),
        'Kas Fisik Aktual (Rp)': Math.round(Number(s.actualCash || 0)),
        'Ekspektasi Kas (Rp)': Math.round(Number(s.expectedCash || 0)),
        'Selisih Kas (Rp)': Math.round(diff),
        'Status Selisih': diffStatus,
        'Total Transaksi': Number(s.totalTransactions || 0),
        'Total Omset (Rp)': Math.round(Number(s.totalSales || 0)),
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Shift');

    const dateStr = format(new Date(), 'yyyyMMdd');
    const fileName = `Riwayat_Shift_${(outletName || 'Outlet').replace(/\s+/g, '_')}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
    toast.success('File Excel riwayat shift berhasil diunduh');
  } catch (err: any) {
    console.error('Error exporting shift history to excel:', err);
    toast.error('Gagal mengekspor riwayat shift ke Excel');
  }
}
