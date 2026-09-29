'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  ChevronRight, 
  ArrowLeft, 
  Check, 
  Loader2,
  Search,
  CheckSquare,
  Square
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
import { 
  createPromotion, 
  updatePromotion, 
  togglePromotionStatus, 
  deletePromotion,
  getTenantProductsForPromo,
  getPromotionTransactions 
} from '@/lib/actions/promotions';
import { cn } from '@/lib/utils';

export type Promotion = {
  id: string;
  tenantId: string;
  code?: string;
  name: string;
  type: string;
  value: string;
  minOrder: string;
  maxDiscount: string | null;
  targetType?: string;
  applicableProductIds?: string[] | any;
  minProductQty?: number;
  isActive: boolean;
  startDate: Date | string | null;
  endDate: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  totalUsage?: number;
  totalDiscountValue?: number;
};

export type ProductForPromo = {
  id: string;
  name: string;
  price: string;
  imageUrl?: string | null;
  sku: string;
  isActive: boolean;
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
  targetType: z.enum(['ALL', 'SPECIFIC_PRODUCTS']),
  applicableProductIds: z.array(z.string()),
  minProductQty: z.coerce.number().min(1, 'Minimal jumlah produk 1'),
  isActive: z.boolean(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

function parseProductIds(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return [];
    }
  }
  return [];
}

function calculateDiscountedPrice(priceStr: string, promo: Promotion | null): { discountAmount: number; finalPrice: number } {
  const price = parseFloat(priceStr || '0');
  if (!promo || price <= 0) return { discountAmount: 0, finalPrice: price };

  const promoVal = parseFloat(promo.value || '0');
  let discount = 0;
  if (promo.type === 'PERCENTAGE') {
    discount = (price * promoVal) / 100;
    if (promo.maxDiscount) {
      const maxD = parseFloat(promo.maxDiscount);
      if (discount > maxD) discount = maxD;
    }
  } else {
    discount = promoVal;
  }

  if (discount > price) discount = price;
  const finalPrice = Math.max(0, price - discount);
  return { discountAmount: discount, finalPrice };
}

