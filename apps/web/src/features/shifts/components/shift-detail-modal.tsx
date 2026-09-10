'use client';

import * as React from 'react';
import { getShiftDetails } from '@/lib/actions/shifts';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { format, formatDistanceStrict } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils/format';
import {
  Loader2,
  Receipt,
  Package,
  ShoppingBag,
  CreditCard,
  Banknote,
  User,
  Clock,
  Store,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Printer,
  X
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
      <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl shadow-2xl border bg-background">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                SHIFT #{shift?.id?.slice(0, 8).toUpperCase() || '...'}
              </span>
              {shift?.status === 'ACTIVE' ? (
                <Badge className="bg-emerald-500 text-white gap-1 text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Sedang Aktif
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[11px] font-medium">
                  Shift Selesai
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <User className="w-3.5 h-3.5 text-primary" />
                {shift?.cashierName || 'Kasir'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-muted-foreground" />
                {shift?.restaurantName || 'Outlet'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
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
              className="text-xs gap-1.5 h-8 print:hidden"
              onClick={handlePrint}
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Rekap
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[380px] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-medium">Memuat rincian shift kasir...</p>
          </div>
        ) : data ? (
          <ScrollArea className="flex-1 px-6 py-5">
            {/* 3 Metric Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              
              {/* KARTU 1: AKTIVITAS PENJUALAN */}
              <div className="rounded-2xl border bg-card p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Penjualan
                        </h4>
                        <span className="text-[10px] text-muted-foreground">Volume Order</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {metrics.totalTransactions} Transaksi
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs py-0.5">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Transaksi Selesai</span>
                      <span className="font-mono font-semibold">{metrics.totalTransactions} Order</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Produk Terjual</span>
                      <span className="font-mono font-semibold">{metrics.totalItemsSold} pcs</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Penjualan Online</span>
                      <span className="font-mono text-muted-foreground">{formatCurrency(metrics.totalOnlineSales || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t flex justify-between items-baseline bg-muted/30 -mx-4 -mb-4 p-3 rounded-b-2xl">
                  <span className="text-[11px] font-medium text-muted-foreground">Rata-rata Order (AOV)</span>
                  <span className="text-xs font-bold font-mono text-foreground">
                    {formatCurrency(metrics.totalTransactions > 0 ? Math.round(metrics.totalSales / metrics.totalTransactions) : 0)}
                  </span>
                </div>
              </div>

              {/* KARTU 2: RINCIAN METODE BAYAR */}
              <div className="rounded-2xl border bg-card p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Pendapatan
                        </h4>
                        <span className="text-[10px] text-muted-foreground">Metode Bayar</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded">
                      Omzet Bersih
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs py-0.5">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Tunai (Cash)
                      </span>
                      <span className="font-mono font-semibold">{formatCurrency(metrics.totalCashSales || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> QRIS
                      </span>
                      <span className="font-mono font-semibold">{formatCurrency(metrics.totalQrisSales || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Transfer / EDC
                      </span>
                      <span className="font-mono font-semibold">
                        {formatCurrency((metrics.totalTransferSales || 0) + (metrics.totalDebitSales || 0))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t flex justify-between items-baseline bg-muted/30 -mx-4 -mb-4 p-3 rounded-b-2xl">
                  <span className="text-[11px] font-bold text-foreground">Total Omzet</span>
                  <span className="text-sm font-bold font-mono text-primary">
                    {formatCurrency(metrics.totalSales || 0)}
                  </span>
                </div>
              </div>

              {/* KARTU 3: REKONSILIASI KAS LACI */}
              <div className="rounded-2xl border bg-card p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Kas di Laci
                        </h4>
                        <span className="text-[10px] text-muted-foreground">Uang Fisik Kasir</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono">
                      Cash Drawer
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Modal Awal Kas</span>
                      <span className="font-mono">{formatCurrency(metrics.startingCash || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Penjualan Tunai (+)</span>
                      <span className="font-mono text-emerald-600">+{formatCurrency(metrics.totalCashSales || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Kas Masuk (+)</span>
                      <span className="font-mono text-emerald-600">+{formatCurrency(metrics.totalCashIn || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Kas Keluar (-)</span>
                      <span className="font-mono text-rose-600">-{formatCurrency(metrics.totalCashOut || 0)}</span>
                    </div>
                    <div className="pt-1 border-t flex justify-between items-center font-medium">
                      <span className="text-muted-foreground">Ekspektasi Kas Laci</span>
                      <span className="font-mono font-semibold">{formatCurrency(metrics.expectedCash || 0)}</span>
                    </div>
                    {shift?.status === 'ENDED' && (
                      <div className="flex justify-between items-center font-semibold text-foreground">
                        <span>Kas Aktual Dihitung</span>
                        <span className="font-mono text-primary">{formatCurrency(metrics.actualCash || 0)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t flex justify-between items-center bg-emerald-500/5 -mx-4 -mb-4 p-3 rounded-b-2xl border-emerald-500/20">
                  <span className="text-xs font-semibold">Selisih Kas</span>
                  {shift?.status === 'ACTIVE' ? (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Shift Berjalan
                    </Badge>
                  ) : metrics.cashDifference === 0 ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-xs font-mono font-bold">
                      Pas (Rp 0)
                    </Badge>
                  ) : metrics.cashDifference < 0 ? (
                    <Badge className="bg-rose-500/15 text-rose-600 border border-rose-500/30 text-xs font-mono font-bold">
                      Kurang {formatCurrency(Math.abs(metrics.cashDifference))}
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500/15 text-blue-600 border border-blue-500/30 text-xs font-mono font-bold">
                      Lebih {formatCurrency(metrics.cashDifference)}
                    </Badge>
                  )}
                </div>
              </div>

            </div>

            {/* TABS DETAILS */}
            <Tabs defaultValue="transactions" className="w-full">
              <div className="flex items-center justify-between mb-3">
                <TabsList className="bg-muted/60 p-1 border">
                  <TabsTrigger value="transactions" className="text-xs gap-1.5 px-3">
                    <Receipt className="w-3.5 h-3.5" />
                    Daftar Transaksi ({data.transactions.length})
                  </TabsTrigger>
                  <TabsTrigger value="products" className="text-xs gap-1.5 px-3">
                    <Package className="w-3.5 h-3.5" />
                    Produk Terjual ({data.soldProducts.length})
                  </TabsTrigger>
                  <TabsTrigger value="cash" className="text-xs gap-1.5 px-3">
                    <Banknote className="w-3.5 h-3.5" />
                    Arus Kas Laci ({data.cashMovements.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: TRANSAKSI */}
              <TabsContent value="transactions" className="m-0 border rounded-2xl bg-card overflow-hidden shadow-2xs">
                <div className="max-h-[320px] overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted/40 sticky top-0 z-10">
                      <TableRow className="text-xs">
                        <TableHead className="w-[80px]">Jam</TableHead>
                        <TableHead className="w-[140px]">No. Order</TableHead>
                        <TableHead className="w-[100px]">Channel</TableHead>
                        <TableHead>Metode Bayar</TableHead>
                        <TableHead className="text-right w-[140px]">Total Belanja</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                            Belum ada transaksi pada shift ini.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.transactions.map((tx: any) => (
                          <TableRow key={tx.id} className="text-xs hover:bg-muted/40 transition-colors">
                            <TableCell className="font-mono text-muted-foreground">
                              {format(new Date(tx.createdAt), 'HH:mm:ss')}
                            </TableCell>
                            <TableCell className="font-mono font-bold">
                              {tx.orderNumber ? `#${tx.orderNumber}` : tx.id.slice(0, 8)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={tx.source === 'ONLINE' ? 'secondary' : 'outline'}
                                className="text-[10px]"
                              >
                                {tx.source === 'ONLINE' ? 'Online' : 'POS Kasir'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">{tx.paymentMethod}</span>
                                {tx.orderType && (
                                  <span className="text-[10px] text-muted-foreground">• {tx.orderType.replace('_', ' ')}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-foreground">
                              {formatCurrency(Number(tx.grandTotal))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* TAB 2: PRODUK TERJUAL */}
              <TabsContent value="products" className="m-0 border rounded-2xl bg-card overflow-hidden shadow-2xs">
                <div className="max-h-[320px] overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted/40 sticky top-0 z-10">
                      <TableRow className="text-xs">
                        <TableHead className="w-[50px] text-center">No</TableHead>
                        <TableHead>Nama Produk / Menu</TableHead>
                        <TableHead className="text-center w-[120px]">Qty Terjual</TableHead>
                        <TableHead className="text-right w-[160px]">Total Omzet</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.soldProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-10 text-xs text-muted-foreground">
                            Tidak ada data produk terjual pada shift ini.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.soldProducts.map((item: any, idx: number) => (
                          <TableRow key={idx} className="text-xs hover:bg-muted/40 transition-colors">
                            <TableCell className="text-center font-mono text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="font-bold text-foreground">{item.name}</TableCell>
                            <TableCell className="text-center font-mono font-bold">
                              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-muted text-foreground">
                                {item.totalQuantity} pcs
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-foreground">
                              {formatCurrency(Number(item.totalRevenue))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* TAB 3: ARUS KAS LACI */}
              <TabsContent value="cash" className="m-0 border rounded-2xl bg-card overflow-hidden shadow-2xs">
                <div className="max-h-[320px] overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted/40 sticky top-0 z-10">
                      <TableRow className="text-xs">
                        <TableHead className="w-[80px]">Jam</TableHead>
                        <TableHead className="w-[120px]">Tipe Kas</TableHead>
                        <TableHead>Keterangan / Keperluan</TableHead>
                        <TableHead className="text-right w-[150px]">Nominal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.cashMovements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-10 text-xs text-muted-foreground">
                            Tidak ada catatan kas masuk atau keluar pada shift ini.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.cashMovements.map((move: any) => (
                          <TableRow key={move.id} className="text-xs hover:bg-muted/40 transition-colors">
                            <TableCell className="font-mono text-muted-foreground">
                              {format(new Date(move.createdAt), 'HH:mm')}
                            </TableCell>
                            <TableCell>
                              {move.type === 'IN' ? (
                                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] gap-1">
                                  <ArrowDownLeft className="w-3 h-3" /> Kas Masuk
                                </Badge>
                              ) : (
                                <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30 text-[10px] gap-1">
                                  <ArrowUpRight className="w-3 h-3" /> Kas Keluar
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">{move.description}</TableCell>
                            <TableCell className={`text-right font-mono font-bold ${move.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {move.type === 'IN' ? '+' : '-'}{formatCurrency(Number(move.amount))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        ) : (
          <div className="p-12 text-center text-muted-foreground text-xs">
            Data shift tidak ditemukan.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
