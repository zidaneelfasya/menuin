'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils/format';
import { X, Plus, Minus, Check, Maximize2, Tag } from 'lucide-react';
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
  potongan?: string | number | null;
  imageUrl?: string | null;
  description?: string | null;
  categoryName?: string | null;
  isFeatured?: boolean | null;
  categoryId?: string | null;
  modifierGroupIds?: string[];
  totalSold?: number;
  promo?: {
    id: string;
    code: string;
    name: string;
    discountedPrice: number;
    discountAmount: number;
    badgeText: string;
  } | null;
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
  const rawPrice = product ? Number(product.price) : 0;
  const potongan = product?.potongan ? Number(product.potongan) : 0;
  const basePrice = Math.max(0, rawPrice - potongan);
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
          // Radio button yang wajib dipilih tidak bisa di-unselect menjadi kosong
          if (group.isRequired) {
            return prev;
          }
          // Pilihan opsional bisa di-toggle off
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
            className="fixed bottom-0 left-0 right-0 z-50 w-full sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md h-[90vh] max-h-[92vh] sm:h-[88vh] sm:max-h-[88vh] rounded-t-[28px] sm:rounded-t-[32px] rounded-b-none p-0 m-0 flex flex-col bg-white shadow-2xl overflow-hidden outline-none border-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300"
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

            {/* 2. Title, Price, and Description (Tiru Layout Bersih ala Gojek) */}
            <div className="p-4 sm:p-5 space-y-4">
              <div className="border-b border-slate-150 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight leading-snug flex-1">
                    {product.name}
                  </h2>
                  <div className="text-right shrink-0">
                    {potongan > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="text-base sm:text-lg font-semibold text-rose-600 font-numeric">
                          {formatCurrency(basePrice)}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-400 line-through font-numeric">
                            {formatCurrency(rawPrice)}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                            Hemat {formatCurrency(potongan)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-base sm:text-lg font-semibold text-slate-900 font-numeric">
                        {formatCurrency(basePrice)}
                      </span>
                    )}
                  </div>
                </div>

                {product.description && product.description.trim() !== '' && (
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                )}
              </div>

              {/* 3. Modifier Groups Section (Layout & Kontrol ala Gojek: Bulat untuk Wajib Single-Select, Kotak Checkbox untuk Opsional/Multi-Select) */}
              {productGroups.length > 0 && (
                <div className="space-y-5 pt-1">
                  {productGroups.map(group => {
                    const isRadio = group.isRequired && group.maxSelections === 1;
                    const groupSelections = selectedMap[group.id] || {};
                    const currentGroupTotalQty = Object.values(groupSelections).reduce((a, b) => a + b, 0);
                    const isGroupSatisfied = group.isRequired
                      ? currentGroupTotalQty >= Math.max(1, group.minSelections || 1)
                      : true;

                    return (
                      <div key={group.id} className="pb-4 border-b border-slate-100 last:border-b-0 space-y-1.5">
                        {/* Group Header */}
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base text-slate-900 tracking-tight leading-snug">
                            {group.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs sm:text-[13px]">
                            {group.isRequired ? (
                              <>
                                <span
                                  className="font-medium text-catalog-primary"
                                  style={{ color: 'var(--catalog-primary, #059669)' }}
                                >
                                  Harus dipilih
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500">
                                  {group.maxSelections === 1
                                    ? 'Pilih 1'
                                    : group.minSelections && group.minSelections > 1
                                    ? `Pilih ${group.minSelections} - ${group.maxSelections}`
                                    : `Pilih maks. ${group.maxSelections}`}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-slate-500 font-normal">Opsional</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500">
                                  {group.maxSelections === 1
                                    ? 'Pilih maks. 1'
                                    : group.maxSelections
                                    ? `Pilih maks. ${group.maxSelections}`
                                    : 'Bebas pilih'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Flat Modifier Options List (Nama di Kiri, Harga & Kontrol di Kanan) */}
                        <div className="pt-0.5" role={isRadio ? "radiogroup" : "group"} aria-label={group.name}>
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
                                role={isRadio ? "radio" : "checkbox"}
                                aria-checked={isSelected}
                                aria-disabled={!isAvailable}
                                tabIndex={isAvailable ? 0 : -1}
                                className={`flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0 cursor-pointer select-none group transition-colors ${
                                  !isAvailable ? 'opacity-40 cursor-not-allowed' : 'active:bg-slate-50/60'
                                }`}
                              >
                                {/* Kiri: Nama Modifier (Konsisten font-normal & warna teks hitam ala Gojek) */}
                                <div className="flex-1 min-w-0 pr-3">
                                  <span
                                    className={`text-sm sm:text-[15px] block leading-snug font-normal ${
                                      !isAvailable
                                        ? 'line-through text-slate-400'
                                        : 'text-slate-900'
                                    }`}
                                  >
                                    <span>{mod.name}</span>
                                    {!isAvailable && (
                                      <span className="text-xs text-rose-500 font-medium ml-2">
                                        (Habis)
                                      </span>
                                    )}
                                  </span>
                                </div>

                                {/* Kanan: Harga & Kontrol Selector (Bulat Radio vs Kotak Checkbox) */}
                                <div className="flex items-center gap-3 shrink-0">
                                  {isAvailable && (
                                    <span
                                      className={`text-xs sm:text-sm ${
                                        modPrice > 0 ? 'font-medium text-slate-800' : 'text-slate-400 font-normal'
                                      }`}
                                    >
                                      {modPrice > 0 ? `+${formatCurrency(modPrice)}` : 'Gratis'}
                                    </span>
                                  )}

                                  {isRadio ? (
                                    /* Bulat (Radio) untuk Pilihan Wajib & Single-Select */
                                    <div
                                      className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                        isSelected
                                          ? 'border-catalog-primary bg-white'
                                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                                      }`}
                                      style={
                                        isSelected
                                          ? { borderColor: 'var(--catalog-primary, #059669)' }
                                          : undefined
                                      }
                                    >
                                      {isSelected && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                          className="w-2.5 h-2.5 rounded-full bg-catalog-primary"
                                          style={{ backgroundColor: 'var(--catalog-primary, #059669)' }}
                                        />
                                      )}
                                    </div>
                                  ) : (
                                    /* Checkbox (Kotak Persegi) untuk Opsional / Multi-Select */
                                    <div
                                      className={`w-[22px] h-[22px] rounded-sm border-2 flex items-center justify-center shrink-0 transition-all ${
                                        isSelected
                                          ? 'border-catalog-primary bg-catalog-primary text-white shadow-2xs'
                                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                                      }`}
                                      style={
                                        isSelected
                                          ? {
                                              borderColor: 'var(--catalog-primary, #059669)',
                                              backgroundColor: 'var(--catalog-primary, #059669)',
                                            }
                                          : undefined
                                      }
                                    >
                                      {isSelected && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        >
                                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        </motion.div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 4. Notes Section (Catatan Pesanan) */}
              <div className="space-y-2 pt-1 pb-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="sheet-notes" className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
                    Catatan Pesanan
                  </label>
                  <span className="text-xs text-slate-400 font-normal">Opsional</span>
                </div>
                <Textarea
                  id="sheet-notes"
                  placeholder="Contoh: Jangan terlalu manis, es dipisah, ekstra sedotan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[78px] rounded-xl border-slate-200 text-xs sm:text-sm focus-visible:ring-catalog-primary placeholder:text-slate-400 resize-none p-3"
                  maxLength={200}
                />
              </div>
            </div>
          </div>

          {/* 5. Sticky Bottom Bar: Stepper & CTA Button (Pill Rounded ala Gojek) */}
          <div className="bg-white border-t border-slate-150 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg flex flex-col gap-3 shrink-0 z-20">
            {/* Stepper Row: "Jumlah pembelian" + [-] [qty] [+] */}
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base font-medium text-slate-900 tracking-tight">
                Jumlah pembelian
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:border-slate-200 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
                  aria-label="Kurangi jumlah pesanan"
                >
                  <Minus className="w-4 h-4 stroke-[2]" />
                </button>
                <span className="min-w-[24px] text-center font-semibold text-base text-slate-900 font-numeric">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-full border border-catalog-primary text-catalog-primary flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                  style={{
                    borderColor: 'var(--catalog-primary, #059669)',
                    color: 'var(--catalog-primary, #059669)',
                  }}
                  aria-label="Tambah jumlah pesanan"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Validation Message if required modifier is missing */}
            {!isValid && missingRequiredGroup && (
              <p className="text-xs font-medium text-rose-500">
                Pilih {missingRequiredGroup.name} terlebih dahulu
              </p>
            )}

            {/* Primary Action Button (Rounded Pill ala Gojek) */}
            <button
              type="button"
              disabled={!isValid}
              onClick={handleAddAction}
              className={`w-full h-12 rounded-full font-semibold text-sm sm:text-base flex items-center justify-center transition-all cursor-pointer active:scale-[0.99] shadow-xs ${
                isValid
                  ? 'bg-catalog-primary text-white hover:opacity-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
              style={
                isValid
                  ? {
                      backgroundColor: 'var(--catalog-primary, #059669)',
                    }
                  : undefined
              }
            >
              <span>
                {editingCartItemId ? 'Simpan Perubahan' : 'Tambah Pesanan'} - {formatCurrency(grandTotal)}
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
