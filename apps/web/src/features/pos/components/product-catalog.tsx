'use client';

import * as React from 'react';
import { Plus, Search, Star, Sparkles, Power, PowerOff, CheckCircle2, SlidersHorizontal, Package, X } from 'lucide-react';
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

type Category = {
  id: string;
  name: string;
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
  const addItem = useCartStore((state) => state.addItem);
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

  const handleAddToCart = (product: { id: string, name: string, price: string | number, imageUrl?: string | null }, modifiers: any[] = [], notes: string = '', quantity: number = 1) => {
    let extraPrice = 0;
    modifiers.forEach(m => extraPrice += Number(m.price));
    
    for(let i = 0; i < quantity; i++) {
      addItem({ 
        productId: product.id, 
        name: product.name, 
        price: Number(product.price) + extraPrice, 
        imageUrl: product.imageUrl,
        modifiers,
        notes
      });
    }
  };

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

  // Sync cart images with current product list
  React.useEffect(() => {
    if (localProducts && localProducts.length > 0) {
      useCartStore.getState().syncProductImages(localProducts);
    }
  }, [localProducts]);

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
      matchesCategory = p.categoryName === activeCategory;
    }

    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const hasBestSellers = sortedProducts.some(p => p.isFeatured);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search Bar + Quick Availability Shortcut Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            ref={searchInputRef}
            placeholder="Cari produk atau scan barcode..." 
            className="pl-9 bg-card border-border rounded-xl h-11 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAvailabilityModalOpen(true)}
          className="h-11 px-3.5 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5 shrink-0 bg-white dark:bg-slate-900 shadow-2xs hover:bg-slate-50 transition-colors"
          title="Kelola ketersediaan menu secara cepat"
        >
          <Power className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Ketersediaan Menu</span>
        </Button>
      </div>

      {/* Categories with Best Seller Option */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveCategory('Semua')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border",
            activeCategory === 'Semua' 
              ? "bg-primary text-primary-foreground border-primary shadow-sm" 
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          )}
        >
          Semua
        </button>

        {hasBestSellers && (
          <button
            onClick={() => setActiveCategory('Best Seller')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors border flex items-center gap-1.5",
              activeCategory === 'Best Seller' 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            )}
          >
            <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
            Best Seller
          </button>
        )}

        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.name)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border",
              activeCategory === category.name 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto pr-2 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.slice(0, visibleCount).map((product) => {
            const isActive = product.isActive !== false;
            const isOutOfStock = product.trackStock !== false && product.stock <= 0;
            const isAvailable = isActive && !isOutOfStock;

            return (
              <div 
                key={product.id} 
                className={cn(
                  "bg-card border rounded-2xl overflow-hidden transition-all flex flex-col relative select-none",
                  isAvailable 
                    ? "cursor-pointer group hover:shadow-md hover:border-primary/50 active:scale-[0.98]" 
                    : "opacity-40 grayscale-[30%] bg-slate-100 dark:bg-slate-900/60 border-dashed border-slate-300 dark:border-slate-800 cursor-not-allowed pointer-events-none"
                )}
                onClick={() => {
                  if (isAvailable) {
                    if (product.modifierGroupIds && product.modifierGroupIds.length > 0) {
                      setSelectedProductForModal(product);
                      setIsModalOpen(true);
                    } else {
                      handleAddToCart(product);
                    }
                  }
                }}
              >
                {!isActive ? (
                  <div className="absolute inset-0 bg-slate-950/70 z-20 flex flex-col items-center justify-center p-2 text-center backdrop-blur-[1px]">
                    <span className="text-white text-[11px] font-bold tracking-wider uppercase bg-rose-600/95 px-2.5 py-1 rounded-md shadow-xs">
                      TIDAK TERSEDIA
                    </span>
                    <span className="text-[10px] text-slate-300 mt-1 font-medium">Menu Dinonaktifkan</span>
                  </div>
                ) : isOutOfStock ? (
                  <div className="absolute inset-0 bg-slate-950/60 z-20 flex flex-col items-center justify-center p-2 text-center backdrop-blur-[1px]">
                    <span className="text-white text-[11px] font-bold tracking-wider uppercase bg-amber-600/95 px-2.5 py-1 rounded-md shadow-xs">
                      STOK HABIS
                    </span>
                  </div>
                ) : null}

                {product.isFeatured && (
                  <div className="absolute top-2 left-2 z-10 bg-amber-500/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 backdrop-blur-sm">
                    <Star className="w-3 h-3 fill-current" />
                    BEST SELLER
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
                      <div className="hidden w-full h-full items-center justify-center text-muted-foreground bg-primary/5 text-4xl font-bold text-primary/20">
                        {product.name.charAt(0)}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5 text-4xl font-bold text-primary/20">
                      {product.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1">{product.name}</h3>
                  <div className="text-xs text-muted-foreground mb-2">
                    {product.trackStock === false ? 'Stok: Tanpa Batas' : `Stok: ${product.stock}`}
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-primary font-bold text-sm">{formatCurrency(parseFloat(product.price))}</span>
                    {isAvailable && (
                      <button className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              Tidak ada produk yang ditemukan.
            </div>
          )}
        </div>
        
        {/* Infinite Scroll Target */}
        {visibleCount < filteredProducts.length && (
          <div ref={observerTarget} className="mt-6 flex justify-center py-6">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <CustomizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProductForModal}
        allModifierGroups={modifierGroups || []}
        onAddToCart={(product, modifiers, notes, qty) => {
          handleAddToCart(product, modifiers, notes, qty);
          toast.success(`${product.name} ditambahkan`);
        }}
      />

      {/* Quick Availability Modal in POS */}
      <Dialog open={isAvailabilityModalOpen} onOpenChange={setIsAvailabilityModalOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
          <DialogHeader className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
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
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-primary shrink-0 overflow-hidden">
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
