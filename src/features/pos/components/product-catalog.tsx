'use client';

import * as React from 'react';
import { Plus, Search } from 'lucide-react';
import { useCartStore } from '../stores/use-cart-store';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format';
import { Input } from '@/components/ui/input';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { toast } from 'sonner';

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
  status: string;
};

export function ProductCatalog({ 
  products, 
  categories 
}: { 
  products: Product[], 
  categories: Category[] 
}) {
  const [activeCategory, setActiveCategory] = React.useState('Semua');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [visibleCount, setVisibleCount] = React.useState(40);
  const addItem = useCartStore((state) => state.addItem);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const observerTarget = React.useRef<HTMLDivElement>(null);

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
      const matchedProduct = products.find(p => p.barcode === barcode || p.sku === barcode);
      if (matchedProduct && matchedProduct.stock > 0) {
        addItem({ 
          productId: matchedProduct.id, 
          name: matchedProduct.name, 
          price: parseFloat(matchedProduct.price), 
        });
        toast.success(`Berhasil menambahkan ${matchedProduct.name}`);
        setSearchQuery(''); // clear if it typed into the input
      } else {
        toast.error(`Produk dengan barcode ${barcode} tidak ditemukan atau stok habis.`);
      }
    }
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      // Manual search exact match
      const matchedProduct = products.find(p => p.barcode === searchQuery.trim() || p.sku === searchQuery.trim());
      if (matchedProduct && matchedProduct.stock > 0) {
        addItem({ 
          productId: matchedProduct.id, 
          name: matchedProduct.name, 
          price: parseFloat(matchedProduct.price), 
        });
        setSearchQuery('');
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'Semua' || p.categoryName === activeCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search and Scanner Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          ref={searchInputRef}
          placeholder="Cari produk atau scan barcode..." 
          className="pl-9 bg-card border-border rounded-xl h-11"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      {/* Categories */}
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
          {filteredProducts.slice(0, visibleCount).map(product => (
            <div 
              key={product.id} 
              className={cn(
                "bg-card border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/50 transition-all flex flex-col",
                product.stock > 0 ? "cursor-pointer group" : "opacity-50 cursor-not-allowed"
              )}
              onClick={() => {
                if (product.stock > 0) {
                  addItem({ 
                    productId: product.id, 
                    name: product.name, 
                    price: parseFloat(product.price), 
                  });
                }
              }}
            >
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
                <div className="text-xs text-muted-foreground mb-2">Stok: {product.stock}</div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-primary font-bold text-sm">{formatCurrency(parseFloat(product.price))}</span>
                  {product.stock > 0 && (
                    <button className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
    </div>
  );
}
