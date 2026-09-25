'use client';

import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Minus, X, Trash2, Sparkles } from 'lucide-react';
import { CartItem } from '@/lib/store/cart';
import { Product } from './product-detail-sheet';

export type { Product };

export interface ModifierDecreaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  cartItemsForProduct: CartItem[];
  primaryColor?: string;
  onDecreaseVariation: (cartItemId: string) => void;
}

export function ModifierDecreaseModal({
  isOpen,
  onClose,
  product,
  cartItemsForProduct,
  primaryColor,
  onDecreaseVariation,
}: ModifierDecreaseModalProps) {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        style={{
          "--outlet-primary": primaryColor || "var(--catalog-primary, #f43f5e)",
        } as React.CSSProperties}
        className="fixed bottom-0 top-auto left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full max-w-full sm:max-w-md rounded-t-[28px] sm:rounded-3xl p-0 flex flex-col bg-white border-t sm:border border-gray-150 shadow-2xl overflow-hidden z-50 focus:outline-hidden"
      >
        {/* Mobile Swipe Handle Indicator */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" aria-hidden="true" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100 relative">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Sparkles className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 leading-snug truncate uppercase">
                Kurangi {product.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Pilih variasi yang ingin dikurangi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Variations List */}
        <div className="p-4 sm:p-5 space-y-2.5 max-h-[70vh] overflow-y-auto overscroll-contain">
          {cartItemsForProduct.map((item, idx) => {
            const modSummary = item.modifiers && item.modifiers.length > 0
              ? item.modifiers.map((m: any) => m.name).join(', ')
              : 'Standar';

            return (
              <div
                key={item.cartItemId}
                className="p-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50/70 transition-all flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-900">
                      Variasi {idx + 1}: {modSummary}
                    </span>
                    <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                      x{item.quantity}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-[11px] text-gray-500 italic mt-0.5 truncate">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onDecreaseVariation(item.cartItemId);
                    if (cartItemsForProduct.length <= 1 && item.quantity <= 1) {
                      onClose();
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 border border-gray-200 hover:border-red-200"
                  aria-label={`Kurangi variasi ${idx + 1}`}
                >
                  {item.quantity <= 1 ? (
                    <>
                      <Trash2 className="w-3.5 h-3.5 text-red-500 stroke-[2.5]" />
                      <span className="text-red-600">Hapus</span>
                    </>
                  ) : (
                    <>
                      <Minus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Kurangi (-1)</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
