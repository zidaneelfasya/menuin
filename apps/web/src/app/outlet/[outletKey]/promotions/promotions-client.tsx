'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Plus, 
  Tag, 
  Calendar, 
  Trash2, 
  Pencil, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft, 
  Check, 
  Percent, 
  Receipt, 
  SlidersHorizontal,
  Loader2
} from 'lucide-react';
import dynamic from 'next/dynamic';

const DataTable = dynamic(
  () => import('@/components/ui/data-table').then((mod) => mod.DataTable),
  { ssr: false, loading: () => <div className="h-64 w-full bg-muted/40 animate-pulse rounded-xl" /> }
);
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/utils/format';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { createPromotion, updatePromotion, togglePromotionStatus, deletePromotion } from '@/lib/actions/promotions';
import { cn } from '@/lib/utils';

type Promotion = {
  id: string;
  tenantId: string;
  code?: string;
  name: string;
  type: string;
  value: string;
  minOrder: string;
  maxDiscount: string | null;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const promoFormSchema = z.object({
  code: z
    .string()
    .min(2, 'Kode promo minimal 2 karakter')
    .max(30, 'Kode promo maksimal 30 karakter')
    .regex(/^[A-Za-z0-9_-]+$/, 'Kode promo hanya boleh huruf, angka, strip (-), atau underscore (_)')
    .trim(),
  name: z.string().min(1, 'Nama promo wajib diisi'),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().min(0.01, 'Nilai potongan harus lebih dari 0'),
  minOrder: z.coerce.number().min(0, 'Minimal belanja tidak boleh negatif'),
  maxDiscount: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export function PromotionsClient({ initialPromotions }: { initialPromotions: Promotion[] }) {
  const [promotionsList, setPromotionsList] = React.useState<Promotion[]>(initialPromotions);
  const [viewMode, setViewMode] = React.useState<'list' | 'editor'>('list');
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [editingPromo, setEditingPromo] = React.useState<Promotion | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [selectedPromoForDelete, setSelectedPromoForDelete] = React.useState<Promotion | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof promoFormSchema>>({
    resolver: zodResolver(promoFormSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'PERCENTAGE',
      value: 10,
      minOrder: 0,
      maxDiscount: null,
      isActive: true,
      startDate: '',
      endDate: '',
    },
  });

  const formValues = form.watch();
  const activePromoType = form.watch('type');

  const handleOpenCreate = () => {
    setEditingPromo(null);
    form.reset({
      code: '',
      name: '',
      type: 'PERCENTAGE',
      value: 10,
      minOrder: 0,
      maxDiscount: null,
      isActive: true,
      startDate: '',
      endDate: '',
    });
    setCurrentStep(1);
    setViewMode('editor');
  };

  const handleOpenEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    form.reset({
      code: promo.code || '',
      name: promo.name,
      type: promo.type as 'PERCENTAGE' | 'FIXED',
      value: parseFloat(promo.value),
      minOrder: parseFloat(promo.minOrder || '0'),
      maxDiscount: promo.maxDiscount ? parseFloat(promo.maxDiscount) : null,
      isActive: promo.isActive,
      startDate: promo.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : '',
      endDate: promo.endDate ? new Date(promo.endDate).toISOString().split('T')[0] : '',
    });
    setCurrentStep(1);
    setViewMode('editor');
  };

  const handleToggleStatus = async (promo: Promotion, currentValue: boolean) => {
    const newValue = !currentValue;
    setPromotionsList((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, isActive: newValue } : p))
    );

    const result = await togglePromotionStatus(promo.id, newValue);
    if (!result.success) {
      toast.error(result.error || 'Gagal mengubah status promo');
      setPromotionsList((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, isActive: currentValue } : p))
      );
    } else {
      toast.success(`Promo "${promo.name}" kini ${newValue ? 'Aktif' : 'Nonaktif'}`);
    }
  };

  const handleSubmitForm = async (values: z.infer<typeof promoFormSchema>) => {
    setIsLoading(true);
    try {
      if (editingPromo) {
        const result = await updatePromotion(editingPromo.id, values);
        if (result.success) {
          toast.success('Promo berhasil diperbarui');
          setViewMode('list');
          window.location.reload();
        } else {
          toast.error(result.error || 'Gagal memperbarui promo');
        }
      } else {
        const result = await createPromotion(values);
        if (result.success) {
          toast.success('Promo baru berhasil dibuat');
          setViewMode('list');
          form.reset();
          window.location.reload();
        } else {
          toast.error(result.error || 'Gagal membuat promo');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!selectedPromoForDelete) return;
    setIsLoading(true);
    const result = await deletePromotion(selectedPromoForDelete.id);
    setIsLoading(false);
    if (result.success) {
      toast.success('Promo berhasil dihapus');
      setIsDeleteOpen(false);
      setPromotionsList((prev) => prev.filter((p) => p.id !== selectedPromoForDelete.id));
    } else {
      toast.error(result.error || 'Gagal menghapus promo');
    }
  };

  const columns: ColumnDef<Promotion>[] = [
    {
      accessorKey: 'name',
      header: 'Nama Promo',
      cell: ({ row }) => {
        const promo = row.original;
        return (
          <div className="py-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-xs sm:text-sm text-foreground">{promo.name}</span>
              {promo.code && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {promo.code}
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground block">
              {promo.type === 'PERCENTAGE' ? 'Diskon Persentase (%)' : 'Potongan Nominal Langsung (Rp)'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'value',
      header: 'Besar Diskon',
      cell: ({ row }) => {
        const promo = row.original;
        const val = parseFloat(promo.value);
        return (
          <div className="font-semibold text-xs sm:text-sm text-blue-600 dark:text-blue-400">
            {promo.type === 'PERCENTAGE' ? `${val}%` : formatCurrency(val)}
            {promo.type === 'PERCENTAGE' && promo.maxDiscount && (
              <span className="text-[11px] text-muted-foreground block font-normal">
                Maks: {formatCurrency(parseFloat(promo.maxDiscount))}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'minOrder',
      header: 'Min. Belanja',
      cell: ({ row }) => {
        const minOrder = parseFloat(row.getValue('minOrder') || '0');
        return <span className="text-xs sm:text-sm text-muted-foreground">{minOrder > 0 ? formatCurrency(minOrder) : 'Tanpa Minimum'}</span>;
      },
    },
    {
      id: 'period',
      header: 'Masa Berlaku',
      cell: ({ row }) => {
        const promo = row.original;
        if (!promo.startDate && !promo.endDate) {
          return <span className="text-xs text-muted-foreground">Selalu Aktif</span>;
        }
        const start = promo.startDate ? new Date(promo.startDate).toLocaleDateString('id-ID') : 'Sekarang';
        const end = promo.endDate ? new Date(promo.endDate).toLocaleDateString('id-ID') : 'Seterusnya';
        return (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>{start} - {end}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const promo = row.original;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={promo.isActive}
              onCheckedChange={() => handleToggleStatus(promo, promo.isActive)}
            />
            <span className={cn("text-xs font-medium", promo.isActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground')}>
              {promo.isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const promo = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              onClick={() => handleOpenEdit(promo)}
              title="Edit Promo"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                setSelectedPromoForDelete(promo);
                setIsDeleteOpen(true);
              }}
              title="Hapus Promo"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  const totalPromos = promotionsList.length;
  const activePromos = promotionsList.filter((p) => p.isActive).length;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* HEADER UTAMA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Manajemen Promo & Diskon
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola aturan diskon persentase dan potongan harga untuk kasir POS dan katalog digital.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'editor' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-9 text-xs font-medium rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Kembali ke Daftar
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="h-9 px-3.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Tambah Promo Baru
            </Button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: LIST / DAFTAR PROMO */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* STATS SUMMARY BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border bg-background flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Promo</p>
                <p className="text-xl font-semibold mt-0.5">{totalPromos}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground">
                <Tag className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-background flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Promo Aktif</p>
                <p className="text-xl font-semibold text-blue-600 dark:text-blue-400 mt-0.5">{activePromos}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-background flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Integrasi Kasir POS</p>
                <p className="text-xs font-semibold text-foreground mt-1">Otomatis Terhubung</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="rounded-xl border border-border bg-background overflow-hidden p-4">
            <DataTable
              columns={columns}
              data={promotionsList}
              searchKey="name"
              searchPlaceholder="Cari nama promo..."
            />
          </div>
        </div>
      )}

      {/* VIEW MODE 2: FORM EDITOR DENGAN STEPPER & LIVE SUMMARY (REFERENSI GAMBAR) */}
      {viewMode === 'editor' && (
        <div className="space-y-6">
          {/* STEPPER BREADCRUMB ATAS */}
          <div className="flex items-center gap-2 sm:gap-3 py-2 px-1 overflow-x-auto select-none border-b border-border/60 pb-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0",
                currentStep === 1
                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px]",
                currentStep === 1 ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
              )}>
                1
              </span>
              <span>Informasi Promo</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0",
                currentStep === 2
                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px]",
                currentStep === 2 ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
              )}>
                2
              </span>
              <span>Aturan Diskon</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0",
                currentStep === 3
                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px]",
                currentStep === 3 ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
              )}>
                3
              </span>
              <span>Masa Berlaku</span>
            </button>
          </div>

          {/* MAIN 2-COLUMN STUDIO LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: FORM CARD (8 COLS) */}
            <div className="lg:col-span-8">
              <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
                <div className="rounded-2xl border border-border bg-background p-5 sm:p-6 space-y-6">
                  
                  {/* STEP 1: INFORMASI PROMO */}
                  {currentStep === 1 && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          Informasi Dasar Promo
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tentukan nama dan tipe potongan harga yang akan diberikan ke pelanggan.
                        </p>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="code" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              Kode Promo <span className="text-destructive">*</span>
                            </Label>
                            <span className="text-[10px] text-muted-foreground font-medium">Karakter kapital & angka tanpa spasi</span>
                          </div>
                          <Input
                            id="code"
                            {...form.register('code', {
                              onChange: (e) => {
                                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                              }
                            })}
                            placeholder="Contoh: HEMAT50, DISKON10, MERDEKA17"
                            className="rounded-lg h-10 bg-background border-input text-sm font-mono tracking-wider focus-visible:ring-blue-500/20 focus-visible:border-blue-500 uppercase"
                          />
                          {form.formState.errors.code ? (
                            <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">Pelanggan akan memasukkan kode ini saat checkout untuk mendapatkan potongan.</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            Nama Promo <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="name"
                            {...form.register('name')}
                            placeholder="Contoh: Diskon Merdeka 17%, Hemat Akhir Pekan"
                            className="rounded-lg h-10 bg-background border-input text-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                          />
                          {form.formState.errors.name && (
                            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            Tipe Diskon <span className="text-destructive">*</span>
                          </Label>
                          <Controller
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="w-full h-10 bg-background border-input rounded-lg text-sm focus:ring-blue-500/20 focus:border-blue-500">
                                  <SelectValue placeholder="Pilih Tipe Diskon" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg">
                                  <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                                  <SelectItem value="FIXED">Potongan Tetap (Rp)</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="value" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {activePromoType === 'PERCENTAGE' ? 'Besar Potongan (%)' : 'Besar Potongan (Rp)'} <span className="text-destructive">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="value"
                              type="number"
                              step="0.01"
                              min="0"
                              {...form.register('value')}
                              placeholder={activePromoType === 'PERCENTAGE' ? '10' : '10000'}
                              className="rounded-lg h-10 bg-background border-input text-sm pr-12 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                              {activePromoType === 'PERCENTAGE' ? '%' : 'Rp'}
                            </span>
                          </div>
                          {form.formState.errors.value && (
                            <p className="text-xs text-destructive">{form.formState.errors.value.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-border">
                        <Button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="h-9 px-4 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                          Lanjut ke Aturan Diskon
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: ATURAN DISKON */}
                  {currentStep === 2 && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          Syarat & Batas Diskon
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tentukan nilai transaksi minimum dan batas maksimal diskon.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="minOrder" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            Minimal Belanja (Rp)
                          </Label>
                          <Input
                            id="minOrder"
                            type="number"
                            {...form.register('minOrder')}
                            placeholder="0 (Tanpa minimal)"
                            className="rounded-lg h-10 bg-background border-input text-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                          />
                          <p className="text-[11px] text-muted-foreground">Biarkan 0 jika tidak ada syarat minimum.</p>
                        </div>

                        {activePromoType === 'PERCENTAGE' && (
                          <div className="space-y-1.5">
                            <Label htmlFor="maxDiscount" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              Maksimal Potongan (Rp)
                            </Label>
                            <Input
                              id="maxDiscount"
                              type="number"
                              {...form.register('maxDiscount')}
                              placeholder="Contoh: 25000"
                              className="rounded-lg h-10 bg-background border-input text-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                            />
                            <p className="text-[11px] text-muted-foreground">Kosongkan jika tanpa batas potongan.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep(1)}
                          className="h-9 px-3 text-xs font-medium rounded-lg"
                        >
                          Sebelumnya
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="h-9 px-4 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                          Lanjut ke Masa Berlaku
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: MASA BERLAKU */}
                  {currentStep === 3 && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          Masa Berlaku & Status
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tentukan periode tanggal aktif promo dan status ketersediaannya.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="startDate" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            Tanggal Mulai
                          </Label>
                          <Input
                            id="startDate"
                            type="date"
                            {...form.register('startDate')}
                            className="rounded-lg h-10 bg-background border-input text-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="endDate" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            Tanggal Selesai
                          </Label>
                          <Input
                            id="endDate"
                            type="date"
                            {...form.register('endDate')}
                            className="rounded-lg h-10 bg-background border-input text-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-input bg-muted/20 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="isActivePromo" className="text-xs font-semibold">
                            Aktifkan Promo Sekarang
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Promo akan langsung dapat dipilih kasir dan diklaim pelanggan.
                          </p>
                        </div>
                        <Controller
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <Switch id="isActivePromo" checked={field.value} onCheckedChange={field.onChange} />
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep(2)}
                          className="h-9 px-3 text-xs font-medium rounded-lg"
                        >
                          Sebelumnya
                        </Button>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="h-9 px-5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                          {isLoading ? (
                            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Menyimpan...</>
                          ) : (
                            <><Check className="w-3.5 h-3.5 mr-1.5" /> {editingPromo ? 'Simpan Perubahan' : 'Buat Promo Baru'}</>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                </div>
              </form>
            </div>

            {/* RIGHT: LIVE PROMO SUMMARY CARD (REFERENSI GAMBAR "Booking Summary") */}
            <div className="lg:col-span-4">
              <div className="sticky top-6 space-y-4">
                <div className="rounded-2xl border border-border bg-background p-5 shadow-xs space-y-5">
                  
                  {/* SUMMARY HEADER */}
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Ringkasan Promo
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Pratinjau langsung aturan diskon promo
                    </p>
                  </div>

                  {/* PROMO TITLE & BADGE */}
                  <div className="p-3.5 rounded-xl border border-border/80 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {formValues.name || 'Nama Promo Belum Diisi'}
                      </p>
                      {formValues.code && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono text-[10px] font-bold">
                          <Tag className="w-2.5 h-2.5" />
                          {formValues.code}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{formValues.type === 'PERCENTAGE' ? 'Diskon Persentase' : 'Potongan Nominal'}</span>
                    </div>
                  </div>

                  {/* DETAILS ROWS */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Nilai Potongan</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {formValues.type === 'PERCENTAGE' 
                          ? `${formValues.value || 0}%` 
                          : formatCurrency(formValues.value || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Minimal Belanja</span>
                      <span className="font-medium text-foreground">
                        {formValues.minOrder && Number(formValues.minOrder) > 0 
                          ? formatCurrency(Number(formValues.minOrder)) 
                          : 'Tanpa Minimum'}
                      </span>
                    </div>

                    {formValues.type === 'PERCENTAGE' && (
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Maksimal Diskon</span>
                        <span className="font-medium text-foreground">
                          {formValues.maxDiscount && Number(formValues.maxDiscount) > 0 
                            ? formatCurrency(Number(formValues.maxDiscount)) 
                            : 'Tanpa Batas'}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Masa Berlaku</span>
                      <span className="font-medium text-foreground text-right">
                        {formValues.startDate || formValues.endDate 
                          ? `${formValues.startDate || 'Sekarang'} s/d ${formValues.endDate || 'Seterusnya'}`
                          : 'Selalu Aktif'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Status Awal</span>
                      <span className={cn("font-semibold text-xs", formValues.isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>
                        {formValues.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>

                  {/* BIG HIGHLIGHT BOX (ESTIMASI POTONGAN / NILAI PROMO) */}
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">Besar Nilai Diskon</p>
                      <p className="text-base font-semibold text-blue-900 dark:text-blue-100 mt-0.5">
                        {formValues.type === 'PERCENTAGE' 
                          ? `${formValues.value || 0}% Diskon` 
                          : formatCurrency(formValues.value || 0)}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-semibold text-xs">
                      {formValues.type === 'PERCENTAGE' ? '%' : 'Rp'}
                    </div>
                  </div>

                  {/* ACTION SUBMIT BUTTON IN SUMMARY */}
                  <Button
                    type="button"
                    onClick={form.handleSubmit(handleSubmitForm)}
                    disabled={isLoading}
                    className="w-full h-10 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Menyimpan...</>
                    ) : (
                      <><Check className="w-3.5 h-3.5 mr-1.5" /> {editingPromo ? 'Simpan Perubahan' : 'Buat Promo'}</>
                    )}
                  </Button>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Hapus Promo</DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus promo <b>{selectedPromoForDelete?.name}</b>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
              className="text-xs rounded-lg"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onConfirmDelete}
              disabled={isLoading}
              className="text-xs rounded-lg"
            >
              {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
