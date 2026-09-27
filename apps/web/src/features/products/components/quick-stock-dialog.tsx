'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowDownCircle, ArrowUpCircle, Boxes, PackagePlus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adjustStock } from '@/lib/actions/inventory';
import { ProductDto } from '@menuin/types';
import { cn } from '@/lib/utils';

const quickStockSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().min(1, 'Kuantitas minimal 1'),
  reasonCategory: z.enum([
    'RESTOCK_BATCH',
    'OPNAME_CORRECTION_ADD',
    'RETURN_CUSTOMER',
    'WASTE_EXPIRED',
    'STAFF_MEAL',
    'OPNAME_CORRECTION_SUB',
    'OTHER',
  ]).optional(),
  reason: z.string().optional(),
});

type QuickStockDialogProps = {
  product: ProductDto | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (productId: string, newStock: number) => void;
};

const IN_REASONS = [
  { value: 'RESTOCK_BATCH', label: 'Kiriman Dapur / Vendor Harian' },
  { value: 'OPNAME_CORRECTION_ADD', label: 'Koreksi Fisik Lebih (+ Opname)' },
  { value: 'RETURN_CUSTOMER', label: 'Batal Pesanan / Return' },
  { value: 'OTHER', label: 'Lainnya' },
] as const;

const OUT_REASONS = [
  { value: 'WASTE_EXPIRED', label: 'Basi / Rusak / Tumpah (Waste)' },
  { value: 'STAFF_MEAL', label: 'Makan Karyawan / Tester' },
  { value: 'OPNAME_CORRECTION_SUB', label: 'Koreksi Fisik Kurang (- Opname)' },
  { value: 'OTHER', label: 'Lainnya' },
] as const;

export function QuickStockDialog({
  product,
  isOpen,
  onOpenChange,
  onSuccess,
}: QuickStockDialogProps) {
  const [adjustType, setAdjustType] = React.useState<'IN' | 'OUT'>('IN');
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof quickStockSchema>>({
    resolver: zodResolver(quickStockSchema),
    defaultValues: {
      productId: '',
      type: 'IN',
      quantity: 10,
      reasonCategory: 'RESTOCK_BATCH',
      reason: '',
    },
  });

  const currentStock = product?.stock ?? 0;
  const quantityWatch = form.watch('quantity') || 0;
  const projectedStock = adjustType === 'IN' 
    ? currentStock + Number(quantityWatch)
    : Math.max(0, currentStock - Number(quantityWatch));

  React.useEffect(() => {
    if (product && isOpen) {
      const defaultQty = product.stock <= 0 ? (product.minStock > 0 ? product.minStock * 2 : 10) : 5;
      setAdjustType('IN');
      form.reset({
        productId: product.id,
        type: 'IN',
        quantity: defaultQty,
        reasonCategory: 'RESTOCK_BATCH',
        reason: '',
      });
    }
  }, [product, isOpen, form]);

  const handleTypeChange = (newType: 'IN' | 'OUT') => {
    setAdjustType(newType);
    form.setValue('type', newType);
    form.setValue('reasonCategory', newType === 'IN' ? 'RESTOCK_BATCH' : 'WASTE_EXPIRED');
  };

  const handleApplyPreset = (amount: number) => {
    form.setValue('quantity', amount, { shouldValidate: true });
  };

  const onSubmit = async (values: z.infer<typeof quickStockSchema>) => {
    if (!product) return;
    setIsLoading(true);
    try {
      const result = await adjustStock(values);
      if (result.success) {
        toast.success(
          values.type === 'IN' 
            ? `Berhasil menambah stok: +${values.quantity} ${product.name}`
            : `Berhasil mencatat stok keluar: -${values.quantity} ${product.name}`
        );
        if (typeof result.newStock === 'number') {
          onSuccess?.(product.id, result.newStock);
        }
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Gagal menyesuaikan stok.');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Penyesuaian Stok
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {product.name} &bull; <span className="font-mono">{product.sku}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Status Sekarang & Type Switcher */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Sisa Stok Saat Ini
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {currentStock} <span className="text-xs font-normal text-muted-foreground">porsi</span>
              </p>
            </div>
            {product.minStock > 0 && (
              <div className="text-right">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Batas Min
                </p>
                <p className="text-sm font-semibold text-muted-foreground">
                  {product.minStock} porsi
                </p>
              </div>
            )}
          </div>

          {/* Segmented Switch IN vs OUT */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => handleTypeChange('IN')}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all",
                adjustType === 'IN'
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              <ArrowUpCircle className="h-4 w-4" />
              <span>Stok Masuk (+ Restock)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('OUT')}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all",
                adjustType === 'OUT'
                  ? "bg-white dark:bg-slate-900 text-destructive dark:text-rose-400 shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              <ArrowDownCircle className="h-4 w-4" />
              <span>Stok Keluar (- Waste)</span>
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Pilihan Cepat Tambah Kuantitas</Label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 50].map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-xs font-medium h-8 rounded-lg",
                    Number(quantityWatch) === preset && "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  )}
                  onClick={() => handleApplyPreset(preset)}
                >
                  +{preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Kuantitas Manual & Estimasi Hasil */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-xs">
                Kuantitas {adjustType === 'IN' ? 'Masuk' : 'Keluar'}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                {...form.register('quantity')}
                className="h-9 text-sm"
              />
              {form.formState.errors.quantity && (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.quantity.message}
                </p>
              )}
            </div>

            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-center h-9">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                Estimasi Stok Baru
              </span>
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {projectedStock} porsi
              </span>
            </div>
          </div>

          {/* Dropdown Alasan Sesuai Standar FnB */}
          <div className="space-y-1.5">
            <Label className="text-xs">Alasan Penyesuaian</Label>
            <Select
              value={form.watch('reasonCategory') || (adjustType === 'IN' ? 'RESTOCK_BATCH' : 'WASTE_EXPIRED')}
              onValueChange={(val: any) => form.setValue('reasonCategory', val)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Pilih alasan..." />
              </SelectTrigger>
              <SelectContent>
                {(adjustType === 'IN' ? IN_REASONS : OUT_REASONS).map((item) => (
                  <SelectItem key={item.value} value={item.value} className="text-xs">
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Catatan Bebas Opsional */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs text-muted-foreground">
              Catatan Tambahan (Opsional)
            </Label>
            <Input
              id="reason"
              placeholder="Contoh: Kiriman batch sore dari dapur"
              {...form.register('reason')}
              className="h-9 text-xs"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-9"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="text-xs h-9 bg-primary hover:bg-primary/90 text-white font-medium"
            >
              {isLoading ? 'Menyimpan...' : `Simpan (${projectedStock} Porsi)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
