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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          data-slot="modifier-action-modal"
          style={{
            "--outlet-primary": primaryColor || "var(--catalog-primary, #f43f5e)",
          } as React.CSSProperties}
          className="fixed bottom-0 left-0 right-0 z-50 w-full sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md rounded-t-[28px] sm:rounded-t-[32px] rounded-b-none p-0 m-0 flex flex-col bg-white shadow-2xl overflow-hidden outline-none border-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300"
        >
          <DialogTitle className="sr-only">Pilihan {product.name}</DialogTitle>

          {/* 1. Header: Product Name + Close Button */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 bg-white">
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 tracking-tight uppercase truncate">
              {product.name}
            </h3>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Tutup"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
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
                      <span className="text-sm sm:text-base font-semibold text-gray-900 leading-snug uppercase">
                        x{item.quantity} {modSummary}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEditVariation(item);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
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
                      <span className="text-sm sm:text-base font-semibold text-gray-900 font-sans">
                        {formatCurrency(item.price * item.quantity)}
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const newQty = item.quantity - 1;
                            onUpdateQuantity(item.cartItemId, newQty);
                            if (cartItemsForProduct.length <= 1 && newQty <= 0) {
                              onClose();
                            }
                          }}
                          className="w-8 h-8 rounded-full border border-gray-900 flex items-center justify-center text-gray-900 hover:bg-gray-100 active:scale-90 transition-all cursor-pointer"
                          aria-label={`Kurangi variasi ${idx + 1}`}
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>

                        <span className="min-w-[20px] text-center font-semibold text-sm sm:text-base text-gray-900 font-mono">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            onUpdateQuantity(item.cartItemId, item.quantity + 1);
                          }}
                          className="w-8 h-8 rounded-full border border-gray-900 flex items-center justify-center text-gray-900 hover:bg-gray-100 active:scale-90 transition-all cursor-pointer"
                          aria-label={`Tambah variasi ${idx + 1}`}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Bottom Sticky Bar: "Make another" Button */}
          <div className="p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-100 bg-white">
            <button
              type="button"
              onClick={() => {
                onClose();
                onMakeAnother(product);
              }}
              className="w-full h-12 sm:h-13 rounded-xl sm:rounded-2xl text-white font-semibold text-sm sm:text-base shadow-sm hover:opacity-95 active:scale-[0.99] flex items-center justify-center transition-all cursor-pointer"
              style={{
                backgroundColor: "var(--outlet-primary, #f43f5e)",
              }}
            >
              Make another
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
