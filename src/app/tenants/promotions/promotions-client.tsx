'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Percent, Tag, Calendar, Trash2, Pencil, Sparkles, CheckCircle2, XCircle, Gift } from 'lucide-react';
import dynamic from 'next/dynamic';

const DataTable = dynamic(
  () => import('@/components/ui/data-table').then((mod) => mod.DataTable),
  { ssr: false, loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-xl"></div> }
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createPromotion, updatePromotion, togglePromotionStatus, deletePromotion } from '@/lib/actions/promotions';

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
  name: z.string().min(1, 'Nama promo wajib diisi'),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().min(0.01, 'Nilai potongan harus lebih besar dari 0'),
  minOrder: z.coerce.number().min(0, 'Minimal transaksi tidak boleh negatif'),
  maxDiscount: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export function PromotionsClient({ initialPromotions }: { initialPromotions: Promotion[] }) {
  const [promotionsList, setPromotionsList] = React.useState<Promotion[]>(initialPromotions);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [selectedPromo, setSelectedPromo] = React.useState<Promotion | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof promoFormSchema>>({
    resolver: zodResolver(promoFormSchema),
    defaultValues: {
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

  const activePromoType = form.watch('type');

  const handleToggleStatus = async (promo: Promotion, currentValue: boolean) => {
    const newValue = !currentValue;
    // Optimistic UI update
    setPromotionsList((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, isActive: newValue } : p))
    );

    const result = await togglePromotionStatus(promo.id, newValue);
    if (!result.success) {
      toast.error(result.error || 'Gagal mengubah status promo');
      // Revert
      setPromotionsList((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, isActive: currentValue } : p))
      );
    } else {
      toast.success(`Promo "${promo.name}" kini ${newValue ? 'Aktif' : 'Nonaktif'}`);
    }
  };

  const onSubmitAdd = async (values: z.infer<typeof promoFormSchema>) => {
    setIsLoading(true);
    try {
      const result = await createPromotion(values);
      if (result.success) {
        toast.success('Promo baru berhasil ditambahkan!');
        setIsAddOpen(false);
        form.reset();
        window.location.reload();
      } else {
        toast.error(result.error || 'Gagal menambahkan promo');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitEdit = async (values: z.infer<typeof promoFormSchema>) => {
    if (!selectedPromo) return;
    setIsLoading(true);
    try {
      const result = await updatePromotion(selectedPromo.id, values);
      if (result.success) {
        toast.success('Promo berhasil diperbarui!');
        setIsEditOpen(false);
        window.location.reload();
      } else {
        toast.error(result.error || 'Gagal memperbarui promo');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!selectedPromo) return;
    setIsLoading(true);
    const result = await deletePromotion(selectedPromo.id);
    setIsLoading(false);
    if (result.success) {
      toast.success('Promo berhasil dihapus');
      setIsDeleteOpen(false);
      setPromotionsList((prev) => prev.filter((p) => p.id !== selectedPromo.id));
    } else {
      toast.error(result.error || 'Gagal menghapus promo');
    }
  };

  const handleEditClick = (promo: Promotion) => {
    setSelectedPromo(promo);
    form.reset({
      name: promo.name,
      type: promo.type as 'PERCENTAGE' | 'FIXED',
      value: parseFloat(promo.value),
      minOrder: parseFloat(promo.minOrder || '0'),
      maxDiscount: promo.maxDiscount ? parseFloat(promo.maxDiscount) : null,
      isActive: promo.isActive,
      startDate: promo.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : '',
      endDate: promo.endDate ? new Date(promo.endDate).toISOString().split('T')[0] : '',
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (promo: Promotion) => {
    setSelectedPromo(promo);
    setIsDeleteOpen(true);
  };

  const columns: ColumnDef<Promotion>[] = [
    {
      accessorKey: 'name',
      header: 'Nama Promo & Tipe',
      cell: ({ row }) => {
        const promo = row.original;
        return (
          <div className="flex items-start gap-3 py-1">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">{promo.name}</span>
              <span className="text-xs text-muted-foreground">
                {promo.type === 'PERCENTAGE' ? 'Diskon Persentase (%)' : 'Potongan Nominal Langsung (Rp)'}
              </span>
            </div>
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
          <div className="font-bold text-sm text-primary">
            {promo.type === 'PERCENTAGE' ? `${val}%` : formatCurrency(val)}
            {promo.type === 'PERCENTAGE' && promo.maxDiscount && (
              <span className="text-xs text-muted-foreground block font-normal">
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
        return <span className="text-sm font-medium">{minOrder > 0 ? formatCurrency(minOrder) : 'Tanpa Minimum'}</span>;
      },
    },
    {
      id: 'period',
      header: 'Masa Berlaku',
      cell: ({ row }) => {
        const promo = row.original;
        if (!promo.startDate && !promo.endDate) {
          return <span className="text-xs text-muted-foreground font-medium">Selalu Aktif</span>;
        }
        const start = promo.startDate ? new Date(promo.startDate).toLocaleDateString('id-ID') : 'Sekarang';
        const end = promo.endDate ? new Date(promo.endDate).toLocaleDateString('id-ID') : 'Seterusnya';
        return (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
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
            <span className={`text-xs font-semibold ${promo.isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
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
              className="h-8 w-8 text-primary hover:bg-primary/10"
              onClick={() => handleEditClick(promo)}
              title="Edit Promo"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => handleDeleteClick(promo)}
              title="Hapus Promo"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const totalPromos = promotionsList.length;
  const activePromos = promotionsList.filter((p) => p.isActive).length;

  const PromoFormModal = ({ onSubmit, isEdit = false }: { onSubmit: any; isEdit?: boolean }) => (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Promo <span className="text-destructive">*</span></Label>
        <Input 
          id="name" 
          {...form.register('name')} 
          placeholder="Misal: Diskon Merdeka 17%, Hemat Akhir Pekan" 
          className="font-medium"
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipe Diskon</Label>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tipe Diskon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                  <SelectItem value="FIXED">Potongan Tetap (Rp)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="value">
            {activePromoType === 'PERCENTAGE' ? 'Besar Diskon (%)' : 'Potongan Harga (Rp)'} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="value"
            type="number"
            step="0.01"
            min="0"
            {...form.register('value')}
            placeholder={activePromoType === 'PERCENTAGE' ? '10' : '10000'}
          />
          {form.formState.errors.value && (
            <p className="text-xs text-destructive">{form.formState.errors.value.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minOrder">Minimal Belanja (Rp)</Label>
          <Input id="minOrder" type="number" {...form.register('minOrder')} placeholder="0 (Tanpa min. belanja)" />
        </div>
        {activePromoType === 'PERCENTAGE' && (
          <div className="space-y-2">
            <Label htmlFor="maxDiscount">Maksimal Diskon (Rp) (Opsional)</Label>
            <Input id="maxDiscount" type="number" {...form.register('maxDiscount')} placeholder="Kosongkan jika tanpa batas" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Tanggal Mulai (Opsional)</Label>
          <Input id="startDate" type="date" {...form.register('startDate')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Tanggal Berakhir (Opsional)</Label>
          <Input id="endDate" type="date" {...form.register('endDate')} />
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Controller
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label htmlFor="isActive" className="cursor-pointer font-medium">Aktifkan promo ini langsung</Label>
      </div>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsAddOpen(false);
            setIsEditOpen(false);
          }}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Promo'}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Manajemen Promo & Diskon
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola promo, diskon persentase, dan potongan harga yang dapat dipilih langsung di kasir dan diklaim oleh pelanggan.
          </p>
        </div>
        <Button
          onClick={() => {
            form.reset({
              name: '',
              type: 'PERCENTAGE',
              value: 10,
              minOrder: 0,
              maxDiscount: null,
              isActive: true,
              startDate: '',
              endDate: '',
            });
            setIsAddOpen(true);
          }}
          className="rounded-xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Promo Baru
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Promo Dibuat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPromos} Promo</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promo Sedang Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activePromos} Promo</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Integrasi Kasir & Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-primary">Tersinkronisasi Otomatis</div>
            <p className="text-xs text-muted-foreground mt-1">Dapat langsung dipilih kasir dan diklaim saat checkout online</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Promo</CardTitle>
          <CardDescription>Semua promo yang aktif otomatis tersedia untuk dipilih di Kasir POS dan diklaim oleh pelanggan.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={promotionsList}
            searchKey="name"
            searchPlaceholder="Cari nama promo..."
          />
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat Promo Baru</DialogTitle>
            <DialogDescription>
              Tentukan nama promo, besaran diskon, serta syarat minimal belanja.
            </DialogDescription>
          </DialogHeader>
          <PromoFormModal onSubmit={onSubmitAdd} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Promo</DialogTitle>
            <DialogDescription>Perbarui rincian promo ini.</DialogDescription>
          </DialogHeader>
          <PromoFormModal onSubmit={onSubmitEdit} isEdit={true} />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Promo</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus promo <b>{selectedPromo?.name}</b>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <Button type="button" variant="destructive" onClick={onConfirmDelete} disabled={isLoading}>
              {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

