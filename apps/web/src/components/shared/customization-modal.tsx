'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { X, Plus, Minus, Check, AlertCircle } from 'lucide-react';
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
  modifierGroupIds?: string[];
};

export interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  allModifierGroups: ModifierGroup[];
  primaryColor?: string;
  onAddToCart: (product: Product, selectedModifiers: Modifier[], notes: string, quantity: number) => void;
}

export function CustomizationModal({
  isOpen,
  onClose,
  product,
  allModifierGroups,
  primaryColor,
  onAddToCart,
}: CustomizationModalProps) {
  // Map of groupId -> { [modifierId]: quantity }
  const [selectedMap, setSelectedMap] = React.useState<Record<string, Record<string, number>>>({});
  const [notes, setNotes] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [limitWarningGroupId, setLimitWarningGroupId] = React.useState<string | null>(null);
  const warningTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Filter groups applicable to this product
  const productGroups = React.useMemo(() => {
    if (!product || !product.modifierGroupIds) return [];
    return allModifierGroups.filter(g => product.modifierGroupIds?.includes(g.id));
  }, [product, allModifierGroups]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedMap({});
      setNotes('');
      setQuantity(1);
      setLimitWarningGroupId(null);
    }
  }, [isOpen]);

  // Calculate total extra price based on modifier quantities
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

  // Validation: Find first missing required group
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

  // Validation: Check if any required group has fewer available options than minSelections
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

  // Show limit warning toast and inline indicator
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

  // Universal Toggle Handler (Square Checkbox with Deselect & Multi-selection support)
  const handleToggleModifier = (group: ModifierGroup, modifier: Modifier) => {
    if (modifier.isAvailable === false) return;
    const isSingleSelect = group.maxSelections === 1;

    if (isSingleSelect) {
      setSelectedMap(prev => {
        const currentGroup = { ...(prev[group.id] || {}) };
        const currentQty = currentGroup[modifier.id] || 0;

        if (currentQty > 0) {
          // Deselect / toggle off and clear the selection
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
      // Toggle off / deselect
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

  const handleAddToCart = () => {
    if (!product || !isValid) return;

    // Flatten selected modifiers with quantity support
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
              quantity: qty,
            });
          }
        }
      });
    });

    onAddToCart(product, flatSelectedModifiers, notes, quantity);
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="fixed bottom-0 top-auto left-0 right-0 sm:bottom-auto sm:top-[50%] sm:left-[50%] translate-x-0 translate-y-0 sm:translate-x-[-50%] sm:translate-y-[-50%] w-full max-w-full sm:max-w-lg rounded-t-[28px] sm:rounded-2xl max-h-[88vh] sm:max-h-[85vh] p-0 flex flex-col gap-0 bg-white dark:bg-slate-950 border-t sm:border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden focus:outline-hidden z-50 font-sans"
      >
        {/* Mobile Swipe Handle Indicator */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-0.5 sm:hidden shrink-0" aria-hidden="true" />

        {/* 1. Header: Product Name, Base Price, Close Button */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 bg-white dark:bg-slate-950 sticky top-0 z-10">
          <div className="flex-1 pr-2">
            <h3 className="font-semibold text-base sm:text-lg text-foreground leading-snug line-clamp-2">
              {product.name}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-0.5">
              {formatCurrency(basePrice)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] -mr-2 -mt-1 rounded-full text-slate-400 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup modal kustomisasi"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* 2. Scrollable Body: Flat Modifier Options & Special Instructions */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 overscroll-contain">
          {productGroups.map(group => {
            const groupSelections = selectedMap[group.id] || {};
            const currentGroupTotalQty = Object.values(groupSelections).reduce((a, b) => a + b, 0);
            const isGroupSatisfied = group.isRequired
              ? currentGroupTotalQty >= Math.max(1, group.minSelections || 1)
              : true;

            return (
              <div key={group.id} className="space-y-2 pb-5 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                {/* Group Header */}
                <div>
                  <h4 className="font-semibold text-sm sm:text-base text-foreground uppercase tracking-tight">
                    {group.name}
                  </h4>
                  <p
                    className={cn(
                      "text-xs mt-0.5 font-medium transition-colors",
                      group.isRequired
                        ? isGroupSatisfied
                          ? "text-muted-foreground"
                          : "text-orange-500"
                        : "text-muted-foreground"
                    )}
                  >
                    {group.isRequired
                      ? group.maxSelections === 1
                        ? "Must be selected max. 1"
                        : `Must be selected min. ${group.minSelections || 1}, max. ${group.maxSelections}`
                      : group.maxSelections === 1
                      ? "Opsional (Pilih maks. 1)"
                      : `Opsional (Pilih maks. ${group.maxSelections})`}
                  </p>
                </div>

                {/* Max Limit Warning Banner */}
                {limitWarningGroupId === group.id && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-800 px-3 py-2 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      Maksimal pilihan <strong>{group.name}</strong> hanya {group.maxSelections}
                    </span>
                  </div>
                )}

                {/* Flat Modifier Options List (No Card Border Clutter) */}
                <div className="space-y-0.5 pt-1" role="group" aria-label={group.name}>
                  {group.modifiers?.map(mod => {
                    const isAvailable = mod.isAvailable !== false;
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
                        className={cn(
                          "flex items-center justify-between py-2.5 sm:py-3 cursor-pointer select-none group transition-opacity",
                          !isAvailable && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        {/* Left: Option Name & Extra Price Inline */}
                        <div className="flex-1 min-w-0 pr-3">
                          <span
                            className={cn(
                              "text-sm sm:text-[15px] uppercase leading-snug font-sans block",
                              !isAvailable
                                ? "line-through text-slate-400 font-medium"
                                : isSelected
                                ? "font-semibold text-foreground"
                                : "font-medium text-slate-700 dark:text-slate-300 group-hover:text-foreground"
                            )}
                          >
                            <span>{mod.name}</span>
                            {modPrice > 0 && isAvailable && (
                              <span className="font-semibold text-foreground ml-1.5">
                                (+ {formatCurrency(modPrice)})
                              </span>
                            )}
                            {!isAvailable && (
                              <span className="text-xs text-red-500 font-semibold ml-1.5">
                                (Habis)
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Right: Modern Square Checkbox with Tactile Micro-Animation */}
                        <motion.div
                          initial={false}
                          animate={isSelected ? { scale: [0.9, 1.15, 1] } : { scale: 1 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className={cn(
                            "w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white shadow-2xs"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 group-hover:border-slate-400 dark:group-hover:border-slate-500"
                          )}
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

          {/* 3. Special Instruction / Notes Field */}
          <div className="space-y-1.5 pt-2 pb-2">
            <div className="flex items-center justify-between">
              <label htmlFor="modal-notes" className="text-xs font-semibold text-foreground uppercase tracking-tight">
                Catatan Khusus
              </label>
              <span className="text-xs text-muted-foreground font-medium">Opsional</span>
            </div>
            <Textarea
              id="modal-notes"
              placeholder="Contoh: Jangan terlalu manis, tanpa es..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[64px] rounded-xl border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-2 focus-visible:ring-blue-600/20"
            />
          </div>
        </div>

        {/* 4. Sticky Bottom Action Bar (Footer) */}
        <div className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 p-4 sm:p-5 shadow-lg flex flex-col gap-3 sticky bottom-0 z-20">
          {/* Total Order Row + Round Plus-Minus Stepper */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm sm:text-base text-foreground">
              Total Order
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || unavailableRequiredGroups.length > 0}
                className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all cursor-pointer"
                aria-label="Kurangi jumlah pesanan"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span className="min-w-[20px] text-center font-semibold text-sm sm:text-base text-foreground font-mono select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                disabled={unavailableRequiredGroups.length > 0}
                className="w-8 h-8 rounded-full border border-slate-900 dark:border-slate-200 flex items-center justify-center text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all cursor-pointer"
                aria-label="Tambah jumlah pesanan"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Validation Message if required modifier is missing */}
          {unavailableRequiredGroups.length > 0 ? (
            <p className="text-xs sm:text-sm font-semibold text-amber-600">
              Bahan untuk pilihan wajib ({unavailableRequiredGroups.map(g => g.name).join(', ')}) sedang habis.
            </p>
          ) : !isValid && missingRequiredGroup ? (
            <p className="text-xs sm:text-sm font-semibold text-orange-500">
              Pilih {missingRequiredGroup.name} terlebih dahulu
            </p>
          ) : null}

          {/* Primary Action Button */}
          <button
            type="button"
            disabled={!isValid}
            onClick={handleAddToCart}
            className={cn(
              "w-full h-12 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base flex items-center justify-center transition-all cursor-pointer",
              isValid
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-[0.99]"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
            )}
          >
            <span>
              {unavailableRequiredGroups.length > 0
                ? "Bahan Habis"
                : `Tambah Pesanan – ${formatCurrency(grandTotal)}`}
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
