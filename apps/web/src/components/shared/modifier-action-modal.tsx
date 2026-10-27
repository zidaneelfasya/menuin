'use client';

import * as React from 'react';
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { formatCurrency } from '@/lib/utils/format';
import { Plus, Minus, X, FileText, Pencil } from 'lucide-react';
import { CartItem } from '@/lib/store/cart';
import { Product } from './product-detail-sheet';

export type { Product };

export interface ModifierActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  cartItemsForProduct: CartItem[];
  primaryColor?: string;
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onEditVariation: (item: CartItem) => void;
  onMakeAnother: (product: Product) => void;
}

export function ModifierActionModal({
  isOpen,
  onClose,
  product,
  cartItemsForProduct,
  primaryColor,
  onUpdateQuantity,
  onEditVariation,
  onMakeAnother,
}: ModifierActionModalProps) {
  if (!product) return null;
  const themeColor = primaryColor || "var(--catalog-primary, #0e59f9)";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          data-slot="modifier-action-modal"
          style={{
            "--outlet-primary": primaryColor || "var(--catalog-primary, #0e59f9)",
          } as React.CSSProperties}
          className="fixed bottom-0 left-0 right-0 z-50 w-full sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md rounded-t-[28px] sm:rounded-t-[32px] rounded-b-none p-0 m-0 flex flex-col bg-white shadow-2xl overflow-hidden outline-none border-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300"
        >
          <DialogTitle className="sr-only">Pilihan {product.name}</DialogTitle>

          {/* 1. Header: Product Name + Close Button */}
          <div className="px-5 py-4 border-b border-gray-150 flex items-center justify-between gap-3 bg-white">
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 tracking-tight truncate">
              {product.name}
            </h3>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/90 shadow-sm-md flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Tutup"
            >
              <X className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>

          {/* 2. Variations List Body (matching Screenshot) */}
          <div className="p-5 max-h-[60vh] overflow-y-auto overscroll-contain">
            {cartItemsForProduct.map((item, idx) => {
              const modSummary = item.modifiers && item.modifiers.length > 0
                ? item.modifiers.map((m: any) => m.name).join(', ')
                : 'Standar';

              return (
                <div key={item.cartItemId}>
                  {idx > 0 && (
                    <div className="border-b border-dashed border-gray-200 my-4" />
                  )}

                  <div className="space-y-1.5">
                    {/* Top Row: Quantity x Modifier Name + Edit Button */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm sm:text-base font-semibold text-gray-900 leading-snug">
                        x{item.quantity} {modSummary}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEditVariation(item);
                        }}
                        className="px-3 py-1 rounded-full bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/90 text-xs font-semibold shadow-sm-md flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5 stroke-[2.2]" />
                        <span>Edit</span>
                      </button>
                    </div>

                    {/* Notes Row */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <FileText className="w-3.5 h-3.5 shrink-0 stroke-[1.8]" />
                      <span className="truncate">{item.notes ? item.notes : 'No notes yet'}</span>
                    </div>

                    {/* Bottom Row: Item Total Price + Quantity Stepper */}
                    <div className="flex items-center justify-between pt-1.5">
                      <span className="text-sm sm:text-base font-semibold text-gray-900 font-sans font-numeric tabular-nums">
                        {formatCurrency(item.price * item.quantity)}
                      </span>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            const newQty = item.quantity - 1;
                            onUpdateQuantity(item.cartItemId, newQty);
                            if (cartItemsForProduct.length <= 1 && newQty <= 0) {
                              onClose();
                            }
                          }}
                          className="w-7 h-7 rounded-full bg-white text-slate-900 hover:bg-slate-50 border border-slate-700 shadow-sm-md flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                          aria-label={`Kurangi variasi ${idx + 1}`}
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.2] text-slate-700" />
                        </button>

                        <span className="min-w-[20px] text-center font-semibold text-sm sm:text-base text-gray-900 font-numeric tabular-nums">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            onUpdateQuantity(item.cartItemId, item.quantity + 1);
                          }}
                          className="w-7 h-7 rounded-full bg-catalog-primary hover:bg-catalog-primary/90 text-white shadow-sm-md flex items-center justify-center active:scale-90 transition-all cursor-pointer border-none"
                          style={{ backgroundColor: themeColor }}
                          aria-label={`Tambah variasi ${idx + 1}`}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Bottom Sticky Bar: "Make another" Button (Menuin Large Pill Button with shadow-md) */}
          <div className="p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-150 bg-white">
            <button
              type="button"
              onClick={() => {
                onClose();
                onMakeAnother(product);
              }}
              className="w-full h-12 rounded-full bg-catalog-primary hover:bg-catalog-primary/90 text-white font-semibold text-sm sm:text-base shadow-md active:scale-[0.99] flex items-center justify-center transition-all cursor-pointer"
              style={{ backgroundColor: themeColor }}
            >
              Make another
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
