'use client';

import * as React from 'react';
import { 
  DollarSign, 
  Receipt, 
  CreditCard, 
  Calendar, 
  Printer, 
  FileText, 
  RefreshCw,
  Coins,
  TrendingUp,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  Percent,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { getFinancialReportData, sendFinancialReportEmail } from '@/lib/actions/finance';
import { toast } from 'sonner';

type FinancialData = Awaited<ReturnType<typeof getFinancialReportData>>['data'];

export function FinanceClient({ initialData }: { initialData: FinancialData }) {
  const [data, setData] = React.useState<FinancialData>(initialData);
  const [period, setPeriod] = React.useState<'today' | '7days' | 'this_month' | '30days' | 'custom'>('this_month');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = React.useState(false);
  const [recipientEmail, setRecipientEmail] = React.useState('');
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);

  const loadData = async (selectedPeriod: typeof period, customStart?: string, customEnd?: string) => {
    setIsLoading(true);
    try {
      const res = await getFinancialReportData({
        period: selectedPeriod,
        startDate: selectedPeriod === 'custom' ? (customStart || startDate) : undefined,
        endDate: selectedPeriod === 'custom' ? (customEnd || endDate) : undefined,
      });

      if (res.success && res.data) {
        setData(res.data);
      } else {
        toast.error(res.error || 'Gagal memuat data laporan');
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan saat memuat laporan');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: typeof period) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      loadData(newPeriod);
    }
  };

  const handleApplyCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error('Pilih tanggal awal dan akhir');
      return;
    }
    loadData('custom', startDate, endDate);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
      toast.error('Masukkan alamat email yang valid');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await sendFinancialReportEmail(recipientEmail, {
        period,
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined,
      });

      if (res.success) {
        toast.success(res.message || 'Laporan keuangan berhasil dikirim ke email');
        setIsEmailModalOpen(false);
      } else {
        toast.error(res.error || 'Gagal mengirim laporan ke email');
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan saat mengirim email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (!data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Tidak ada data keuangan yang dapat dimuat.
      </div>
    );
  }

  const { summary, tenant, period: reportPeriod, paymentMethods, transactions } = data;

  const filteredTransactions = transactions.filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.orderNumber?.toLowerCase().includes(term) ||
      t.customerName?.toLowerCase().includes(term) ||
      t.paymentMethod?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 print:p-0">
      
      {/* HEADER PRINT LOGO (HANYA MUNCUL DI PRINT PDF) */}
      <div className="hidden print:flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-900">
        <div className="flex items-center gap-4">
          {tenant.storeLogoUrl ? (
            <img 
              src={tenant.storeLogoUrl} 
              alt="Logo" 
              className="h-16 w-16 object-contain rounded-lg border border-slate-300"
            />
          ) : (
            <div className="h-16 w-16 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-xl">
              {tenant.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">{tenant.name}</h1>
            <p className="text-xs text-slate-600">{tenant.receiptHeader || tenant.storeDescription || 'Laporan Penjualan & Laba Bersih Outlet'}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase text-slate-500">Periode Laporan</div>
          <div className="text-sm font-bold text-slate-900">{reportPeriod.formattedStart} - {reportPeriod.formattedEnd}</div>
        </div>
      </div>

      {/* HEADER SCREEN VIEW */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laporan Penjualan & Keuangan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analisis omset real-time, HPP modal produk, laba kotor, dan rekapitulasi pembayaran.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button 
            onClick={() => loadData(period)} 
            variant="outline" 
            size="sm" 
            disabled={isLoading}
            className="h-10 border-slate-200 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Segarkan
          </Button>

          <Button 
            onClick={() => setIsEmailModalOpen(true)}
            variant="outline"
            className="h-10 border-slate-200 shadow-sm gap-2 text-slate-800 hover:bg-slate-50"
          >
            <Mail className="h-4 w-4 text-primary" />
            <span>Kirim ke Email</span>
          </Button>

          <Button 
            onClick={handlePrint} 
            className="h-10 bg-slate-900 hover:bg-slate-800 text-white shadow-md gap-2"
          >
            <Printer className="h-4 w-4 text-emerald-400" />
            <span>Export PDF / Cetak</span>
          </Button>
        </div>
      </div>

      {/* FILTER PERIODE */}
      <Card className="border-0 shadow-sm ring-1 ring-slate-200 print:hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
              <button
                onClick={() => handlePeriodChange('today')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === 'today' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => handlePeriodChange('7days')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === '7days' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => handlePeriodChange('this_month')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === 'this_month' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bulan Ini
              </button>
              <button
                onClick={() => handlePeriodChange('30days')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === '30days' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 Hari
              </button>
              <button
                onClick={() => setPeriod('custom')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === 'custom' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kustom
              </button>
            </div>

            {period === 'custom' && (
              <form onSubmit={handleApplyCustomDate} className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 w-36 text-xs bg-slate-50/50"
                  required
                />
                <span className="text-xs text-muted-foreground">-</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 w-36 text-xs bg-slate-50/50"
                  required
                />
                <Button type="submit" size="sm" className="h-9 text-xs">
                  Terapkan
                </Button>
              </form>
            )}

            <div className="text-xs font-medium text-slate-500">
              Periode: <strong className="text-slate-800">{reportPeriod.formattedStart} - {reportPeriod.formattedEnd}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL OMSET */}
        <Card className="border-0 shadow-sm ring-1 ring-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Omset</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                Rp {summary.totalOmset.toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                <span>{summary.totalTransaksi} Transaksi Sukses</span>
                <span>Rata² Rp {Math.round(summary.rataRataTransaksi).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TOTAL HPP (MODAL PRODUK) */}
        <Card className="border-0 shadow-sm ring-1 ring-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Modal (HPP)</span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Coins className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                Rp {summary.totalHpp.toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Akumulasi harga modal pokok menu terjual
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LABA KOTOR & MARGIN */}
        <Card className="border-0 shadow-sm ring-1 ring-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Laba Kotor (Gross Profit)</span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-blue-700">
                Rp {summary.labaKotor.toLocaleString('id-ID')}
              </div>
              <div className="text-xs font-semibold text-emerald-600 mt-1">
                Margin Keuntungan: {summary.marginLaba.toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PAJAK PB1 & LAYANAN */}
        <Card className="border-0 shadow-sm ring-1 ring-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pajak (PB1) & Layanan</span>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                Rp {(summary.totalPajak + summary.totalLayanan).toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                <span>Pajak: Rp {summary.totalPajak.toLocaleString('id-ID')}</span>
                <span>Layanan: Rp {summary.totalLayanan.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* METODE PEMBAYARAN */}
      <Card className="border-0 shadow-sm ring-1 ring-slate-200">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-slate-700" />
            Rekapitulasi Kanal Pembayaran
          </CardTitle>
          <CardDescription className="text-xs">
            Distribusi penerimaan omset berdasarkan metode pembayaran kasir
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          {paymentMethods.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Belum ada data transaksi pembayaran pada periode ini.
            </div>
          ) : (
            paymentMethods.map((pm) => {
              const percentage = summary.totalOmset > 0 ? (pm.total / summary.totalOmset) * 100 : 0;
              return (
                <div key={pm.method} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 uppercase tracking-wide">
                      {pm.method || 'LAINNYA'} ({pm.count}x)
                    </span>
                    <span className="font-bold text-slate-900">
                      Rp {pm.total.toLocaleString('id-ID')} <span className="text-slate-400 font-normal">({percentage.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-900 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* DAFTAR TRANSAKSI */}
      <Card className="border-0 shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <CardHeader className="p-5 border-b bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-700" />
              Daftar Transaksi ({filteredTransactions.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Rincian seluruh transaksi yang masuk selama periode ini
            </CardDescription>
          </div>

          <div className="print:hidden w-full sm:w-64">
            <Input
              placeholder="Cari no order / pelanggan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 text-xs bg-white"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b">
              <tr>
                <th className="py-3 px-4">No. Order</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Tipe & Meja</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Pajak</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    Tidak ada transaksi pada periode ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const isCanceled = trx.status === 'CANCELLED' || trx.status === 'CANCELED' || trx.paymentStatus === 'CANCELED' || trx.paymentStatus === 'REFUNDED';
                  return (
                    <tr key={trx.id} className={`hover:bg-slate-50/80 transition-colors ${isCanceled ? 'opacity-50 line-through bg-slate-50/40' : ''}`}>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {trx.orderNumber || trx.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500 text-[11px]">
                        {trx.createdAt ? new Date(trx.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="font-semibold text-slate-800 uppercase">{trx.orderType || 'DINE IN'}</span>
                        {trx.tableNumber && <span className="text-slate-500 text-[11px] block">Meja {trx.tableNumber}</span>}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-700">
                        {trx.customerName || '-'}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border">
                            {trx.paymentMethod || 'TUNAI'}
                          </span>
                          {isCanceled && (
                            <span className="px-1.5 py-0.5 text-[9px] text-red-700 bg-red-100 rounded font-bold uppercase border border-red-200">
                              BATAL
                            </span>
                          )}
                        </div>
                        {isCanceled && trx.voidReason && (
                          <div className="text-[10px] text-red-600 italic not-line-through mt-0.5">
                            Alasan: {trx.voidReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        Rp {parseFloat(trx.totalAmount || '0').toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        Rp {parseFloat(trx.tax || '0').toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-950 font-sans">
                        Rp {parseFloat(trx.grandTotal || '0').toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredTransactions.length > 0 && (
              <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-right uppercase font-sans">TOTAL:</td>
                  <td className="py-3 px-4 text-right font-mono">Rp {(summary.totalOmset - summary.totalPajak - summary.totalLayanan + summary.totalDiskon).toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 text-right font-mono">Rp {summary.totalPajak.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-emerald-700">
                    Rp {summary.totalOmset.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </CardContent>
      </Card>

      {/* FOOTER PENGESAHAN CETAK */}
      <div className="hidden print:flex justify-between items-end pt-12 mt-8 border-t border-slate-300 text-xs">
        <div className="space-y-1 text-slate-500">
          <p>Laporan keuangan dicetak melalui sistem POS <strong>Menuin</strong>.</p>
        </div>
        <div className="text-center space-y-12">
          <p className="font-semibold text-slate-800">Mengetahui,<br />Pemilik Outlet</p>
          <div className="border-b border-slate-800 w-44 mx-auto" />
          <p className="font-bold text-slate-900">{tenant.name}</p>
        </div>
      </div>

      {/* MODAL KIRIM EMAIL */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSendEmail}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <Mail className="h-5 w-5 text-primary" />
                Kirim Laporan Keuangan ke Email
              </DialogTitle>
              <DialogDescription className="text-xs">
                Kirimkan ringkasan eksekutif dan rekap transaksi periode terpilih langsung ke email Anda atau tim akunting.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-3.5 bg-slate-50 border rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Periode:</span>
                  <strong className="text-slate-900">{reportPeriod.formattedStart} - {reportPeriod.formattedEnd}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Omset:</span>
                  <strong className="text-emerald-700 font-mono">Rp {summary.totalOmset.toLocaleString('id-ID')}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Laba Kotor:</span>
                  <strong className="text-blue-700 font-mono">Rp {summary.labaKotor.toLocaleString('id-ID')} ({summary.marginLaba.toFixed(1)}%)</strong>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientEmail" className="font-semibold text-xs uppercase tracking-wider text-slate-700">
                  Alamat Email Penerima
                </Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="owner@resto.com / akuntan@resto.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="bg-slate-50/50 text-sm h-11"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Laporan akan dikirimkan lengkap dengan rekapitulasi pembayaran dan rincian transaksi.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEmailModalOpen(false)}
                disabled={isSendingEmail}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSendingEmail || !recipientEmail}
                className="bg-slate-900 hover:bg-slate-800 text-white min-w-[120px]"
              >
                {isSendingEmail ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Kirim Email</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
