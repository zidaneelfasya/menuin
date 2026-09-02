"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { Search, ShoppingBag, Plus, Minus, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/format";

type Product = {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
  isFeatured: boolean | null;
  categoryId: string | null;
};

type CatalogProductListProps = {
  productsByCategory: Record<string, Product[]>;
  categories: { id: string; name: string }[];
  featuredProducts: Product[];
  tenantSlug: string;
};

export function CatalogProductList({ productsByCategory, categories, featuredProducts, tenantSlug }: CatalogProductListProps) {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");
  
  const { setTenant, setTableNumber, items, addItem, updateQuantity, getTotalItems, getTotalPrice } = useCartStore();
  const [searchQuery, setSearchQuery] = useState("");

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
    const cartItem = items.find(i => i.id === product.id);
    const qty = cartItem?.quantity || 0;

    if (isBestSellerVariant) {
      return (
        <div 
          key={product.id} 
          className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
        >
          {/* Top Badge */}
          <div className="absolute top-2.5 left-2.5 z-10 bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-sm tracking-wider uppercase">
            <Star className="w-3 h-3 fill-current text-amber-400" />
            <span>Best Seller</span>
          </div>

          <div className="relative bg-slate-100 dark:bg-slate-800 w-full aspect-[4/3] overflow-hidden">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs font-medium">Menu Pilihan</span>
              </div>
            )}
          </div>

          <div className="flex flex-col flex-1 justify-between p-3.5 space-y-3">
            <div>
              <h4 className="font-semibold text-sm leading-snug text-slate-800 dark:text-slate-100 line-clamp-2">
                {product.name}
              </h4>
              <div className="font-bold text-base text-catalog-primary mt-1">
                {formatCurrency(Number(product.price))}
              </div>
            </div>
            
            <div className="pt-1">
              {qty > 0 ? (
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl p-1 border">
                  <button 
                    onClick={() => updateQuantity(product.id, qty - 1)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-100 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-bold text-sm w-8 text-center">{qty}</span>
                  <button 
                    onClick={() => updateQuantity(product.id, qty + 1)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-catalog-primary text-white shadow-sm hover:opacity-90 transition-opacity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button 
                  className="w-full text-xs h-9 font-semibold rounded-xl bg-catalog-primary text-white shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1"
                  onClick={() => addItem({
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    imageUrl: product.imageUrl
                  })}
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        key={product.id} 
        className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex ${horizontal ? 'flex-row' : 'flex-col'}`}
      >
        <div className={`relative bg-slate-100 dark:bg-slate-800 ${horizontal ? 'w-1/3 aspect-square' : 'w-full aspect-[4/3]'}`}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800">
              <span className="text-xs">No Image</span>
            </div>
          )}
          {product.isFeatured && (
            <div className="absolute top-2 left-2 bg-slate-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <Star className="w-3 h-3 fill-current text-amber-400" /> Best Seller
            </div>
          )}
        </div>
        <div className={`flex flex-col justify-between p-3.5 ${horizontal ? 'w-2/3' : 'w-full'}`}>
          <div>
            <h4 className="font-semibold text-sm leading-tight text-slate-800 dark:text-slate-100 line-clamp-2">{product.name}</h4>
            <div className="font-bold text-catalog-primary text-sm mt-1 mb-2">
              {formatCurrency(Number(product.price))}
            </div>
          </div>
          
          <div className="mt-auto">
            {qty > 0 ? (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg p-1 border">
                <button 
                  onClick={() => updateQuantity(product.id, qty - 1)}
                  className="h-8 w-8 flex items-center justify-center rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-semibold text-sm w-8 text-center">{qty}</span>
                <button 
                  onClick={() => updateQuantity(product.id, qty + 1)}
                  className="h-8 w-8 flex items-center justify-center rounded-md bg-catalog-primary text-white shadow-sm hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button 
                className="w-full text-xs h-9 font-semibold rounded-xl bg-white dark:bg-slate-800 border-2 border-catalog-primary text-catalog-primary hover:bg-catalog-primary hover:text-white transition-colors"
                onClick={() => addItem({
                  id: product.id,
                  name: product.name,
                  price: Number(product.price),
                  imageUrl: product.imageUrl
                })}
              >
                Tambah
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24">
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
        <Input 
          className="pl-11 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 focus-visible:ring-catalog-primary text-sm" 
          placeholder="Cari makanan atau minuman..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories Navigation */}
      {!searchQuery && (
        <div className="sticky top-[64px] z-30 bg-[#f8fafc]/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mx-4 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide shadow-sm border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex gap-2">
            {featuredProducts.length > 0 && (
              <button
                onClick={() => scrollToCategory('featured')}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-slate-900 text-white shadow-sm flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
              >
                <Star className="w-3.5 h-3.5 fill-current text-amber-400" /> Best Seller Kami
              </button>
            )}
            {allCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-300 hover:border-catalog-primary transition-colors"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mt-6 space-y-10">
        {searchQuery ? (
          // Search Results
          <div>
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Hasil Pencarian</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allCategories.flatMap(cat => productsByCategory[cat.id] || [])
                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(p => renderProduct(p))}
            </div>
          </div>
        ) : (
          <>
            {/* Dedicated Best Seller Kami Showcase */}
            {featuredProducts.length > 0 && (
              <div 
                id="category-featured" 
                className="scroll-mt-36 rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-current text-amber-500" />
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
                  <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 flex items-center justify-between">
                    <span>{cat.name}</span>
                    <span className="text-xs font-normal text-slate-400">{catProducts.length} menu</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {catProducts.map(p => renderProduct(p, true))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Floating Cart Button */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 z-40 md:bg-none md:pointer-events-none">
          <div className="max-w-2xl mx-auto md:flex md:justify-end md:pointer-events-auto">
            <Link href={`/store/${tenantSlug}/checkout`} className="block w-full md:w-auto">
              <div className="bg-catalog-primary text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-xl hover:opacity-95 transition-transform active:scale-95 md:min-w-[340px]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ShoppingBag className="h-6 w-6" />
                    <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm">
                      {getTotalItems()}
                    </span>
                  </div>
                  <span className="font-medium text-sm">{getTotalItems()} Pesanan</span>
                </div>
                <div className="font-bold text-base flex items-center gap-2">
                  {formatCurrency(getTotalPrice())}
                  <span className="bg-white/20 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1">
                    Pesan <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
