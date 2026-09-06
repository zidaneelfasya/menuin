'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils/format';
import { startShift, endShift, addCashMovement } from '@/lib/actions/shifts';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { 
  Wallet, 
  LogOut, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Clock, 
  User, 
  History, 
  ShoppingBag, 
  CreditCard, 
  Banknote,
  Eye,
  PlusCircle,
  Calendar,
  ReceiptText,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ShiftDetailModal } from './shift-detail-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const quickDenominations = [100000, 200000, 300000, 500000, 1000000];

export function ShiftDashboard({ activeShift, shiftHistory }: { activeShift: any, shiftHistory: any[] }) {
  const [isStartModalOpen, setIsStartModalOpen] = React.useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = React.useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = React.useState(false);
  const [movementType, setMovementType] = React.useState<'IN'|'OUT'>('IN');
  const [selectedShiftId, setSelectedShiftId] = React.useState<string | null>(null);

  const [amountInput, setAmountInput] = React.useState('');
  const [descInput, setDescInput] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const amount = Number(amountInput.replace(/\D/g, '')) || 0;
    const res = await startShift(amount);
    setIsSubmitting(false);
    if (res.success) {
      toast.success('Shift berhasil dibuka!');
      setIsStartModalOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Gagal memulai shift');
    }
  };

  const handleEndShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    setIsSubmitting(true);
    const amount = Number(amountInput.replace(/\D/g, '')) || 0;
    const res = await endShift(activeShift.id, amount);
    setIsSubmitting(false);
    if (res.success) {
      toast.success('Shift berhasil ditutup!');
      setIsEndModalOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Gagal menutup shift');
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    setIsSubmitting(true);
    const amount = Number(amountInput.replace(/\D/g, '')) || 0;
    const res = await addCashMovement(activeShift.id, movementType, amount, descInput);
    setIsSubmitting(false);
    if (res.success) {
      toast.success('Pergerakan kas berhasil dicatat!');
      setIsMovementModalOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Gagal mencatat kas');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 pb-24">
      {/* Header Tokopedia Merchant Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Banknote className="w-6 h-6 text-primary" />
            Manajemen Shift Kasir
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Pantau arus kas masuk/keluar, rekonsiliasi laci kasir, dan riwayat shift harian secara akurat.
          </p>
        </div>

        {!activeShift ? (
          <Button onClick={() => { setAmountInput(''); setIsStartModalOpen(true); }} className="gap-2 shadow-xs">
            <PlusCircle className="w-4 h-4" />
            Mulai Shift Baru
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 px-3 py-1.5 text-xs font-medium shadow-xs">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Shift Aktif Berjalan
            </Badge>
          </div>
        )}
      </div>

      <Tabs defaultValue="current" className="space-y-5">
        <TabsList className="h-10 p-1 bg-muted/60 border">
          <TabsTrigger value="current" className="text-xs md:text-sm gap-2 px-4">
            <Clock className="w-4 h-4" />
            Shift Saat Ini
            {activeShift && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs md:text-sm gap-2 px-4">
            <History className="w-4 h-4" />
            Riwayat Shift ({shiftHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SHIFT SAAT INI */}
        <TabsContent value="current" className="m-0 space-y-6">
          {activeShift ? (
            <div className="space-y-6">
              {/* Active Shift Header Bar */}
              <div className="rounded-xl border bg-card p-4 md:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start md:items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        SHIFT AKTIF
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Dimulai: {format(new Date(activeShift.startTime), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </span>
                      {activeShift.cashierName && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                          <User className="w-3.5 h-3.5" />
                          {activeShift.cashierName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Modal Kas Awal: <span className="font-mono font-semibold text-foreground">{formatCurrency(Number(activeShift.startingCash))}</span>
                    </p>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs gap-1.5 border-emerald-600/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    onClick={() => {
                      setMovementType('IN');
                      setAmountInput('');
                      setDescInput('');
                      setIsMovementModalOpen(true);
                    }}
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
                    + Kas Masuk (In)
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs gap-1.5 border-amber-600/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    onClick={() => {
                      setMovementType('OUT');
                      setAmountInput('');
                      setDescInput('');
                      setIsMovementModalOpen(true);
                    }}
                  >
                    <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-600" />
                    - Kas Keluar (Out)
                  </Button>
                  <Button 
                    variant="destructive"
                    size="sm"
                    className="text-xs gap-1.5 shadow-xs"
                    onClick={() => {
                      setAmountInput(activeShift.metrics.expectedCash.toString());
                      setIsEndModalOpen(true);
                    }}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Akhiri Shift
                  </Button>
                </div>
              </div>

              {/* 3 Metric Cards - Structured & Mathematically Sound */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* KARTU 1: AKTIVITAS & VOLUME ORDER */}
                <div className="rounded-xl border bg-card p-4 md:p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Aktivitas Penjualan
                          </h4>
                          <span className="text-[11px] text-muted-foreground">Volume Transaksi</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        {activeShift.metrics.totalTransactions} Order
                      </Badge>
                    </div>

                    <div className="space-y-2.5 text-xs py-1">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Transaksi Selesai</span>
                        <span className="font-mono font-semibold text-foreground">{activeShift.metrics.totalTransactions} Order</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Produk Terjual</span>
                        <span className="font-mono font-semibold text-foreground">{activeShift.metrics.totalItemsSold} Item</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Pesanan POS (Kasir)</span>
                        <span className="font-mono font-medium text-foreground">{activeShift.metrics.totalPosOrders || 0} Order</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Pesanan Online</span>
                        <span className="font-mono font-medium text-foreground">{activeShift.metrics.totalOnlineOrders || 0} Order</span>
                      </div>
                      {activeShift.metrics.pendingOrdersCount > 0 && (
                        <div className="flex justify-between items-center pt-1 border-t border-dashed">
                          <span className="text-amber-600 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Menunggu Bayar
                          </span>
                          <Badge variant="outline" className="text-amber-600 border-amber-300 font-mono text-[10px]">
                            {activeShift.metrics.pendingOrdersCount} Order
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex justify-between items-baseline bg-muted/30 -mx-4 md:-mx-5 -mb-4 md:-mb-5 p-4 md:p-5 rounded-b-xl">
                    <span className="text-xs font-medium text-muted-foreground">Rata-rata per Order (AOV)</span>
                    <span className="text-sm font-bold font-mono text-foreground">
                      {formatCurrency(activeShift.metrics.averageOrderValue || 0)}
                    </span>
                  </div>
                </div>

                {/* KARTU 2: RINCIAN PENDAPATAN (OMZET) */}
                <div className="rounded-xl border bg-card p-4 md:p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Rincian Pembayaran
                          </h4>
                          <span className="text-[11px] text-muted-foreground">Metode Bayar</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-purple-600 font-semibold bg-purple-500/10 px-2 py-0.5 rounded">
                        Non-Tunai: {formatCurrency(activeShift.metrics.totalNonCashSales || 0)}
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs py-1">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Tunai (Cash)
                        </span>
                        <span className="font-mono font-semibold text-foreground">{formatCurrency(activeShift.metrics.totalCashSales || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" /> QRIS
                        </span>
                        <span className="font-mono font-semibold text-foreground">{formatCurrency(activeShift.metrics.totalQrisSales || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" /> Transfer / Debit
                        </span>
                        <span className="font-mono font-semibold text-foreground">
                          {formatCurrency((activeShift.metrics.totalTransferSales || 0) + (activeShift.metrics.totalDebitSales || 0))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-dashed text-muted-foreground">
                        <span>Total Non-Tunai</span>
                        <span className="font-mono text-purple-600 font-medium">
                          {formatCurrency(activeShift.metrics.totalNonCashSales || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex justify-between items-baseline bg-purple-500/5 -mx-4 md:-mx-5 -mb-4 md:-mb-5 p-4 md:p-5 rounded-b-xl border-purple-500/20">
                    <div>
                      <span className="text-xs font-bold text-foreground block">Total Pendapatan (Omzet)</span>
                      <span className="text-[10px] text-muted-foreground">Tunai + Non-Tunai</span>
                    </div>
                    <span className="text-base md:text-lg font-bold font-mono text-primary">
                      {formatCurrency(activeShift.metrics.totalSales || 0)}
                    </span>
                  </div>
                </div>

                {/* KARTU 3: REKONSILIASI KAS LACI */}
                <div className="rounded-xl border bg-card p-4 md:p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <Banknote className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Rekonsiliasi Kas Laci
                          </h4>
                          <span className="text-[11px] text-muted-foreground">Uang Fisik Kasir</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-[10px]">
                        Arus Kas
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs py-1">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Modal Kas Awal</span>
                        <span className="font-mono font-medium">{formatCurrency(Number(activeShift.startingCash))}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Penjualan Tunai</span>
                        <span className="font-mono font-semibold text-emerald-600">+{formatCurrency(activeShift.metrics.totalCashSales || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Kas Masuk (In)</span>
                        <span className="font-mono font-medium text-emerald-600">+{formatCurrency(activeShift.metrics.totalCashIn || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Kas Keluar (Out)</span>
                        <span className="font-mono font-medium text-destructive">-{formatCurrency(activeShift.metrics.totalCashOut || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex justify-between items-baseline bg-emerald-500/5 -mx-4 md:-mx-5 -mb-4 md:-mb-5 p-4 md:p-5 rounded-b-xl border-emerald-500/20">
                    <div>
                      <span className="text-xs font-bold text-foreground block">Ekspektasi Uang di Laci</span>
                      <span className="text-[10px] text-muted-foreground">Uang fisik wajib cocok</span>
                    </div>
                    <span className="text-base md:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(activeShift.metrics.expectedCash || 0)}
                    </span>
                  </div>
                </div>

              </div>

              {/* LIVE SHIFT FEED: TRANSAKSI & PERGERAKAN KAS */}
              <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
                <Tabs defaultValue="transactions" className="w-full">
                  <div className="px-4 md:px-5 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">Aktivitas Live Shift Ini</h3>
                    </div>
                    <TabsList className="h-8 p-1 bg-muted/60 border self-start sm:self-auto">
                      <TabsTrigger value="transactions" className="text-xs gap-1.5 px-3 h-6">
                        <ReceiptText className="w-3.5 h-3.5" />
                        Transaksi ({activeShift.transactions?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="movements" className="text-xs gap-1.5 px-3 h-6">
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        Pergerakan Kas ({activeShift.cashMovements?.length || 0})
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* SUB-TAB 1: TRANSAKSI SHIFT */}
                  <TabsContent value="transactions" className="m-0">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="text-xs">
                          <TableHead className="w-[120px]">Waktu</TableHead>
                          <TableHead className="w-[140px]">No. Order</TableHead>
                          <TableHead>Pelanggan</TableHead>
                          <TableHead className="w-[100px]">Channel</TableHead>
                          <TableHead className="w-[120px]">Metode</TableHead>
                          <TableHead className="w-[120px]">Status</TableHead>
                          <TableHead className="w-[140px] text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!activeShift.transactions || activeShift.transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                              Belum ada transaksi pada shift ini. Transaksi baru di POS akan otomatis muncul di sini.
                            </TableCell>
                          </TableRow>
                        ) : (
                          activeShift.transactions.map((tx: any) => (
                            <TableRow key={tx.id} className="text-xs hover:bg-muted/30 transition-colors">
                              <TableCell className="text-muted-foreground font-mono">
                                {format(new Date(tx.createdAt), 'HH:mm:ss')}
                              </TableCell>
                              <TableCell className="font-mono font-medium text-foreground">
                                {tx.orderNumber ? `#${tx.orderNumber}` : tx.id.slice(0, 8)}
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">{tx.customerName || 'Pelanggan'}</span>
                                {tx.tableNumber && (
                                  <span className="text-[11px] text-muted-foreground block">Meja {tx.tableNumber}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={tx.source === 'ONLINE' ? 'secondary' : 'outline'} className="text-[10px]">
                                  {tx.source}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium uppercase text-muted-foreground">{tx.paymentMethod}</span>
                              </TableCell>
                              <TableCell>
                                {tx.paymentStatus === 'PAID' ? (
                                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Lunas
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px] gap-1">
                                    <AlertCircle className="w-3 h-3" /> Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold text-foreground">
                                {formatCurrency(Number(tx.grandTotal))}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  {/* SUB-TAB 2: PERGERAKAN KAS */}
                  <TabsContent value="movements" className="m-0">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="text-xs">
                          <TableHead className="w-[120px]">Waktu</TableHead>
                          <TableHead className="w-[140px]">Jenis</TableHead>
                          <TableHead>Keterangan</TableHead>
                          <TableHead className="w-[140px] text-right">Nominal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!activeShift.cashMovements || activeShift.cashMovements.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-10 text-xs text-muted-foreground">
                              Belum ada pergerakan kas masuk atau keluar yang dicatat pada shift ini.
                            </TableCell>
                          </TableRow>
                        ) : (
                          activeShift.cashMovements.map((m: any) => (
                            <TableRow key={m.id} className="text-xs hover:bg-muted/30 transition-colors">
                              <TableCell className="text-muted-foreground font-mono">
                                {format(new Date(m.createdAt), 'HH:mm:ss')}
                              </TableCell>
                              <TableCell>
                                {m.type === 'IN' ? (
                                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] gap-1">
                                    <ArrowDownToLine className="w-3 h-3" /> Kas Masuk
                                  </Badge>
                                ) : (
                                  <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] gap-1">
                                    <ArrowUpFromLine className="w-3 h-3" /> Kas Keluar
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="font-medium text-foreground">
                                {m.description}
                              </TableCell>
                              <TableCell className={`text-right font-mono font-semibold ${m.type === 'IN' ? 'text-emerald-600' : 'text-destructive'}`}>
                                {m.type === 'IN' ? '+' : '-'}{formatCurrency(Number(m.amount))}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center text-center space-y-4 bg-muted/20 rounded-xl border border-dashed p-6">
              <div className="w-14 h-14 bg-background rounded-full flex items-center justify-center shadow-xs border text-muted-foreground">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-base md:text-lg">Tidak Ada Shift Aktif</h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-[360px]">
                  Buka shift kasir terlebih dahulu untuk mulai mencatat transaksi penjualan dan rekonsiliasi kas di POS.
                </p>
              </div>
              <Button onClick={() => { setAmountInput(''); setIsStartModalOpen(true); }} size="default" className="mt-4 px-6 gap-2 shadow-xs">
                <PlusCircle className="w-4 h-4" />
                Buka Shift Sekarang
              </Button>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: RIWAYAT SHIFT (Tokopedia Style Table) */}
        <TabsContent value="history" className="m-0">
          <div className="border rounded-xl bg-card overflow-hidden shadow-2xs">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="text-xs">
                  <TableHead className="w-[180px]">Waktu Shift</TableHead>
                  <TableHead className="w-[140px]">Kasir</TableHead>
                  <TableHead className="w-[140px]">Total Omset</TableHead>
                  <TableHead className="w-[160px]">Ekspektasi Kas</TableHead>
                  <TableHead className="w-[160px]">Kas Aktual</TableHead>
                  <TableHead className="w-[130px]">Selisih Kas</TableHead>
                  <TableHead className="w-[100px] text-center">Status</TableHead>
                  <TableHead className="w-[110px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shiftHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground">
                      Belum ada riwayat shift yang tersimpan.
                    </TableCell>
                  </TableRow>
                ) : (
                  shiftHistory.map((shift) => {
                    const diff = Number(shift.cashDifference);
                    return (
                      <TableRow 
                        key={shift.id} 
                        className="text-xs hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedShiftId(shift.id)}
                      >
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {format(new Date(shift.startTime), 'dd MMM yyyy', { locale: id })}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {format(new Date(shift.startTime), 'HH:mm')} - {shift.endTime ? format(new Date(shift.endTime), 'HH:mm') : 'Sekarang'}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5 font-medium">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {shift.cashierName || 'Kasir'}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-mono font-semibold text-foreground">
                            {formatCurrency(Number(shift.totalSales) || 0)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {shift.totalTransactions || 0} Transaksi
                          </div>
                        </TableCell>

                        <TableCell className="font-mono">
                          {formatCurrency(Number(shift.expectedCash) || Number(shift.startingCash))}
                        </TableCell>

                        <TableCell className="font-mono font-medium">
                          {shift.status === 'ACTIVE' ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            formatCurrency(Number(shift.actualCash) || 0)
                          )}
                        </TableCell>

                        <TableCell>
                          {shift.status === 'ACTIVE' ? (
                            <span className="text-muted-foreground font-mono text-[11px]">-</span>
                          ) : diff === 0 ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-[10px] font-mono font-semibold">
                              Pas (Rp 0)
                            </Badge>
                          ) : diff < 0 ? (
                            <Badge variant="destructive" className="text-[10px] font-mono font-semibold">
                              {formatCurrency(diff)}
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-500/15 text-blue-600 border border-blue-500/30 text-[10px] font-mono font-semibold">
                              +{formatCurrency(diff)}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          {shift.status === 'ACTIVE' ? (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px]">
                              Aktif
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Selesai
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedShiftId(shift.id);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* START SHIFT MODAL */}
      <Dialog open={isStartModalOpen} onOpenChange={setIsStartModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleStartShift}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                Mulai Shift Kasir
              </DialogTitle>
              <DialogDescription>
                Masukkan nominal modal kas awal (uang kembalian) yang disiapkan di laci kasir.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startingCash">Modal Awal Kas (Rp)</Label>
                <Input 
                  id="startingCash"
                  type="number" 
                  min="0" 
                  placeholder="Contoh: 300000"
                  value={amountInput} 
                  onChange={e => setAmountInput(e.target.value)} 
                  required 
                  autoFocus
                  className="font-mono text-base"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-muted-foreground">Pilihan Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickDenominations.map((denom) => (
                    <Button
                      key={denom}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 font-mono"
                      onClick={() => setAmountInput(denom.toString())}
                    >
                      {formatCurrency(denom)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsStartModalOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>Buka Shift</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* END SHIFT MODAL */}
      <Dialog open={isEndModalOpen} onOpenChange={setIsEndModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEndShift}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <LogOut className="w-5 h-5" />
                Tutup & Akhiri Shift
              </DialogTitle>
              <DialogDescription>
                Hitung seluruh uang fisik (kertas dan koin) di laci kasir dan masukkan nominal aktualnya di bawah.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-muted/50 p-3.5 rounded-lg flex justify-between items-center border">
                <div>
                  <span className="text-xs text-muted-foreground block">Ekspektasi Kas Sistem:</span>
                  <span className="text-[11px] text-muted-foreground">Modal + Tunai + Kas Masuk - Kas Keluar</span>
                </div>
                <span className="text-base font-bold font-mono text-emerald-600">
                  {formatCurrency(activeShift?.metrics?.expectedCash || 0)}
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualCash">Uang Fisik Aktual di Laci (Rp)</Label>
                <Input 
                  id="actualCash"
                  type="number" 
                  min="0" 
                  value={amountInput} 
                  onChange={e => setAmountInput(e.target.value)} 
                  required 
                  className="text-base font-mono font-bold" 
                  autoFocus
                />
              </div>
              {amountInput && (
                <div className={`text-xs p-3 rounded-md border font-mono font-semibold flex items-center justify-between ${Number(amountInput) === (activeShift?.metrics?.expectedCash || 0) ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : Number(amountInput) < (activeShift?.metrics?.expectedCash || 0) ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-blue-500/10 border-blue-500/20 text-blue-600'}`}>
                  <span>Selisih:</span>
                  <span>
                    {Number(amountInput) === (activeShift?.metrics?.expectedCash || 0) 
                      ? 'Pas (Rp 0)' 
                      : formatCurrency(Number(amountInput) - (activeShift?.metrics?.expectedCash || 0))}
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEndModalOpen(false)}>Batal</Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>Konfirmasi & Tutup</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CASH MOVEMENT MODAL */}
      <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleMovement}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {movementType === 'IN' ? (
                  <>
                    <ArrowDownToLine className="w-5 h-5 text-emerald-600" />
                    Catat Kas Masuk (Cash In)
                  </>
                ) : (
                  <>
                    <ArrowUpFromLine className="w-5 h-5 text-destructive" />
                    Catat Kas Keluar (Cash Out)
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {movementType === 'IN' 
                  ? 'Catat penambahan modal atau uang masuk ke laci selain dari transaksi kasir.' 
                  : 'Catat pengeluaran uang dari laci kasir (misal: beli es batu, gas LPG, atau kasbon).'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="movementAmount">Nominal (Rp)</Label>
                <Input 
                  id="movementAmount"
                  type="number" 
                  min="1" 
                  placeholder="Contoh: 50000"
                  value={amountInput} 
                  onChange={e => setAmountInput(e.target.value)} 
                  required 
                  autoFocus 
                  className="font-mono text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="movementDesc">Keterangan / Alasan</Label>
                <Input 
                  id="movementDesc"
                  type="text" 
                  value={descInput} 
                  onChange={e => setDescInput(e.target.value)} 
                  required 
                  placeholder="Cth: Tambah uang kembalian / Beli gas LPG" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMovementModalOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>Simpan Pergerakan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {selectedShiftId && (
        <ShiftDetailModal shiftId={selectedShiftId} onClose={() => setSelectedShiftId(null)} />
      )}
    </div>
  );
}
