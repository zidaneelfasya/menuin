'use client';

import * as React from 'react';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
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
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
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
      {/* 1. TOP HEADER (Exact match with Transaction History & Product List) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            Diskon & Potongan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola seluruh diskon promo, aturan potongan harga, dan pantau penghematan pelanggan outlet Anda.
          </p>
        </div>

        {viewMode === 'editor' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-9 px-4 text-xs font-medium rounded-full border-none bg-white shadow-sm-md hover:bg-slate-100 text-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Kembali ke Daftar
          </Button>
        )}
      </div>

      {/* VIEW MODE 1: LIST / DAFTAR PROMO */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* 2. TOP 3 METRIC CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KPI 1: TOTAL POTONGAN DIBERIKAN - Solid Royal Blue Hero Card */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0e59f9] text-white p-5 sm:p-6 shadow-md hover:shadow-lg transition-all flex flex-col justify-between min-h-[148px]">
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
            <div className="relative overflow-hidden rounded-2xl bg-white border-none p-5 sm:p-6 shadow-sm-md hover:shadow-md transition-all flex flex-col justify-between min-h-[148px]">
              <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>

              <div className="mt-5 min-w-0">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  PROMO AKTIF
                </span>
                <div className="text-2xl sm:text-[26px] font-semibold text-slate-900 tracking-tight leading-none whitespace-nowrap flex items-baseline gap-1.5">
                  <span>{activePromos}</span>
                  <span className="text-xs sm:text-sm font-normal text-slate-400">/ {totalPromos} Promo</span>
                </div>
              </div>
            </div>

            {/* KPI 3: TOTAL PENGGUNAAN - Clean White Card */}
            <div className="relative overflow-hidden rounded-2xl bg-white border-none p-5 sm:p-6 shadow-sm-md hover:shadow-md transition-all flex flex-col justify-between min-h-[148px]">
              <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <ReceiptText className="w-5 h-5 text-white" />
              </div>

              <div className="mt-5 min-w-0">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  TOTAL PENGGUNAAN
                </span>
                <div className="text-2xl sm:text-[26px] font-semibold text-slate-900 tracking-tight leading-none whitespace-nowrap flex items-baseline gap-1.5">
                  <span>{grandTotalUsage.toLocaleString('id-ID')}</span>
                  <span className="text-xs sm:text-sm font-normal text-slate-400">Kali</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. TABS & TOOLBAR ROW (Exact match with Transaction History) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 gap-4">
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
                        ? "text-[#0e59f9] font-semibold"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className={cn(
                      "text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-[#0e59f9]"
                        : "text-slate-500 bg-slate-100"
                    )}>
                      {tab.count}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activePromoTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0e59f9] rounded-full"
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
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari promo atau kode..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-8 h-9 text-xs rounded-full bg-white border-none shadow-sm-md focus:bg-white focus:ring-2 focus:ring-[#0e59f9]/20 transition-all placeholder:text-slate-400 text-slate-900"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Popover Dropdown (Funnel) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-3.5 rounded-full border-none bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer shadow-sm-md"
                  >
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span>Filter</span>
                    {scopeFilter !== 'all' && (
                      <span className="w-2 h-2 rounded-full bg-[#0e59f9] shrink-0" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-2xl border-none shadow-2xl bg-white text-slate-800">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Cakupan Promo
                  </div>
                  <DropdownMenuItem
                    onClick={() => { setScopeFilter('all'); setCurrentPage(1); }}
                    className={cn(
                      "flex items-center justify-between text-xs rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors",
                      scopeFilter === 'all'
                        ? "bg-blue-50 text-[#0e59f9] font-medium"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span>Semua Target</span>
                    {scopeFilter === 'all' && <Check className="w-3.5 h-3.5 text-[#0e59f9]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { setScopeFilter('cart'); setCurrentPage(1); }}
                    className={cn(
                      "flex items-center justify-between text-xs rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors",
                      scopeFilter === 'cart'
                        ? "bg-blue-50 text-[#0e59f9] font-medium"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span>Semua Menu</span>
                    {scopeFilter === 'cart' && <Check className="w-3.5 h-3.5 text-[#0e59f9]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { setScopeFilter('specific'); setCurrentPage(1); }}
                    className={cn(
                      "flex items-center justify-between text-xs rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors",
                      scopeFilter === 'specific'
                        ? "bg-blue-50 text-[#0e59f9] font-medium"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span>Khusus Produk</span>
                    {scopeFilter === 'specific' && <Check className="w-3.5 h-3.5 text-[#0e59f9]" />}
                  </DropdownMenuItem>
                  {scopeFilter !== 'all' && (
                    <>
                      <DropdownMenuSeparator className="my-1 bg-slate-100" />
                      <button
                        type="button"
                        onClick={() => { setScopeFilter('all'); setCurrentPage(1); }}
                        className="w-full text-center py-1 text-[11px] font-medium text-rose-500 hover:text-rose-600 cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-3.5 rounded-full border-none bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer shadow-sm-md"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <span>Urutan</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-2xl border-none shadow-2xl bg-white text-slate-800">
                  <DropdownMenuItem
                    onClick={() => { setSortBy('newest'); setCurrentPage(1); }}
                    className={cn(
                      "flex items-center justify-between text-xs rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors",
                      sortBy === 'newest'
                        ? "bg-blue-50 text-[#0e59f9] font-medium"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span>Terbaru</span>
                    {sortBy === 'newest' && <Check className="w-3.5 h-3.5 text-[#0e59f9]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { setSortBy('usage'); setCurrentPage(1); }}
                    className={cn(
                      "flex items-center justify-between text-xs rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors",
                      sortBy === 'usage'
                        ? "bg-blue-50 text-[#0e59f9] font-medium"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span>Penggunaan Terbanyak</span>
                    {sortBy === 'usage' && <Check className="w-3.5 h-3.5 text-[#0e59f9]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { setSortBy('discount_val'); setCurrentPage(1); }}
                    className={cn(
                      "flex items-center justify-between text-xs rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors",
                      sortBy === 'discount_val'
                        ? "bg-blue-50 text-[#0e59f9] font-medium"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span>Diskon Terbesar</span>
                    {sortBy === 'discount_val' && <Check className="w-3.5 h-3.5 text-[#0e59f9]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { setSortBy('name'); setCurrentPage(1); }}
                    className={cn(
                      "flex items-center justify-between text-xs rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors",
                      sortBy === 'name'
                        ? "bg-blue-50 text-[#0e59f9] font-medium"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span>Nama Promo (A-Z)</span>
                    {sortBy === 'name' && <Check className="w-3.5 h-3.5 text-[#0e59f9]" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Primary Action Button */}
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="h-9 px-4 text-xs font-semibold rounded-full bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Promo</span>
              </Button>
            </div>
          </div>

          {/* 4. MODERN SAAS PROMOTION TABLE */}
          <div className="rounded-2xl bg-white border-none shadow-sm-md overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="w-full text-left text-xs min-w-[760px]">
                <TableHeader>
                  <TableRow className="border-b border-slate-100 bg-slate-50/70 hover:bg-slate-50/70 text-slate-500">
                    <TableHead className="py-3 px-4 text-xs font-semibold whitespace-nowrap">Promo & Kode</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold whitespace-nowrap">Besar Diskon</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold whitespace-nowrap">Syarat & Cakupan</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold whitespace-nowrap">Penggunaan</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold whitespace-nowrap text-center">Status</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold whitespace-nowrap text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {paginatedPromos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Tag className="w-8 h-8 text-slate-300" />
                          <p className="text-sm font-semibold text-slate-800">
                            Tidak ada diskon atau promo ditemukan
                          </p>
                          <p className="text-xs text-slate-500 max-w-sm">
                            {searchQuery || scopeFilter !== 'all' || activeTab !== 'all'
                              ? 'Coba ubah kata kunci pencarian atau sesuaikan filter Anda.'
                              : 'Mulai buat promo diskon pertama Anda untuk memikat pelanggan outlet.'}
                          </p>
                          {(!searchQuery && scopeFilter === 'all' && activeTab === 'all') && (
                            <Button
                              size="sm"
                              onClick={handleOpenCreate}
                              className="mt-2 h-9 px-4 rounded-full bg-[#0e59f9] text-white text-xs font-semibold shadow-md hover:bg-[#0b4de0] cursor-pointer"
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
                          className="hover:bg-slate-100/60 transition-colors group cursor-pointer border-b border-slate-100"
                          onClick={() => handleOpenDetailModal(promo, 'products')}
                        >
                          {/* Promo & Kode */}
                          <TableCell className="py-3 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-xs text-slate-900 group-hover:text-[#0e59f9] transition-colors">
                                {promo.name}
                              </span>
                              {promo.code ? (
                                <div className="flex items-center gap-1.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-[11px] text-slate-400 font-normal">
                                    Kode: <span className="font-mono text-slate-600 font-medium">{promo.code}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCode(promo.code!)}
                                    title="Salin kode promo"
                                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full transition-colors cursor-pointer"
                                  >
                                    {copiedCode === promo.code ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-normal">
                                  Otomatis / Tanpa Kode
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Besar Diskon */}
                          <TableCell className="py-3 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-slate-900">
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
                                    className="text-xs font-medium text-amber-700 hover:underline cursor-pointer"
                                  >
                                    Khusus {appProductIds.length} Menu
                                  </button>
                                ) : (
                                  <span className="text-xs font-medium text-slate-600">
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
                              <span className="font-semibold text-xs text-slate-900">
                                {(promo.totalUsage || 0).toLocaleString('id-ID')}x dipakai
                              </span>
                              <span className="text-[10px] text-emerald-600 font-medium">
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
                                "text-[11px] font-medium px-2.5 py-0.5 rounded-full border-none inline-flex items-center",
                                promo.isActive
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-slate-100 text-slate-500"
                              )}>
                                {promo.isActive ? 'Aktif' : 'Nonaktif'}
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
                                  className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Menu aksi</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-2xl p-1.5 shadow-2xl border-none bg-white">
                                <DropdownMenuItem
                                  onClick={() => handleOpenDetailModal(promo, 'products')}
                                  className="text-xs cursor-pointer gap-2 py-2 px-2.5 rounded-xl hover:bg-slate-100 text-slate-700"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Lihat Detail</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenEdit(promo)}
                                  className="text-xs cursor-pointer gap-2 py-2 px-2.5 rounded-xl hover:bg-slate-100 text-slate-700"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Edit Promo</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1 border-slate-100" />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPromoForDelete(promo);
                                    setIsDeleteOpen(true);
                                  }}
                                  className="text-xs cursor-pointer gap-2 py-2 px-2.5 rounded-xl text-rose-600 focus:text-rose-600 focus:bg-rose-50"
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
          </div>

          {/* Zone 3: Footer Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            {/* Left: Items Per Page Selector */}
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Items Per Page</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 rounded-full border-none bg-white shadow-sm-md text-xs font-medium gap-1.5 cursor-pointer hover:bg-slate-100 text-slate-700"
                    >
                      <span>{itemsPerPage}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-24 p-1.5 rounded-2xl shadow-2xl border-none bg-white">
                    {[10, 20, 50, 100].map((size) => (
                      <DropdownMenuItem
                        key={size}
                        onClick={() => {
                          setItemsPerPage(size);
                          setCurrentPage(1);
                        }}
                        className={cn("text-xs py-1.5 px-3 rounded-xl cursor-pointer hover:bg-slate-100", itemsPerPage === size && "font-semibold text-[#0e59f9] bg-blue-50")}
                      >
                        {size}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <span className="hidden sm:inline text-slate-300">&bull;</span>
              <span className="hidden sm:inline">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPromos.length)} dari {filteredPromos.length} promo
              </span>
            </div>

            {/* Right: Page Navigation */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 w-8 rounded-full border-none bg-white shadow-sm-md text-slate-600 hover:text-[#0e59f9] hover:bg-slate-100 disabled:opacity-30 cursor-pointer flex items-center justify-center transition-all aspect-square"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {getPaginationNumbers().map((pageItem, index) => {
                  if (pageItem === '...') {
                    return (
                      <span key={`ellipsis-${index}`} className="w-6 text-center text-xs text-slate-400 select-none">
                        ...
                      </span>
                    );
                  }
                  const pageNum = pageItem as number;
                  const isCurrent = pageNum === currentPage;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-8 h-8 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center justify-center aspect-square",
                        isCurrent
                          ? "bg-[#0e59f9] text-white shadow-md hover:bg-[#0b4de0]"
                          : "hover:bg-slate-100 hover:text-slate-900 text-slate-600"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 w-8 rounded-full border-none bg-white shadow-sm-md text-slate-600 hover:text-[#0e59f9] hover:bg-slate-100 disabled:opacity-30 cursor-pointer flex items-center justify-center transition-all aspect-square"
                  aria-label="Halaman selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: FORM EDITOR */}
      {viewMode === 'editor' && (
        <div className="space-y-6">
          {/* STEPPER BREADCRUMB ATAS */}
          <div className="flex items-center gap-2 sm:gap-3 py-2 px-1 overflow-x-auto select-none border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all shrink-0 cursor-pointer",
                currentStep === 1
                  ? "bg-[#0e59f9] text-white font-semibold shadow-md"
                  : "bg-white text-slate-600 font-medium shadow-sm-md hover:bg-slate-50"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold",
                currentStep === 1 ? "bg-white text-[#0e59f9]" : "bg-slate-100 text-slate-500"
              )}>
                1
              </span>
              <span>Informasi Promo</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all shrink-0 cursor-pointer",
                currentStep === 2
                  ? "bg-[#0e59f9] text-white font-semibold shadow-md"
                  : "bg-white text-slate-600 font-medium shadow-sm-md hover:bg-slate-50"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold",
                currentStep === 2 ? "bg-white text-[#0e59f9]" : "bg-slate-100 text-slate-500"
              )}>
                2
              </span>
              <span>Cakupan & Syarat Produk</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all shrink-0 cursor-pointer",
                currentStep === 3
                  ? "bg-[#0e59f9] text-white font-semibold shadow-md"
                  : "bg-white text-slate-600 font-medium shadow-sm-md hover:bg-slate-50"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold",
                currentStep === 3 ? "bg-white text-[#0e59f9]" : "bg-slate-100 text-slate-500"
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
                <div className="rounded-2xl border-none shadow-sm-md bg-white p-6 sm:p-7 space-y-6">
                  
                  {/* STEP 1: INFORMASI PROMO */}
                  {currentStep === 1 && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">
                          Informasi Dasar Promo
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tentukan nama dan tipe potongan harga yang akan diberikan ke pelanggan.
                        </p>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="code" className="text-xs font-medium text-slate-700">
                              Kode Promo <span className="text-rose-500">*</span>
                            </Label>
                            <span className="text-[10px] text-slate-400 font-normal">Karakter kapital & angka tanpa spasi</span>
                          </div>
                          <Input
                            id="code"
                            {...form.register('code', {
                              onChange: (e) => {
                                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                              }
                            })}
                            placeholder="Contoh: HEMAT50, DISKONKOPI, MERDEKA17"
                            className="rounded-xl h-10 bg-slate-50/50 border border-slate-200/80 text-sm font-sans tracking-wide uppercase focus:bg-white focus:border-[#0e59f9]"
                          />
                          {form.formState.errors.code ? (
                            <p className="text-xs text-rose-500">{form.formState.errors.code.message}</p>
                          ) : (
                            <p className="text-[11px] text-slate-400">Pelanggan akan memasukkan kode ini saat checkout untuk mendapatkan potongan.</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-xs font-medium text-slate-700">
                            Nama Promo <span className="text-rose-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            {...form.register('name')}
                            placeholder="Contoh: Promo Spesifik Kopi Susu, Diskon Merdeka 17%"
                            className="rounded-xl h-10 bg-slate-50/50 border border-slate-200/80 text-sm focus:bg-white focus:border-[#0e59f9]"
                          />
                          {form.formState.errors.name && (
                            <p className="text-xs text-rose-500">{form.formState.errors.name.message}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-slate-700">
                            Tipe Diskon <span className="text-rose-500">*</span>
                          </Label>
                          <Controller
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="w-full h-10 bg-slate-50/50 border border-slate-200/80 rounded-xl text-sm focus:bg-white">
                                  <SelectValue placeholder="Pilih Tipe Diskon" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl bg-white p-1.5 font-sans">
                                  <SelectItem value="PERCENTAGE" className="rounded-xl cursor-pointer">Persentase (%)</SelectItem>
                                  <SelectItem value="FIXED" className="rounded-xl cursor-pointer">Potongan Tetap (Rp)</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="value" className="text-xs font-medium text-slate-700">
                            {activePromoType === 'PERCENTAGE' ? 'Besar Potongan (%)' : 'Besar Potongan (Rp)'} <span className="text-rose-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="value"
                              type="number"
                              step="0.01"
                              min="0"
                              {...form.register('value')}
                              placeholder={activePromoType === 'PERCENTAGE' ? '10' : '10000'}
                              className="rounded-xl h-10 bg-slate-50/50 border border-slate-200/80 text-sm pr-12 focus:bg-white focus:border-[#0e59f9]"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                              {activePromoType === 'PERCENTAGE' ? '%' : 'Rp'}
                            </span>
                          </div>
                          {form.formState.errors.value && (
                            <p className="text-xs text-rose-500">{form.formState.errors.value.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="h-9 px-5 text-xs font-semibold rounded-full bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md transition-colors cursor-pointer"
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
                        <h2 className="text-base font-semibold text-slate-900">
                          Cakupan & Syarat Produk
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Atur apakah diskon berlaku untuk seluruh toko atau hanya untuk produk tertentu dengan syarat jumlah minimal.
                        </p>
                      </div>

                      <div className="space-y-4 pt-1">
                        {/* SELECT TARGET TYPE */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-700">
                            Cakupan Berlaku Promo
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => form.setValue('targetType', 'ALL')}
                              className={cn(
                                "p-4 rounded-xl border text-left transition-all cursor-pointer",
                                targetType === 'ALL'
                                  ? "border-[#0e59f9] bg-blue-50/50 ring-1 ring-[#0e59f9]"
                                  : "border-slate-200/80 hover:bg-slate-50 bg-white"
                              )}
                            >
                              <p className="text-xs font-semibold text-slate-900">Semua Produk (Global)</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Diskon berlaku untuk seluruh keranjang tanpa membatasi jenis produk.
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => form.setValue('targetType', 'SPECIFIC_PRODUCTS')}
                              className={cn(
                                "p-4 rounded-xl border text-left transition-all cursor-pointer",
                                targetType === 'SPECIFIC_PRODUCTS'
                                  ? "border-[#0e59f9] bg-blue-50/50 ring-1 ring-[#0e59f9]"
                                  : "border-slate-200/80 hover:bg-slate-50 bg-white"
                              )}
                            >
                              <p className="text-xs font-semibold text-slate-900">Khusus Produk Tertentu</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Pilih produk mana saja yang mendapatkan promo / menjadi syarat belanja.
                              </p>
                            </button>
                          </div>
                        </div>

                        {/* PRODUCT SELECTOR LIST */}
                        {targetType === 'SPECIFIC_PRODUCTS' && (
                          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h3 className="text-xs font-semibold text-slate-900">
                                  Pilih Produk ({selectedProductIds.length} terpilih)
                                </h3>
                                <p className="text-[11px] text-slate-500">
                                  Pelanggan harus memesan produk yang dicentang di bawah untuk menikmati diskon.
                                </p>
                              </div>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={toggleSelectAllProducts}
                                className="h-7 px-3 text-[11px] font-medium rounded-full border-none bg-white shadow-sm-md hover:bg-slate-100 text-slate-700 cursor-pointer"
                              >
                                {selectedProductIds.length === productsList.length ? 'Batal Pilih Semua' : 'Pilih Semua Produk'}
                              </Button>
                            </div>

                            {/* SEARCH PRODUCTS INPUT */}
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <Input
                                value={productSearchQuery}
                                onChange={(e) => setProductSearchQuery(e.target.value)}
                                placeholder="Cari nama produk..."
                                className="pl-9 h-8 text-xs bg-white rounded-xl border-slate-200/80 focus:border-[#0e59f9]"
                              />
                            </div>

                            {/* PRODUCT CHECKBOX LIST */}
                            {isLoadingProducts ? (
                              <div className="h-36 flex items-center justify-center text-xs text-slate-400">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin text-slate-400" />
                                Memuat daftar produk...
                              </div>
                            ) : filteredProductsForPicker.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
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
                                        "p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors text-xs select-none",
                                        isSelected
                                          ? "border-[#0e59f9] bg-blue-50/50 text-slate-900 font-medium"
                                          : "border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600"
                                      )}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        {isSelected ? (
                                          <CheckSquare className="w-4 h-4 text-[#0e59f9] shrink-0" />
                                        ) : (
                                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                                        )}
                                        <div>
                                          <p className="font-medium text-slate-900 text-xs">{product.name}</p>
                                          {product.sku && <span className="text-[10px] text-slate-400 font-normal">SKU: {product.sku}</span>}
                                        </div>
                                      </div>
                                      <span className="font-medium text-slate-900 text-xs shrink-0">
                                        {formatCurrency(parseFloat(product.price))}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* MINIMAL QTY INPUT */}
                            <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                              <Label htmlFor="minProductQty" className="text-xs font-medium text-slate-700">
                                Minimal Jumlah Produk Syarat (Pcs)
                              </Label>
                              <Input
                                id="minProductQty"
                                type="number"
                                min="1"
                                {...form.register('minProductQty')}
                                placeholder="1"
                                className="h-9 text-xs bg-white rounded-xl border-slate-200/80 max-w-xs focus:border-[#0e59f9]"
                              />
                              <p className="text-[11px] text-slate-400">
                                Minimal jumlah pcs produk eligible yang harus dibeli di keranjang untuk membuka diskon ini.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* MINIMAL BELANJA GENERAL */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="minOrder" className="text-xs font-medium text-slate-700">
                              Minimal Total Belanja (Rp)
                            </Label>
                            <Input
                              id="minOrder"
                              type="number"
                              {...form.register('minOrder')}
                              placeholder="0 (Tanpa minimal)"
                              className="rounded-xl h-10 bg-slate-50/50 border border-slate-200/80 text-sm focus:bg-white focus:border-[#0e59f9]"
                            />
                            <p className="text-[11px] text-slate-400">Isi 0 jika tidak ada syarat minimum total uang belanja.</p>
                          </div>

                          {activePromoType === 'PERCENTAGE' && (
                            <div className="space-y-1.5">
                              <Label htmlFor="maxDiscount" className="text-xs font-medium text-slate-700">
                                Maksimal Potongan Diskon (Rp)
                              </Label>
                              <Input
                                id="maxDiscount"
                                type="number"
                                {...form.register('maxDiscount')}
                                placeholder="Contoh: 25000"
                                className="rounded-xl h-10 bg-slate-50/50 border border-slate-200/80 text-sm focus:bg-white focus:border-[#0e59f9]"
                              />
                              <p className="text-[11px] text-slate-400">Batas maksimal nominal potongan persen yang diberikan.</p>
                            </div>
                          )}
                        </div>

                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep(1)}
                          className="h-9 px-4 text-xs font-semibold rounded-full border-none bg-white shadow-sm-md text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          Sebelumnya
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="h-9 px-5 text-xs font-semibold rounded-full bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md transition-colors cursor-pointer"
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
                        <h2 className="text-base font-semibold text-slate-900">
                          Masa Berlaku & Status
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tentukan periode tanggal aktif promo dan status ketersediaannya.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="startDate" className="text-xs font-medium text-slate-700">
                            Tanggal Mulai
                          </Label>
                          <Input
                            id="startDate"
                            type="date"
                            {...form.register('startDate')}
                            className="rounded-xl h-10 bg-slate-50/50 border border-slate-200/80 text-sm focus:bg-white focus:border-[#0e59f9]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="endDate" className="text-xs font-medium text-slate-700">
                            Tanggal Selesai
                          </Label>
                          <Input
                            id="endDate"
                            type="date"
                            {...form.register('endDate')}
                            className="rounded-xl h-10 bg-slate-50/50 border border-slate-200/80 text-sm focus:bg-white focus:border-[#0e59f9]"
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="isActivePromo" className="text-xs font-medium text-slate-900">
                            Aktifkan Promo Sekarang
                          </Label>
                          <p className="text-[11px] text-slate-500">
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

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep(2)}
                          className="h-9 px-4 text-xs font-semibold rounded-full border-none bg-white shadow-sm-md text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          Sebelumnya
                        </Button>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="h-9 px-5 text-xs font-semibold rounded-full bg-[#0e59f9] hover:bg-[#0b4de0] text-white shadow-md transition-colors cursor-pointer"
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
                <div className="rounded-2xl border-none shadow-sm-md bg-white p-6 space-y-4">
                  
                  {/* SUMMARY HEADER */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Ringkasan Aturan Promo
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pratinjau aturan diskon yang dibuat
                    </p>
                  </div>

                  {/* PROMO TITLE */}
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {formValues.name || 'Nama Promo'}
                      </p>
                      {formValues.code && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-50 text-[#0e59f9] text-[10px] font-medium font-mono">
                          {formValues.code}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {formValues.type === 'PERCENTAGE' ? 'Diskon Persentase' : 'Potongan Tetap'}
                    </p>
                  </div>

                  {/* DETAILS ROWS */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Nilai Potongan</span>
                      <span className="font-semibold text-slate-900">
                        {formValues.type === 'PERCENTAGE' 
                          ? `${formValues.value || 0}%` 
                          : formatCurrency(formValues.value || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Cakupan Produk</span>
                      <span className="font-medium text-slate-900">
                        {targetType === 'SPECIFIC_PRODUCTS'
                          ? `Khusus ${selectedProductIds.length} Produk (Min ${formValues.minProductQty || 1} pcs)`
                          : 'Semua Produk'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Minimal Belanja</span>
                      <span className="font-medium text-slate-900">
                        {formValues.minOrder && Number(formValues.minOrder) > 0 
                          ? formatCurrency(Number(formValues.minOrder)) 
                          : 'Tanpa Minimum'}
                      </span>
                    </div>

                    {formValues.type === 'PERCENTAGE' && (
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Maks. Potongan</span>
                        <span className="font-medium text-slate-900">
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
        <DialogContent className="sm:max-w-4xl md:max-w-5xl w-[94vw] max-w-5xl max-h-[88vh] overflow-y-auto rounded-3xl p-6 sm:p-7 border-none bg-white shadow-2xl">
          <DialogHeader className="pr-8 pb-3.5 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-lg font-semibold tracking-tight text-slate-900">
                    {selectedPromoForHistory?.name}
                  </DialogTitle>
                  {selectedPromoForHistory?.code && (
                    <span className="text-xs text-slate-400 font-normal">
                      Kode: <span className="font-mono text-slate-700 font-medium">{selectedPromoForHistory.code}</span>
                    </span>
                  )}
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-medium border-none inline-flex items-center",
                    selectedPromoForHistory?.isActive
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
                  )}>
                    {selectedPromoForHistory?.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <DialogDescription className="text-xs text-slate-500">
                  Ringkasan aturan diskon, cakupan produk berlaku, dan riwayat pesanan yang menggunakan promo ini.
                </DialogDescription>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full w-fit mt-3">
              <button
                type="button"
                onClick={() => setModalActiveTab('products')}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-2 cursor-pointer",
                  modalActiveTab === 'products'
                    ? "bg-white text-slate-900 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                )}
              >
                <span>Produk & Aturan Diskon</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                  modalActiveTab === 'products'
                    ? "bg-blue-50 text-[#0e59f9]"
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
                  "px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-2 cursor-pointer",
                  modalActiveTab === 'transactions'
                    ? "bg-white text-slate-900 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                )}
              >
                <span>Riwayat Transaksi</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                  modalActiveTab === 'transactions'
                    ? "bg-emerald-50 text-emerald-700"
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
                <div className="p-4 rounded-2xl border-none bg-slate-50/70 shadow-sm-md">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Besar Potongan</span>
                  <span className="text-base font-semibold text-slate-900 block leading-tight">
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

                <div className="p-4 rounded-2xl border-none bg-slate-50/70 shadow-sm-md">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Cakupan Menu</span>
                  <span className="text-base font-semibold text-slate-900 block leading-tight">
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

                <div className="p-4 rounded-2xl border-none bg-slate-50/70 shadow-sm-md">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Min. Belanja</span>
                  <span className="text-base font-semibold text-slate-900 block leading-tight">
                    {selectedPromoForHistory?.minOrder && parseFloat(selectedPromoForHistory.minOrder) > 0
                      ? formatCurrency(parseFloat(selectedPromoForHistory.minOrder))
                      : 'Tanpa Min.'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Syarat total belanja
                  </span>
                </div>

                <div className="p-4 rounded-2xl border-none bg-slate-50/70 shadow-sm-md">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Masa Berlaku</span>
                  <span className="text-xs font-semibold text-slate-900 block leading-tight truncate">
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
                    <h3 className="text-xs font-semibold text-slate-900">
                      {selectedPromoForHistory?.targetType === 'SPECIFIC_PRODUCTS'
                        ? `Daftar Produk yang Terdaftar (${eligibleProductsForDetail.length})`
                        : `Daftar Produk yang Memenuhi Syarat (${productsList.length})`}
                    </h3>
                    <p className="text-[11px] text-slate-500">
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
                      className="pl-8 h-8 text-xs rounded-full border-none bg-slate-100/80 text-slate-900 placeholder:text-slate-400 font-sans focus:bg-white focus:ring-1 focus:ring-[#0e59f9]"
                    />
                  </div>
                </div>

                {/* EMPTY PRODUCT STATE */}
                {filteredEligibleProducts.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl space-y-1 bg-slate-50/50">
                    <p className="text-xs font-medium text-slate-900">
                      {productDetailSearch ? 'Produk tidak ditemukan' : 'Belum ada produk yang terdaftar'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {productDetailSearch
                        ? `Tidak ada produk yang cocok dengan "${productDetailSearch}"`
                        : 'Promo ini belum memilih produk manapun.'}
                    </p>
                  </div>
                ) : (
                  /* PRODUCT TABLE */
                  <div className="rounded-2xl border-none overflow-hidden bg-white shadow-sm-md">
                    <Table className="w-full text-left text-xs min-w-[620px]">
                      <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                        <TableRow className="border-none hover:bg-transparent">
                          <TableHead className="py-2.5 px-3.5 text-[11px] font-medium text-slate-400">Nama Produk</TableHead>
                          <TableHead className="py-2.5 px-3.5 text-right text-[11px] font-medium text-slate-400">Harga Asli</TableHead>
                          <TableHead className="py-2.5 px-3.5 text-right text-[11px] font-medium text-slate-400">Potongan Diskon</TableHead>
                          <TableHead className="py-2.5 px-3.5 text-right text-[11px] font-medium text-slate-400">Harga Akhir</TableHead>
                          <TableHead className="py-2.5 px-3.5 text-center text-[11px] font-medium text-slate-400">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100">
                        {filteredEligibleProducts.map((prod) => {
                          const { discountAmount, finalPrice } = calculateDiscountedPrice(prod.price, selectedPromoForHistory);
                          const origPrice = parseFloat(prod.price || '0');

                          return (
                            <TableRow key={prod.id} className="hover:bg-slate-100/60 border-none transition-colors">
                              <TableCell className="py-2.5 px-3.5">
                                <div className="flex items-center gap-2.5">
                                  {prod.imageUrl ? (
                                    <img
                                      src={prod.imageUrl}
                                      alt={prod.name}
                                      className="w-8 h-8 rounded-lg object-cover border border-slate-100 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-medium text-slate-400 border border-slate-100 shrink-0">
                                      P
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-xs font-medium text-slate-900 block">{prod.name}</span>
                                    {prod.sku && (
                                      <span className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="py-2.5 px-3.5 text-right text-xs text-slate-400 font-normal">
                                {formatCurrency(origPrice)}
                              </TableCell>

                              <TableCell className="py-2.5 px-3.5 text-right text-xs font-medium text-emerald-600">
                                -{formatCurrency(discountAmount)}
                                {selectedPromoForHistory?.type === 'PERCENTAGE' && (
                                  <span className="text-[10px] text-slate-400 ml-1 font-normal">
                                    ({parseFloat(selectedPromoForHistory.value || '0')}%)
                                  </span>
                                )}
                              </TableCell>

                              <TableCell className="py-2.5 px-3.5 text-right text-xs font-semibold text-slate-900">
                                {formatCurrency(finalPrice)}
                              </TableCell>

                              <TableCell className="py-2.5 px-3.5 text-center">
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[10px] font-medium border-none inline-block",
                                  prod.isActive
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-slate-100 text-slate-500"
                                )}>
                                  {prod.isActive ? 'Tersedia' : 'Nonaktif'}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    <div className="py-2 px-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
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
                <div className="p-4 rounded-2xl border-none bg-slate-50/70 shadow-sm-md">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Total Penggunaan</span>
                  <p className="text-base font-semibold text-slate-900">
                    {historyStats.totalUsage} <span className="text-xs font-normal text-slate-400">Transaksi</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl border-none bg-slate-50/70 shadow-sm-md">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Total Potongan Diberikan</span>
                  <p className="text-base font-semibold text-emerald-600">
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
                  className="pl-8 h-8 text-xs rounded-full border-none bg-slate-100/80 text-slate-900 placeholder:text-slate-400 font-sans focus:bg-white focus:ring-1 focus:ring-[#0e59f9]"
                />
              </div>

              {/* TRANSACTIONS TABLE */}
              {isLoadingHistory ? (
                <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400 mr-2" />
                  Memuat riwayat transaksi...
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl space-y-1 bg-slate-50/50">
                  <p className="text-xs font-medium text-slate-900">Belum ada transaksi</p>
                  <p className="text-[11px] text-slate-500">
                    Diskon ini belum pernah digunakan pada transaksi yang tercatat.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border-none overflow-hidden bg-white shadow-sm-md">
                  <Table className="w-full text-left text-xs min-w-[620px]">
                    <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="py-2.5 px-3.5 text-[11px] font-medium text-slate-400">No. Order</TableHead>
                        <TableHead className="py-2.5 px-3.5 text-[11px] font-medium text-slate-400">Waktu</TableHead>
                        <TableHead className="py-2.5 px-3.5 text-[11px] font-medium text-slate-400">Pelanggan / Tipe</TableHead>
                        <TableHead className="py-2.5 px-3.5 text-right text-[11px] font-medium text-slate-400">Total Pesanan</TableHead>
                        <TableHead className="py-2.5 px-3.5 text-right text-[11px] font-medium text-slate-400">Potongan</TableHead>
                        <TableHead className="py-2.5 px-3.5 text-center text-[11px] font-medium text-slate-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100">
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
                          <TableRow key={tx.id} className="hover:bg-slate-100/60 border-none transition-colors">
                            <TableCell className="py-2.5 px-3.5 font-mono text-xs font-medium text-slate-900">
                              {tx.orderNumber || tx.id.substring(0, 8)}
                            </TableCell>
                            <TableCell className="py-2.5 px-3.5 text-xs text-slate-400 font-normal">
                              {dateStr}
                            </TableCell>
                            <TableCell className="py-2.5 px-3.5">
                              <span className="text-xs font-medium text-slate-900 block">{tx.customerName || 'Pelanggan POS'}</span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{tx.orderType || 'DINE_IN'}</span>
                            </TableCell>
                            <TableCell className="py-2.5 px-3.5 text-right text-xs font-medium text-slate-900">
                              {formatCurrency(grandTotal)}
                            </TableCell>
                            <TableCell className="py-2.5 px-3.5 text-right text-xs font-semibold text-emerald-600">
                              -{formatCurrency(discountAmount)}
                            </TableCell>
                            <TableCell className="py-2.5 px-3.5 text-center">
                              <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-medium border-none inline-block",
                                tx.status === 'COMPLETED'
                                  ? "bg-emerald-50 text-emerald-600"
                                  : tx.status === 'CANCELED'
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-blue-50 text-[#0e59f9]"
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

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between sm:justify-between w-full">
            <span className="text-xs text-slate-400 font-normal">
              ID Promo: <code className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">{selectedPromoForHistory?.id.substring(0, 8)}...</code>
            </span>
            <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(false)} className="h-8 px-4 text-xs font-semibold rounded-full border-none bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DIALOG KONFIRMASI HAPUS PROMO */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-3xl border-none bg-white shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-rose-600">
              Hapus Promo
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus promo{' '}
              <span className="font-semibold text-slate-900">{selectedPromoForDelete?.name}</span>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-3">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)} className="h-9 px-4 text-xs font-semibold rounded-full border-none bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onConfirmDelete}
              disabled={isLoading}
              className="h-9 px-5 text-xs font-semibold rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
