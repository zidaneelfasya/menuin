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
      <DialogContent className="max-w-md p-6 rounded-3xl border-none bg-white shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-emerald-50 text-emerald-700">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight text-slate-900">
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
          <div className="flex items-center justify-between p-3.5 rounded-2xl shadow-sm-md bg-slate-50">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Sisa Stok Saat Ini
              </p>
              <p className="text-lg font-semibold text-slate-900">
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
          <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-slate-100 shadow-sm-md text-xs font-medium">
            <button
              type="button"
              onClick={() => handleTypeChange('IN')}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 rounded-full transition-all cursor-pointer",
                adjustType === 'IN'
                  ? "bg-white text-emerald-700 shadow-md font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              )}
            >
              <ArrowUpCircle className="h-4 w-4" />
              <span>Stok Masuk (+ Restock)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('OUT')}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 rounded-full transition-all cursor-pointer",
                adjustType === 'OUT'
                  ? "bg-white text-destructive shadow-md font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
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
                    "text-xs font-medium h-9 rounded-full border-none shadow-sm-md bg-white hover:bg-slate-100",
                    Number(quantityWatch) === preset && "bg-emerald-50 text-emerald-700 shadow-md font-semibold"
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
                className="h-10 text-sm rounded-full border-none shadow-sm-md bg-white px-4 focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              {form.formState.errors.quantity && (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.quantity.message}
                </p>
              )}
            </div>

            <div className="p-2.5 px-4 rounded-full shadow-sm-md bg-slate-50 flex flex-col justify-center h-10">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                Estimasi Stok Baru
              </span>
              <span className="text-xs font-semibold text-slate-900">
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
              <SelectTrigger className="h-10 text-xs rounded-full border-none shadow-sm-md bg-white px-4 focus:outline-none focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Pilih alasan..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl bg-white p-1">
                {(adjustType === 'IN' ? IN_REASONS : OUT_REASONS).map((item) => (
                  <SelectItem key={item.value} value={item.value} className="text-xs rounded-xl cursor-pointer hover:bg-slate-100">
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
              className="h-10 text-xs rounded-full border-none shadow-sm-md bg-white px-4 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full shadow-md bg-white hover:bg-slate-100 text-slate-700 border-none px-5 h-10 text-xs"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="rounded-full shadow-md bg-primary hover:bg-primary/90 text-white border-none px-5 h-10 text-xs font-semibold"
            >
              {isLoading ? 'Menyimpan...' : `Simpan (${projectedStock} Porsi)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
