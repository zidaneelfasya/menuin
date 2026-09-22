'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils/format';
import { X, Plus, Minus, Check, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';

export type Modifier = {
  id: string;
  name: string;
  price: string | number;
  quantity?: number;
  isAvailable?: boolean;
};

export type ModifierGroup = {
  id: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  modifiers: Modifier[];
};

export type Product = {
  id: string;
  name: string;
  price: string | number;
  imageUrl?: string | null;
  description?: string | null;
  categoryName?: string | null;
  isFeatured?: boolean | null;
  categoryId?: string | null;
  modifierGroupIds?: string[];
  totalSold?: number;
};

export interface ProductDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  allModifierGroups: ModifierGroup[];
  primaryColor?: string;
  initialModifiers?: Modifier[];
  initialNotes?: string;
  initialQuantity?: number;
  editingCartItemId?: string | null;
  onAddToCart: (
    product: Product,
    selectedModifiers: Modifier[],
    notes: string,
    quantity: number,
    editingCartItemId?: string | null
  ) => void;
}

export function ProductDetailSheet({
  isOpen,
  onClose,
  product,
  allModifierGroups,
  primaryColor,
  initialModifiers,
  initialNotes = '',
  initialQuantity = 1,
  editingCartItemId = null,
  onAddToCart,
}: ProductDetailSheetProps) {
  // Map of groupId -> { [modifierId]: quantity }
  const [selectedMap, setSelectedMap] = React.useState<Record<string, Record<string, number>>>({});
  const [notes, setNotes] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [limitWarningGroupId, setLimitWarningGroupId] = React.useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = React.useState(false);
  const warningTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Filter groups applicable to this product
  const productGroups = React.useMemo(() => {
    if (!product || !product.modifierGroupIds) return [];
    return allModifierGroups.filter(g => product.modifierGroupIds?.includes(g.id));
  }, [product, allModifierGroups]);

  // Reset or pre-fill state when modal opens
  React.useEffect(() => {
    if (isOpen && product) {
      setNotes(initialNotes || '');
      setQuantity(Math.max(1, initialQuantity || 1));
      setLimitWarningGroupId(null);
      setIsZoomOpen(false);

      if (initialModifiers && initialModifiers.length > 0) {
        const prefilledMap: Record<string, Record<string, number>> = {};
        productGroups.forEach(group => {
          group.modifiers?.forEach(mod => {
            const matches = initialModifiers.filter(m => String(m.id) === String(mod.id));
            if (matches.length > 0) {
              if (!prefilledMap[group.id]) prefilledMap[group.id] = {};
              const qty = matches.reduce((acc, curr) => {
                return acc + (matches.length === 1 && typeof curr.quantity === 'number' ? curr.quantity : 1);
              }, 0);
              prefilledMap[group.id][mod.id] = qty;
            }
          });
        });
        setSelectedMap(prefilledMap);
      } else {
        const initialMap: Record<string, Record<string, number>> = {};
        setSelectedMap(initialMap);
      }
    }
  }, [isOpen, product, initialModifiers, initialNotes, initialQuantity, productGroups]);

  // Calculate extra price from selected modifiers
  const extraPrice = React.useMemo(() => {
    if (!product) return 0;
    let sum = 0;
    productGroups.forEach(group => {
      const groupSelections = selectedMap[group.id] || {};
      group.modifiers?.forEach(mod => {
        const qty = groupSelections[mod.id] || 0;
        if (qty > 0) {
          sum += Number(mod.price) * qty;
        }
      });
    });
    return sum;
  }, [product, productGroups, selectedMap]);

  // Validation: Missing required group
  const missingRequiredGroup = React.useMemo(() => {
    if (!product) return undefined;
    return productGroups.find(group => {
      if (!group.isRequired) return false;
      const groupSelections = selectedMap[group.id] || {};
      const totalCount = Object.values(groupSelections).reduce((a, b) => a + b, 0);
      const minRequired = Math.max(1, group.minSelections || 1);
      return totalCount < minRequired;
    });
  }, [product, productGroups, selectedMap]);

  // Validation: Check if required group has all items out of stock
  const unavailableRequiredGroups = React.useMemo(() => {
    if (!product) return [];
    return productGroups.filter(group => {
      if (!group.isRequired) return false;
      const availableOptions = (group.modifiers || []).filter(m => m.isAvailable !== false);
      return availableOptions.length < Math.max(1, group.minSelections || 1);
    });
  }, [product, productGroups]);

  const isValid = !missingRequiredGroup && unavailableRequiredGroups.length === 0;
  const basePrice = product ? Number(product.price) : 0;
  const grandTotal = (basePrice + extraPrice) * quantity;

  const showMaxLimitWarning = React.useCallback((group: ModifierGroup) => {
    toast.warning(`Maksimal pilihan ${group.name} hanya ${group.maxSelections}`, {
      id: `max-limit-${group.id}`,
    });
    setLimitWarningGroupId(group.id);
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    warningTimeoutRef.current = setTimeout(() => {
      setLimitWarningGroupId(null);
    }, 3000);
  }, []);

  const handleToggleModifier = (group: ModifierGroup, modifier: Modifier) => {
    if (modifier.isAvailable === false) return;
    const isSingleSelect = group.maxSelections === 1;

    if (isSingleSelect) {
      setSelectedMap(prev => {
        const currentGroup = { ...(prev[group.id] || {}) };
        const currentQty = currentGroup[modifier.id] || 0;

        if (currentQty > 0) {
          // Deselect / toggle off and clear the group
          return { ...prev, [group.id]: {} };
        }
        return { ...prev, [group.id]: { [modifier.id]: 1 } };
      });
      return;
    }

    // Multi-Select
    const currentGroup = selectedMap[group.id] || {};
    const currentQty = currentGroup[modifier.id] || 0;
    const currentGroupTotal = Object.values(currentGroup).reduce((a, b) => a + b, 0);

    if (currentQty > 0) {
      // Toggle off
      setSelectedMap(prev => {
        const updated = { ...(prev[group.id] || {}) };
        delete updated[modifier.id];
        return { ...prev, [group.id]: updated };
      });
      return;
    }

    // Check max limit
    if (group.maxSelections && currentGroupTotal >= group.maxSelections) {
      showMaxLimitWarning(group);
      return;
    }

    // Toggle on
    setSelectedMap(prev => ({
      ...prev,
      [group.id]: {
        ...(prev[group.id] || {}),
        [modifier.id]: 1,
      },
    }));
    setLimitWarningGroupId(null);
  };

  const handleAddAction = () => {
    if (!product || !isValid) return;

    const flatSelectedModifiers: Modifier[] = [];
    productGroups.forEach(group => {
      const groupSelections = selectedMap[group.id] || {};
      group.modifiers?.forEach(mod => {
        const qty = groupSelections[mod.id] || 0;
        if (qty > 0) {
          for (let i = 0; i < qty; i++) {
            flatSelectedModifiers.push({
              id: mod.id,
              name: mod.name,
              price: mod.price,
              quantity: 1,
            });
          }
        }
      });
    });

    onAddToCart(product, flatSelectedModifiers, notes, quantity, editingCartItemId);
    onClose();
  };

  if (!product) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            data-slot="dialog-content"
            style={{
              "--outlet-primary": primaryColor || "var(--catalog-primary, #f43f5e)",
            } as React.CSSProperties}
            className="fixed bottom-0 left-0 right-0 z-50 w-full sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md md:max-w-lg h-[90vh] max-h-[92vh] sm:h-[88vh] sm:max-h-[88vh] rounded-t-[28px] sm:rounded-t-[32px] rounded-b-none p-0 m-0 flex flex-col bg-white shadow-2xl overflow-hidden outline-none border-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300"
          >
            <DialogTitle className="sr-only">{product.name}</DialogTitle>

          {/* Scrollable Container (Hero Image + Info + Modifiers + Notes) */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* 1. Hero Image Section (Clean, without decorative badges/emojis) */}
            <div className="relative w-full aspect-[16/11] bg-slate-900 overflow-hidden shrink-0">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-800">
                  <span className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Menu Spesial
                  </span>
                </div>
              )}

              {/* Floating Close Button Top Right (White Circle) */}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-gray-800 shadow-md flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                aria-label="Tutup detail menu"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Floating Zoom Button Bottom Right (White Circle) */}
              {product.imageUrl && (
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="absolute bottom-4 right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-gray-800 shadow-md flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                  aria-label="Perbesar gambar"
                  title="Lihat foto penuh"
                >
                  <Maximize2 className="w-4.5 h-4.5 stroke-[2]" />
                </button>
              )}
            </div>

            {/* 2. Title, Price, and Description */}
            <div className="p-5 sm:p-6 space-y-5">
              <div className="border-b border-gray-150 pb-5">
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight leading-tight uppercase">
                  {product.name}
                </h2>
                <div className="text-lg sm:text-xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(basePrice)}
                </div>
                {product.description && product.description.trim() !== '' && (
                  <p className="text-sm sm:text-[15px] text-gray-500 mt-2 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                )}
              </div>

              {/* 3. Modifier Groups Section (Flat list, NO borders around options, all use animated checkboxes) */}
              {productGroups.length > 0 && (
                <div className="space-y-6 pt-1">
                  {productGroups.map(group => {
                    const isSingleSelect = group.maxSelections === 1;
                    const groupSelections = selectedMap[group.id] || {};
                    const currentGroupTotalQty = Object.values(groupSelections).reduce((a, b) => a + b, 0);
                    const isGroupSatisfied = group.isRequired
                      ? currentGroupTotalQty >= Math.max(1, group.minSelections || 1)
                      : true;

                    return (
                      <div key={group.id} className="space-y-3 pb-5 border-b border-gray-150 last:border-b-0">
                        {/* Group Header */}
                        <div>
                          <h3 className="font-semibold text-base sm:text-lg text-gray-900 uppercase tracking-tight">
                            {group.name}
                          </h3>
                          <p
                            className={`text-xs sm:text-sm mt-0.5 font-medium transition-colors ${
                              group.isRequired
                                ? isGroupSatisfied
                                  ? 'text-gray-500'
                                  : 'text-orange-500'
                                : 'text-gray-500'
                            }`}
                          >
                            {group.isRequired
                              ? group.maxSelections === 1
                                ? 'Must be selected max. 1'
                                : `Must be selected min. ${group.minSelections || 1}, max. ${group.maxSelections}`
                              : group.maxSelections === 1
                              ? 'Opsional (Pilih maks. 1)'
                              : `Opsional (Pilih maks. ${group.maxSelections})`}
                          </p>
                        </div>

                        {/* Flat Modifier Options List (No Card Border) */}
                        <div className="space-y-1 pt-1" role="group" aria-label={group.name}>
                          {group.modifiers?.map(mod => {
                            const isAvailable = mod.isAvailable !== false;
                            const groupSelections = selectedMap[group.id] || {};
                            const selectedQty = groupSelections[mod.id] || 0;
                            const isSelected = selectedQty > 0;
                            const modPrice = Number(mod.price);

                            return (
                              <div
                                key={mod.id}
                                onClick={() => isAvailable && handleToggleModifier(group, mod)}
                                role="checkbox"
                                aria-checked={isSelected}
                                aria-disabled={!isAvailable}
                                tabIndex={isAvailable ? 0 : -1}
                                className={`flex items-center justify-between py-2.5 sm:py-3 cursor-pointer select-none group transition-opacity ${
                                  !isAvailable ? 'opacity-40 cursor-not-allowed' : ''
                                }`}
                              >
                                {/* Left: Option Name & Extra Price */}
                                <div className="flex-1 min-w-0 pr-3">
                                  <span
                                    className={`text-base sm:text-[17px] block leading-snug uppercase ${
                                      !isAvailable
                                        ? 'line-through text-gray-400 font-medium'
                                        : isSelected
                                        ? 'font-semibold text-gray-900'
                                        : 'font-medium text-gray-800 group-hover:text-gray-900'
                                    }`}
                                  >
                                    <span>{mod.name}</span>
                                    {modPrice > 0 && isAvailable && (
                                      <span className="font-semibold text-gray-900 ml-1.5">
                                        (+ {formatCurrency(modPrice)})
                                      </span>
                                    )}
                                    {!isAvailable && (
                                      <span className="text-sm text-red-500 font-semibold ml-1.5">
                                        (Habis)
                                      </span>
                                    )}
                                  </span>
                                </div>

                                {/* Right: Modern Animated Checkbox */}
                                <motion.div
                                  initial={false}
                                  animate={isSelected ? { scale: [0.9, 1.15, 1] } : { scale: 1 }}
                                  transition={{ duration: 0.22, ease: 'easeOut' }}
                                  className={`w-7 h-7 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected
                                      ? 'border-catalog-primary bg-catalog-primary text-white shadow-2xs'
                                      : 'border-gray-300 bg-white group-hover:border-gray-400'
                                  }`}
                                  style={
                                    isSelected
                                      ? {
                                          borderColor: 'var(--catalog-primary, #f43f5e)',
                                          backgroundColor: 'var(--catalog-primary, #f43f5e)',
                                        }
                                      : undefined
                                  }
                                >
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                    >
                                      <Check className="w-4.5 h-4.5 stroke-[3.2]" />
                                    </motion.div>
                                  )}
                                </motion.div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 4. Notes Section */}
              <div className="space-y-2 pt-2 pb-6">
                <div className="flex items-center justify-between">
                  <label htmlFor="sheet-notes" className="text-base font-semibold text-gray-900 uppercase tracking-tight">
                    Notes
                  </label>
                  <span className="text-xs sm:text-sm text-gray-400 font-medium">Optional</span>
                </div>
                <Textarea
                  id="sheet-notes"
                  placeholder="Example: Make my dish delicious!"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[85px] rounded-xl border-gray-200 text-sm sm:text-base focus-visible:ring-catalog-primary placeholder:text-gray-400 resize-none p-3.5"
                />
              </div>
            </div>
          </div>

          {/* 5. Sticky Bottom Bar: Total Order Stepper & Add Orders CTA Button */}
          <div className="bg-white border-t border-gray-150 p-4 sm:p-5 pb-5 sm:pb-6 shadow-lg flex flex-col gap-4 shrink-0 z-20">
            {/* Stepper Row: "Total Order" + [-] [qty] [+] */}
            <div className="flex items-center justify-between">
              <span className="text-lg sm:text-lg font-medium text-gray-900 tracking-tight">
                Total Order
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 sm:w-8 sm:h-8 rounded-full border border-gray-900 flex items-center justify-center text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all cursor-pointer"
                  aria-label="Kurangi jumlah pesanan"
                >
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                </button>
                <span className="min-w-[24px] text-center font-semibold text-base sm:text-lg text-gray-900 font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 sm:w-8 sm:h-8 rounded-full border border-gray-900 flex items-center justify-center text-gray-900 hover:bg-gray-100 active:scale-90 transition-all cursor-pointer"
                  aria-label="Tambah jumlah pesanan"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Validation Message if required modifier is missing */}
            {!isValid && missingRequiredGroup && (
              <p className="text-xs sm:text-sm font-semibold text-orange-500">
                Pilih {missingRequiredGroup.name} terlebih dahulu
              </p>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              disabled={!isValid}
              onClick={handleAddAction}
              className="w-full h-14 sm:h-14 rounded-2xl font-semibold text-base sm:text-lg text-white shadow-sm flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.99] cursor-pointer"
              style={{
                backgroundColor: isValid
                  ? 'var(--catalog-primary, #f43f5e)'
                  : '#9ca3af',
              }}
            >
              <span>
                {editingCartItemId ? 'Simpan Perubahan' : 'Add Orders'} - {formatCurrency(grandTotal)}
              </span>
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>

      {/* Lightbox / Full Image Dialog */}
      {product.imageUrl && (
        <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
          <DialogPortal>
            <DialogOverlay className="fixed inset-0 z-[60] bg-black/95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <DialogPrimitive.Content
              className="fixed inset-0 w-full h-full p-0 bg-black/95 flex flex-col items-center justify-center z-[60] border-none outline-none"
            >
              <DialogTitle className="sr-only">Foto Full {product.name}</DialogTitle>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Tutup preview"
              >
                <X className="w-6 h-6 stroke-[2]" />
              </button>
              <div className="max-w-3xl max-h-[85vh] p-4 flex items-center justify-center">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                />
              </div>
              <div className="text-white text-center px-4 mt-2">
                <p className="font-semibold text-base sm:text-lg uppercase">{product.name}</p>
                <p className="text-sm text-gray-300">{formatCurrency(basePrice)}</p>
              </div>
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>
      )}
    </>
  );
}
