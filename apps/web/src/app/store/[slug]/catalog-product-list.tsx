"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { Search, ShoppingBag, Plus, Minus, Star, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/format";
import { CustomizationModal } from '@/components/shared/customization-modal';
import { toast } from 'sonner';

type Product = {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
  isFeatured: boolean | null;
  categoryId: string | null;
  stock?: number | null;
  trackStock?: boolean | null;
  modifierGroupIds?: string[];
};

type CatalogProductListProps = {
  productsByCategory: Record<string, Product[]>;
  categories: { id: string; name: string }[];
  featuredProducts: Product[];
  tenantSlug: string;
  modifierGroups?: any[];
};

export function CatalogProductList({
  productsByCategory,
  categories,
  featuredProducts,
  tenantSlug,
  modifierGroups = []
}: CatalogProductListProps) {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");
  
  const { setTenant, setTableNumber, items, addItem, updateQuantity, getTotalItems, getTotalPrice } = useCartStore();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize cart for this tenant
  useEffect(() => {
    setTenant(tenantSlug);
    if (tableParam) {
      setTableNumber(tableParam);
    }
  }, [tenantSlug, tableParam, setTenant, setTableNumber]);

  const allCategories = [
    ...categories,
    ...(productsByCategory['uncategorized']?.length > 0 ? [{ id: 'uncategorized', name: 'Lainnya' }] : [])
  ];

  // Smooth scroll to category
  const scrollToCategory = (id: string) => {
    const el = document.getElementById(`category-${id}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const renderProduct = (product: Product, horizontal: boolean = false, isBestSellerVariant: boolean = false) => {
    const hasModifiers = product.modifierGroupIds && product.modifierGroupIds.length > 0;
    const cartItemsForProduct = items.filter(i => i.productId === product.id);
    const qty = cartItemsForProduct.reduce((sum, item) => sum + item.quantity, 0);
    const cartItemWithoutModifiers = !hasModifiers ? cartItemsForProduct[0] : null;

    const isTracked = product.trackStock !== false;
    const availableStock = product.stock ?? 0;
    const isOutOfStock = isTracked && availableStock <= 0;
    const isLowStock = isTracked && availableStock > 0 && availableStock <= 5;

    const handleProductClick = () => {
      if (isOutOfStock) {
        toast.error(`Maaf, stok ${product.name} sedang habis`);
        return;
      }

      if (hasModifiers) {
        setSelectedProductForModal(product);
        setIsModalOpen(true);
      } else {
        if (isTracked && qty >= availableStock) {
          toast.error(`Stok tidak mencukupi (tersedia ${availableStock})`);
          return;
        }

        if (!cartItemWithoutModifiers) {
          addItem({
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            imageUrl: product.imageUrl
          });
          toast.success(`${product.name} ditambahkan`);
        } else {
          updateQuantity(cartItemWithoutModifiers.cartItemId, cartItemWithoutModifiers.quantity + 1);
          toast.success(`${product.name} ditambah`);
        }
      }
    };

    const handleIncrease = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!cartItemWithoutModifiers) return;
      if (isTracked && cartItemWithoutModifiers.quantity >= availableStock) {
        toast.error(`Maksimal stok tercapai (${availableStock})`);
        return;
      }
      updateQuantity(cartItemWithoutModifiers.cartItemId, cartItemWithoutModifiers.quantity + 1);
    };

    const handleDecrease = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!cartItemWithoutModifiers) return;
      updateQuantity(cartItemWithoutModifiers.cartItemId, cartItemWithoutModifiers.quantity - 1);
    };

    // Card variant 1: Best Seller Card (Grid showcase)
    if (isBestSellerVariant) {
      return (
        <div 
          key={product.id} 
          onClick={handleProductClick}
          className={`group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-100/90 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col justify-between ${isOutOfStock ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}`}
        >
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
            <span className="bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 tracking-wider uppercase">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>Favorit</span>
            </span>
            {isOutOfStock ? (
              <span className="bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                Habis
              </span>
            ) : isLowStock ? (
              <span className="bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                Sisa {availableStock}
              </span>
            ) : null}
          </div>

          <div className="relative bg-slate-50 dark:bg-slate-800/60 w-full aspect-[4/3] overflow-hidden">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale' : ''}`}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800/40">
                <Sparkles className="w-6 h-6 mb-1 opacity-60" />
                <span className="text-[11px] font-medium text-slate-400">Pilihan Spesial</span>
              </div>
            )}
          </div>

          <div className="flex flex-col flex-1 justify-between p-3.5 sm:p-4 space-y-3">
            <div>
              <h4 className="font-semibold text-sm leading-snug text-slate-800 dark:text-slate-100 line-clamp-2">
                {product.name}
              </h4>
              <div className="font-bold text-base text-catalog-primary mt-1 tracking-tight">
                {formatCurrency(Number(product.price))}
              </div>
            </div>
            
            <div className="pt-1">
              {isOutOfStock ? (
                <div className="w-full text-xs h-9 font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  Stok Habis
                </div>
              ) : !hasModifiers && cartItemWithoutModifiers ? (
                <div 
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200/80 dark:border-slate-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={handleDecrease}
                    className="h-7 w-7 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-100 active:scale-90 transition-all"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-bold text-sm w-7 text-center">{cartItemWithoutModifiers.quantity}</span>
                  <button 
                    onClick={handleIncrease}
                    className="h-7 w-7 flex items-center justify-center rounded-lg bg-catalog-primary text-white shadow-sm hover:opacity-90 active:scale-90 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button 
                  className="w-full text-xs h-9 font-semibold rounded-xl bg-catalog-primary text-white shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick();
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {qty > 0 && hasModifiers ? `Tambah (${qty})` : 'Tambah'}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Card variant 2: Minimalist Modern Category Card
    return (
      <div 
        key={product.id}
        onClick={handleProductClick}
        className={`group bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all duration-300 overflow-hidden flex ${horizontal ? 'flex-row' : 'flex-col'} ${isOutOfStock ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}`}
      >
        <div className={`relative bg-slate-50 dark:bg-slate-800/60 overflow-hidden ${horizontal ? 'w-28 sm:w-36 aspect-square shrink-0' : 'w-full aspect-[4/3]'}`}>
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale' : ''}`} 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800/30">
              <Sparkles className="w-5 h-5 opacity-40 mb-1" />
              <span className="text-[10px] text-slate-400 font-medium">Menu</span>
            </div>
          )}

          {/* Floating Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            {product.isFeatured && (
              <span className="bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Favorit
              </span>
            )}
            {isOutOfStock ? (
              <span className="bg-rose-500/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                Habis
              </span>
            ) : isLowStock ? (
              <span className="bg-amber-500/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                Sisa {availableStock}
              </span>
            ) : null}
          </div>
        </div>

        <div className={`flex flex-col justify-between p-3 sm:p-4 flex-1`}>
          <div>
            <h4 className="font-semibold text-sm leading-snug text-slate-800 dark:text-slate-100 line-clamp-2">
              {product.name}
            </h4>
            <div className="font-bold text-catalog-primary text-sm sm:text-base mt-1 tracking-tight">
              {formatCurrency(Number(product.price))}
            </div>
          </div>
          
          <div className="mt-3">
            {isOutOfStock ? (
              <div className="w-full text-xs h-8 sm:h-9 font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                Stok Habis
              </div>
            ) : !hasModifiers && cartItemWithoutModifiers ? (
              <div 
                className="inline-flex items-center justify-between w-full bg-slate-50 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200/80 dark:border-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={handleDecrease}
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-100 active:scale-90 transition-all"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="font-bold text-xs sm:text-sm w-7 text-center">{cartItemWithoutModifiers.quantity}</span>
                <button 
                  onClick={handleIncrease}
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-catalog-primary text-white shadow-sm hover:opacity-90 active:scale-90 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button 
                className="w-full text-xs h-8 sm:h-9 font-medium rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-catalog-primary hover:text-white dark:hover:bg-catalog-primary text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 hover:border-catalog-primary transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProductClick();
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                {qty > 0 && hasModifiers ? `Tambah (${qty})` : 'Tambah'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-28">
      {/* Minimalist Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input 
          className="pl-11 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border-slate-200/90 dark:border-slate-800 focus-visible:ring-catalog-primary text-sm transition-all" 
          placeholder="Cari menu favoritmu..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sticky Categories Navigation */}
      {!searchQuery && (
        <div className="sticky top-[64px] z-30 bg-[#f8fafc]/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mx-4 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide border-b border-slate-200/60 dark:border-slate-800/80">
          <div className="flex gap-2">
            {featuredProducts.length > 0 && (
              <button
                onClick={() => scrollToCategory('featured')}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Best Seller
              </button>
            )}
            {allCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-300 hover:border-catalog-primary hover:text-catalog-primary active:scale-95 transition-all"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product Content Sections */}
      <div className="mt-6 space-y-10">
        {searchQuery ? (
          // Search Results
          <div>
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>Hasil Pencarian</span>
              <span className="text-xs font-normal text-slate-400">
                "{searchQuery}"
              </span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
              {allCategories.flatMap(cat => productsByCategory[cat.id] || [])
                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(p => renderProduct(p, false))}
            </div>
          </div>
        ) : (
          <>
            {/* Best Seller Featured Showcase */}
            {featuredProducts.length > 0 && (
              <div 
                id="category-featured" 
                className="scroll-mt-36 rounded-3xl p-4 sm:p-5 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                        Best Seller Kami
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Menu terfavorit dan paling sering dipesan
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    {featuredProducts.length} Menu
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                  {featuredProducts.map(product => renderProduct(product, false, true))}
                </div>
              </div>
            )}

            {/* Regular Categories */}
            {allCategories.map(cat => {
              const catProducts = productsByCategory[cat.id];
              if (!catProducts || catProducts.length === 0) return null;

              return (
                <div key={cat.id} id={`category-${cat.id}`} className="scroll-mt-36">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                      {cat.name}
                    </h3>
                    <span className="text-xs font-normal text-slate-400">
                      {catProducts.length} menu
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {catProducts.map(p => renderProduct(p, true))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Floating Modern Cart Button */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 z-40 md:bg-none md:pointer-events-none">
          <div className="max-w-xl mx-auto md:flex md:justify-end md:pointer-events-auto">
            <Link href={`/store/${tenantSlug}/checkout`} className="block w-full md:w-auto">
              <div className="bg-catalog-primary text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.18)] hover:opacity-95 transition-all active:scale-[0.98] md:min-w-[340px]">
                <div className="flex items-center gap-3">
                  <div className="relative bg-white/20 p-2 rounded-xl">
                    <ShoppingBag className="h-5 w-5" />
                    <span className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                      {getTotalItems()}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-white/80 font-medium">{getTotalItems()} Menu Dipilih</div>
                    <div className="font-bold text-base tracking-tight">{formatCurrency(getTotalPrice())}</div>
                  </div>
                </div>
                <div className="bg-white text-catalog-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-slate-50">
                  Lanjut <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Customization Modal */}
      <CustomizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProductForModal}
        allModifierGroups={modifierGroups || []}
        onAddToCart={(product, modifiers, notes, qty) => {
          let extraPrice = 0;
          modifiers.forEach(m => extraPrice += Number(m.price));
          addItem({
            productId: product.id,
            name: product.name,
            price: Number(product.price) + extraPrice,
            imageUrl: product.imageUrl,
            modifiers,
            notes
          }, qty);
          toast.success(`${product.name} ditambahkan`);
        }}
      />
    </div>
  );
}
