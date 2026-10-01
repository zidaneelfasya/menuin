'use client';

import * as React from 'react';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  ChevronRight, 
  ChevronLeft,
  ArrowLeft, 
  Check, 
  Loader2,
  Search,
  CheckSquare,
  Square,
  Tag,
  Percent,
  Sparkles,
  ShoppingBag,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Eye,
  SlidersHorizontal,
  X,
  Filter,
  CheckCircle2,
  ReceiptText,
  Coins,
  Layers,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/utils/format';



function MiniSparkline(_props: any) {
  return null;
}

function formatKpiCurrency(val: number): string {
  if (val >= 1_000_000_000) {
    const m = (val / 1_000_000_000).toFixed(1).replace('.', ',');
    return `Rp ${m.endsWith(',0') ? m.slice(0, -2) : m} M`;
  }
  if (val >= 1_000_000) {
    const jt = (val / 1_000_000).toFixed(1).replace('.', ',');
    return `Rp ${jt.endsWith(',0') ? jt.slice(0, -2) : jt} Jt`;
  }
  return formatCurrency(val);
}
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

  // Filter, Tab, Search, and Pagination States (Matching Transaction History)
  type PromoTabFilter = 'all' | 'active' | 'inactive' | 'percentage' | 'fixed';
  const [activeTab, setActiveTab] = React.useState<PromoTabFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [scopeFilter, setScopeFilter] = React.useState<'all' | 'cart' | 'specific'>('all');
  const [sortBy, setSortBy] = React.useState<'newest' | 'usage' | 'discount_val' | 'name'>('newest');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kode promo "${code}" berhasil disalin`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Aggregated Stats
  const totalPromos = promotionsList.length;
  const activePromos = promotionsList.filter((p) => p.isActive).length;
  const grandTotalDiscountGiven = promotionsList.reduce((sum, p) => sum + (p.totalDiscountValue || 0), 0);
  const grandTotalUsage = promotionsList.reduce((sum, p) => sum + (p.totalUsage || 0), 0);
  const avgDiscount = grandTotalUsage > 0 ? Math.round(grandTotalDiscountGiven / grandTotalUsage) : 0;


  // Tab counts
  const tabCounts = React.useMemo(() => {
    return {
      all: promotionsList.length,
      active: promotionsList.filter((p) => p.isActive).length,
      inactive: promotionsList.filter((p) => !p.isActive).length,
      percentage: promotionsList.filter((p) => p.type === 'PERCENTAGE').length,
      fixed: promotionsList.filter((p) => p.type === 'FIXED').length,
    };
  }, [promotionsList]);

  // Filtered & Sorted Promotions
  const filteredPromos = React.useMemo(() => {
    return promotionsList
      .filter((promo) => {
        if (activeTab === 'active' && !promo.isActive) return false;
        if (activeTab === 'inactive' && promo.isActive) return false;
        if (activeTab === 'percentage' && promo.type !== 'PERCENTAGE') return false;
        if (activeTab === 'fixed' && promo.type !== 'FIXED') return false;

        if (scopeFilter === 'cart' && promo.targetType === 'SPECIFIC_PRODUCTS') return false;
        if (scopeFilter === 'specific' && promo.targetType !== 'SPECIFIC_PRODUCTS') return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = promo.name.toLowerCase().includes(q);
          const matchesCode = (promo.code || '').toLowerCase().includes(q);
          if (!matchesName && !matchesCode) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === 'usage') {
          return (b.totalUsage || 0) - (a.totalUsage || 0);
        }
        if (sortBy === 'discount_val') {
          return (b.totalDiscountValue || 0) - (a.totalDiscountValue || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [promotionsList, activeTab, scopeFilter, searchQuery, sortBy]);

  // Pagination generator
  const totalPages = Math.max(1, Math.ceil(filteredPromos.length / itemsPerPage));
  const paginatedPromos = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPromos.slice(start, start + itemsPerPage);
  }, [filteredPromos, currentPage, itemsPerPage]);

  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const statusTabs: { key: PromoTabFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Semua Promo', count: tabCounts.all },
    { key: 'active', label: 'Promo Aktif', count: tabCounts.active },
    { key: 'inactive', label: 'Nonaktif', count: tabCounts.inactive },
    { key: 'percentage', label: 'Diskon %', count: tabCounts.percentage },
    { key: 'fixed', label: 'Potongan Tetap', count: tabCounts.fixed },
  ];

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
    <div className="space-y-6">
      {/* 1. TOP HEADER (Exact match with Transaction History) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Diskon & Potongan
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola seluruh diskon promo, aturan potongan harga, dan pantau penghematan pelanggan outlet Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'editor' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-9 px-3.5 text-xs font-medium rounded-xl border-slate-200 dark:border-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Kembali ke Daftar
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="h-9 px-4 text-xs font-semibold rounded-xl bg-[#0e59f9] hover:bg-blue-600 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Promo Baru</span>
            </Button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: LIST / DAFTAR PROMO */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* 2. TOP 3 METRIC CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KPI 1: TOTAL POTONGAN DIBERIKAN - Solid Royal Blue Hero Card */}
            <div className="relative overflow-hidden rounded-[22px] bg-[#0e59f9] text-white p-5 sm:p-6 shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 transition-all flex flex-col justify-between min-h-[148px]">
              <div className="w-10 h-10 rounded-full bg-white text-[#0e59f9] flex items-center justify-center shadow-xs flex-shrink-0">
                <Percent className="w-5 h-5 text-[#0e59f9]" />
              </div>

              <div className="mt-5 min-w-0">
                <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wider block mb-1">
                  TOTAL POTONGAN
                </span>
                <div
                  className="text-2xl sm:text-[26px] font-semibold text-white tracking-tight leading-none whitespace-nowrap"
                  title={formatCurrency(grandTotalDiscountGiven)}
                >
                  {formatKpiCurrency(grandTotalDiscountGiven)}
                </div>
              </div>
            </div>

            {/* KPI 2: PROMO AKTIF - Clean White Card */}
            <div className="relative overflow-hidden rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between min-h-[148px]">
              <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>

              <div className="mt-5 min-w-0">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  PROMO AKTIF
                </span>
                <div className="text-2xl sm:text-[26px] font-semibold text-slate-900 dark:text-white tracking-tight leading-none whitespace-nowrap flex items-baseline gap-1.5">
                  <span>{activePromos}</span>
                  <span className="text-xs sm:text-sm font-normal text-slate-400 dark:text-slate-400">/ {totalPromos} Promo</span>
                </div>
              </div>
            </div>

            {/* KPI 3: TOTAL PENGGUNAAN - Clean White Card */}
            <div className="relative overflow-hidden rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between min-h-[148px]">
              <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <ReceiptText className="w-5 h-5 text-white" />
              </div>

              <div className="mt-5 min-w-0">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  TOTAL PENGGUNAAN
                </span>
                <div className="text-2xl sm:text-[26px] font-semibold text-slate-900 dark:text-white tracking-tight leading-none whitespace-nowrap flex items-baseline gap-1.5">
                  <span>{grandTotalUsage.toLocaleString('id-ID')}</span>
                  <span className="text-xs sm:text-sm font-normal text-slate-400 dark:text-slate-400">Kali</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. TABS & TOOLBAR ROW (Exact match with Transaction History) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 dark:border-slate-800 gap-4">
            {/* Left: Underline Tabs */}
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pt-1">
              {statusTabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.key);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "relative pb-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap",
                      isActive
                        ? "text-blue-600 dark:text-blue-400 font-semibold"
                        : "text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-lg font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                        : "text-slate-400 dark:text-slate-500"
                    )}>
                      {tab.count}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activePromoTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-full"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right: Search & Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5 pb-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari promo atau kode..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-8 h-9 text-xs rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Unified Filter & Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-3 rounded-xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <span>Filter & Urutan</span>
                    {(scopeFilter !== 'all' || sortBy !== 'newest') && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Cakupan Promo
                  </div>
                  <DropdownMenuItem
                    onClick={() => { setScopeFilter('all'); setCurrentPage(1); }}
                    className={cn(
                      "flex items-center justify-between text-xs rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors",
                      scopeFilter === 'all'
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>Semua Target</span>
                    {scopeFilter === 'all' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { setScopeFilter('cart'); setCurrentPage(1); }}
                    className={cn(
                      "flex items-center justify-between text-xs rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors",
                      scopeFilter === 'cart'
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>Semua Menu</span>
                    {scopeFilter === 'cart' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { setScopeFilter('specific'); setCurrentPage(1); }}
                    className={cn(
                      "flex items-center justify-between text-xs rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors",
                      scopeFilter === 'specific'
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>Khusus Produk</span>
                    {scopeFilter === 'specific' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1.5 bg-slate-100 dark:bg-slate-800" />

                  <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Urutan
                  </div>
                  <DropdownMenuItem
                    onClick={() => { setSortBy('newest'); setCurrentPage(1); }}
                    className={cn(
                      "flex items-center justify-between text-xs rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors",
                      sortBy === 'newest'
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>Terbaru</span>
                    {sortBy === 'newest' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { setSortBy('usage'); setCurrentPage(1); }}
                    className={cn(
                      "flex items-center justify-between text-xs rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors",
                      sortBy === 'usage'
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>Penggunaan Terbanyak</span>
                    {sortBy === 'usage' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { setSortBy('discount_val'); setCurrentPage(1); }}
                    className={cn(
                      "flex items-center justify-between text-xs rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors",
                      sortBy === 'discount_val'
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>Diskon Terbesar</span>
                    {sortBy === 'discount_val' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { setSortBy('name'); setCurrentPage(1); }}
                    className={cn(
                      "flex items-center justify-between text-xs rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors",
                      sortBy === 'name'
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>Nama Promo (A-Z)</span>
                    {sortBy === 'name' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </DropdownMenuItem>

                  {(scopeFilter !== 'all' || sortBy !== 'newest') && (
                    <>
                      <DropdownMenuSeparator className="my-1.5 bg-slate-100 dark:bg-slate-800" />
                      <button
                        type="button"
                        onClick={() => {
                          setScopeFilter('all');
                          setSortBy('newest');
                          setCurrentPage(1);
                        }}
                        className="w-full text-center py-1.5 text-[11px] font-medium text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        Reset Filter & Urutan
                      </button>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* 4. MODERN SAAS PROMOTION TABLE */}
          <div className="rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-xs min-w-[760px]">
                <TableHeader>
                  <TableRow className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:bg-slate-50/70 text-slate-500 dark:text-slate-400">
                    <TableHead className="py-3 px-4 text-xs font-semibold whitespace-nowrap">Promo & Kode</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold whitespace-nowrap">Besar Diskon</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold whitespace-nowrap">Syarat & Cakupan</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold whitespace-nowrap">Penggunaan</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold whitespace-nowrap text-center">Status</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold whitespace-nowrap text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {paginatedPromos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Tag className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Tidak ada diskon atau promo ditemukan
                          </p>
                          <p className="text-xs text-muted-foreground max-w-sm">
                            {searchQuery || scopeFilter !== 'all' || activeTab !== 'all'
                              ? 'Coba ubah kata kunci pencarian atau sesuaikan filter Anda.'
                              : 'Mulai buat promo diskon pertama Anda untuk memikat pelanggan outlet.'}
                          </p>
                          {(!searchQuery && scopeFilter === 'all' && activeTab === 'all') && (
                            <Button
                              size="sm"
                              onClick={handleOpenCreate}
                              className="mt-2 h-8 px-3 rounded-lg bg-[#0e59f9] text-white text-xs font-semibold"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Buat Promo Baru
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPromos.map((promo) => {
                      const appProductIds = parseProductIds(promo.applicableProductIds);
                      const isSpecific = promo.targetType === 'SPECIFIC_PRODUCTS';
                      const promoVal = parseFloat(promo.value || '0');
                      const minOrder = parseFloat(promo.minOrder || '0');

                      return (
                        <TableRow
                          key={promo.id}
                          className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors group cursor-pointer"
                          onClick={() => handleOpenDetailModal(promo, 'products')}
                        >
                          {/* Promo & Kode */}
                          <TableCell className="py-3 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {promo.name}
                              </span>
                              {promo.code ? (
                                <div className="flex items-center gap-1.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                                    Kode: <span className="font-mono text-slate-500 dark:text-slate-400 font-medium">{promo.code}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCode(promo.code!)}
                                    title="Salin kode promo"
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors cursor-pointer"
                                  >
                                    {copiedCode === promo.code ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                                  Otomatis / Tanpa Kode
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Besar Diskon */}
                          <TableCell className="py-3 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                                {promo.type === 'PERCENTAGE' ? `${promoVal}%` : formatCurrency(promoVal)}
                              </span>
                              {promo.type === 'PERCENTAGE' && promo.maxDiscount ? (
                                <span className="text-[10px] text-slate-400">
                                  Maks. {formatCurrency(parseFloat(promo.maxDiscount))}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">
                                  {promo.type === 'PERCENTAGE' ? 'Tanpa batas' : 'Potongan langsung'}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Syarat & Cakupan */}
                          <TableCell className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col gap-0.5">
                              <div>
                                {isSpecific ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDetailModal(promo, 'products')}
                                    className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                                  >
                                    Khusus {appProductIds.length} Menu
                                  </button>
                                ) : (
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                    Semua Menu Outlet
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {minOrder > 0 ? `Min. ${formatCurrency(minOrder)}` : 'Tanpa min. belanja'}
                              </span>
                            </div>
                          </TableCell>

                          {/* Penggunaan */}
                          <TableCell className="py-3 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                                {(promo.totalUsage || 0).toLocaleString('id-ID')}x dipakai
                              </span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                Hemat {formatCurrency(promo.totalDiscountValue || 0)}
                              </span>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3 px-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center justify-center gap-2">
                              <Switch
                                checked={promo.isActive}
                                onCheckedChange={() => handleToggleStatus(promo, promo.isActive)}
                              />
                              <span className={cn(
                                "text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1",
                                promo.isActive
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", promo.isActive ? "bg-emerald-500" : "bg-slate-400")} />
                                <span>{promo.isActive ? 'Aktif' : 'Off'}</span>
                              </span>
                            </div>
                          </TableCell>

                          {/* Aksi: Titik 3 Dropdown */}
                          <TableCell className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Menu aksi</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 shadow-lg border-slate-200 dark:border-slate-800">
                                <DropdownMenuItem
                                  onClick={() => handleOpenDetailModal(promo, 'products')}
                                  className="text-xs cursor-pointer gap-2 py-2 px-2.5 rounded-lg"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Lihat Detail</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenEdit(promo)}
                                  className="text-xs cursor-pointer gap-2 py-2 px-2.5 rounded-lg"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Edit Promo</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPromoForDelete(promo);
                                    setIsDeleteOpen(true);
                                  }}
                                  className="text-xs cursor-pointer gap-2 py-2 px-2.5 rounded-lg text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Hapus Promo</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
                <span className="text-slate-500 font-medium">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPromos.length)} dari {filteredPromos.length} promo
                </span>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2.5 rounded-lg border-slate-200 dark:border-slate-800 text-xs font-medium cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                    Sebelumnya
                  </Button>

                  {getPaginationNumbers().map((num, i) =>
                    typeof num === 'number' ? (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentPage(num)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                          currentPage === num
                            ? "bg-[#0e59f9] text-white shadow-xs"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                        )}
                      >
                        {num}
                      </button>
                    ) : (
                      <span key={i} className="px-1 text-slate-400">...</span>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2.5 rounded-lg border-slate-200 dark:border-slate-800 text-xs font-medium cursor-pointer"
                  >
                    Selanjutnya
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
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
        <DialogContent className="sm:max-w-4xl md:max-w-5xl w-[94vw] max-w-5xl max-h-[88vh] overflow-y-auto rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
          <DialogHeader className="pr-8 pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {selectedPromoForHistory?.name}
                  </DialogTitle>
                  {selectedPromoForHistory?.code && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                      Kode: <span className="font-mono text-slate-600 dark:text-slate-300 font-medium">{selectedPromoForHistory.code}</span>
                    </span>
                  )}
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1",
                    selectedPromoForHistory?.isActive
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", selectedPromoForHistory?.isActive ? "bg-emerald-500" : "bg-slate-400")} />
                    <span>{selectedPromoForHistory?.isActive ? 'Aktif' : 'Nonaktif'}</span>
                  </span>
                </div>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Ringkasan aturan diskon, cakupan produk berlaku, dan riwayat pesanan yang menggunakan promo ini.
                </DialogDescription>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl w-fit mt-3">
              <button
                type="button"
                onClick={() => setModalActiveTab('products')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs transition-all font-medium flex items-center gap-2 cursor-pointer",
                  modalActiveTab === 'products'
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                <span>Produk & Aturan Diskon</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[10px] font-medium",
                  modalActiveTab === 'products'
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                    : "text-slate-400"
                )}>
                  {selectedPromoForHistory?.targetType === 'SPECIFIC_PRODUCTS'
                    ? `${eligibleProductsForDetail.length}`
                    : 'Semua'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('transactions')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs transition-all font-medium flex items-center gap-2 cursor-pointer",
                  modalActiveTab === 'transactions'
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                <span>Riwayat Transaksi</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[10px] font-medium",
                  modalActiveTab === 'transactions'
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "text-slate-400"
                )}>
                  {historyStats.totalUsage}
                </span>
              </button>
            </div>
          </DialogHeader>

          {/* TAB 1: PRODUK & ATURAN DISKON */}
          {modalActiveTab === 'products' && (
            <div className="space-y-4 pt-2">
              {/* SUMMARY GRID CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Besar Potongan</span>
                  <span className="text-base font-semibold text-slate-900 dark:text-white block leading-tight">
                    {selectedPromoForHistory?.type === 'PERCENTAGE'
                      ? `${parseFloat(selectedPromoForHistory?.value || '0')}%`
                      : formatCurrency(parseFloat(selectedPromoForHistory?.value || '0'))}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {selectedPromoForHistory?.type === 'PERCENTAGE' && selectedPromoForHistory?.maxDiscount
                      ? `Maks. ${formatCurrency(parseFloat(selectedPromoForHistory.maxDiscount))}`
                      : 'Tanpa batas maksimal'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Cakupan Menu</span>
                  <span className="text-base font-semibold text-slate-900 dark:text-white block leading-tight">
                    {selectedPromoForHistory?.targetType === 'SPECIFIC_PRODUCTS'
                      ? `Khusus ${eligibleProductsForDetail.length} Menu`
                      : 'Semua Menu'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {selectedPromoForHistory?.targetType === 'SPECIFIC_PRODUCTS'
                      ? `Min. ${selectedPromoForHistory?.minProductQty || 1} pcs per menu`
                      : 'Semua katalog outlet'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Min. Belanja</span>
                  <span className="text-base font-semibold text-slate-900 dark:text-white block leading-tight">
                    {selectedPromoForHistory?.minOrder && parseFloat(selectedPromoForHistory.minOrder) > 0
                      ? formatCurrency(parseFloat(selectedPromoForHistory.minOrder))
                      : 'Tanpa Min.'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Syarat total belanja
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Masa Berlaku</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block leading-tight truncate">
                    {selectedPromoForHistory?.startDate || selectedPromoForHistory?.endDate ? (
                      <>
                        {selectedPromoForHistory.startDate ? new Date(selectedPromoForHistory.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Kapan saja'}
                        {' - '}
                        {selectedPromoForHistory.endDate ? new Date(selectedPromoForHistory.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Seterusnya'}
                      </>
                    ) : (
                      'Selalu Aktif'
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Periode promo
                  </span>
                </div>
              </div>

              {/* DAFTAR PRODUK HEADER & SEARCH */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                      {selectedPromoForHistory?.targetType === 'SPECIFIC_PRODUCTS'
                        ? `Daftar Produk yang Terdaftar (${eligibleProductsForDetail.length})`
                        : `Daftar Produk yang Memenuhi Syarat (${productsList.length})`}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedPromoForHistory?.targetType === 'SPECIFIC_PRODUCTS'
                        ? `Pelanggan berhak diskon jika memesan produk berikut (min. ${selectedPromoForHistory?.minProductQty || 1} pcs).`
                        : 'Diskon berlaku untuk semua produk katalog outlet.'}
                    </p>
                  </div>

                  <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={productDetailSearch}
                      onChange={(e) => setProductDetailSearch(e.target.value)}
                      placeholder="Cari produk / SKU..."
                      className="pl-8 h-8 text-xs rounded-xl border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white placeholder:text-slate-400 font-sans focus:bg-white dark:focus:bg-slate-900"
                    />
                  </div>
                </div>

                {/* EMPTY PRODUCT STATE */}
                {filteredEligibleProducts.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 bg-slate-50/30 dark:bg-slate-800/10">
                    <p className="text-xs font-medium text-slate-900 dark:text-white">
                      {productDetailSearch ? 'Produk tidak ditemukan' : 'Belum ada produk yang terdaftar'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {productDetailSearch
                        ? `Tidak ada produk yang cocok dengan "${productDetailSearch}"`
                        : 'Promo ini belum memilih produk manapun.'}
                    </p>
                  </div>
                ) : (
                  /* PRODUCT TABLE */
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                    <Table className="w-full text-left text-xs min-w-[620px]">
                      <TableHeader className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80">
                        <TableRow className="border-none hover:bg-transparent">
                          <TableHead className="py-2.5 px-3.5 text-[11px] font-medium text-slate-400">Nama Produk</TableHead>
                          <TableHead className="py-2.5 px-3.5 text-right text-[11px] font-medium text-slate-400">Harga Asli</TableHead>
                          <TableHead className="py-2.5 px-3.5 text-right text-[11px] font-medium text-slate-400">Potongan Diskon</TableHead>
                          <TableHead className="py-2.5 px-3.5 text-right text-[11px] font-medium text-slate-400">Harga Akhir</TableHead>
                          <TableHead className="py-2.5 px-3.5 text-center text-[11px] font-medium text-slate-400">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {filteredEligibleProducts.map((prod) => {
                          const { discountAmount, finalPrice } = calculateDiscountedPrice(prod.price, selectedPromoForHistory);
                          const origPrice = parseFloat(prod.price || '0');

                          return (
                            <TableRow key={prod.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 border-none transition-colors">
                              <TableCell className="py-2.5 px-3.5">
                                <div className="flex items-center gap-2.5">
                                  {prod.imageUrl ? (
                                    <img
                                      src={prod.imageUrl}
                                      alt={prod.name}
                                      className="w-8 h-8 rounded-lg object-cover border border-slate-200/80 dark:border-slate-800 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-medium text-slate-400 border border-slate-200/80 dark:border-slate-800 shrink-0">
                                      P
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-xs font-medium text-slate-900 dark:text-white block">{prod.name}</span>
                                    {prod.sku && (
                                      <span className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="py-2.5 px-3.5 text-right text-xs text-slate-400 font-normal">
                                {formatCurrency(origPrice)}
                              </TableCell>

                              <TableCell className="py-2.5 px-3.5 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                -{formatCurrency(discountAmount)}
                                {selectedPromoForHistory?.type === 'PERCENTAGE' && (
                                  <span className="text-[10px] text-slate-400 ml-1 font-normal">
                                    ({parseFloat(selectedPromoForHistory.value || '0')}%)
                                  </span>
                                )}
                              </TableCell>

                              <TableCell className="py-2.5 px-3.5 text-right text-xs font-semibold text-slate-900 dark:text-white">
                                {formatCurrency(finalPrice)}
                              </TableCell>

                              <TableCell className="py-2.5 px-3.5 text-center">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-medium border inline-block",
                                  prod.isActive
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                )}>
                                  {prod.isActive ? 'Tersedia' : 'Nonaktif'}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    <div className="py-2 px-3.5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Menampilkan {filteredEligibleProducts.length} dari {eligibleProductsForDetail.length} produk</span>
                      {selectedPromoForHistory?.targetType === 'SPECIFIC_PRODUCTS' && (
                        <span>Min. beli: {selectedPromoForHistory.minProductQty || 1} pcs</span>
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
                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Total Penggunaan</span>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {historyStats.totalUsage} <span className="text-xs font-normal text-slate-400">Transaksi</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Total Potongan Diberikan</span>
                  <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(historyStats.totalDiscountValue)}
                  </p>
                </div>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Cari no. order atau nama pelanggan..."
                  className="pl-8 h-8 text-xs rounded-xl border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white placeholder:text-slate-400 font-sans focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              {/* TRANSACTIONS TABLE */}
              {isLoadingHistory ? (
                <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400 mr-2" />
                  Memuat riwayat transaksi...
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 bg-slate-50/30 dark:bg-slate-800/10">
                  <p className="text-xs font-medium text-slate-900 dark:text-white">Belum ada transaksi</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Diskon ini belum pernah digunakan pada transaksi yang tercatat.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                  <Table className="w-full text-left text-xs min-w-[620px]">
                    <TableHeader className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="py-2.5 px-3.5 text-[11px] font-medium text-slate-400">No. Order</TableHead>
                        <TableHead className="py-2.5 px-3.5 text-[11px] font-medium text-slate-400">Waktu</TableHead>
                        <TableHead className="py-2.5 px-3.5 text-[11px] font-medium text-slate-400">Pelanggan / Tipe</TableHead>
                        <TableHead className="py-2.5 px-3.5 text-right text-[11px] font-medium text-slate-400">Total Pesanan</TableHead>
                        <TableHead className="py-2.5 px-3.5 text-right text-[11px] font-medium text-slate-400">Potongan</TableHead>
                        <TableHead className="py-2.5 px-3.5 text-center text-[11px] font-medium text-slate-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60">
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
                          <TableRow key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 border-none transition-colors">
                            <TableCell className="py-2.5 px-3.5 font-mono text-xs font-medium text-slate-900 dark:text-white">
                              {tx.orderNumber || tx.id.substring(0, 8)}
                            </TableCell>
                            <TableCell className="py-2.5 px-3.5 text-xs text-slate-400 font-normal">
                              {dateStr}
                            </TableCell>
                            <TableCell className="py-2.5 px-3.5">
                              <span className="text-xs font-medium text-slate-900 dark:text-white block">{tx.customerName || 'Pelanggan POS'}</span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{tx.orderType || 'DINE_IN'}</span>
                            </TableCell>
                            <TableCell className="py-2.5 px-3.5 text-right text-xs font-medium text-slate-900 dark:text-white">
                              {formatCurrency(grandTotal)}
                            </TableCell>
                            <TableCell className="py-2.5 px-3.5 text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              -{formatCurrency(discountAmount)}
                            </TableCell>
                            <TableCell className="py-2.5 px-3.5 text-center">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-medium border inline-block",
                                tx.status === 'COMPLETED'
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50"
                                  : tx.status === 'CANCELED'
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/50"
                                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/50"
                              )}>
                                {tx.status || 'PAID'}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between sm:justify-between w-full">
            <span className="text-xs text-slate-400 font-normal">
              ID Promo: <code className="font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{selectedPromoForHistory?.id.substring(0, 8)}...</code>
            </span>
            <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(false)} className="h-8 text-xs font-medium rounded-xl border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
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