export function PromotionsClient({ initialPromotions }: { initialPromotions: Promotion[] }) {
  const [promotionsList, setPromotionsList] = React.useState<Promotion[]>(initialPromotions);
  const [viewMode, setViewMode] = React.useState<'list' | 'editor'>('list');
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [editingPromo, setEditingPromo] = React.useState<Promotion | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [selectedPromoForDelete, setSelectedPromoForDelete] = React.useState<Promotion | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Products state for step 2 product selector
  const [productsList, setProductsList] = React.useState<ProductForPromo[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(false);
  const [productSearchQuery, setProductSearchQuery] = React.useState('');

  // History & Detail modal state
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [modalActiveTab, setModalActiveTab] = React.useState<'products' | 'transactions'>('products');
  const [productDetailSearch, setProductDetailSearch] = React.useState('');
  const [selectedPromoForHistory, setSelectedPromoForHistory] = React.useState<Promotion | null>(null);
  const [historyTransactions, setHistoryTransactions] = React.useState<any[]>([]);
  const [historyStats, setHistoryStats] = React.useState<{ totalUsage: number; totalDiscountValue: number }>({
    totalUsage: 0,
    totalDiscountValue: 0,
  });
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const [historySearchQuery, setHistorySearchQuery] = React.useState('');

  // Load products list for step 2 picker
  React.useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      const res = await getTenantProductsForPromo();
      if (res.success && res.data) {
        setProductsList(res.data);
      }
      setIsLoadingProducts(false);
    };
    fetchProducts();
  }, []);

  const form = useForm<z.infer<typeof promoFormSchema>>({
    resolver: zodResolver(promoFormSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'PERCENTAGE',
      value: 10,
      minOrder: 0,
      maxDiscount: null,
      targetType: 'ALL',
      applicableProductIds: [],
      minProductQty: 1,
      isActive: true,
      startDate: '',
      endDate: '',
    },
  });

  const formValues = form.watch();
  const activePromoType = form.watch('type');
  const targetType = form.watch('targetType');
  const selectedProductIds = form.watch('applicableProductIds') || [];

  const handleOpenCreate = () => {
    setEditingPromo(null);
    form.reset({
      code: '',
      name: '',
      type: 'PERCENTAGE',
      value: 10,
      minOrder: 0,
      maxDiscount: null,
      targetType: 'ALL',
      applicableProductIds: [],
      minProductQty: 1,
      isActive: true,
      startDate: '',
      endDate: '',
    });
    setProductSearchQuery('');
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
      targetType: (promo.targetType as 'ALL' | 'SPECIFIC_PRODUCTS') || 'ALL',
      applicableProductIds: parseProductIds(promo.applicableProductIds),
      minProductQty: promo.minProductQty || 1,
      isActive: promo.isActive,
      startDate: promo.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : '',
      endDate: promo.endDate ? new Date(promo.endDate).toISOString().split('T')[0] : '',
    });
    setProductSearchQuery('');
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

  const handleOpenDetailModal = async (promo: Promotion, defaultTab: 'products' | 'transactions' = 'products') => {
    setSelectedPromoForHistory(promo);
    setModalActiveTab(defaultTab);
    setIsHistoryOpen(true);
    setProductDetailSearch('');
    setHistorySearchQuery('');
    setIsLoadingHistory(true);
    const res = await getPromotionTransactions(promo.id);
    setIsLoadingHistory(false);
    if (res.success && res.data) {
      setHistoryTransactions(res.data);
      setHistoryStats(res.stats || { totalUsage: 0, totalDiscountValue: 0 });
    } else {
      toast.error(res.error || 'Gagal mengambil riwayat transaksi promo');
    }
  };

  const handleOpenHistoryModal = (promo: Promotion) => handleOpenDetailModal(promo, 'transactions');

  const handleSubmitForm = async (values: z.infer<typeof promoFormSchema>) => {
    if (values.targetType === 'SPECIFIC_PRODUCTS' && values.applicableProductIds.length === 0) {
      toast.error('Silakan pilih minimal 1 produk untuk diskon khusus produk.');
      return;
    }

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

  const toggleSelectProduct = (productId: string) => {
    const current = form.getValues('applicableProductIds') || [];
    if (current.includes(productId)) {
      form.setValue('applicableProductIds', current.filter((id) => id !== productId));
    } else {
      form.setValue('applicableProductIds', [...current, productId]);
    }
  };

  const toggleSelectAllProducts = () => {
    const current = form.getValues('applicableProductIds') || [];
    if (current.length === productsList.length) {
      form.setValue('applicableProductIds', []);
    } else {
      form.setValue('applicableProductIds', productsList.map((p) => p.id));
    }
  };

  const columns: ColumnDef<Promotion>[] = [
    {
      accessorKey: 'name',
      header: () => <span className="font-medium text-xs text-foreground">Nama & Scope Promo</span>,
      cell: ({ row }) => {
        const promo = row.original;
        const appProductIds = parseProductIds(promo.applicableProductIds);
        const isSpecific = promo.targetType === 'SPECIFIC_PRODUCTS';

        return (
          <div className="py-1 space-y-1 min-w-[200px] font-sans">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground">{promo.name}</span>
              {promo.code && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                  {promo.code}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {isSpecific ? (
                <button
                  type="button"
                  onClick={() => handleOpenDetailModal(promo, 'products')}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-colors text-left cursor-pointer"
                  title="Klik untuk melihat daftar produk yang terdaftar"
                >
                  Khusus {appProductIds.length} Produk (Min {promo.minProductQty || 1} pcs) • Lihat Produk
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenDetailModal(promo, 'products')}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Klik untuk melihat detail diskon"
                >
                  Semua Produk (Global) • Lihat Detail
                </button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'value',
      header: () => <span className="font-medium text-xs text-foreground">Besar Diskon</span>,
      cell: ({ row }) => {
        const promo = row.original;
        const val = parseFloat(promo.value);
        return (
          <div className="min-w-[100px] font-sans">
            <span className="text-sm font-semibold text-foreground">
              {promo.type === 'PERCENTAGE' ? `${val}%` : formatCurrency(val)}
            </span>
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
      header: () => <span className="font-medium text-xs text-foreground">Min. Belanja</span>,
      cell: ({ row }) => {
        const minOrder = parseFloat(row.getValue('minOrder') || '0');
        return (
          <div className="min-w-[100px] font-sans">
            <span className="text-xs font-normal text-muted-foreground">
              {minOrder > 0 ? formatCurrency(minOrder) : 'Tanpa Minimum'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'usageStats',
      header: () => <span className="font-medium text-xs text-foreground">Penggunaan</span>,
      cell: ({ row }) => {
        const promo = row.original;
        const usageCount = promo.totalUsage || 0;
        const totalSaved = promo.totalDiscountValue || 0;
        return (
          <div className="space-y-0.5 min-w-[150px] font-sans">
            <p className="text-xs font-medium text-foreground">
              {usageCount}x terpakai
            </p>
            <p className="text-[11px] text-muted-foreground font-normal">
              Total: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalSaved)}</span>
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: () => <span className="font-medium text-xs text-foreground">Status</span>,
      cell: ({ row }) => {
        const promo = row.original;
        return (
          <div className="flex items-center gap-2 min-w-[90px] font-sans">
            <Switch
              checked={promo.isActive}
              onCheckedChange={() => handleToggleStatus(promo, promo.isActive)}
            />
            <span className={cn("text-xs font-medium", promo.isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>
              {promo.isActive ? 'Aktif' : 'Off'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right font-medium text-xs text-foreground">Aksi</div>,
      cell: ({ row }) => {
        const promo = row.original;
        return (
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap min-w-[170px] font-sans">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs font-medium rounded-lg text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-900/80 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              onClick={() => handleOpenDetailModal(promo, 'products')}
              title="Lihat Detail Produk & Riwayat Diskon"
            >
              Detail Diskon
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              onClick={() => handleOpenEdit(promo)}
              title="Edit Promo"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
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
  const grandTotalDiscountGiven = promotionsList.reduce((sum, p) => sum + (p.totalDiscountValue || 0), 0);

  const filteredHistory = historyTransactions.filter((tx) => {
    if (!historySearchQuery.trim()) return true;
    const query = historySearchQuery.toLowerCase();
    const orderNum = (tx.orderNumber || '').toLowerCase();
    const customer = (tx.customerName || '').toLowerCase();
    return orderNum.includes(query) || customer.includes(query);
  });

  const filteredProductsForPicker = productsList.filter((p) => {
    if (!productSearchQuery.trim()) return true;
    const q = productSearchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
  });

  const eligibleProductsForDetail = React.useMemo(() => {
    if (!selectedPromoForHistory) return [];
    const isSpecific = selectedPromoForHistory.targetType === 'SPECIFIC_PRODUCTS';
    if (isSpecific) {
      const idSet = new Set(parseProductIds(selectedPromoForHistory.applicableProductIds));
      return productsList.filter((p) => idSet.has(p.id));
    }
    return productsList;
  }, [selectedPromoForHistory, productsList]);

  const filteredEligibleProducts = React.useMemo(() => {
    if (!productDetailSearch.trim()) return eligibleProductsForDetail;
    const q = productDetailSearch.toLowerCase();
    return eligibleProductsForDetail.filter((p) =>
      p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [eligibleProductsForDetail, productDetailSearch]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 font-sans">
      {/* HEADER UTAMA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Manajemen Promo & Diskon Produk
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atur promo global atau khusus per produk, syarat minimal produk, serta pantau total nominal uang kepotong dan riwayat transaksi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'editor' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-9 text-xs font-medium rounded-lg"
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
              Buat Promo Baru
            </Button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: LIST / DAFTAR PROMO */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* STATS SUMMARY BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <p className="text-xs text-muted-foreground font-medium">Total Promo</p>
              <p className="text-2xl font-semibold tracking-tight text-foreground mt-1">{totalPromos}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <p className="text-xs text-muted-foreground font-medium">Promo Aktif</p>
              <p className="text-2xl font-semibold tracking-tight text-blue-600 dark:text-blue-400 mt-1">{activePromos}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <p className="text-xs text-muted-foreground font-medium">Total Potongan Diberikan</p>
              <p className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(grandTotalDiscountGiven)}
              </p>
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="rounded-xl border border-border bg-background overflow-hidden p-4">
            <DataTable
              columns={columns}
              data={promotionsList}
              searchKey="name"
              searchPlaceholder="Cari nama promo atau kode..."
            />
          </div>
        </div>
      )}

      {/* VIEW MODE 2: FORM EDITOR */}
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
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px]",
                currentStep === 1 ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
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
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px]",
                currentStep === 2 ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
              )}>
                2
              </span>
              <span>Cakupan & Syarat Produk</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0",
                currentStep === 3
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px]",
                currentStep === 3 ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
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
                <div className="rounded-xl border border-border bg-background p-5 sm:p-6 space-y-6">
                  
                  {/* STEP 1: INFORMASI PROMO */}
                  {currentStep === 1 && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-base font-semibold text-foreground">
                          Informasi Dasar Promo
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tentukan nama dan tipe potongan harga yang akan diberikan ke pelanggan.
                        </p>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="code" className="text-xs font-medium text-foreground">
                              Kode Promo <span className="text-destructive">*</span>
                            </Label>
                            <span className="text-[10px] text-muted-foreground font-normal">Karakter kapital & angka tanpa spasi</span>
                          </div>
                          <Input
                            id="code"
                            {...form.register('code', {
                              onChange: (e) => {
                                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                              }
                            })}
                            placeholder="Contoh: HEMAT50, DISKONKOPI, MERDEKA17"
                            className="rounded-lg h-10 bg-background border-input text-sm font-sans tracking-wide uppercase"
                          />
                          {form.formState.errors.code ? (
                            <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">Pelanggan akan memasukkan kode ini saat checkout untuk mendapatkan potongan.</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-xs font-medium text-foreground">
                            Nama Promo <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="name"
                            {...form.register('name')}
                            placeholder="Contoh: Promo Spesifik Kopi Susu, Diskon Merdeka 17%"
                            className="rounded-lg h-10 bg-background border-input text-sm"
                          />
                          {form.formState.errors.name && (
                            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-foreground">
                            Tipe Diskon <span className="text-destructive">*</span>
                          </Label>
                          <Controller
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="w-full h-10 bg-background border-input rounded-lg text-sm">
                                  <SelectValue placeholder="Pilih Tipe Diskon" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg font-sans">
                                  <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                                  <SelectItem value="FIXED">Potongan Tetap (Rp)</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="value" className="text-xs font-medium text-foreground">
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
                              className="rounded-lg h-10 bg-background border-input text-sm pr-12"
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
                          Lanjut ke Cakupan & Syarat Produk
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: CAKUPAN DISKON & SYARAT PER PRODUK */}
                  {currentStep === 2 && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-base font-semibold text-foreground">
                          Cakupan & Syarat Produk
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Atur apakah diskon berlaku untuk seluruh toko atau hanya untuk produk tertentu dengan syarat jumlah minimal.
                        </p>
                      </div>

                      <div className="space-y-4 pt-1">
                        {/* SELECT TARGET TYPE */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-foreground">
                            Cakupan Berlaku Promo
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => form.setValue('targetType', 'ALL')}
                              className={cn(
                                "p-3.5 rounded-lg border text-left transition-all",
                                targetType === 'ALL'
                                  ? "border-primary bg-muted/40 text-foreground ring-1 ring-primary"
                                  : "border-border hover:border-muted-foreground/30 bg-background"
                              )}
                            >
                              <p className="text-xs font-semibold text-foreground">Semua Produk (Global)</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Diskon berlaku untuk seluruh keranjang tanpa membatasi jenis produk.
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => form.setValue('targetType', 'SPECIFIC_PRODUCTS')}
                              className={cn(
                                "p-3.5 rounded-lg border text-left transition-all",
                                targetType === 'SPECIFIC_PRODUCTS'
                                  ? "border-primary bg-muted/40 text-foreground ring-1 ring-primary"
                                  : "border-border hover:border-muted-foreground/30 bg-background"
                              )}
                            >
                              <p className="text-xs font-semibold text-foreground">Khusus Produk Tertentu</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Pilih produk mana saja yang mendapatkan promo / menjadi syarat belanja.
                              </p>
                            </button>
                          </div>
                        </div>

                        {/* PRODUCT SELECTOR LIST */}
                        {targetType === 'SPECIFIC_PRODUCTS' && (
                          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h3 className="text-xs font-semibold text-foreground">
                                  Pilih Produk ({selectedProductIds.length} terpilih)
                                </h3>
                                <p className="text-[11px] text-muted-foreground">
                                  Pelanggan harus memesan produk yang dicentang di bawah untuk menikmati diskon.
                                </p>
                              </div>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={toggleSelectAllProducts}
                                className="h-7 px-2.5 text-[11px] font-medium rounded-lg"
                              >
                                {selectedProductIds.length === productsList.length ? 'Batal Pilih Semua' : 'Pilih Semua Produk'}
                              </Button>
                            </div>

                            {/* SEARCH PRODUCTS INPUT */}
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                value={productSearchQuery}
                                onChange={(e) => setProductSearchQuery(e.target.value)}
                                placeholder="Cari nama produk..."
                                className="pl-9 h-8 text-xs bg-background rounded-lg border-input"
                              />
                            </div>

                            {/* PRODUCT CHECKBOX LIST */}
                            {isLoadingProducts ? (
                              <div className="h-36 flex items-center justify-center text-xs text-muted-foreground">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin text-muted-foreground" />
                                Memuat daftar produk...
                              </div>
                            ) : filteredProductsForPicker.length === 0 ? (
                              <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-lg bg-background">
                                Tidak ada produk yang ditemukan.
                              </div>
                            ) : (
                              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                                {filteredProductsForPicker.map((product) => {
                                  const isSelected = selectedProductIds.includes(product.id);
                                  return (
                                    <div
                                      key={product.id}
                                      onClick={() => toggleSelectProduct(product.id)}
                                      className={cn(
                                        "p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors text-xs select-none",
                                        isSelected
                                          ? "border-primary bg-muted/60 text-foreground font-medium"
                                          : "border-border bg-background hover:bg-muted/40 text-muted-foreground"
                                      )}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        {isSelected ? (
                                          <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                                        ) : (
                                          <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                                        )}
                                        <div>
                                          <p className="font-medium text-foreground text-xs">{product.name}</p>
                                          {product.sku && <span className="text-[10px] text-muted-foreground font-normal">SKU: {product.sku}</span>}
                                        </div>
                                      </div>
                                      <span className="font-medium text-foreground text-xs shrink-0">
                                        {formatCurrency(parseFloat(product.price))}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* MINIMAL QTY INPUT */}
                            <div className="pt-2 border-t border-border space-y-1.5">
                              <Label htmlFor="minProductQty" className="text-xs font-medium text-foreground">
                                Minimal Jumlah Produk Syarat (Pcs)
                              </Label>
                              <Input
                                id="minProductQty"
                                type="number"
                                min="1"
                                {...form.register('minProductQty')}
                                placeholder="1"
                                className="h-9 text-xs bg-background rounded-lg max-w-xs"
                              />
                              <p className="text-[11px] text-muted-foreground">
                                Minimal jumlah pcs produk eligible yang harus dibeli di keranjang untuk membuka diskon ini.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* MINIMAL BELANJA GENERAL */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="minOrder" className="text-xs font-medium text-foreground">
                              Minimal Total Belanja (Rp)
                            </Label>
                            <Input
                              id="minOrder"
                              type="number"
                              {...form.register('minOrder')}
                              placeholder="0 (Tanpa minimal)"
                              className="rounded-lg h-10 bg-background border-input text-sm"
                            />
                            <p className="text-[11px] text-muted-foreground">Isi 0 jika tidak ada syarat minimum total uang belanja.</p>
                          </div>

                          {activePromoType === 'PERCENTAGE' && (
                            <div className="space-y-1.5">
                              <Label htmlFor="maxDiscount" className="text-xs font-medium text-foreground">
                                Maksimal Potongan Diskon (Rp)
                              </Label>
                              <Input
                                id="maxDiscount"
                                type="number"
                                {...form.register('maxDiscount')}
                                placeholder="Contoh: 25000"
                                className="rounded-lg h-10 bg-background border-input text-sm"
                              />
                              <p className="text-[11px] text-muted-foreground">Batas maksimal nominal potongan persen yang diberikan.</p>
                            </div>
                          )}
                        </div>

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
                        <h2 className="text-base font-semibold text-foreground">
                          Masa Berlaku & Status
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tentukan periode tanggal aktif promo dan status ketersediaannya.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="startDate" className="text-xs font-medium text-foreground">
                            Tanggal Mulai
                          </Label>
                          <Input
                            id="startDate"
                            type="date"
                            {...form.register('startDate')}
                            className="rounded-lg h-10 bg-background border-input text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="endDate" className="text-xs font-medium text-foreground">
                            Tanggal Selesai
                          </Label>
                          <Input
                            id="endDate"
                            type="date"
                            {...form.register('endDate')}
                            className="rounded-lg h-10 bg-background border-input text-sm"
                          />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg border border-input bg-muted/20 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="isActivePromo" className="text-xs font-medium">
                            Aktifkan Promo Sekarang
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Promo akan langsung dapat dipilih kasir POS dan diklaim pelanggan toko online.
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

            {/* RIGHT: LIVE PROMO SUMMARY CARD */}
            <div className="lg:col-span-4">
              <div className="sticky top-6 space-y-4">
                <div className="rounded-xl border border-border bg-background p-5 space-y-4">
                  
                  {/* SUMMARY HEADER */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Ringkasan Aturan Promo
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Pratinjau aturan diskon yang dibuat
                    </p>
                  </div>

                  {/* PROMO TITLE */}
                  <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {formValues.name || 'Nama Promo'}
                      </p>
                      {formValues.code && (
                        <span className="shrink-0 px-2 py-0.5 rounded bg-muted text-foreground border border-border text-[10px] font-medium">
                          {formValues.code}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {formValues.type === 'PERCENTAGE' ? 'Diskon Persentase' : 'Potongan Tetap'}
                    </p>
                  </div>

                  {/* DETAILS ROWS */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Nilai Potongan</span>
                      <span className="font-semibold text-foreground">
                        {formValues.type === 'PERCENTAGE' 
                          ? `${formValues.value || 0}%` 
                          : formatCurrency(formValues.value || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Cakupan Produk</span>
                      <span className="font-medium text-foreground">
                        {targetType === 'SPECIFIC_PRODUCTS'
                          ? `Khusus ${selectedProductIds.length} Produk (Min ${formValues.minProductQty || 1} pcs)`
                          : 'Semua Produk'}
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
                        <span className="text-muted-foreground">Maks. Potongan</span>
                        <span className="font-medium text-foreground">
                          {formValues.maxDiscount && Number(formValues.maxDiscount) > 0
                            ? formatCurrency(Number(formValues.maxDiscount))
                            : 'Tanpa Batas'}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DETAIL DISKON, PRODUK & TRANSAKSI */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-4xl md:max-w-5xl w-[94vw] max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl p-5 sm:p-6 border border-border bg-background shadow-lg">
          <DialogHeader className="pr-8 pb-3 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-base font-semibold text-foreground">
                    {selectedPromoForHistory?.name}
                  </DialogTitle>
                  {selectedPromoForHistory?.code && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                      {selectedPromoForHistory.code}
                    </span>
                  )}
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-medium border",
                    selectedPromoForHistory?.isActive
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60"
                      : "bg-muted text-muted-foreground border-border"
                  )}>
                    {selectedPromoForHistory?.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Detail lengkap aturan diskon, daftar produk yang memenuhi syarat, serta riwayat transaksi penggunaan.
                </DialogDescription>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-lg w-fit border border-border/60 mt-3">
              <button
                type="button"
                onClick={() => setModalActiveTab('products')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs transition-colors font-medium flex items-center gap-2",
                  modalActiveTab === 'products'
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Produk & Aturan Diskon</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                  modalActiveTab === 'products'
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50"
                    : "bg-muted text-muted-foreground"
                )}>
                  {selectedPromoForHistory?.targetType === 'SPECIFIC_PRODUCTS'
                    ? `${eligibleProductsForDetail.length} Produk`
                    : 'Semua Produk'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('transactions')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs transition-colors font-medium flex items-center gap-2",
                  modalActiveTab === 'transactions'
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Riwayat Transaksi</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                  modalActiveTab === 'transactions'
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50"
                    : "bg-muted text-muted-foreground"
                )}>
                  {historyStats.totalUsage}
                </span>
              </button>
            </div>
          </DialogHeader>

          {/* TAB 1: PRODUK & ATURAN DISKON */}
          {modalActiveTab === 'products' && (
            <div className="space-y-5 pt-3">
              {/* SUMMARY GRID CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <p className="text-[11px] text-muted-foreground font-medium">Besar Potongan</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {selectedPromoForHistory?.type === 'PERCENTAGE'
                      ? `${parseFloat(selectedPromoForHistory?.value || '0')}%`
                      : formatCurrency(parseFloat(selectedPromoForHistory?.value || '0'))}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {selectedPromoForHistory?.type === 'PERCENTAGE' && selectedPromoForHistory?.maxDiscount
                      ? `Maks: ${formatCurrency(parseFloat(selectedPromoForHistory.maxDiscount))}`
                      : 'Tanpa batas maksimal'}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <p className="text-[11px] text-muted-foreground font-medium">Cakupan Produk</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {selectedPromoForHistory?.targetType === 'SPECIFIC_PRODUCTS'
                      ? `Khusus ${eligibleProductsForDetail.length} Produk`
                      : 'Semua Produk'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {selectedPromoForHistory?.targetType === 'SPECIFIC_PRODUCTS'
                      ? `Min. ${selectedPromoForHistory?.minProductQty || 1} pcs produk berlaku`
                      : 'Berlaku seluruh menu'}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <p className="text-[11px] text-muted-foreground font-medium">Min. Belanja</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {selectedPromoForHistory?.minOrder && parseFloat(selectedPromoForHistory.minOrder) > 0
                      ? formatCurrency(parseFloat(selectedPromoForHistory.minOrder))
                      : 'Tanpa Minimum'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Syarat subtotal belanja
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <p className="text-[11px] text-muted-foreground font-medium">Masa Berlaku</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    {selectedPromoForHistory?.startDate || selectedPromoForHistory?.endDate ? (
                      <>
                        {selectedPromoForHistory.startDate ? new Date(selectedPromoForHistory.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Kapan saja'}
                        {' s/d '}
                        {selectedPromoForHistory.endDate ? new Date(selectedPromoForHistory.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Seterusnya'}
                      </>
                    ) : (
                      'Selalu Aktif'
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Periode promo
                  </p>
                </div>
              </div>

              {/* DAFTAR PRODUK HEADER & SEARCH */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {selectedPromoForHistory?.targetType === 'SPECIFIC_PRODUCTS'
                        ? `Daftar Produk yang Terdaftar (${eligibleProductsForDetail.length} Produk)`
                        : `Daftar Produk yang Memenuhi Syarat (${productsList.length} Produk)`}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedPromoForHistory?.targetType === 'SPECIFIC_PRODUCTS'
                        ? `Pelanggan berhak mendapatkan diskon ini jika memesan produk di bawah ini (minimal ${selectedPromoForHistory?.minProductQty || 1} pcs).`
                        : 'Diskon ini berlaku umum untuk semua produk yang ada di katalog outlet Anda.'}
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={productDetailSearch}
                      onChange={(e) => setProductDetailSearch(e.target.value)}
                      placeholder="Cari nama produk / SKU..."
                      className="pl-8 h-8 text-xs rounded-lg border-input bg-background font-sans"
                    />
                  </div>
                </div>

                {/* EMPTY PRODUCT STATE */}
                {filteredEligibleProducts.length === 0 ? (
                  <div className="p-8 text-center border border-dashed rounded-lg space-y-1">
                    <p className="text-xs font-medium text-foreground">
                      {productDetailSearch ? 'Produk tidak ditemukan' : 'Belum ada produk yang terdaftar'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {productDetailSearch
                        ? `Tidak ada produk yang cocok dengan "${productDetailSearch}"`
                        : 'Promo ini belum memilih produk manapun. Silakan edit promo untuk menambahkan produk.'}
                    </p>
                  </div>
                ) : (
                  /* PRODUCT TABLE */
                  <div className="rounded-lg border border-border overflow-hidden bg-background">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs border-collapse min-w-[620px] font-sans">
                        <thead className="bg-muted/40 border-b border-border text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3 font-medium">Nama Produk</th>
                            <th className="py-2.5 px-3 font-medium text-right">Harga Asli</th>
                            <th className="py-2.5 px-3 font-medium text-right">Potongan Diskon</th>
                            <th className="py-2.5 px-3 font-medium text-right">Harga Setelah Diskon</th>
                            <th className="py-2.5 px-3 font-medium text-center">Status Produk</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredEligibleProducts.map((prod) => {
                            const { discountAmount, finalPrice } = calculateDiscountedPrice(prod.price, selectedPromoForHistory);
                            const origPrice = parseFloat(prod.price || '0');

                            return (
                              <tr key={prod.id} className="hover:bg-muted/20 transition-colors">
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2.5">
                                    {prod.imageUrl ? (
                                      <img
                                        src={prod.imageUrl}
                                        alt={prod.name}
                                        className="w-8 h-8 rounded object-cover border border-border shrink-0"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground border border-border shrink-0">
                                        P
                                      </div>
                                    )}
                                    <div>
                                      <span className="font-medium text-foreground block">{prod.name}</span>
                                      {prod.sku && (
                                        <span className="text-[10px] text-muted-foreground">SKU: {prod.sku}</span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 text-right text-muted-foreground font-normal">
                                  {formatCurrency(origPrice)}
                                </td>

                                <td className="py-2.5 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                  -{formatCurrency(discountAmount)}
                                  {selectedPromoForHistory?.type === 'PERCENTAGE' && (
                                    <span className="text-[10px] text-muted-foreground ml-1 font-normal">
                                      ({parseFloat(selectedPromoForHistory.value || '0')}%)
                                    </span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(finalPrice)}
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-medium border",
                                    prod.isActive
                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60"
                                      : "bg-muted text-muted-foreground border-border"
                                  )}>
                                    {prod.isActive ? 'Tersedia' : 'Nonaktif'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="py-2 px-3 bg-muted/20 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Menampilkan {filteredEligibleProducts.length} dari {eligibleProductsForDetail.length} produk</span>
                      {selectedPromoForHistory?.targetType === 'SPECIFIC_PRODUCTS' && (
                        <span>Minimal beli: {selectedPromoForHistory.minProductQty || 1} pcs per produk</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RIWAYAT TRANSAKSI */}
          {modalActiveTab === 'transactions' && (
            <div className="space-y-4 pt-3">
              {/* STATS HEADER CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg border border-border bg-card">
                  <p className="text-xs text-muted-foreground font-medium">Total Penggunaan</p>
                  <p className="text-xl font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                    {historyStats.totalUsage} Transaksi
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-card">
                  <p className="text-xs text-muted-foreground font-medium">Total Potongan Diberikan</p>
                  <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatCurrency(historyStats.totalDiscountValue)}
                  </p>
                </div>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Cari no. order atau nama pelanggan..."
                  className="pl-9 h-9 text-xs rounded-lg border-input bg-background font-sans"
                />
              </div>

              {/* TRANSACTIONS TABLE */}
              {isLoadingHistory ? (
                <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
                  Memuat riwayat transaksi...
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-lg space-y-1">
                  <p className="text-xs font-medium text-foreground">Belum ada transaksi</p>
                  <p className="text-xs text-muted-foreground">
                    Diskon ini belum pernah digunakan pada transaksi yang tercatat.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden bg-background">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs border-collapse min-w-[620px] font-sans">
                      <thead className="bg-muted/40 border-b border-border text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 font-medium">No. Order</th>
                          <th className="py-2.5 px-3 font-medium">Waktu</th>
                          <th className="py-2.5 px-3 font-medium">Pelanggan / Tipe</th>
                          <th className="py-2.5 px-3 font-medium text-right">Total Pesanan</th>
                          <th className="py-2.5 px-3 font-medium text-right">Potongan</th>
                          <th className="py-2.5 px-3 font-medium text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredHistory.map((tx) => {
                          const discountAmount = parseFloat(tx.discount || '0');
                          const grandTotal = parseFloat(tx.grandTotal || '0');
                          const dateStr = tx.createdAt ? new Date(tx.createdAt).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-';

                          return (
                            <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                              <td className="py-2.5 px-3 font-medium text-foreground">
                                {tx.orderNumber || tx.id.substring(0, 8)}
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground">
                                {dateStr}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-medium text-foreground block">{tx.customerName || 'Pelanggan POS'}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">{tx.orderType || 'DINE_IN'}</span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium text-foreground">
                                {formatCurrency(grandTotal)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                -{formatCurrency(discountAmount)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-medium border",
                                  tx.status === 'COMPLETED'
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60"
                                    : tx.status === 'CANCELED'
                                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60 dark:border-rose-900/60"
                                    : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60"
                                )}>
                                  {tx.status || 'PAID'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-between sm:justify-between w-full">
            <span className="text-xs text-muted-foreground">
              ID Promo: <span className="font-medium text-foreground">{selectedPromoForHistory?.id.substring(0, 8)}...</span>
            </span>
            <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(false)} className="h-8 text-xs font-medium">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DIALOG KONFIRMASI HAPUS PROMO */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-destructive">
              Hapus Promo
            </DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus promo{' '}
              <span className="font-semibold text-foreground">{selectedPromoForDelete?.name}</span>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)} className="h-8 text-xs font-medium">
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onConfirmDelete}
              disabled={isLoading}
              className="h-8 text-xs font-medium"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
