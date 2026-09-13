'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  History,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Package,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import dynamic from 'next/dynamic';

const DataTable = dynamic(
  () => import('@/components/ui/data-table').then((mod) => mod.DataTable),
  { ssr: false, loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-xl"></div> }
);
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { adjustStock, StockMovementDto, getStockMovements } from '@/lib/actions/inventory';
import { toggleTrackStock } from '@/lib/actions/products';
import { toast } from 'sonner';
import { StockMovementsTable } from './stock-movements-table';
import { ProductDto } from '@menuin/types';

const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().min(1, 'Kuantitas minimal 1'),
  reason: z.string().optional(),
});

interface InventoryListProps {
  initialData: ProductDto[];
  initialMovements?: StockMovementDto[];
  summary?: {
    totalTracked: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalInThisMonth: number;
    totalOutThisMonth: number;
    totalSaleThisMonth: number;
  };
}

export function InventoryList({
  initialData,
  initialMovements = [],
  summary,
}: InventoryListProps) {
  const [inventoryList, setInventoryList] = React.useState<ProductDto[]>(initialData);
  const [movementsList, setMovementsList] = React.useState<StockMovementDto[]>(initialMovements);
  const [isAdjustOpen, setIsAdjustOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [adjustType, setAdjustType] = React.useState<'IN' | 'OUT'>('IN');
  const [selectedProduct, setSelectedProduct] = React.useState<ProductDto | null>(null);
  const [productMovements, setProductMovements] = React.useState<StockMovementDto[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setInventoryList(initialData);
  }, [initialData]);

  React.useEffect(() => {
    setMovementsList(initialMovements);
  }, [initialMovements]);

  const form = useForm<z.infer<typeof adjustStockSchema>>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: { productId: '', type: 'IN', quantity: 1, reason: '' },
  });

  const onSubmitAdjust = async (values: z.infer<typeof adjustStockSchema>) => {
    setIsLoading(true);
    const result = await adjustStock(values);
    setIsLoading(false);

    if (result.success) {
      toast.success(
        values.type === 'IN' ? 'Stok masuk berhasil dicatat' : 'Stok keluar berhasil dicatat'
      );
      setIsAdjustOpen(false);
      form.reset();

      // Refresh movements
      const updatedMovements = await getStockMovements({ limit: 200 });
      if (updatedMovements.success && updatedMovements.data) {
        setMovementsList(updatedMovements.data);
      }
    } else {
      toast.error(result.error);
    }
  };

  const handleAdjustClick = (product: ProductDto, type: 'IN' | 'OUT') => {
    setSelectedProduct(product);
    setAdjustType(type);
    form.reset({
      productId: product.id,
      type,
      quantity: 1,
      reason: type === 'IN' ? 'Barang masuk / Pembelian' : 'Barang rusak / Kadaluarsa',
    });
    setIsAdjustOpen(true);
  };

  const handleViewHistoryClick = async (product: ProductDto) => {
    setSelectedProduct(product);
    setIsHistoryOpen(true);
    setIsLoadingHistory(true);
    const res = await getStockMovements({ productId: product.id, limit: 50 });
    setIsLoadingHistory(false);
    if (res.success && res.data) {
      setProductMovements(res.data);
    }
  };

  const handleToggleTrackStock = async (product: ProductDto, currentValue: boolean) => {
    const newValue = !currentValue;
    setInventoryList((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, trackStock: newValue } : p))
    );

    const result = await toggleTrackStock(product.id, newValue);
    if (!result.success) {
      toast.error(result.error || 'Gagal mengubah status pelacakan stok');
      setInventoryList((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, trackStock: currentValue } : p))
      );
    } else {
      toast.success(
        newValue
          ? `Lacak stok aktif untuk ${product.name} (stok akan berkurang saat kasir checkout)`
          : `Lacak stok dinonaktifkan untuk ${product.name} (stok tanpa batas & tidak berkurang)`
      );
    }
  };

  const columns: ColumnDef<ProductDto>[] = [
    {
      accessorKey: 'name',
      header: 'Nama Item',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-2.5">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-9 h-9 rounded-lg object-cover border shrink-0"
              />
            ) : (
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {product.name.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-semibold text-sm block text-foreground">{product.name}</span>
              {product.categoryName && (
                <span className="text-xs text-muted-foreground">{product.categoryName}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'stock',
      header: 'Sisa Stok',
      cell: ({ row }) => {
        const product = row.original;
        const isTracked = product.trackStock !== false;

        if (!isTracked) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50">
              Tanpa Batas
            </span>
          );
        }

        const stock = product.stock ?? 0;
        const minStock = product.minStock ?? 5;
        const isLow = stock <= minStock;

        return (
          <div className="flex items-center gap-2">
            <span className={`text-base font-bold ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
              {stock}
            </span>
            {isLow && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">
                Perlu Restock
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'minStock',
      header: 'Batas Minimum',
      cell: ({ row }) => {
        const product = row.original;
        if (product.trackStock === false) return <span className="text-muted-foreground text-xs">-</span>;
        return <span className="text-xs text-muted-foreground font-medium">{product.minStock ?? 5} unit</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const product = row.original;
        const isTracked = product.trackStock !== false;

        if (!isTracked) {
          return (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              Selalu Siap
            </span>
          );
        }

        const stock = product.stock ?? 0;
        const minStock = product.minStock ?? 5;

        if (stock <= 0) {
          return (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200">
              Habis
            </span>
          );
        }

        if (stock <= minStock) {
          return (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
              Menipis
            </span>
          );
        }

        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
            Tersedia
          </span>
        );
      },
    },
    {
      id: 'quickActions',
      header: 'Kelola Stok',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAdjustClick(product, 'IN')}
              className="h-8 text-xs font-medium gap-1 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
            >
              <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-600" />
              Masuk
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAdjustClick(product, 'OUT')}
              className="h-8 text-xs font-medium gap-1 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-800"
            >
              <ArrowUpCircle className="w-3.5 h-3.5 text-rose-600" />
              Keluar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleViewHistoryClick(product)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Lihat riwayat mutasi item ini"
            >
              <History className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
    {
      id: 'moreActions',
      cell: ({ row }) => {
        const product = row.original;
        const isTracked = product.trackStock !== false;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Buka menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Opsi Stok</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewHistoryClick(product)}>
                <History className="mr-2 h-4 w-4 text-blue-600" />
                Lihat Riwayat Distribusi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleTrackStock(product, isTracked)}>
                <Boxes className="mr-2 h-4 w-4 text-primary" />
                {isTracked ? 'Nonaktifkan Lacak Stok (Tanpa Batas)' : 'Aktifkan Lacak Stok'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen & Distribusi Stok</h1>
          <p className="text-sm text-muted-foreground">
            Pantau pergerakan stok keluar/masuk, penjualan kasir, dan penyesuaian opname secara real-time.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Produk Dilacak
              <Package className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {summary?.totalTracked ?? inventoryList.filter((p) => p.trackStock !== false).length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Total item aktif</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Perlu Restock
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary?.lowStockCount ??
                inventoryList.filter((p) => p.trackStock !== false && p.stock <= (p.minStock ?? 5) && p.stock > 0).length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Stok di bawah batas minimum</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Stok Masuk (Bln Ini)
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              +{summary?.totalInThisMonth ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Total kuantitas barang masuk</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Keluar & Terjual
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              -{(summary?.totalOutThisMonth ?? 0) + (summary?.totalSaleThisMonth ?? 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Penjualan & barang keluar</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md h-11 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="status" className="rounded-lg text-xs font-semibold gap-2 data-[state=active]:shadow-sm">
            <Boxes className="w-4 h-4" />
            Status & Penyesuaian Stok
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-xs font-semibold gap-2 data-[state=active]:shadow-sm">
            <History className="w-4 h-4" />
            Riwayat Distribusi Mutasi
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Current Stock */}
        <TabsContent value="status" className="space-y-4">
          <DataTable
            columns={columns}
            data={inventoryList}
            searchKey="name"
            searchPlaceholder="Cari nama produk stok..."
          />
        </TabsContent>

        {/* Tab 2: Stock Movements History */}
        <TabsContent value="history" className="space-y-4">
          <StockMovementsTable initialData={movementsList} />
        </TabsContent>
      </Tabs>

      {/* Modal Penyesuaian Stok (Masuk / Keluar) */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {adjustType === 'IN' ? (
                <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <ArrowUpCircle className="w-5 h-5 text-rose-600" />
              )}
              {adjustType === 'IN' ? 'Catat Stok Masuk' : 'Catat Stok Keluar'}
            </DialogTitle>
            <DialogDescription>
              Penyesuaian stok untuk produk <b>{selectedProduct?.name}</b> (Sisa saat ini: {selectedProduct?.stock ?? 0})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmitAdjust)}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Kuantitas {adjustType === 'IN' ? 'Masuk' : 'Keluar'}</Label>
                <Input
                  id="quantity"
                  type="number"
                  {...form.register('quantity')}
                  min="1"
                  className="text-lg font-bold"
                />
                {form.formState.errors.quantity && (
                  <p className="text-sm text-destructive">{form.formState.errors.quantity.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Catatan / Alasan Distribusi</Label>
                <Input
                  id="reason"
                  {...form.register('reason')}
                  placeholder={
                    adjustType === 'IN'
                      ? 'Misal: Pembelian bahan baku dari supplier'
                      : 'Misal: Barang basi, rusak, atau terbuang'
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAdjustOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className={adjustType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Mutasi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Riwayat Mutasi Spesifik Per Item */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Riwayat Distribusi: {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Catatan mutasi stok keluar, masuk, penjualan kasir, dan pesanan online untuk item ini.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 py-2 pr-1 space-y-3">
            {isLoadingHistory ? (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                Memuat riwayat mutasi...
              </div>
            ) : productMovements.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-sm text-muted-foreground">
                <Layers className="w-8 h-8 text-muted-foreground/50 mb-2" />
                Belum ada catatan mutasi untuk produk ini.
              </div>
            ) : (
              productMovements.map((m) => {
                const isPositive = m.type === 'IN';
                return (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border bg-card/60 flex items-center justify-between text-xs gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            m.type === 'IN'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : m.type === 'SALE'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {m.type === 'IN' ? 'Masuk' : m.type === 'SALE' ? 'Penjualan' : 'Keluar'}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(m.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="font-medium text-foreground mt-1">{m.reason || 'Tidak ada catatan'}</p>
                      <span className="text-[11px] text-muted-foreground">Oleh: {m.actorName || 'Sistem'}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-base font-bold ${
                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {m.previousStock} ➔ <b>{m.currentStock}</b>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
