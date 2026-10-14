'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Search, Archive, ArrowDownCircle, ArrowUpCircle, Boxes } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { adjustStock } from '@/lib/actions/inventory';
import { toggleTrackStock } from '@/lib/actions/products';
import { toast } from 'sonner';

type Product = {
  id: string;
  sku: string;
  name: string;
  stock: number;
  minStock: number;
  status: string;
  trackStock?: boolean;
};

const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().min(1, 'Kuantitas minimal 1'),
  reason: z.string().optional(),
});

export function InventoryList({ initialData }: { initialData: Product[] }) {
  const [inventoryList, setInventoryList] = React.useState<Product[]>(initialData);
  const [isAdjustOpen, setIsAdjustOpen] = React.useState(false);
  const [adjustType, setAdjustType] = React.useState<'IN' | 'OUT'>('IN');
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setInventoryList(initialData);
  }, [initialData]);

  const form = useForm<z.infer<typeof adjustStockSchema>>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: { productId: '', type: 'IN', quantity: 1, reason: '' },
  });

  const onSubmitAdjust = async (values: z.infer<typeof adjustStockSchema>) => {
    setIsLoading(true);
    const result = await adjustStock(values);
    setIsLoading(false);
    
    if (result.success) {
      toast.success(values.type === 'IN' ? 'Stok masuk berhasil dicatat' : 'Stok keluar berhasil dicatat');
      setIsAdjustOpen(false);
      form.reset();
    } else {
      toast.error(result.error);
    }
  };

  const handleAdjustClick = (product: Product, type: 'IN' | 'OUT') => {
    setSelectedProduct(product);
    setAdjustType(type);
    form.reset({
      productId: product.id,
      type,
      quantity: 1,
      reason: type === 'IN' ? 'Barang masuk' : 'Barang rusak/expired',
    });
    setIsAdjustOpen(true);
  };

  const handleToggleTrackStock = async (product: Product, currentValue: boolean) => {
    const newValue = !currentValue;
    // Optimistic UI update
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

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'sku',
      header: 'SKU',
    },
    {
      accessorKey: 'name',
      header: 'Nama Produk',
      cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>
    },
    {
      accessorKey: 'stock',
      header: 'Sisa Stok',
      cell: ({ row }) => {
        const product = row.original;
        const isTracked = product.trackStock !== false;

        if (!isTracked) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-100/80 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
              Tanpa Batas
            </span>
          );
        }

        const stock = parseInt(row.getValue('stock'));
        const minStock = product.minStock;
        
        let textColor = 'text-foreground';
        if (stock <= minStock && stock > 0) textColor = 'text-amber-600 font-semibold';
        if (stock === 0) textColor = 'text-rose-600 font-semibold';
        
        return <div className={`text-base font-semibold ${textColor}`}>{stock}</div>;
      },
    },
    {
      accessorKey: 'minStock',
      header: 'Batas Minimum',
      cell: ({ row }) => {
        const product = row.original;
        if (product.trackStock === false) return <span className="text-muted-foreground text-xs">-</span>;
        return <span>{row.getValue('minStock')}</span>;
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const product = row.original;
        const isTracked = product.trackStock !== false;

        if (!isTracked) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-100/80 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
              Selalu Ada
            </span>
          );
        }

        const stock = parseInt(row.getValue('stock'));
        const minStock = product.minStock;
        
        let badgeClass = 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300';
        let text = 'Aman';
        
        if (stock === 0) {
          badgeClass = 'bg-rose-100/80 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300';
          text = 'Habis';
        } else if (stock <= minStock) {
          badgeClass = 'bg-amber-100/80 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300';
          text = 'Menipis';
        }
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium ${badgeClass}`}>
            {text}
          </span>
        );
      },
    },
    {
      id: 'actions',
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
              <DropdownMenuLabel>Kelola Stok</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleToggleTrackStock(product, isTracked)}>
                <Boxes className="mr-2 h-4 w-4 text-blue-600" />
                {isTracked ? 'Nonaktifkan Lacak Stok (Tanpa Batas)' : 'Aktifkan Lacak Stok'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-success cursor-pointer" onClick={() => handleAdjustClick(product, 'IN')}>
                <ArrowUpCircle className="mr-2 h-4 w-4" /> Stok Masuk
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleAdjustClick(product, 'OUT')}>
                <ArrowDownCircle className="mr-2 h-4 w-4" /> Stok Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manajemen Stok</h1>
          <p className="text-sm text-muted-foreground">Pantau sisa stok, status ketersediaan, dan atur apakah stok berkurang otomatis atau tanpa batas.</p>
        </div>
      </div>

      <DataTable columns={columns} data={inventoryList} searchKey="name" searchPlaceholder="Cari produk..." />

      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{adjustType === 'IN' ? 'Stok Masuk' : 'Stok Keluar'}</DialogTitle>
            <DialogDescription>
              Penyesuaian stok untuk produk <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedProduct?.name}</span> (SKU: {selectedProduct?.sku})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmitAdjust)}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Kuantitas {adjustType === 'IN' ? 'Masuk' : 'Keluar'}</Label>
                <Input id="quantity" type="number" {...form.register('quantity')} min="1" />
                {form.formState.errors.quantity && <p className="text-sm text-destructive">{form.formState.errors.quantity.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Catatan / Alasan</Label>
                <Input id="reason" {...form.register('reason')} placeholder="Opsional" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAdjustOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Konfirmasi'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

