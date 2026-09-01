"use client";

import { useEffect, useState, useMemo } from "react";
import { useCartStore } from "@/lib/store/cart";
import { Search, ShoppingBag, Plus, Minus, Flame } from "lucide-react";
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
  imageUrl: string | null;
  isFeatured: boolean | null;
  categoryId: string | null;
  modifierGroupIds?: string[];
};

type CatalogProductListProps = {
  productsByCategory: Record<string, Product[]>;
  categories: { id: string; name: string }[];
  featuredProducts: Product[];
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

  const renderProduct = (product: Product, horizontal: boolean = false) => {
    const hasModifiers = product.modifierGroupIds && product.modifierGroupIds.length > 0;
    const cartItemsForProduct = items.filter(i => i.productId === product.id);
    const qty = cartItemsForProduct.reduce((sum, item) => sum + item.quantity, 0);
    // If it has modifiers, we just show "Tambah". If it doesn't, we can show Plus/Minus for the single cart item.
    const cartItemWithoutModifiers = !hasModifiers ? cartItemsForProduct[0] : null;

    return (
      <div 
        key={product.id} 
        className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex ${horizontal ? 'flex-row' : 'flex-col'}`}
      >
        <div className={`relative bg-gray-100 ${horizontal ? 'w-1/3 aspect-square' : 'w-full aspect-[4/3]'}`}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
              <span className="text-xs">No Image</span>
            </div>
          )}
        </div>
        <div className={`flex flex-col justify-between p-3 ${horizontal ? 'w-2/3' : 'w-full'}`}>
          <div>
            <h4 className="font-semibold text-sm leading-tight text-gray-800 line-clamp-2">{product.name}</h4>
            <div className="font-bold text-catalog-primary text-sm mt-1 mb-2">
              {formatCurrency(Number(product.price))}
            </div>
          </div>
          
          <div className="mt-auto">
            {!hasModifiers && cartItemWithoutModifiers ? (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1 border">
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
                onClick={() => {
                  if (hasModifiers) {
                    setSelectedProductForModal(product);
                    setIsModalOpen(true);
                  } else {
                    addItem({
                      productId: product.id,
                      name: product.name,
                      price: Number(product.price),
                      imageUrl: product.imageUrl
                    });
                    toast.success(`${product.name} ditambahkan`);
                  }
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
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input 
          className="pl-10 h-12 bg-white rounded-xl shadow-sm border-gray-200 focus-visible:ring-catalog-primary" 
          placeholder="Cari makanan atau minuman..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories Navigation */}
      {!searchQuery && (
        <div className="sticky top-[64px] z-30 bg-[#f8fafc]/95 backdrop-blur-md py-3 -mx-4 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide shadow-sm border-b">
          <div className="flex gap-2">
            {featuredProducts.length > 0 && (
              <button
                onClick={() => scrollToCategory('featured')}
                className="px-4 py-2 rounded-full text-sm font-semibold bg-white border shadow-sm text-gray-700 flex items-center gap-1.5 hover:border-catalog-primary"
              >
                <Flame className="w-4 h-4 text-orange-500" /> Rekomendasi
              </button>
            )}
            {allCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white border shadow-sm text-gray-700 hover:border-catalog-primary transition-colors"
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
            <h3 className="font-bold text-lg mb-4 text-gray-800">Hasil Pencarian</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allCategories.flatMap(cat => productsByCategory[cat.id] || [])
                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(p => renderProduct(p))}
            </div>
          </div>
        ) : (
          <>
            {/* Featured Section */}
            {featuredProducts.length > 0 && (
              <div id="category-featured" className="scroll-mt-36">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-800">
                  <Flame className="w-6 h-6 text-orange-500" /> Spesial Untukmu
                </h3>
                <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-4 snap-x snap-mandatory scrollbar-hide">
                  {featuredProducts.map(product => (
                    <div key={product.id} className="min-w-[200px] w-[200px] snap-center">
                      {renderProduct(product)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Categories */}
            {allCategories.map(cat => {
              const catProducts = productsByCategory[cat.id];
              if (!catProducts || catProducts.length === 0) return null;

              return (
                <div key={cat.id} id={`category-${cat.id}`} className="scroll-mt-36">
                  <h3 className="font-bold text-xl mb-4 text-gray-800">{cat.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent z-40 md:bg-none md:pointer-events-none">
          <div className="max-w-2xl mx-auto md:flex md:justify-end md:pointer-events-auto">
            <Link href={`/checkout`} className="block w-full md:w-auto">
              <div className="bg-catalog-primary text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-2xl hover:bg-catalog-primary/90 transition-transform active:scale-95 md:min-w-[340px]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ShoppingBag className="h-6 w-6" />
                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm">
                      {getTotalItems()}
                    </span>
                  </div>
                  <span className="font-medium text-sm">{getTotalItems()} Pesanan</span>
                </div>
                <div className="font-bold text-lg flex items-center gap-2">
                  {formatCurrency(getTotalPrice())}
                  <span className="bg-white/20 px-2 py-1 rounded-lg text-xs">Pesan ➔</span>
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
    </div>
  );
}
