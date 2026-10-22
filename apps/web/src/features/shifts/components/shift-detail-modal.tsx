'use client';

import * as React from 'react';
import { getShiftDetails } from '@/lib/actions/shifts';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { format, formatDistanceStrict } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  formatCurrency,
  formatPaymentMethodLabel,
  formatOrderTypeLabel,
  formatOrderSourceLabel,
} from '@/lib/utils/format';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  ShoppingBag,
  CreditCard,
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function ShiftDetailModal({
  shiftId,
  onClose,
}: {
  shiftId: string;
  onClose: () => void;
}) {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'transactions' | 'products' | 'cash'>('transactions');

  React.useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      const res = await getShiftDetails(shiftId);
      if (res.success) {
        setData(res.data);
      }
      setLoading(false);
    }
    fetchDetails();
  }, [shiftId]);

  const metrics = data?.metrics;
  const shift = data?.shift;

  // Duration computation
  const shiftDuration = React.useMemo(() => {
    if (!shift?.startTime) return '';
    try {
      const end = shift?.endTime ? new Date(shift.endTime) : new Date();
      return formatDistanceStrict(new Date(shift.startTime), end, {
        locale: id,
        addSuffix: false,
      });
    } catch {
      return '';
    }
  }, [shift?.startTime, shift?.endTime]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl shadow-xl border border-[#EAEFF8] dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAEFF8] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                Rekap Sesi Shift #{shift?.id?.slice(0, 8).toUpperCase() || '...'}
              </h2>
              {shift?.status === 'ACTIVE' ? (
                <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border-none dark:bg-emerald-950/40 dark:text-emerald-400">
                  Sedang Berjalan
                </span>
              ) : (
                <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border-none dark:bg-slate-800 dark:text-slate-300">
                  Shift Selesai
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
              <span>
                Kasir: <span className="font-semibold text-slate-800 dark:text-slate-200">{shift?.cashierName || 'Kasir'}</span>
              </span>
              <span>•</span>
              <span>{shift?.restaurantName || 'Outlet'}</span>
              <span>•</span>
              <span className="font-financial tabular-nums">
                {shift?.startTime && format(new Date(shift.startTime), 'dd MMM yyyy, HH:mm', { locale: id })}
                {' - '}
                {shift?.endTime ? format(new Date(shift.endTime), 'HH:mm', { locale: id }) : 'Sekarang'}
                {shiftDuration && ` (${shiftDuration})`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-1.5 h-9 rounded-xl border-[#EAEFF8] dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 print:hidden cursor-pointer"
              onClick={handlePrint}
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Cetak Rekap
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[380px] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0e59f9]" />
            <p className="text-xs text-slate-500 font-medium">Mengambil data rekap shift...</p>
          </div>
        ) : data ? (
          <ScrollArea className="flex-1 px-6 py-5">
            {/* 3 Metric Summary Cards - Neutral Gray Cards (No Uppercase) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              
              {/* KARTU 1: AKTIVITAS PENJUALAN */}
              <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between overflow-hidden">
                <CardContent className="p-5 flex flex-col justify-between flex-1 h-full">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-[#EAEFF8] mb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                          <ShoppingBag className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Volume Order
                          </span>
                          <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
                            Penjualan
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs py-0.5 font-financial tabular-nums">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-sans">Transaksi Selesai</span>
                        <span className="font-semibold text-slate-800">{metrics.totalTransactions} Order</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-sans">Total Produk Terjual</span>
                        <span className="font-semibold text-slate-800">{metrics.totalItemsSold} pcs</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-sans">Penjualan Online</span>
                        <span className="font-semibold text-slate-800">{formatCurrency(metrics.totalOnlineSales || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EAEFF8] flex justify-between items-baseline font-financial tabular-nums">
                    <span className="text-[11px] font-normal text-slate-400 font-sans">Rata-rata Order (AOV)</span>
                    <span className="text-xs font-semibold text-slate-900">
                      {formatCurrency(metrics.totalTransactions > 0 ? Math.round(metrics.totalSales / metrics.totalTransactions) : 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* KARTU 2: RINCIAN METODE BAYAR */}
              <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between overflow-hidden">
                <CardContent className="p-5 flex flex-col justify-between flex-1 h-full">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-[#EAEFF8] mb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                          <CreditCard className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Metode Bayar
                          </span>
                          <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
                            Pendapatan
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs py-0.5 font-financial tabular-nums">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 flex items-center gap-2 font-sans">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Tunai (Kas Laci)
                        </span>
                        <span className="font-semibold text-slate-800">{formatCurrency(metrics.totalCashSales || 0)}</span>
                      </div>

                      {(metrics.totalQrisStaticSales ?? 0) > 0 || (metrics.totalQrisDynamicSales ?? 0) > 0 ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 flex items-center gap-2 font-sans">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> QRIS Statis Toko
                            </span>
                            <span className="font-semibold text-slate-800">{formatCurrency(metrics.totalQrisStaticSales || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 flex items-center gap-2 font-sans">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> QRIS Dinamis (Menuin)
                            </span>
                            <span className="font-semibold text-slate-800">{formatCurrency(metrics.totalQrisDynamicSales || 0)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 flex items-center gap-2 font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> QRIS
                          </span>
                          <span className="font-semibold text-slate-800">{formatCurrency(metrics.totalQrisSales || 0)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 flex items-center gap-2 font-sans">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Transfer / EDC Toko
                        </span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency((metrics.totalTransferSales || 0) + (metrics.totalDebitSales || 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EAEFF8] flex justify-between items-baseline font-financial tabular-nums">
                    <span className="text-[11px] font-medium text-slate-500 font-sans">Total Omzet</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(metrics.totalSales || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* KARTU 3: REKONSILIASI KAS LACI */}
              <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between overflow-hidden">
                <CardContent className="p-5 flex flex-col justify-between flex-1 h-full">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-[#EAEFF8] mb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                          <Banknote className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Audit Kas Laci
                          </span>
                          <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
                            Rekonsiliasi Fisik
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs font-financial tabular-nums">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-sans">Modal Awal Kas</span>
                        <span className="text-slate-700">{formatCurrency(metrics.startingCash || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-sans">Penjualan Tunai (+)</span>
                        <span className="text-emerald-600 font-semibold">+{formatCurrency(metrics.totalCashSales || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-sans">Kas Masuk (+)</span>
                        <span className="text-emerald-600 font-semibold">+{formatCurrency(metrics.totalCashIn || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-sans">Kas Keluar (-)</span>
                        <span className="text-rose-600 font-semibold">-{formatCurrency(metrics.totalCashOut || 0)}</span>
                      </div>
                      <div className="pt-1.5 border-t border-[#EAEFF8] flex justify-between items-center font-medium">
                        <span className="text-slate-600 font-sans font-medium">Ekspektasi Kas Laci</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(metrics.expectedCash || 0)}</span>
                      </div>
                      {shift?.status === 'ENDED' && (
                        <div className="flex justify-between items-center font-semibold text-slate-900">
                          <span className="font-sans">Kas Aktual Dihitung</span>
                          <span className="text-[#0e59f9]">{formatCurrency(metrics.actualCash || 0)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EAEFF8] flex justify-between items-center font-financial tabular-nums">
                    <span className="text-xs font-semibold font-sans text-slate-600">Selisih Kas</span>
                    {shift?.status === 'ACTIVE' ? (
                      <span className="text-xs text-slate-400 font-normal">Shift Berjalan</span>
                    ) : metrics.cashDifference === 0 ? (
                      <span className="text-xs font-semibold text-emerald-600">Pas (Rp 0)</span>
                    ) : metrics.cashDifference < 0 ? (
                      <span className="text-xs font-semibold text-rose-600">Kurang {formatCurrency(Math.abs(metrics.cashDifference))}</span>
                    ) : (
                      <span className="text-xs font-semibold text-[#0e59f9]">Lebih {formatCurrency(metrics.cashDifference)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* TABS DETAILS (Underline tabs matching Riwayat Transaksi) */}
            <div className="w-full">
              <div className="flex items-center gap-6 border-b border-[#EAEFF8] dark:border-slate-800 pb-0 mb-4 overflow-x-auto no-scrollbar">
                {[
                  { key: 'transactions', label: 'Daftar Transaksi', count: data.transactions.length },
                  { key: 'products', label: 'Produk Terjual', count: data.soldProducts.length },
                  { key: 'cash', label: 'Arus Kas Laci', count: data.cashMovements.length },
                ].map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key as any)}
                      className={cn(
                        "relative pb-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap",
                        isActive
                          ? "text-[#0e59f9] font-semibold"
                          : "text-slate-500 hover:text-[#0e59f9]"
                      )}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-lg font-semibold transition-colors font-financial tabular-nums",
                          isActive
                            ? "bg-blue-50 text-[#0e59f9]"
                            : "text-slate-400 bg-slate-100"
                        )}
                      >
                        {tab.count}
                      </span>
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0e59f9] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: TRANSAKSI */}
              {activeTab === 'transactions' && (
                <div className="max-h-[360px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50/75 dark:bg-slate-800/75 backdrop-blur-xs">
                      <TableRow className="border-b border-[#EAEFF8] dark:border-slate-800">
                        <TableHead className="w-[130px] text-xs font-semibold text-slate-600 py-3 px-4">No. Order</TableHead>
                        <TableHead className="w-[90px] text-xs font-semibold text-slate-600 py-3 px-4">Channel</TableHead>
                        <TableHead className="w-[130px] text-xs font-semibold text-slate-600 py-3 px-4">Tipe Pesanan</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 py-3 px-4">Metode Bayar</TableHead>
                        <TableHead className="w-[90px] text-xs font-semibold text-slate-600 py-3 px-4">Jam</TableHead>
                        <TableHead className="text-right w-[130px] text-xs font-semibold text-slate-600 py-3 px-4">Total Belanja</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-[#EAEFF8] dark:divide-slate-800/80">
                      {data.transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-xs text-slate-400">
                            Belum ada transaksi pada shift ini.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.transactions.map((tx: any) => (
                          <TableRow key={tx.id} className="text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <TableCell className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                              {tx.orderNumber ? `#${tx.orderNumber}` : tx.id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="py-3 px-4 font-normal text-slate-600 dark:text-slate-400">
                              {formatOrderSourceLabel(tx.source)}
                            </TableCell>
                            <TableCell className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                              {tx.orderType ? formatOrderTypeLabel(tx.orderType) : '-'}
                            </TableCell>
                            <TableCell className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              {formatPaymentMethodLabel(tx.paymentMethod)}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-slate-500 font-financial tabular-nums">
                              {format(new Date(tx.createdAt), 'HH:mm:ss')}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right font-financial font-semibold text-slate-900 dark:text-white tabular-nums">
                              {formatCurrency(Number(tx.grandTotal))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* TAB 2: PRODUK TERJUAL */}
              {activeTab === 'products' && (
                <div className="max-h-[360px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50/75 dark:bg-slate-800/75 backdrop-blur-xs">
                      <TableRow className="border-b border-[#EAEFF8] dark:border-slate-800">
                        <TableHead className="w-[50px] text-center text-xs font-semibold text-slate-600 py-3 px-4">No</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 py-3 px-4">Nama Produk / Menu</TableHead>
                        <TableHead className="text-center w-[120px] text-xs font-semibold text-slate-600 py-3 px-4">Qty Terjual</TableHead>
                        <TableHead className="text-right w-[160px] text-xs font-semibold text-slate-600 py-3 px-4">Total Omzet</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-[#EAEFF8] dark:divide-slate-800/80">
                      {data.soldProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-10 text-xs text-slate-400">
                            Tidak ada data produk terjual pada shift ini.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.soldProducts.map((item: any, idx: number) => (
                          <TableRow key={idx} className="text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <TableCell className="py-3 px-4 text-center font-financial text-slate-400 tabular-nums">{idx + 1}</TableCell>
                            <TableCell className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{item.name}</TableCell>
                            <TableCell className="py-3 px-4 text-center font-financial font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                              {item.totalQuantity} pcs
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right font-financial font-semibold text-slate-900 dark:text-white tabular-nums">
                              {formatCurrency(Number(item.totalRevenue))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* TAB 3: ARUS KAS LACI */}
              {activeTab === 'cash' && (
                <div className="max-h-[360px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50/75 dark:bg-slate-800/75 backdrop-blur-xs">
                      <TableRow className="border-b border-[#EAEFF8] dark:border-slate-800">
                        <TableHead className="w-[80px] text-xs font-semibold text-slate-600 py-3 px-4">Jam</TableHead>
                        <TableHead className="w-[120px] text-xs font-semibold text-slate-600 py-3 px-4">Tipe Kas</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 py-3 px-4">Keterangan / Keperluan</TableHead>
                        <TableHead className="text-right w-[150px] text-xs font-semibold text-slate-600 py-3 px-4">Nominal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-[#EAEFF8] dark:divide-slate-800/80">
                      {data.cashMovements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-10 text-xs text-slate-400">
                            Tidak ada catatan kas masuk atau keluar pada shift ini.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.cashMovements.map((move: any) => (
                          <TableRow key={move.id} className="text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <TableCell className="py-3 px-4 font-financial text-slate-500 tabular-nums">
                              {format(new Date(move.createdAt), 'HH:mm')}
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              {move.type === 'IN' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-none">
                                  Kas Masuk
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-none">
                                  Kas Keluar
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{move.description}</TableCell>
                            <TableCell className={`py-3 px-4 text-right font-financial font-semibold tabular-nums ${move.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {move.type === 'IN' ? '+' : '-'}{formatCurrency(Number(move.amount))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            Data shift tidak ditemukan.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
