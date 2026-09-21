"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { Search, ShoppingBag, Plus, Minus, Star, ArrowRight, Info } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/format";
import { CustomizationModal } from '@/components/shared/customization-modal';
import { ProductDetailModal } from '@/components/shared/product-detail-modal';
import { toast } from 'sonner';

type Product = {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
  description?: string | null;
  isFeatured: boolean | null;
  categoryId: string | null;
  modifierGroupIds?: string[];
};

type CatalogProductListProps = {
  productsByCategory: Record<string, Product[]>;
  categories: { id: string; name: string }[];
  featuredProducts: Product[];
  tenantSlug: string;
  modifierGroups?: any[];
};

export function CatalogProductList({ productsByCategory, categories, featuredProducts, tenantSlug, modifierGroups = [] }: CatalogProductListProps) {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");
  
  const { setTenant, setTableNumber, items, addItem, updateQuantity, getTotalItems, getTotalPrice } = useCartStore();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleOpenDetail = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setSelectedProductForDetail(product);
    setIsDetailModalOpen(true);
  };

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
      const y = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const renderProduct = (product: Product, horizontal: boolean = false, isBestSellerVariant: boolean = false) => {
    const hasModifiers = product.modifierGroupIds && product.modifierGroupIds.length > 0;
    const cartItemsForProduct = items.filter(i => i.productId === product.id);
    const qty = cartItemsForProduct.reduce((sum, item) => sum + item.quantity, 0);
    // If it has modifiers, we just show "Tambah". If it doesn't, we can show Plus/Minus for the single cart item.
    const cartItemWithoutModifiers = !hasModifiers ? cartItemsForProduct[0] : null;

    const handleProductClick = () => {
      if (hasModifiers) {
        setSelectedProductForModal(product);
        setIsModalOpen(true);
      } else {
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

    if (isBestSellerVariant) {
      return (
        <div 
          key={product.id} 
          onClick={handleProductClick}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer"
        >
          {/* Top Badge */}
          <div className="absolute top-2.5 left-2.5 z-10 bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-sm tracking-wider uppercase">
            <Star className="w-3 h-3 fill-current text-amber-400" />
            <span>Best Seller</span>
          </div>

          {/* Subtle Round Detail Button */}
          <button
            type="button"
            onClick={(e) => handleOpenDetail(e, product)}
            className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/35 hover:bg-black/55 text-white/95 backdrop-blur-md flex items-center justify-center shadow-xs transition-all active:scale-90 border border-white/20 cursor-pointer"
            title={`Lihat detail ${product.name}`}
            aria-label={`Lihat detail ${product.name}`}
          >
            <Info className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

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
              {!hasModifiers && cartItemWithoutModifiers ? (
                <div 
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl p-1 border"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => updateQuantity(cartItemWithoutModifiers.cartItemId, cartItemWithoutModifiers.quantity - 1)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-100 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-bold text-sm w-8 text-center">{cartItemWithoutModifiers.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(cartItemWithoutModifiers.cartItemId, cartItemWithoutModifiers.quantity + 1)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-catalog-primary text-white shadow-sm hover:opacity-90 transition-opacity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button 
                  className="w-full text-xs h-9 font-semibold rounded-xl bg-catalog-primary text-white shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick();
                  }}
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
        onClick={handleProductClick}
        className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex cursor-pointer ${horizontal ? 'flex-row' : 'flex-col'}`}
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

          {/* Subtle Round Detail Button */}
          <button
            type="button"
            onClick={(e) => handleOpenDetail(e, product)}
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/35 hover:bg-black/55 text-white/95 backdrop-blur-md flex items-center justify-center shadow-xs transition-all active:scale-90 border border-white/20 cursor-pointer"
            title={`Lihat detail ${product.name}`}
            aria-label={`Lihat detail ${product.name}`}
          >
            <Info className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
        <div className={`flex flex-col justify-between p-3.5 ${horizontal ? 'w-2/3' : 'w-full'}`}>
          <div>
            <h4 className="font-semibold text-sm leading-tight text-slate-800 dark:text-slate-100 line-clamp-2">{product.name}</h4>
            <div className="font-bold text-catalog-primary text-sm mt-1 mb-2">
              {formatCurrency(Number(product.price))}
            </div>
          </div>
          
          <div className="mt-auto">
            {!hasModifiers && cartItemWithoutModifiers ? (
              <div 
                className="flex items-center justify-between bg-gray-50 rounded-lg p-1 border"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => updateQuantity(cartItemWithoutModifiers.cartItemId, cartItemWithoutModifiers.quantity - 1)}
                  className="h-8 w-8 flex items-center justify-center rounded-md bg-white text-catalog-primary shadow-sm hover:bg-gray-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-semibold text-sm w-8 text-center">{cartItemWithoutModifiers.quantity}</span>
                <button 
                  onClick={() => updateQuantity(cartItemWithoutModifiers.cartItemId, cartItemWithoutModifiers.quantity + 1)}
                  className="h-8 w-8 flex items-center justify-center rounded-md bg-catalog-primary text-white shadow-sm hover:bg-catalog-primary/90"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button 
                className="w-full text-xs h-9 font-medium rounded-lg bg-white border-2 border-catalog-primary text-catalog-primary hover:bg-catalog-primary hover:text-white transition-colors flex items-center justify-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProductClick();
                }}
              >
                {qty > 0 && hasModifiers ? `Tambah Lagi (${qty})` : 'Tambah'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24">
      {/* Sticky Combined Header: Search Bar + Categories Navigation */}
      <div className="sticky top-0 z-30 bg-[#f8fafc]/95 dark:bg-slate-950/95 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 border-b border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5 transition-all">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input 
            className="pl-10 pr-9 h-11 bg-white dark:bg-slate-900 rounded-xl shadow-xs border-slate-200 dark:border-slate-800 focus-visible:ring-catalog-primary text-sm placeholder:text-slate-400" 
            placeholder="Cari makanan atau minuman..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories Navigation */}
        {!searchQuery && (
          <div className="overflow-x-auto whitespace-nowrap scrollbar-hide -mx-1 px-1">
            <div className="flex gap-2">
              {featuredProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => scrollToCategory('featured')}
                  className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-slate-900 text-white shadow-xs flex items-center gap-1.5 hover:bg-slate-800 transition-colors shrink-0"
                >
                  <Star className="w-3.5 h-3.5 fill-current text-amber-400" /> Best Seller Kami
                </button>
              )}
              {allCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => scrollToCategory(cat.id)}
                  className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-slate-700 dark:text-slate-300 hover:border-catalog-primary transition-colors shrink-0"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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
                className="scroll-mt-28 rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm"
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
                <div key={cat.id} id={`category-${cat.id}`} className="scroll-mt-28">
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

      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        product={selectedProductForDetail ? {
          ...selectedProductForDetail,
          categoryName: categories.find(c => c.id === selectedProductForDetail.categoryId)?.name || null
        } : null}
        onAddToCart={(product) => {
          addItem({
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            imageUrl: product.imageUrl,
          });
          toast.success(`${product.name} ditambahkan`);
        }}
        onCustomize={(product) => {
          const originalProduct = selectedProductForDetail;
          if (originalProduct) {
            setSelectedProductForModal(originalProduct);
            setIsModalOpen(true);
          }
        }}
      />
    </div>
  );
}
