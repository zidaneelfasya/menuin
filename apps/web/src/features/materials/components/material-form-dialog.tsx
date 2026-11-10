'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createRawMaterial, updateRawMaterial, RawMaterialItem } from '@/lib/actions/materials';
import { cn } from '@/lib/utils';

const materialSchema = z.object({
  name: z.string().min(1, 'Nama bahan wajib diisi'),
  sku: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit: z.string().min(1, 'Satuan bahan wajib diisi'),
  stock: z.coerce.number().min(0, 'Stok minimal 0'),
  minStock: z.coerce.number().min(0, 'Batas minimum minimal 0'),
  costPerUnit: z.coerce.number().min(0, 'Harga beli minimal 0'),
  description: z.string().optional().nullable(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

interface MaterialFormDialogProps {
  material?: RawMaterialItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const COMMON_UNITS = [
  'Liter',
  'Kg',
  'Gram',
  'Ml',
  'Pcs',
  'Pack',
  'Botol',
  'Roll',
  'Meter',
  'Box',
  'Lembar',
  'Kaleng',
];

const COMMON_CATEGORIES = [
  'Dairy & Cairan',
  'Biji & Bubuk',
  'Sirup & Pemanis',
  'Daging & Lauk',
  'Sayur & Buah',
  'Packaging & Kemasan',
  'Tekstil & Kain',
  'Operasional',
];

export function MaterialFormDialog({
  material,
  isOpen,
  onOpenChange,
  onSuccess,
}: MaterialFormDialogProps) {
  const isEditing = Boolean(material);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      unit: 'Kg',
      stock: 0,
      minStock: 5,
      costPerUnit: 0,
      description: '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (material) {
        form.reset({
          name: material.name,
          sku: material.sku || '',
          category: material.category || '',
          unit: material.unit || 'Kg',
          stock: material.stock || 0,
          minStock: material.minStock || 5,
          costPerUnit: material.costPerUnit || 0,
          description: material.description || '',
        });
      } else {
        form.reset({
          name: '',
          sku: '',
          category: '',
          unit: 'Kg',
          stock: 0,
          minStock: 5,
          costPerUnit: 0,
          description: '',
        });
      }
    }
  }, [isOpen, material, form]);

  const onSubmit = async (values: MaterialFormValues) => {
    try {
      setIsLoading(true);
      if (isEditing && material) {
        const res = await updateRawMaterial(material.id, {
          name: values.name,
          sku: values.sku || null,
          category: values.category || null,
          unit: values.unit,
          minStock: values.minStock,
          costPerUnit: values.costPerUnit,
          description: values.description || null,
        });

        if (res.success) {
          toast.success('Data bahan berhasil diperbarui');
          onSuccess?.();
          onOpenChange(false);
        } else {
          toast.error(res.error || 'Gagal memperbarui bahan');
        }
      } else {
        const res = await createRawMaterial({
          name: values.name,
          sku: values.sku || null,
          category: values.category || null,
          unit: values.unit,
          stock: values.stock,
          minStock: values.minStock,
          costPerUnit: values.costPerUnit,
          description: values.description || null,
        });

        if (res.success) {
          toast.success('Bahan baru berhasil ditambahkan');
          onSuccess?.();
          onOpenChange(false);
        } else {
          toast.error(res.error || 'Gagal menambahkan bahan');
        }
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan bahan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-6 rounded-3xl border-none shadow-2xl bg-white max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-semibold text-slate-900 tracking-normal">
            {isEditing ? 'Edit Data Bahan' : 'Tambah Bahan Baru'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {isEditing
              ? 'Perbarui informasi spesifikasi bahan, satuan, atau batas minimum stok.'
              : 'Daftarkan bahan mentah, bumbu, kain, kayu, atau kemasan ke sistem persediaan.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Nama Bahan */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Nama Bahan <span className="text-rose-500">*</span></label>
            <input
              type="text"
              {...form.register('name')}
              placeholder="cth: Susu UHT Full Cream, Biji Kopi Gayo, Kain Katun"
              className="w-full h-10 px-4 text-xs sm:text-sm rounded-full border-none bg-slate-50 focus:bg-white shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] text-slate-800 placeholder:text-slate-400 transition-all"
            />
            {form.formState.errors.name && (
              <p className="text-[11px] text-rose-500 font-medium">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* SKU / Kode Bahan & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Kode SKU (Opsional)</label>
              <input
                type="text"
                {...form.register('sku')}
                placeholder="cth: RM-SUSU-01"
                className="w-full h-10 px-4 text-xs rounded-full border-none bg-slate-50 focus:bg-white shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] text-slate-800 placeholder:text-slate-400 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Kategori Bahan</label>
              <input
                type="text"
                {...form.register('category')}
                placeholder="cth: Dairy, Packaging, Tekstil"
                className="w-full h-10 px-4 text-xs rounded-full border-none bg-slate-50 focus:bg-white shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] text-slate-800 placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Preset Kategori Rekomendasi */}
          <div className="flex flex-wrap gap-1">
            {COMMON_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => form.setValue('category', cat)}
                className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-600 transition-colors cursor-pointer border-none"
              >
                + {cat}
              </button>
            ))}
          </div>

          {/* Satuan Ukuran */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">Satuan Ukuran <span className="text-rose-500">*</span></label>
              <span className="text-[11px] text-slate-400">Pilih atau ketik satuan</span>
            </div>
            <input
              type="text"
              {...form.register('unit')}
              placeholder="cth: Liter, Kg, Pcs, Roll, Meter"
              className="w-full h-10 px-4 text-xs sm:text-sm rounded-full border-none bg-slate-50 focus:bg-white shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] text-slate-800 placeholder:text-slate-400 transition-all"
            />
            {form.formState.errors.unit && (
              <p className="text-[11px] text-rose-500 font-medium">{form.formState.errors.unit.message}</p>
            )}

            {/* Common Units Pill selector */}
            <div className="flex flex-wrap gap-1 pt-1">
              {COMMON_UNITS.map((u) => {
                const isSelected = form.watch('unit')?.toLowerCase() === u.toLowerCase();
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => form.setValue('unit', u)}
                    className={cn(
                      "text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer border-none",
                      isSelected
                        ? "bg-[#0e59f9] text-white font-semibold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                    )}
                  >
                    {u}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Batas Minimum Stok & Stok Awal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {!isEditing && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Stok Awal Masuk</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  {...form.register('stock')}
                  placeholder="0"
                  className="w-full h-10 px-4 text-xs sm:text-sm rounded-full border-none bg-slate-50 focus:bg-white shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] text-slate-800 placeholder:text-slate-400 transition-all tabular-nums font-numeric"
                />
              </div>
            )}

            <div className={cn("space-y-1.5", isEditing && "sm:col-span-2")}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700">Batas Minimum Peringatan</label>
                <span className="text-[10px] text-amber-600 font-medium">Beri alert jika di bawah ini</span>
              </div>
              <input
                type="number"
                step="any"
                min="0"
                {...form.register('minStock')}
                placeholder="5"
                className="w-full h-10 px-4 text-xs sm:text-sm rounded-full border-none bg-slate-50 focus:bg-white shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] text-slate-800 placeholder:text-slate-400 transition-all tabular-nums font-numeric"
              />
            </div>
          </div>

          {/* Estimasi Harga Modal per Satuan */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Estimasi Biaya Beli / Modal per Satuan (Rp)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 select-none pointer-events-none">
                Rp
              </span>
              <input
                type="number"
                step="any"
                min="0"
                {...form.register('costPerUnit')}
                placeholder="0"
                className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm rounded-full border-none bg-slate-50 focus:bg-white shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] text-slate-800 placeholder:text-slate-400 transition-all tabular-nums font-numeric"
              />
            </div>
          </div>

          {/* Deskripsi Tambahan */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Deskripsi / Catatan Penyimpanan</label>
            <textarea
              rows={2}
              {...form.register('description')}
              placeholder="cth: Simpan di freezer suhu -4°C, hindari terkena air langsung"
              className="w-full px-4 py-2.5 text-xs rounded-2xl border-none bg-slate-50 focus:bg-white shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] text-slate-800 placeholder:text-slate-400 transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm border-none shadow-sm-md cursor-pointer transition-all active:scale-[0.98] select-none"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-10 px-6 rounded-full bg-[#0e59f9] hover:bg-blue-600 text-white font-medium text-xs sm:text-sm shadow-md border-none cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 select-none"
            >
              {isLoading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Bahan'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
