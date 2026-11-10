'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Minus, 
  Search, 
  Filter, 
  Check, 
  X, 
  LayoutList, 
  LayoutGrid, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  History, 
  Boxes, 
  RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';

import { 
  RawMaterialItem, 
  MaterialStatusFilter, 
  getRawMaterials, 
  deleteRawMaterial, 
  bulkDeleteRawMaterials 
} from '@/lib/actions/materials';
import { formatCurrency } from '@/lib/utils/format';
import { MaterialQuickStockDialog } from './material-quick-stock-dialog';
import { MaterialFormDialog } from './material-form-dialog';
import { MaterialMovementsDialog } from './material-movements-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface MaterialListProps {
  initialData: RawMaterialItem[];
  initialCounts: {
    total: number;
    safe: number;
    lowStock: number;
    outOfStock: number;
  };
  categories: string[];
}

const AVATAR_COLORS = [
  'bg-[#0e59f9] text-white',
  'bg-blue-700 text-white',
  'bg-blue-500 text-white',
  'bg-sky-600 text-white',
  'bg-indigo-600 text-white',
  'bg-blue-100 text-[#0e59f9]',
  'bg-sky-100 text-sky-800',
  'bg-blue-50 text-blue-700',
];

function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getMaterialInitials(name: string): string {
  if (!name) return 'B';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function MaterialList({
  initialData,
  initialCounts,
  categories,
}: MaterialListProps) {
  const router = useRouter();
  const [materials, setMaterials] = React.useState<RawMaterialItem[]>(initialData);
  const [counts, setCounts] = React.useState(initialCounts);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<MaterialStatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('ALL');
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Dialog States
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedMaterialForEdit, setSelectedMaterialForEdit] = React.useState<RawMaterialItem | null>(null);

  const [isQuickStockOpen, setIsQuickStockOpen] = React.useState(false);
  const [quickStockMaterial, setQuickStockMaterial] = React.useState<RawMaterialItem | null>(null);
  const [quickStockType, setQuickStockType] = React.useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');

  const [isMovementsOpen, setIsMovementsOpen] = React.useState(false);
  const [movementsMaterial, setMovementsMaterial] = React.useState<{ id?: string | null; name?: string | null }>({
    id: null,
    name: null,
  });

  // Client-side filtering
  const filteredMaterials = React.useMemo(() => {
    return materials.filter((item) => {
      // 1. Status Filter
      if (statusFilter === 'SAFE' && item.stock <= item.minStock) return false;
      if (statusFilter === 'LOW_STOCK' && (item.stock <= 0 || item.stock > item.minStock)) return false;
      if (statusFilter === 'OUT_OF_STOCK' && item.stock > 0) return false;

      // 2. Category Filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSku = item.sku ? item.sku.toLowerCase().includes(q) : false;
        const matchCat = item.category ? item.category.toLowerCase().includes(q) : false;
        if (!matchName && !matchSku && !matchCat) return false;
      }

      return true;
    });
  }, [materials, statusFilter, categoryFilter, searchQuery]);

  // Recalculate counts
  const reloadData = async () => {
    try {
      const res = await getRawMaterials();
      if (res.success && res.data) {
        setMaterials(res.data);
        if (res.counts) setCounts(res.counts);
      }
    } catch {
      // ignore
    }
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredMaterials.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Hapus ${selectedIds.length} bahan baku yang dipilih?`)) return;

    try {
      const res = await bulkDeleteRawMaterials(selectedIds);
      if (res.success) {
        toast.success(`${res.count ?? selectedIds.length} bahan baku berhasil dihapus`);
        setSelectedIds([]);
        reloadData();
      } else {
        toast.error(res.error || 'Gagal menghapus bahan');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem');
    }
  };

  // Delete Single
  const handleDeleteSingle = async (material: RawMaterialItem) => {
    if (!confirm(`Hapus bahan "${material.name}"?`)) return;

    try {
      const res = await deleteRawMaterial(material.id);
      if (res.success) {
        toast.success(`Bahan "${material.name}" berhasil dihapus`);
        reloadData();
      } else {
        toast.error(res.error || 'Gagal menghapus bahan');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem');
    }
  };

  const openQuickStock = (
    material: RawMaterialItem,
    type: 'IN' | 'OUT' | 'ADJUSTMENT'
  ) => {
    setQuickStockMaterial(material);
    setQuickStockType(type);
    setIsQuickStockOpen(true);
  };

  const handleQuickStockSuccess = (materialId: string, newStock: number) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === materialId ? { ...m, stock: newStock } : m))
    );
    reloadData();
  };

  const openEditModal = (material: RawMaterialItem) => {
    setSelectedMaterialForEdit(material);
    setIsFormOpen(true);
  };

  const openGlobalMovements = () => {
    setMovementsMaterial({ id: null, name: null });
    setIsMovementsOpen(true);
  };

  const openMaterialMovements = (material: RawMaterialItem) => {
    setMovementsMaterial({ id: material.id, name: material.name });
    setIsMovementsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar (Menuin Standard) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Stok Bahan
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Kelola persediaan bahan mentah, pantau sisa stok gudang, dan catat keluar-masuk stok.
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openGlobalMovements}
            className="h-10 px-4 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border-none shadow-sm-md hover:shadow-md inline-flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98] select-none"
          >
            <History className="h-4 w-4 text-[#0e59f9]" />
            <span>Riwayat Mutasi</span>
          </button>
        </div>
      </div>

      {/* 2. ZONE 1: TABS & TOOLBAR ROW (Single Universal Row - Matches Riwayat Transaksi Standard) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 gap-4">
        {/* Left: Underline Status Filter Tabs with Neutral Inactive Counters */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pt-1">
          {[
            { key: 'ALL', label: 'Semua Bahan', count: counts.total },
            { key: 'SAFE', label: 'Stok Aman', count: counts.safe },
            ...(counts.lowStock > 0 ? [{ key: 'LOW_STOCK', label: 'Stok Menipis', count: counts.lowStock }] : []),
            { key: 'OUT_OF_STOCK', label: 'Habis', count: counts.outOfStock },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key as MaterialStatusFilter)}
                className={cn(
                  "relative pb-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap border-none bg-transparent",
                  isActive
                    ? "text-[#0e59f9] font-semibold"
                    : "text-slate-500 hover:text-[#0e59f9]"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-[#0e59f9] font-semibold"
                      : "text-slate-400 bg-slate-100"
                  )}
                >
                  {tab.count}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeMaterialTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0e59f9] rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Search, Category Filter Popover, View Switcher, and Primary Action */}
        <div className="flex items-center gap-2 pb-2.5 lg:pb-3 flex-wrap">
          {/* Search Bar */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari bahan atau SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 h-10 text-xs rounded-full bg-white border-none shadow-sm-md focus:outline-none focus:ring-2 focus:ring-[#0e59f9] text-slate-800 placeholder:text-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Popover */}
          <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "h-10 w-10 rounded-full border-none shadow-sm-md bg-white hover:bg-slate-100 relative flex items-center justify-center cursor-pointer transition-colors",
                  categoryFilter !== 'ALL' && "bg-blue-50 text-[#0e59f9] ring-2 ring-blue-500/20"
                )}
                title="Filter Kategori"
              >
                <Filter className="w-4 h-4 text-slate-600" />
                {categoryFilter !== 'ALL' && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0e59f9] ring-2 ring-white" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3 rounded-2xl shadow-2xl border-none space-y-2 bg-white z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900">Kategori Bahan</span>
                {categoryFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('ALL');
                      setIsFilterPopoverOpen(false);
                    }}
                    className="text-[11px] text-[#0e59f9] hover:underline font-medium cursor-pointer border-none bg-transparent"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('ALL');
                    setIsFilterPopoverOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-medium transition-colors text-left cursor-pointer border-none",
                    categoryFilter === 'ALL'
                      ? "bg-blue-50 text-[#0e59f9] font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <span>Semua Kategori</span>
                  {categoryFilter === 'ALL' && <Check className="w-3.5 h-3.5 text-[#0e59f9]" />}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(cat);
                      setIsFilterPopoverOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-medium transition-colors text-left cursor-pointer border-none",
                      categoryFilter === cat
                        ? "bg-blue-50 text-[#0e59f9] font-semibold"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span className="truncate">{cat}</span>
                    {categoryFilter === cat && <Check className="w-3.5 h-3.5 text-[#0e59f9] shrink-0" />}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Switcher Tampilan (List vs Card) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-full shadow-sm-md h-10">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border-none",
                viewMode === 'list'
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              )}
              title="Tampilan Tabel"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border-none",
                viewMode === 'grid'
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              )}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kartu</span>
            </button>
          </div>

          {/* Tombol Primary: Tambah Bahan */}
          <button
            type="button"
            onClick={() => {
              setSelectedMaterialForEdit(null);
              setIsFormOpen(true);
            }}
            className="h-10 px-5 rounded-full bg-[#0e59f9] hover:bg-blue-600 text-white font-medium text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-all cursor-pointer border-none active:scale-[0.98] shrink-0 select-none"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bahan</span>
          </button>
        </div>
      </div>

      {/* 3. Empty State (No Materials Found) */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm-md border-none my-4">
          <div className="h-14 w-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 shadow-sm-md">
            <Boxes className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            {searchQuery ? 'Bahan Tidak Ditemukan' : 'Belum Ada Bahan Baku'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            {searchQuery
              ? `Tidak ada stok bahan yang cocok dengan pencarian "${searchQuery}".`
              : 'Daftarkan bahan mentah seperti susu, kopi, daging, kain, atau packaging untuk mulai mencatat stok keluar-masuk.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSelectedMaterialForEdit(null);
                setIsFormOpen(true);
              }}
              className="mt-4 h-10 px-5 rounded-full bg-[#0e59f9] hover:bg-blue-600 text-white font-medium text-xs shadow-md border-none inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Bahan Sekarang</span>
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* 4. MODE TABEL (Harmonized with Riwayat Transaksi Standard) */
        <div className="rounded-2xl border-none bg-white overflow-hidden shadow-sm-md">
          <div className="relative w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3.5 pl-5 pr-3 w-10">
                    <Checkbox
                      checked={
                        selectedIds.length === filteredMaterials.length &&
                        filteredMaterials.length > 0
                      }
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                      aria-label="Pilih semua bahan"
                    />
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 w-[240px]">
                    Bahan Baku
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 w-[140px]">
                    Kategori
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 w-[160px]">
                    Sisa Stok
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 w-[140px]">
                    Harga Beli
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 w-[120px]">
                    Status
                  </th>
                  <th className="py-3.5 pr-5 pl-4 text-xs font-semibold whitespace-nowrap text-right w-[110px]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map((item) => {
                  const isLow = item.stock > 0 && item.stock <= item.minStock;
                  const isOut = item.stock <= 0;
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => openEditModal(item)}
                      className={cn(
                        "hover:bg-slate-100/60 transition-colors cursor-pointer",
                        isSelected && "bg-blue-50/40"
                      )}
                    >
                      {/* 1. Checkbox */}
                      <td className="py-3.5 pl-5 pr-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSelect(item.id)}
                          aria-label={`Pilih ${item.name}`}
                        />
                      </td>

                      {/* 2. Bahan Baku (Avatar / Initials + Nama + SKU) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 select-none",
                            getAvatarColor(item.name)
                          )}>
                            {getMaterialInitials(item.name)}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                            <span className="font-medium text-slate-800 text-xs truncate" title={item.name}>
                              {item.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono truncate">
                              {item.sku || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Kategori (Plain Text Clean) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-600 text-xs font-normal">
                          {item.category || '-'}
                        </span>
                      </td>

                      {/* 4. Sisa Stok (Aktual + Batas Min - 2 Baris Vertikal) */}
                      <td className="py-3.5 px-4 whitespace-nowrap tabular-nums font-numeric">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-xs">
                            {item.stock} {item.unit}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Batas min: {item.minStock} {item.unit}
                          </span>
                        </div>
                      </td>

                      {/* 5. Harga Beli (Rp + Satuan - 2 Baris Vertikal) */}
                      <td className="py-3.5 px-4 whitespace-nowrap tabular-nums font-numeric">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-xs">
                            {formatCurrency(item.costPerUnit || 0)}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            per {item.unit}
                          </span>
                        </div>
                      </td>

                      {/* 6. Status Stok (Pastel Soft Borderless) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border-none",
                          isOut
                            ? "bg-rose-100/70 text-rose-700"
                            : isLow
                            ? "bg-amber-100/80 text-amber-700"
                            : "bg-emerald-100/80 text-emerald-700"
                        )}>
                          {isOut ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
                        </span>
                      </td>

                      {/* 7. Aksi Cepat (+ / -) & Menu Opsi */}
                      <td className="py-3.5 pr-5 pl-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openQuickStock(item, 'IN')}
                            title="Tambah Stok Masuk"
                            className="h-7 w-7 rounded-full bg-slate-100/80 hover:bg-[#0e59f9] text-slate-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer border-none shadow-none active:scale-95"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openQuickStock(item, 'OUT')}
                            title="Catat Stok Keluar"
                            className="h-7 w-7 rounded-full bg-slate-100/80 hover:bg-[#0e59f9] text-slate-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer border-none shadow-none active:scale-95"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="h-7 w-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer border-none transition-colors"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-2xl shadow-2xl border-none bg-white z-50">
                              <DropdownMenuLabel className="text-[11px] font-semibold text-slate-400 px-2 py-1">
                                Aksi Bahan
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => openQuickStock(item, 'IN')}
                                className="text-xs font-medium cursor-pointer rounded-xl text-slate-700 hover:bg-slate-100"
                              >
                                <Plus className="mr-2 h-3.5 w-3.5 text-emerald-600" /> Stok Masuk
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openQuickStock(item, 'OUT')}
                                className="text-xs font-medium cursor-pointer rounded-xl text-slate-700 hover:bg-slate-100"
                              >
                                <Minus className="mr-2 h-3.5 w-3.5 text-rose-600" /> Stok Keluar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openQuickStock(item, 'ADJUSTMENT')}
                                className="text-xs font-medium cursor-pointer rounded-xl text-slate-700 hover:bg-slate-100"
                              >
                                <RefreshCw className="mr-2 h-3.5 w-3.5 text-[#0e59f9]" /> Opname Fisik
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-slate-100" />
                              <DropdownMenuItem
                                onClick={() => openMaterialMovements(item)}
                                className="text-xs font-medium cursor-pointer rounded-xl text-slate-700 hover:bg-slate-100"
                              >
                                <History className="mr-2 h-3.5 w-3.5 text-blue-600" /> Riwayat Mutasi
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEditModal(item)}
                                className="text-xs font-medium cursor-pointer rounded-xl text-slate-700 hover:bg-slate-100"
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5 text-slate-600" /> Edit Detail Bahan
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-slate-100" />
                              <DropdownMenuItem
                                onClick={() => handleDeleteSingle(item)}
                                className="text-xs font-medium cursor-pointer rounded-xl text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus Bahan
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 5. MODE KARTU (Grid View Pattern - Cleaned Typography) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredMaterials.map((item) => {
            const isLow = item.stock > 0 && item.stock <= item.minStock;
            const isOut = item.stock <= 0;

            return (
              <div
                key={item.id}
                onClick={() => openEditModal(item)}
                className="bg-white rounded-2xl p-5 shadow-sm-md hover:shadow-md border-none transition-all flex flex-col justify-between space-y-4 cursor-pointer"
              >
                {/* Top Section */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border-none truncate">
                      {item.category || 'Bahan'}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="h-7 w-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer border-none"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-2xl shadow-2xl border-none bg-white z-50">
                        <DropdownMenuItem
                          onClick={() => openMaterialMovements(item)}
                          className="text-xs font-medium cursor-pointer rounded-xl text-slate-700 hover:bg-slate-100"
                        >
                          <History className="mr-2 h-3.5 w-3.5 text-[#0e59f9]" /> Riwayat Mutasi
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEditModal(item)}
                          className="text-xs font-medium cursor-pointer rounded-xl text-slate-700 hover:bg-slate-100"
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5 text-slate-600" /> Edit Detail
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-slate-100" />
                        <DropdownMenuItem
                          onClick={() => handleDeleteSingle(item)}
                          className="text-xs font-medium cursor-pointer rounded-xl text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus Bahan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 select-none",
                      getAvatarColor(item.name)
                    )}>
                      {getMaterialInitials(item.name)}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1 overflow-hidden">
                      <h3 className="text-sm font-semibold text-slate-900 tracking-normal truncate" title={item.name}>
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        {item.sku || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Middle Stock Numbers */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 border-none flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500">Sisa Stok</p>
                    <p className="text-base font-semibold text-slate-900 tabular-nums font-numeric mt-0.5">
                      {item.stock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border-none",
                      isOut
                        ? "bg-rose-100/70 text-rose-700"
                        : isLow
                        ? "bg-amber-100/80 text-amber-700"
                        : "bg-emerald-100/80 text-emerald-700"
                    )}>
                      {isOut ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1 tabular-nums font-numeric">
                      Min {item.minStock} {item.unit}
                    </p>
                  </div>
                </div>

                {/* Bottom Quick Stock Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => openQuickStock(item, 'IN')}
                    className="h-8 rounded-full bg-slate-100/80 hover:bg-[#0e59f9] text-slate-700 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Masuk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openQuickStock(item, 'OUT')}
                    className="h-8 rounded-full bg-slate-100/80 hover:bg-[#0e59f9] text-slate-700 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Floating Bulk Actions Bar (When checkboxes are selected) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-150">
          <span className="text-xs font-medium text-slate-200">
            {selectedIds.length} bahan dipilih
          </span>
          <div className="h-4 w-px bg-slate-700" />
          <button
            type="button"
            onClick={handleBulkDelete}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer border-none bg-transparent"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Terpilih</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-xs text-slate-400 hover:text-white p-1 cursor-pointer border-none bg-transparent"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 7. Dialogs */}
      <MaterialFormDialog
        material={selectedMaterialForEdit}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={reloadData}
      />

      <MaterialQuickStockDialog
        material={quickStockMaterial}
        isOpen={isQuickStockOpen}
        initialType={quickStockType}
        onOpenChange={setIsQuickStockOpen}
        onSuccess={handleQuickStockSuccess}
      />

      <MaterialMovementsDialog
        materialId={movementsMaterial.id}
        materialName={movementsMaterial.name}
        isOpen={isMovementsOpen}
        onOpenChange={setIsMovementsOpen}
      />
    </div>
  );
}
