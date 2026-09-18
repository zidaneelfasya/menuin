'use client';

import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils/format';
import { X, Star, Sparkles, Plus, SlidersHorizontal } from 'lucide-react';

export type ProductDetail = {
  id: string;
  name: string;
  price: string | number;
  imageUrl?: string | null;
  description?: string | null;
  categoryName?: string | null;
  isFeatured?: boolean | null;
  modifierGroupIds?: string[];
};

export interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductDetail | null;
  primaryColor?: string;
  onAddToCart?: (product: ProductDetail) => void;
  onCustomize?: (product: ProductDetail) => void;
}

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
  primaryColor,
  onAddToCart,
  onCustomize,
}: ProductDetailModalProps) {
  if (!product) return null;

  const hasModifiers = Boolean(product.modifierGroupIds && product.modifierGroupIds.length > 0);
  const formattedPrice = formatCurrency(Number(product.price));

  const handlePrimaryAction = () => {
    onClose();
    if (hasModifiers && onCustomize) {
      onCustomize(product);
    } else if (onAddToCart) {
      onAddToCart(product);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        style={{
          "--outlet-primary": primaryColor || "var(--catalog-primary, #0E59F9)",
        } as React.CSSProperties}
        className="fixed bottom-0 top-auto left-0 right-0 sm:bottom-auto sm:top-[50%] sm:left-[50%] translate-x-0 translate-y-0 sm:translate-x-[-50%] sm:translate-y-[-50%] w-full max-w-full sm:max-w-md rounded-t-[28px] sm:rounded-2xl max-h-[85vh] p-0 flex flex-col gap-0 bg-white border-t sm:border border-gray-200/90 shadow-2xl overflow-hidden focus:outline-hidden z-50"
      >
        {/* Mobile Swipe Handle Indicator */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" aria-hidden="true" />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Header Image Area */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-slate-100 dark:bg-slate-800 overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800">
                <Sparkles className="w-8 h-8 stroke-[1.5] text-slate-300 mb-1" />
                <span className="text-xs font-medium">Menu Pilihan</span>
              </div>
            )}

            {/* Top Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
              {product.isFeatured && (
                <div className="bg-slate-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-md tracking-wider uppercase">
                  <Star className="w-3 h-3 fill-current text-amber-400" />
                  <span>Best Seller</span>
                </div>
              )}
              {product.categoryName && (
                <div className="bg-white/90 text-slate-800 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md">
                  {product.categoryName}
                </div>
              )}
            </div>

            {/* Floating Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-gray-700 shadow-md backdrop-blur-md flex items-center justify-center transition-all active:scale-90"
              aria-label="Tutup detail item"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Details Body */}
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="font-bold text-lg sm:text-xl text-gray-900 leading-snug">
                {product.name}
              </h3>
              <div
                className="font-black text-lg sm:text-xl mt-1"
                style={{ color: "var(--outlet-primary, #0E59F9)" }}
              >
                {formattedPrice}
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-1.5 pt-1 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Deskripsi Menu
              </h4>
              {product.description && product.description.trim() !== '' ? (
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Belum ada deskripsi khusus untuk item ini. Dibuat dengan bahan-bahan pilihan berkualitas.
                </p>
              )}
            </div>

            {/* Modifier availability note */}
            {hasModifiers && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200/70 text-xs text-gray-600">
                <SlidersHorizontal className="w-4 h-4 text-gray-500 shrink-0" />
                <span>Menu ini dapat disesuaikan dengan pilihan ukuran, suhu, susu, atau topping tambahan.</span>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Action Button */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-150 shadow-lg sticky bottom-0 z-20">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="w-full h-12 sm:h-13 rounded-xl font-bold text-sm sm:text-base text-white shadow-xs transition-all flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99]"
            style={{ backgroundColor: "var(--outlet-primary, #0E59F9)" }}
          >
            {hasModifiers ? (
              <>
                <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
                <span>Pilih Varian &amp; Kustomisasi &bull; {formattedPrice}</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Tambah ke Pesanan &bull; {formattedPrice}</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
