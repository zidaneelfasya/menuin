'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Minus, ArrowDownCircle, ArrowUpCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adjustRawMaterialStock, RawMaterialItem } from '@/lib/actions/materials';
import { cn } from '@/lib/utils';

const quickStockSchema = z.object({
  rawMaterialId: z.string().uuid(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.coerce.number().min(0.01, 'Kuantitas harus lebih dari 0'),
  reasonCategory: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
});

type QuickStockDialogProps = {
  material: RawMaterialItem | null;
  isOpen: boolean;
  initialType?: 'IN' | 'OUT' | 'ADJUSTMENT';
  onOpenChange: (open: boolean) => void;
  onSuccess?: (materialId: string, newStock: number) => void;
};

const IN_REASONS = [
  { value: 'RESTOCK_PURCHASE', label: 'Pembelian Supplier / Belanja' },
  { value: 'RETURN_IN', label: 'Retur Masuk / Pembatalan' },
  { value: 'OPNAME_CORRECTION_ADD', label: 'Koreksi Fisik Lebih (+ Opname)' },
  { value: 'BONUS_SAMPLE', label: 'Bonus / Sampel Vendor' },
  { value: 'OTHER', label: 'Lainnya' },
] as const;

const OUT_REASONS = [
  { value: 'PRODUCTION_USED', label: 'Terpakai Produksi / Jualan' },
  { value: 'WASTE_EXPIRED', label: 'Basi / Kedaluwarsa (Waste)' },
  { value: 'DAMAGE_SPOILED', label: 'Rusak / Tumpah / Pecah' },
  { value: 'OPNAME_CORRECTION_SUB', label: 'Koreksi Fisik Kurang (- Opname)' },
  { value: 'OTHER', label: 'Lainnya' },
] as const;

export function MaterialQuickStockDialog({
  material,
  isOpen,
  initialType = 'IN',
  onOpenChange,
  onSuccess,
}: QuickStockDialogProps) {
  const [adjustType, setAdjustType] = React.useState<'IN' | 'OUT' | 'ADJUSTMENT'>(initialType);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof quickStockSchema>>({
    resolver: zodResolver(quickStockSchema),
    defaultValues: {
      rawMaterialId: '',
      type: initialType,
      quantity: 5,
      reasonCategory: initialType === 'IN' ? 'RESTOCK_PURCHASE' : 'PRODUCTION_USED',
      reason: '',
    },
  });

  React.useEffect(() => {
    if (material && isOpen) {
      setAdjustType(initialType);
      form.reset({
        rawMaterialId: material.id,
        type: initialType,
        quantity: initialType === 'ADJUSTMENT' ? material.stock : 5,
        reasonCategory: initialType === 'IN' ? 'RESTOCK_PURCHASE' : initialType === 'OUT' ? 'PRODUCTION_USED' : 'OPNAME_CORRECTION_ADD',
        reason: '',
      });
    }
  }, [material, isOpen, initialType, form]);

  const currentStock = material?.stock ?? 0;
  const quantityWatch = form.watch('quantity') || 0;

  let projectedStock = currentStock;
  if (adjustType === 'IN') {
    projectedStock = currentStock + Number(quantityWatch);
  } else if (adjustType === 'OUT') {
    projectedStock = Math.max(0, currentStock - Number(quantityWatch));
  } else if (adjustType === 'ADJUSTMENT') {
    projectedStock = Math.max(0, Number(quantityWatch));
  }

  const handleTypeChange = (type: 'IN' | 'OUT' | 'ADJUSTMENT') => {
    setAdjustType(type);
    form.setValue('type', type);
    if (type === 'IN') {
      form.setValue('reasonCategory', 'RESTOCK_PURCHASE');
      if (form.getValues('quantity') === 0) form.setValue('quantity', 5);
    } else if (type === 'OUT') {
      form.setValue('reasonCategory', 'PRODUCTION_USED');
      if (form.getValues('quantity') === 0) form.setValue('quantity', 1);
    } else {
      form.setValue('reasonCategory', 'OPNAME_CORRECTION_ADD');
      form.setValue('quantity', currentStock);
    }
  };

  const onSubmit = async (values: z.infer<typeof quickStockSchema>) => {
    if (!material) return;
    try {
      setIsLoading(true);
      const res = await adjustRawMaterialStock({
        rawMaterialId: material.id,
        type: adjustType,
        quantity: Number(values.quantity),
        reasonCategory: values.reasonCategory || null,
        reason: values.reason?.trim() || null,
      });

      if (res.success && res.data) {
        toast.success(
          adjustType === 'IN'
            ? `Stok ${material.name} bertambah +${values.quantity} ${material.unit}`
            : adjustType === 'OUT'
            ? `Stok ${material.name} berkurang -${values.quantity} ${material.unit}`
            : `Stok ${material.name} disesuaikan menjadi ${values.quantity} ${material.unit}`
        );
        onSuccess?.(material.id, res.data.currentStock);
        onOpenChange(false);
      } else {
        toast.error(res.error || 'Gagal mengubah stok');
      }
    } catch {
      toast.error('Terjadi kesalahan saat memperbarui stok');
    } finally {
      setIsLoading(false);
    }
  };

  if (!material) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 rounded-3xl border-none shadow-2xl bg-white">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-semibold text-slate-900 tracking-normal flex items-center justify-between">
            <span>Mutasi Stok Bahan</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {material.category || 'Bahan'}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {material.name} {material.sku ? `(${material.sku})` : ''}
          </DialogDescription>
        </DialogHeader>

        {/* 3-Way Segmented Control: Masuk / Keluar / Opname */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100/80 p-1 rounded-full shadow-sm-md mt-2">
          <button
            type="button"
            onClick={() => handleTypeChange('IN')}
            className={cn(
              "h-8 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none",
              adjustType === 'IN'
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Stok Masuk</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('OUT')}
            className={cn(
              "h-8 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none",
              adjustType === 'OUT'
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Stok Keluar</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('ADJUSTMENT')}
            className={cn(
              "h-8 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none",
              adjustType === 'ADJUSTMENT'
                ? "bg-[#0e59f9] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <RefreshCw className="w-3 h-3" />
            <span>Opname</span>
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Quantity Input with Unit */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">
                {adjustType === 'IN'
                  ? 'Jumlah Bahan Masuk'
                  : adjustType === 'OUT'
                  ? 'Jumlah Bahan Keluar'
                  : 'Total Stok Fisik Hasil Opname'}
              </label>
              <span className="text-[11px] text-slate-400">Satuan: {material.unit}</span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                {...form.register('quantity')}
                placeholder="0"
                className="w-full h-11 pl-4 pr-16 text-base font-semibold rounded-full border-none bg-slate-50 focus:bg-white shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] text-slate-900 tabular-nums font-numeric transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 select-none pointer-events-none">
                {material.unit}
              </span>
            </div>
            {form.formState.errors.quantity && (
              <p className="text-[11px] text-rose-500 font-medium">{form.formState.errors.quantity.message}</p>
            )}
          </div>

          {/* Preset Reason Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Alasan Mutasi</label>
            <div className="flex flex-wrap gap-1.5">
              {(adjustType === 'IN' ? IN_REASONS : OUT_REASONS).map((r) => {
                const isSelected = form.watch('reasonCategory') === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => form.setValue('reasonCategory', r.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border-none",
                      isSelected
                        ? adjustType === 'IN'
                          ? "bg-emerald-50 text-emerald-700 font-semibold ring-1 ring-emerald-500/20 shadow-xs"
                          : "bg-rose-50 text-rose-700 font-semibold ring-1 ring-rose-500/20 shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                    )}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes Optional */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Catatan Tambahan (Opsional)</label>
            <input
              type="text"
              {...form.register('reason')}
              placeholder="cth: Dari supplier Toko Berkah, exp date 2027"
              className="w-full h-9 px-4 text-xs rounded-full border-none bg-slate-50 focus:bg-white shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] text-slate-800 placeholder:text-slate-400 transition-all"
            />
          </div>

          {/* Live Projection Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border-none shadow-sm-md flex items-center justify-between text-xs">
            <div>
              <p className="text-slate-400 text-[11px]">Stok Saat Ini</p>
              <p className="font-semibold text-slate-700 tabular-nums font-numeric">
                {currentStock} {material.unit}
              </p>
            </div>

            <div className="text-center font-medium text-slate-400">
              {adjustType === 'IN' ? `+${quantityWatch}` : adjustType === 'OUT' ? `-${quantityWatch}` : '='}
            </div>

            <div className="text-right">
              <p className="text-slate-400 text-[11px]">Proyeksi Stok Akhir</p>
              <p className={cn(
                "font-semibold tabular-nums font-numeric text-sm",
                projectedStock <= 0 ? "text-rose-600" :
                projectedStock <= material.minStock ? "text-amber-600" : "text-emerald-600"
              )}>
                {projectedStock} {material.unit}
              </p>
            </div>
          </div>

          {/* Warning if projected stock <= minStock */}
          {projectedStock <= material.minStock && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 text-amber-800 text-[11px]">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                {projectedStock <= 0
                  ? 'Perhatian: Stok bahan ini akan habis (0).'
                  : `Perhatian: Stok akan berada di bawah batas minimum (${material.minStock} ${material.unit}).`}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs border-none shadow-sm-md cursor-pointer transition-all active:scale-[0.98] select-none"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "h-10 px-6 rounded-full text-white font-medium text-xs shadow-md border-none cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 select-none",
                adjustType === 'IN'
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : adjustType === 'OUT'
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-[#0e59f9] hover:bg-blue-600"
              )}
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Mutasi Stok'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
