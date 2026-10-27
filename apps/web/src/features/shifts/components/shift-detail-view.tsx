'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ShoppingBag,
  CreditCard,
  Banknote,
  Printer,
  ArrowLeft,
  Clock,
  User,
  Store,
} from 'lucide-react';
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

interface ShiftDetailViewProps {
  outletKey: string;
  data: {
    shift: any;
    metrics: any;
    transactions: any[];
    soldProducts: any[];
    cashMovements: any[];
  };
}

export function ShiftDetailView({ outletKey, data }: ShiftDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'transactions' | 'products' | 'cash'>('transactions');

  const { shift, metrics, transactions, soldProducts, cashMovements } = data;

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
    <div className="space-y-6 pb-12">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/outlet/${outletKey}/shifts?tab=history`)}
            className="h-9 px-4 rounded-full border-none shadow-sm-md bg-white text-slate-700 hover:bg-slate-100 gap-2 font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali ke Riwayat</span>
          </Button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
            <Link
              href={`/outlet/${outletKey}/shifts`}
              className="hover:text-blue-600 transition-colors"
            >
              Shift Kasir
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium font-mono">
              #{shift?.id?.slice(0, 8).toUpperCase() || 'DETAIL'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs font-semibold gap-2 h-9 px-4 rounded-full border-none shadow-sm-md bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Rekap</span>
          </Button>
        </div>
      </div>

      {/* Main Shift Header Banner */}
      <div className="bg-white rounded-2xl border-none p-5 sm:p-6 shadow-sm-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                Rekap Sesi Shift #{shift?.id?.slice(0, 8).toUpperCase() || '...'}
              </h1>
              {shift?.status === 'ACTIVE' ? (
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border-none">
                  Sedang Berjalan
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border-none">
                  Shift Selesai
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                <span>Kasir:</span>
                <span className="font-semibold text-slate-900">{shift?.cashierName || 'Kasir'}</span>
              </span>

              <span className="text-slate-300">•</span>

              <span className="inline-flex items-center gap-1.5">
                <Store className="w-4 h-4 text-slate-400" />
                <span>{shift?.restaurantName || 'Outlet'}</span>
              </span>

              <span className="text-slate-300">•</span>

              <span className="inline-flex items-center gap-1.5 font-financial tabular-nums">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  {shift?.startTime && format(new Date(shift.startTime), 'dd MMM yyyy, HH:mm', { locale: id })}
                  {' - '}
                  {shift?.endTime ? format(new Date(shift.endTime), 'HH:mm', { locale: id }) : 'Sekarang'}
                </span>
                {shiftDuration && (
                  <span className="text-slate-500 font-normal">({shiftDuration})</span>
                )}
              </span>
            </div>
          </div>

          <div className="pt-3 md:pt-0 border-t md:border-t-0 border-[#EAEFF8] text-left md:text-right">
            <span className="text-xs font-medium text-slate-500 block">Total Omzet Shift</span>
            <span className="text-xl sm:text-2xl font-semibold text-slate-900 font-financial tabular-nums">
              {formatCurrency(metrics?.totalSales || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KARTU 1: AKTIVITAS PENJUALAN */}
        <Card className="border-none shadow-sm-md rounded-2xl bg-white flex flex-col justify-between overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-between flex-1 h-full">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-[#EAEFF8] mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#0e59f9] text-white flex items-center justify-center flex-shrink-0">
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

              <div className="space-y-2.5 text-xs py-0.5 font-financial tabular-nums">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Transaksi Selesai</span>
                  <span className="font-semibold text-slate-900">{metrics?.totalTransactions || 0} Order</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Total Produk Terjual</span>
                  <span className="font-semibold text-slate-900">{metrics?.totalItemsSold || 0} pcs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Penjualan Online</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(metrics?.totalOnlineSales || 0)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#EAEFF8] flex justify-between items-baseline font-financial tabular-nums">
              <span className="text-[11px] font-normal text-slate-500 font-sans">Rata-rata Order (AOV)</span>
              <span className="text-xs font-semibold text-slate-900">
                {formatCurrency(metrics?.totalTransactions > 0 ? Math.round(metrics.totalSales / metrics.totalTransactions) : 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KARTU 2: RINCIAN METODE BAYAR */}
        <Card className="border-none shadow-sm-md rounded-2xl bg-white flex flex-col justify-between overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-between flex-1 h-full">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-[#EAEFF8] mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#0e59f9] text-white flex items-center justify-center flex-shrink-0">
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

              <div className="space-y-2.5 text-xs py-0.5 font-financial tabular-nums">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-2 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Tunai (Kas Laci)
                  </span>
                  <span className="font-semibold text-slate-900">{formatCurrency(metrics?.totalCashSales || 0)}</span>
                </div>

                {(metrics?.totalQrisStaticSales ?? 0) > 0 || (metrics?.totalQrisDynamicSales ?? 0) > 0 ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 flex items-center gap-2 font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> QRIS Statis Toko
                      </span>
                      <span className="font-semibold text-slate-900">{formatCurrency(metrics?.totalQrisStaticSales || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 flex items-center gap-2 font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> QRIS Dinamis (Menuin)
                      </span>
                      <span className="font-semibold text-slate-900">{formatCurrency(metrics?.totalQrisDynamicSales || 0)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 flex items-center gap-2 font-sans">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> QRIS
                    </span>
                    <span className="font-semibold text-slate-900">{formatCurrency(metrics?.totalQrisSales || 0)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-2 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Transfer / EDC Toko
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency((metrics?.totalTransferSales || 0) + (metrics?.totalDebitSales || 0))}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#EAEFF8] flex justify-between items-baseline font-financial tabular-nums">
              <span className="text-[11px] font-medium text-slate-500 font-sans">Total Omzet</span>
              <span className="text-sm font-semibold text-slate-900">
                {formatCurrency(metrics?.totalSales || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KARTU 3: REKONSILIASI KAS LACI */}
        <Card className="border-none shadow-sm-md rounded-2xl bg-white flex flex-col justify-between overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-between flex-1 h-full">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-[#EAEFF8] mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#0e59f9] text-white flex items-center justify-center flex-shrink-0">
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

              <div className="space-y-2 text-xs font-financial tabular-nums">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Modal Awal Kas</span>
                  <span className="text-slate-700">{formatCurrency(metrics?.startingCash || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Penjualan Tunai (+)</span>
                  <span className="text-emerald-600 font-semibold">+{formatCurrency(metrics?.totalCashSales || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Kas Masuk (+)</span>
                  <span className="text-emerald-600 font-semibold">+{formatCurrency(metrics?.totalCashIn || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Kas Keluar (-)</span>
                  <span className="text-rose-600 font-semibold">-{formatCurrency(metrics?.totalCashOut || 0)}</span>
                </div>
                <div className="pt-2 border-t border-[#EAEFF8] flex justify-between items-center font-medium">
                  <span className="text-slate-700 font-sans font-medium">Ekspektasi Kas Laci</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(metrics?.expectedCash || 0)}</span>
                </div>
                {shift?.status === 'ENDED' && (
                  <div className="flex justify-between items-center font-semibold text-slate-900">
                    <span className="font-sans">Kas Aktual Dihitung</span>
                    <span className="text-[#0e59f9]">{formatCurrency(metrics?.actualCash || 0)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#EAEFF8] flex justify-between items-center font-financial tabular-nums">
              <span className="text-xs font-semibold font-sans text-slate-600">Selisih Kas</span>
              {shift?.status === 'ACTIVE' ? (
                <span className="text-xs text-slate-400 font-normal">Shift Berjalan</span>
              ) : metrics?.cashDifference === 0 ? (
                <span className="text-xs font-semibold text-emerald-600">Pas (Rp 0)</span>
              ) : metrics?.cashDifference < 0 ? (
                <span className="text-xs font-semibold text-rose-600">Kurang {formatCurrency(Math.abs(metrics.cashDifference))}</span>
              ) : (
                <span className="text-xs font-semibold text-[#0e59f9]">Lebih {formatCurrency(metrics?.cashDifference || 0)}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Breakdown */}
      <div className="bg-white rounded-2xl border-none p-5 sm:p-6 shadow-sm-md space-y-5">
        <div className="flex items-center gap-6 border-b border-[#EAEFF8] pb-0 overflow-x-auto no-scrollbar">
          {[
            { key: 'transactions', label: 'Daftar Transaksi', count: transactions?.length || 0 },
            { key: 'products', label: 'Produk Terjual', count: soldProducts?.length || 0 },
            { key: 'cash', label: 'Arus Kas Laci', count: cashMovements?.length || 0 },
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
                    "text-xs px-2.5 py-0.5 rounded-full font-semibold transition-colors font-financial tabular-nums",
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b border-[#EAEFF8]">
                  <TableHead className="w-[140px] text-xs font-semibold text-slate-600 py-3.5 px-4">No. Order</TableHead>
                  <TableHead className="w-[110px] text-xs font-semibold text-slate-600 py-3.5 px-4">Channel</TableHead>
                  <TableHead className="w-[130px] text-xs font-semibold text-slate-600 py-3.5 px-4">Tipe Pesanan</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-4">Metode Bayar</TableHead>
                  <TableHead className="w-[95px] text-xs font-semibold text-slate-600 py-3.5 px-4">Jam</TableHead>
                  <TableHead className="text-right w-[150px] text-xs font-semibold text-slate-600 py-3.5 px-4">Total Belanja</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#EAEFF8]">
                {transactions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-xs text-slate-400">
                      Belum ada transaksi pada sesi shift ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions?.map((tx: any) => (
                    <TableRow key={tx.id} className="text-xs hover:bg-slate-50/70 transition-colors">
                      <TableCell className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {tx.orderNumber ? `#${tx.orderNumber}` : tx.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="py-3 px-4 font-normal text-slate-600">
                        {formatOrderSourceLabel(tx.source)}
                      </TableCell>
                      <TableCell className="py-3 px-4 font-medium text-slate-700">
                        {tx.orderType ? formatOrderTypeLabel(tx.orderType) : '-'}
                      </TableCell>
                      <TableCell className="py-3 px-4 font-semibold text-slate-800">
                        {formatPaymentMethodLabel(tx.paymentMethod)}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-slate-500 font-financial tabular-nums">
                        {tx.createdAt ? format(new Date(tx.createdAt), 'HH:mm:ss') : '-'}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right font-financial font-semibold text-slate-900 tabular-nums">
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b border-[#EAEFF8]">
                  <TableHead className="w-[60px] text-center text-xs font-semibold text-slate-600 py-3.5 px-4">No</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-4">Nama Produk / Menu</TableHead>
                  <TableHead className="text-center w-[130px] text-xs font-semibold text-slate-600 py-3.5 px-4">Qty Terjual</TableHead>
                  <TableHead className="text-right w-[160px] text-xs font-semibold text-slate-600 py-3.5 px-4">Total Omzet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#EAEFF8]">
                {soldProducts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-xs text-slate-400">
                      Tidak ada data produk terjual pada shift ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  soldProducts?.map((item: any, idx: number) => (
                    <TableRow key={item.productId || idx} className="text-xs hover:bg-slate-50/70 transition-colors">
                      <TableCell className="py-3 px-4 text-center font-financial text-slate-400 tabular-nums">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="py-3 px-4 font-semibold text-slate-900">
                        {item.name}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center font-financial font-semibold text-slate-800 tabular-nums">
                        {item.totalQuantity} pcs
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right font-financial font-semibold text-slate-900 tabular-nums">
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b border-[#EAEFF8]">
                  <TableHead className="w-[90px] text-xs font-semibold text-slate-600 py-3.5 px-4">Jam</TableHead>
                  <TableHead className="w-[130px] text-xs font-semibold text-slate-600 py-3.5 px-4">Tipe Kas</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-4">Keterangan / Keperluan</TableHead>
                  <TableHead className="text-right w-[160px] text-xs font-semibold text-slate-600 py-3.5 px-4">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#EAEFF8]">
                {cashMovements?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-xs text-slate-400">
                      Tidak ada catatan kas masuk atau keluar pada shift ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  cashMovements?.map((move: any) => (
                    <TableRow key={move.id} className="text-xs hover:bg-slate-50/70 transition-colors">
                      <TableCell className="py-3 px-4 font-financial text-slate-500 tabular-nums">
                        {move.createdAt ? format(new Date(move.createdAt), 'HH:mm') : '-'}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        {move.type === 'IN' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border-none">
                            Kas Masuk
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border-none">
                            Kas Keluar
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4 font-medium text-slate-800">
                        {move.description || '-'}
                      </TableCell>
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
    </div>
  );
}
