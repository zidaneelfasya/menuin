'use client';

import * as React from 'react';
import { Plus, Search, Power, PowerOff, CheckCircle2, SlidersHorizontal, Package, X, Image as ImageIcon, Palette, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCartStore } from '../stores/use-cart-store';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toggleProductActiveStatus } from '@/lib/actions/products';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { toast } from 'sonner';
import { CustomizationModal } from '@/components/shared/customization-modal';
import { getCategoryIcon } from '@/features/categories/lib/category-icons';
import { getPosCardPalette, getProductCardIcon } from '../lib/pos-card-theme';

type Category = {
  id: string;
  name: string;
  icon?: string | null;
};

type Product = {
  id: string;
  sku: string;
  name: string;
  price: string;
  stock: number;
  categoryName: string | null;
  categoryId: string | null;
  imageUrl: string | null;
  barcode: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
  trackStock?: boolean;
  status: string;
  modifierGroupIds?: string[];
};

export function ProductCatalog({
  products,
  categories,
  modifierGroups
}: {
  products: Product[],
  categories: Category[],
  modifierGroups?: any[]
}) {
  const [activeCategory, setActiveCategory] = React.useState('Semua');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [visibleCount, setVisibleCount] = React.useState(40);
  const displayMode = useCartStore((state) => state.displayMode);
  const setDisplayMode = useCartStore((state) => state.setDisplayMode);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('menuin_pos_display_mode');
      if (saved === 'color' || saved === 'image') {
        setDisplayMode(saved);
      }
    } catch {
      // LocalStorage fallback
    }
  }, [setDisplayMode]);

  const handleSetDisplayMode = (mode: 'image' | 'color') => {
    setDisplayMode(mode);
  };

  const categoryIconMap = React.useMemo(() => {
    const map = new Map<string, string | null>();
    categories.forEach((cat) => {
      if (cat.icon) {
        map.set(cat.id, cat.icon);
        map.set(cat.name, cat.icon);
      }
    });
    return map;
  }, [categories]);

  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);

  const cartCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cartItems) {
      map[item.productId] = (map[item.productId] || 0) + item.quantity;
    }
    return map;
  }, [cartItems]);

  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const observerTarget = React.useRef<HTMLDivElement>(null);

  const [localProducts, setLocalProducts] = React.useState<Product[]>(products);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = React.useState(false);
  const [availabilitySearch, setAvailabilitySearch] = React.useState('');

  React.useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  const [selectedProductForModal, setSelectedProductForModal] = React.useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleToggleProductAvailability = async (product: Product) => {
    const currentVal = product.isActive !== false;
    const nextVal = !currentVal;

    // Optimistic UI update
    setLocalProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isActive: nextVal } : p))
    );

    const res = await toggleProductActiveStatus(product.id, nextVal);
    if (!res.success) {
      toast.error(res.error || 'Gagal mengubah status ketersediaan item');
      setLocalProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: currentVal } : p))
      );
    } else {
      toast.success(
        nextVal
          ? `${product.name} sekarang Tersedia`
          : `${product.name} dimatikan (Tidak Tersedia)`
      );
    }
  };

  const filteredAvailabilityProducts = React.useMemo(() => {
    if (!availabilitySearch.trim()) return localProducts;
    const q = availabilitySearch.toLowerCase();
    return localProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [localProducts, availabilitySearch]);

  // Sort available products first (unavailable items go to the very bottom, even if Best Seller)
  const sortedProducts = React.useMemo(() => {
    return [...localProducts].sort((a, b) => {
      const isAUnavailable = a.isActive === false || (a.trackStock !== false && a.stock <= 0);
      const isBUnavailable = b.isActive === false || (b.trackStock !== false && b.stock <= 0);

      // 1. Available products ALWAYS come before Unavailable products
      if (isAUnavailable !== isBUnavailable) {
        return isAUnavailable ? 1 : -1;
      }

      // 2. Best Sellers come first within availability group
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      // 3. Alphabetical by name
      return a.name.localeCompare(b.name);
    });
  }, [localProducts]);

  const productIndexMap = React.useMemo(() => {
    const map = new Map<string, number>();
    sortedProducts.forEach((p, idx) => map.set(p.id, idx));
    return map;
  }, [sortedProducts]);

  const handleAddToCart = (
    product: { id: string, name: string, price: string | number, imageUrl?: string | null },
    modifiers: any[] = [],
    notes: string = '',
    quantity: number = 1,
    colorIndex?: number
  ) => {
    let extraPrice = 0;
    modifiers.forEach(m => extraPrice += Number(m.price));
    const resolvedColorIndex = typeof colorIndex === 'number' ? colorIndex : productIndexMap.get(product.id);

    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price: Number(product.price) + extraPrice,
        imageUrl: product.imageUrl,
        colorIndex: resolvedColorIndex,
        modifiers,
        notes
      });
    }
  };

  // Sync cart images & color indices with current product list
  React.useEffect(() => {
    if (sortedProducts && sortedProducts.length > 0) {
      const mapped = sortedProducts.map((p, idx) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        colorIndex: idx,
      }));
      useCartStore.getState().syncProductImages(mapped);
    }
  }, [sortedProducts]);

  // Reset visible count when filter changes
  React.useEffect(() => {
    setVisibleCount(40);
  }, [activeCategory, searchQuery]);

  // Infinite Scroll Observer
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 40);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, []);

  // Focus search input when typing anywhere (good for manual typing)
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Allow barcode scanner to bypass this (it's very fast, but let's just let the hook handle it)
      if (
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useBarcodeScanner({
    onScan: (barcode: string) => {
      const matchedProduct = sortedProducts.find(p => p.barcode === barcode || p.sku === barcode);
      if (matchedProduct && matchedProduct.stock > 0) {
        if (matchedProduct.modifierGroupIds && matchedProduct.modifierGroupIds.length > 0) {
          setSelectedProductForModal(matchedProduct);
          setIsModalOpen(true);
        } else {
          handleAddToCart(matchedProduct);
          toast.success(`Berhasil menambahkan ${matchedProduct.name}`);
        }
        setSearchQuery(''); // clear if it typed into the input
      } else {
        toast.error(`Produk dengan barcode ${barcode} tidak ditemukan atau stok habis.`);
      }
    }
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      // Manual search exact match
      const matchedProduct = sortedProducts.find(p => p.barcode === searchQuery.trim() || p.sku === searchQuery.trim());
      if (matchedProduct && matchedProduct.stock > 0) {
        if (matchedProduct.modifierGroupIds && matchedProduct.modifierGroupIds.length > 0) {
          setSelectedProductForModal(matchedProduct);
          setIsModalOpen(true);
        } else {
          handleAddToCart(matchedProduct);
        }
        setSearchQuery('');
      }
    }
  };

  const filteredProducts = sortedProducts.filter(p => {
    let matchesCategory = false;
    if (activeCategory === 'Semua') {
      matchesCategory = true;
    } else if (activeCategory === 'Best Seller') {
      matchesCategory = !!p.isFeatured;
    } else {
      matchesCategory = p.categoryName === activeCategory || p.categoryId === activeCategory;
    }

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const hasBestSellers = sortedProducts.some(p => p.isFeatured);

  // Category counts matching Menuin standard status tabs
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      'Semua': sortedProducts.length,
      'Best Seller': sortedProducts.filter(p => p.isFeatured).length,
    };
    categories.forEach(cat => {
      counts[cat.name] = sortedProducts.filter(
        p => p.categoryName === cat.name || p.categoryId === cat.id
      ).length;
    });
    return counts;
  }, [sortedProducts, categories]);

  const categoryTabs = React.useMemo(() => {
    const tabs: {
      id: string;
      label: string;
      count: number;
      icon?: React.ComponentType<{ className?: string }> | null;
    }[] = [
      {
        id: 'Semua',
        label: 'Semua',
        count: categoryCounts['Semua'] || 0,
      },
    ];

    if (hasBestSellers) {
      tabs.push({
        id: 'Best Seller',
        label: 'Rekomendasi',
        count: categoryCounts['Best Seller'] || 0,
        icon: ThumbsUp,
      });
    }

    categories.forEach((cat) => {
      const CategoryIcon = cat.icon ? getCategoryIcon(cat.icon) : null;
      tabs.push({
        id: cat.name,
        label: cat.name,
        count: categoryCounts[cat.name] || 0,
        icon: CategoryIcon,
      });
    });

    return tabs;
  }, [categoryCounts, hasBestSellers, categories]);

  // Horizontal scroll & drag management for category filter bar
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  // Check if tabs overflow the container to enable drag cursor
  const checkScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollWidth, clientWidth } = el;
    setIsOverflowing(scrollWidth > clientWidth + 2);
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll, categoryTabs.length]);

  // Convert mouse wheel up/down to horizontal scroll
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
      el.scrollLeft += e.deltaY;
    }
  };

  // Mouse Drag-to-Scroll support (for desktop mouse drag and touch screens)
  const isMouseDownRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const startScrollLeftRef = React.useRef(0);
  const hasDraggedRef = React.useRef(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    startScrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const currentX = e.pageX - el.offsetLeft;
    const walk = (currentX - startXRef.current) * 1.2;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
      if (!isDragging) setIsDragging(true);
    }
    el.scrollLeft = startScrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      setIsDragging(false);
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 50);
    }
  };

  // Auto-scroll active tab into view
  React.useEffect(() => {
    const activeEl = tabRefs.current[activeCategory];
    if (activeEl && scrollContainerRef.current) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeCategory]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search Bar + Compact Settings Dropdown (Tampilan & Ketersediaan) */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            ref={searchInputRef}
            placeholder="Cari produk atau scan barcode..."
            className="pl-9 pr-8 h-9 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800 focus-visible:outline-none shadow-2xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Pengaturan Tampilan & Ketersediaan (Single Compact Icon Button 36x36px, 100% matching Kanban Board) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="relative h-9 w-9 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs shrink-0 rounded-xl cursor-pointer"
              title="Pengaturan Tampilan & Ketersediaan"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="sr-only">Pengaturan Tampilan & Ketersediaan</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-0.5"
          >
            {/* Seksi 1: Mode Tampilan */}
            <div className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Mode Tampilan
            </div>
            <DropdownMenuItem
              onClick={() => handleSetDisplayMode('image')}
              className={cn(
                "text-xs px-3 py-2 cursor-pointer rounded-full font-medium flex items-center transition-colors",
                displayMode === 'image'
                  ? "bg-blue-600 text-white font-semibold shadow-2xs hover:bg-blue-500 focus:bg-blue-500 focus:text-white data-[highlighted]:bg-blue-500 data-[highlighted]:text-white"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 dark:hover:bg-slate-800 dark:focus:bg-slate-800 dark:data-[highlighted]:bg-slate-800"
              )}
            >
              <div className="flex items-center gap-2">
                <ImageIcon
                  className={cn(
                    "w-3.5 h-3.5",
                    displayMode === 'image' ? "text-white" : "text-slate-500"
                  )}
                />
                <span>Gambar</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleSetDisplayMode('color')}
              className={cn(
                "text-xs px-3 py-2 cursor-pointer rounded-full font-medium flex items-center transition-colors",
                displayMode === 'color'
                  ? "bg-blue-600 text-white font-semibold shadow-2xs hover:bg-blue-500 focus:bg-blue-500 focus:text-white data-[highlighted]:bg-blue-500 data-[highlighted]:text-white"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 dark:hover:bg-slate-800 dark:focus:bg-slate-800 dark:data-[highlighted]:bg-slate-800"
              )}
            >
              <div className="flex items-center gap-2">
                <Palette
                  className={cn(
                    "w-3.5 h-3.5",
                    displayMode === 'color' ? "text-white" : "text-slate-500"
                  )}
                />
                <span>Warna</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1.5 bg-slate-100 dark:bg-slate-800" />

            {/* Seksi 2: Manajemen Menu */}
            <div className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Ketersediaan Menu
            </div>
            <DropdownMenuItem
              onClick={() => setIsAvailabilityModalOpen(true)}
              className="text-xs px-3 py-2 cursor-pointer rounded-full font-medium flex items-center transition-colors text-slate-700 dark:text-slate-200 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 dark:hover:bg-slate-800 dark:focus:bg-slate-800 dark:data-[highlighted]:bg-slate-800"
            >
              <div className="flex items-center gap-2">
                <Power className="w-3.5 h-3.5 text-slate-500" />
                <span>Kelola Ketersediaan</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Menuin Standard Category Filter Tabs (Underline Navigation + Horizontal Drag & Scroll) */}
      <div className="relative border-b border-slate-200 dark:border-slate-800 pt-0.5 select-none shrink-0">

        {/* Draggable & Scrollable Tabs Container */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onWheel={handleWheel}
          className={cn(
            "flex items-center gap-6 overflow-x-auto scrollbar-hide pt-1 px-1",
            isOverflowing ? "cursor-grab active:cursor-grabbing" : ""
          )}
        >
          {categoryTabs.map((tab) => {
            const isActive = activeCategory === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                type="button"
                onClick={(e) => {
                  if (hasDraggedRef.current) {
                    e.preventDefault();
                    return;
                  }
                  setActiveCategory(tab.id);
                }}
                className={cn(
                  "relative pb-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 select-none",
                  isActive
                    ? "text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                )}
              >
                {TabIcon && (
                  <TabIcon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-400 dark:text-slate-500"
                    )}
                  />
                )}
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-lg font-medium transition-colors tabular-nums",
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                      : "text-slate-400 dark:text-slate-500 bg-slate-100/70 dark:bg-slate-800/50"
                  )}
                >
                  {tab.count}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="activePosCategoryTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-full"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 35,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid (Dual Mode: Gambar vs Warna Pastel) */}
      <div className="flex-1 overflow-y-auto px-1 pt-1.5 sm:pt-2 pr-2 pb-24">
        {displayMode === 'color' ? (
          /* ================= COLOR / NO-IMAGE MODE ================= */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.slice(0, visibleCount).map((product, productIndex) => {
              const isActive = product.isActive !== false;
              const isOutOfStock = product.trackStock !== false && product.stock <= 0;
              const isAvailable = isActive && !isOutOfStock;
              const cartQuantity = cartCounts[product.id] || 0;
              const isInCart = cartQuantity > 0;
              const palette = getPosCardPalette(productIndex);
              const catIcon = product.categoryId
                ? categoryIconMap.get(product.categoryId)
                : (product.categoryName ? categoryIconMap.get(product.categoryName) : null);
              const FoodIcon = getProductCardIcon(product.name, catIcon);

              return (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: isAvailable ? palette.bgHex : undefined,
                    boxShadow: isAvailable && isInCart
                      ? `0 0 0 2px ${palette.activeRingHex}, 0 4px 12px -2px rgba(0, 0, 0, 0.08)`
                      : undefined,
                  }}
                  className={cn(
                    "rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all select-none relative min-h-[148px] sm:min-h-[156px]",
                    isAvailable
                      ? isInCart
                        ? "cursor-pointer group shadow-xs active:scale-[0.98]"
                        : "cursor-pointer group shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                      : "opacity-40 grayscale-[30%] bg-slate-100 cursor-not-allowed pointer-events-none shadow-none"
                  )}
                  onClick={() => {
                    if (isAvailable) {
                      const colorIdx = productIndexMap.get(product.id) ?? productIndex;
                      if (product.modifierGroupIds && product.modifierGroupIds.length > 0) {
                        setSelectedProductForModal({ ...product, colorIndex: colorIdx } as any);
                        setIsModalOpen(true);
                      } else {
                        handleAddToCart(product, [], '', 1, colorIdx);
                      }
                    }
                  }}
                >
                  {/* Status Overlay for Inactive or Out of Stock */}
                  {!isActive ? (
                    <div className="absolute inset-0 bg-slate-950/70 z-20 flex flex-col items-center justify-center p-2 text-center rounded-2xl backdrop-blur-[1px]">
                      <span className="text-white text-[11px] font-semibold tracking-wider uppercase bg-rose-600/95 px-2.5 py-1 rounded-md shadow-xs">
                        TIDAK TERSEDIA
                      </span>
                      <span className="text-[10px] text-slate-300 mt-1 font-medium">Menu Dinonaktifkan</span>
                    </div>
                  ) : isOutOfStock ? (
                    <div className="absolute inset-0 bg-slate-950/60 z-20 flex flex-col items-center justify-center p-2 text-center rounded-2xl backdrop-blur-[1px]">
                      <span className="text-white text-[11px] font-semibold tracking-wider uppercase bg-amber-600/95 px-2.5 py-1 rounded-md shadow-xs">
                        STOK HABIS
                      </span>
                    </div>
                  ) : null}

                  {/* Top Row: Food Icon + Recommendation Badge */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div
                      style={{
                        backgroundColor: isAvailable ? palette.iconBgHex : undefined,
                        color: isAvailable ? palette.iconColorHex : undefined,
                      }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                    >
                      <FoodIcon className="w-5 h-5" />
                    </div>

                    {product.isFeatured && (
                      <div
                        style={{
                          backgroundColor: isAvailable ? palette.iconBgHex : undefined,
                          color: isAvailable ? palette.iconColorHex : undefined,
                        }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                        title="Menu Rekomendasi"
                      >

                      </div>
                    )}
                  </div>

                  {/* Middle: Product Name */}
                  <div className="my-auto py-2.5">
                    <h3
                      style={{ color: isAvailable ? palette.textPrimaryHex : undefined }}
                      className="font-semibold text-base sm:text-[17px] leading-snug line-clamp-2"
                    >
                      {product.name}
                    </h3>
                  </div>

                  {/* Bottom: Price + Cart Quantity Badge */}
                  <div
                    className="flex items-center justify-between gap-2 pt-2 mt-auto"
                  >
                    <span
                      style={{ color: isAvailable ? palette.textPrimaryHex : undefined }}
                      className="font-semibold text-sm sm:text-base tracking-tight font-financial tabular-nums"
                    >
                      {formatCurrency(parseFloat(product.price))}
                    </span>

                    {isInCart && (
                      <span
                        style={{
                          backgroundColor: palette.activeRingHex,
                          color: '#FFFFFF'
                        }}
                        className="flex items-center justify-center min-w-[26px] h-[26px] px-2 rounded-full text-xs font-semibold shadow-xs select-none animate-in zoom-in-50 duration-150 font-financial tabular-nums"
                      >
                        {cartQuantity}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground flex flex-col items-center justify-center">
                <Package className="w-10 h-10 mb-2.5 opacity-30 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Tidak ada produk ditemukan</p>
                <p className="text-xs text-muted-foreground mt-1">Coba kata kunci lain atau ubah kategori pilihan</p>
                {(searchQuery || activeCategory !== 'Semua') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('Semua');
                    }}
                    className="mt-3 text-xs rounded-xl"
                  >
                    Tampilkan Semua Produk
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ================= IMAGE MODE ================= */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.slice(0, visibleCount).map((product) => {
              const isActive = product.isActive !== false;
              const isOutOfStock = product.trackStock !== false && product.stock <= 0;
              const isAvailable = isActive && !isOutOfStock;
              const cartQuantity = cartCounts[product.id] || 0;
              const isInCart = cartQuantity > 0;

              return (
                <div
                  key={product.id}
                  className={cn(
                    "bg-card rounded-2xl overflow-hidden transition-all flex flex-col relative select-none",
                    isAvailable
                      ? isInCart
                        ? "cursor-pointer group ring-2 ring-[#0e59f9] shadow-xs active:scale-[0.98]"
                        : "cursor-pointer group shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                      : "opacity-40 grayscale-[30%] bg-slate-100 dark:bg-slate-900/60 shadow-none cursor-not-allowed pointer-events-none"
                  )}
                  onClick={() => {
                    if (isAvailable) {
                      const colorIdx = productIndexMap.get(product.id);
                      if (product.modifierGroupIds && product.modifierGroupIds.length > 0) {
                        setSelectedProductForModal({ ...product, colorIndex: colorIdx } as any);
                        setIsModalOpen(true);
                      } else {
                        handleAddToCart(product, [], '', 1, colorIdx);
                      }
                    }
                  }}
                >
                  {!isActive ? (
                    <div className="absolute inset-0 bg-slate-950/70 z-20 flex flex-col items-center justify-center p-2 text-center backdrop-blur-[1px]">
                      <span className="text-white text-[11px] font-semibold tracking-wider uppercase bg-rose-600/95 px-2.5 py-1 rounded-md shadow-xs">
                        TIDAK TERSEDIA
                      </span>
                      <span className="text-[10px] text-slate-300 mt-1 font-medium">Menu Dinonaktifkan</span>
                    </div>
                  ) : isOutOfStock ? (
                    <div className="absolute inset-0 bg-slate-950/60 z-20 flex flex-col items-center justify-center p-2 text-center backdrop-blur-[1px]">
                      <span className="text-white text-[11px] font-semibold tracking-wider uppercase bg-amber-600/95 px-2.5 py-1 rounded-md shadow-xs">
                        STOK HABIS
                      </span>
                    </div>
                  ) : null}

                  {product.isFeatured && (
                    <div className="absolute top-2 left-2 z-10 bg-[#0e59f9] text-white text-[10px] font-semibold px-2 py-2 rounded-full shadow-md flex items-center gap-1 backdrop-blur-sm">
                      <ThumbsUp className="w-4 h-4" />
                    </div>
                  )}

                  <div className="aspect-[4/3] bg-muted relative overflow-hidden flex items-center justify-center">
                    {product.imageUrl ? (
                      <>
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          loading="lazy"
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            e.currentTarget.nextElementSibling?.classList.add('flex');
                          }}
                        />
                        <div className="hidden w-full h-full items-center justify-center text-muted-foreground bg-primary/5 text-4xl font-semibold text-primary/20">
                          {product.name.charAt(0)}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5 text-4xl font-semibold text-primary/20">
                        {product.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1">{product.name}</h3>

                    <div className="mt-auto flex items-center justify-between gap-1 pt-0.5">
                      <span className="text-[#0e59f9] font-semibold text-sm font-financial tabular-nums">{formatCurrency(parseFloat(product.price))}</span>
                      {isInCart && (
                        <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#0e59f9] text-white text-[11px] font-semibold font-financial tabular-nums shadow-xs select-none">
                          {cartQuantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground flex flex-col items-center justify-center">
                <Package className="w-10 h-10 mb-2.5 opacity-30 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Tidak ada produk ditemukan</p>
                <p className="text-xs text-muted-foreground mt-1">Coba kata kunci lain atau ubah kategori pilihan</p>
                {(searchQuery || activeCategory !== 'Semua') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('Semua');
                    }}
                    className="mt-3 text-xs rounded-xl"
                  >
                    Tampilkan Semua Produk
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Infinite Scroll Skeleton Placeholders */}
        {visibleCount < filteredProducts.length && (
          <div ref={observerTarget} className={cn(
            "mt-4 py-2",
            displayMode === 'color'
              ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          )}>
            {Array.from({ length: 6 }).map((_, idx) => (
              displayMode === 'color' ? (
                <div key={idx} className="bg-muted/40 border border-border/60 rounded-2xl h-[150px] animate-pulse p-4 flex flex-col justify-between">
                  <div className="w-9 h-9 bg-muted rounded-xl"></div>
                  <div className="space-y-1.5 my-auto">
                    <div className="h-4 w-3/4 bg-muted rounded"></div>
                    <div className="h-3 w-1/2 bg-muted rounded"></div>
                  </div>
                  <div className="h-3.5 w-1/3 bg-muted rounded"></div>
                </div>
              ) : (
                <div key={idx} className="bg-card border border-border/60 rounded-2xl h-44 animate-pulse p-3 flex flex-col justify-between">
                  <div className="w-full h-24 bg-muted/60 rounded-xl"></div>
                  <div className="space-y-1.5 mt-2">
                    <div className="h-3.5 w-3/4 bg-muted/60 rounded"></div>
                    <div className="h-3 w-1/2 bg-muted/60 rounded"></div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      <CustomizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProductForModal}
        allModifierGroups={modifierGroups || []}
        onAddToCart={(product, modifiers, notes, qty) => {
          handleAddToCart(product, modifiers, notes, qty, (selectedProductForModal as any)?.colorIndex);
          toast.success(`${product.name} ditambahkan`);
        }}
      />

      {/* Quick Availability Modal in POS */}
      <Dialog open={isAvailabilityModalOpen} onOpenChange={setIsAvailabilityModalOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
          <DialogHeader className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Power className="w-5 h-5 text-emerald-600" />
              Kelola Ketersediaan Menu Kasir
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Matikan menu yang habis atau tidak dapat disajikan agar kasir dan pelanggan tidak memesannya.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari item yang ingin diubah..."
                value={availabilitySearch}
                onChange={(e) => setAvailabilitySearch(e.target.value)}
                className="pl-8 h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-4 space-y-2">
            {filteredAvailabilityProducts.map((p) => {
              const isActive = p.isActive !== false;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-semibold text-xs text-primary shrink-0 overflow-hidden">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        p.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatCurrency(parseFloat(p.price))} {p.categoryName ? `• ${p.categoryName}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                        isActive
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      )}
                    >
                      {isActive ? 'Tersedia' : 'Nonaktif'}
                    </span>
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => handleToggleProductAvailability(p)}
                      className="data-[state=checked]:bg-emerald-600 scale-90 cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
            {filteredAvailabilityProducts.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Tidak ada produk yang cocok dengan pencarian.
              </div>
            )}
          </div>

          <div className="p-3.5 px-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAvailabilityModalOpen(false)}
              className="rounded-xl px-4 text-xs font-medium"
            >
              Selesai
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
