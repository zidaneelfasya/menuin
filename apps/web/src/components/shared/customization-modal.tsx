'use client';

import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils/format';
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
  modifierGroupIds?: string[]; // Groups attached to this product
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

  // Single or Multi toggle handler for full-row clicks
  const handleToggleModifier = (group: ModifierGroup, modifier: Modifier) => {
    if (modifier.isAvailable === false) return;
    const isSingleSelect = group.maxSelections === 1;

    if (isSingleSelect) {
      setSelectedMap(prev => {
        const currentGroup = { ...(prev[group.id] || {}) };
        const currentQty = currentGroup[modifier.id] || 0;

        if (currentQty > 0) {
          // If required, tapping selected keeps it selected. If optional, toggles off.
          if (group.isRequired) return prev;
          return { ...prev, [group.id]: {} };
        }
        return { ...prev, [group.id]: { [modifier.id]: 1 } };
      });
      return;
    }

    // Multi Select:
    const currentGroup = selectedMap[group.id] || {};
    const currentGroupTotal = Object.values(currentGroup).reduce((a, b) => a + b, 0);

    // If already at or above maximum selections, do NOT add and do NOT reset!
    if (currentGroupTotal >= group.maxSelections) {
      showMaxLimitWarning(group);
      return;
    }

    // Room exists: increment selected modifier quantity
    setSelectedMap(prev => {
      const prevGroup = { ...(prev[group.id] || {}) };
      const prevQty = prevGroup[modifier.id] || 0;
      return {
        ...prev,
        [group.id]: {
          ...prevGroup,
          [modifier.id]: prevQty + 1,
        },
      };
    });
  };

  // Inline increment button handler
  const handleIncrementModifier = (group: ModifierGroup, modifier: Modifier) => {
    if (modifier.isAvailable === false) return;
    const currentGroup = selectedMap[group.id] || {};
    const currentGroupTotal = Object.values(currentGroup).reduce((a, b) => a + b, 0);

    if (currentGroupTotal >= group.maxSelections) {
      showMaxLimitWarning(group);
      return;
    }

    setSelectedMap(prev => {
      const prevGroup = { ...(prev[group.id] || {}) };
      const prevQty = prevGroup[modifier.id] || 0;
      return {
        ...prev,
        [group.id]: {
          ...prevGroup,
          [modifier.id]: prevQty + 1,
        },
      };
    });
  };

  // Inline decrement button handler
  const handleDecrementModifier = (group: ModifierGroup, modifier: Modifier) => {
    setSelectedMap(prev => {
      const currentGroup = { ...(prev[group.id] || {}) };
      const currentQty = currentGroup[modifier.id] || 0;

      if (currentQty <= 1) {
        const { [modifier.id]: _, ...rest } = currentGroup;
        return { ...prev, [group.id]: rest };
      }

      return {
        ...prev,
        [group.id]: {
          ...currentGroup,
          [modifier.id]: currentQty - 1,
        },
      };
    });
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
        style={{
          "--outlet-primary": primaryColor || "var(--catalog-primary, #0E59F9)",
        } as React.CSSProperties}
        className="fixed bottom-0 top-auto left-0 right-0 sm:bottom-auto sm:top-[50%] sm:left-[50%] translate-x-0 translate-y-0 sm:translate-x-[-50%] sm:translate-y-[-50%] w-full max-w-full sm:max-w-lg rounded-t-[28px] sm:rounded-2xl max-h-[88vh] sm:max-h-[85vh] p-0 flex flex-col gap-0 bg-white border-t sm:border border-gray-200/90 shadow-2xl overflow-hidden focus:outline-hidden z-50"
      >
        {/* Mobile Swipe Handle Indicator */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-0.5 sm:hidden shrink-0" aria-hidden="true" />

        {/* 1. Header: Product Name, Base Price, Close Button */}
        <div className="px-5 py-3.5 border-b border-gray-150 flex items-start justify-between gap-3 bg-white sticky top-0 z-10">
          <div className="flex-1 pr-2">
            <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-snug line-clamp-2">
              {product.name}
            </h3>
            <p className="text-sm font-semibold text-gray-600 mt-0.5">
              {formatCurrency(basePrice)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] -mr-2 -mt-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--outlet-primary,#0E59F9)]/30"
            aria-label="Tutup modal kustomisasi"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* 2. Scrollable Body: Modifier Groups & Special Instructions */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 overscroll-contain">
          {productGroups.map(group => {
            const isSingleSelect = group.maxSelections === 1;
            const groupSelections = selectedMap[group.id] || {};
            const currentGroupTotalQty = Object.values(groupSelections).reduce((a, b) => a + b, 0);
            const isGroupSatisfied = group.isRequired
              ? currentGroupTotalQty >= Math.max(1, group.minSelections || 1)
              : true;

            return (
              <div key={group.id} className="space-y-2.5 pb-5 border-b border-gray-100 last:border-b-0">
                {/* Group Header */}
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-gray-900 tracking-tight">
                    {group.name}
                  </h4>
                  <p
                    className={`text-xs mt-0.5 font-medium transition-colors ${
                      group.isRequired
                        ? isGroupSatisfied
                          ? "text-gray-900"
                          : "text-amber-600"
                        : currentGroupTotalQty > 0
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}
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

                {/* Max Limit Inline Warning Banner */}
                {limitWarningGroupId === group.id && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300/90 px-3 py-2 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      Maksimal pilihan <strong>{group.name}</strong> hanya {group.maxSelections}
                    </span>
                  </div>
                )}

                {/* Modifier Options List */}
                <div
                  className="space-y-2"
                  role={isSingleSelect ? "radiogroup" : "group"}
                  aria-label={group.name}
                >
                  {group.modifiers?.map(mod => {
                    const isAvailable = mod.isAvailable !== false;
                    const groupSelections = selectedMap[group.id] || {};
                    const selectedQty = groupSelections[mod.id] || 0;
                    const isSelected = selectedQty > 0;
                    const modPrice = Number(mod.price);
                    const displayPrice = isSelected && selectedQty > 1 ? modPrice * selectedQty : modPrice;

                    return (
                      <div
                        key={mod.id}
                        onClick={() => isAvailable && handleToggleModifier(group, mod)}
                        role={isSingleSelect ? "radio" : "checkbox"}
                        aria-checked={isSelected}
                        aria-disabled={!isAvailable}
                        tabIndex={isAvailable ? 0 : -1}
                        onKeyDown={(e) => {
                          if (!isAvailable) return;
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleToggleModifier(group, mod);
                          }
                        }}
                        className={`min-h-[48px] w-full px-3.5 py-3 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 text-left select-none ${
                          !isAvailable
                            ? "opacity-50 cursor-not-allowed bg-gray-50/70 border-dashed border-gray-200"
                            : isSelected
                            ? "shadow-2xs font-medium cursor-pointer active:scale-[0.99] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--outlet-primary,#0E59F9)]/30"
                            : "bg-white border-gray-200/80 hover:bg-gray-50/70 hover:border-gray-300 cursor-pointer active:scale-[0.99] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--outlet-primary,#0E59F9)]/30"
                        }`}
                        style={
                          isAvailable && isSelected
                            ? {
                                backgroundColor: "color-mix(in srgb, var(--outlet-primary, #0E59F9) 6%, white)",
                                borderColor: "color-mix(in srgb, var(--outlet-primary, #0E59F9) 35%, transparent)",
                              }
                            : undefined
                        }
                      >
                        {/* Left: Icon + Name */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {isSingleSelect ? (
                            /* Radio Circle */
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? "" : "border-gray-300 bg-white"
                              }`}
                              style={
                                isSelected
                                  ? { borderColor: "var(--outlet-primary, #0E59F9)" }
                                  : undefined
                              }
                              aria-hidden="true"
                            >
                              {isSelected && (
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: "var(--outlet-primary, #0E59F9)" }}
                                />
                              )}
                            </div>
                          ) : (
                            /* Checkbox Square */
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? "text-white"
                                  : "border-gray-300 bg-white"
                              }`}
                              style={
                                isSelected
                                  ? {
                                      backgroundColor: "var(--outlet-primary, #0E59F9)",
                                      borderColor: "var(--outlet-primary, #0E59F9)",
                                    }
                                  : undefined
                              }
                              aria-hidden="true"
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          )}

                          <span
                            className={`text-sm leading-tight transition-colors ${
                              !isAvailable
                                ? "line-through text-gray-400 font-normal"
                                : isSelected
                                ? "font-bold text-gray-900"
                                : "font-normal text-gray-700"
                            }`}
                          >
                            {mod.name}
                          </span>
                        </div>

                        {/* Right: Price & Multi-Quantity Stepper */}
                        <div className="flex items-center gap-2 shrink-0 text-right">
                          {!isAvailable && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                              Habis
                            </span>
                          )}
                          <span
                            className={`text-xs sm:text-sm font-semibold ${
                              !isAvailable
                                ? "text-gray-400"
                                : isSelected
                                ? "text-gray-900"
                                : "text-gray-500"
                            }`}
                          >
                            {displayPrice > 0 ? `+${formatCurrency(displayPrice)}` : "Gratis"}
                          </span>

                          {/* Multi-Select Quantity Controls */}
                          {!isSingleSelect && isSelected && group.maxSelections > 1 && (
                            <div
                              className="flex items-center bg-white rounded-lg border border-gray-200/90 shadow-2xs p-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDecrementModifier(group, mod);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 active:scale-95 transition-all text-xs font-bold"
                                aria-label={`Kurangi ${mod.name}`}
                              >
                                <Minus className="w-3 h-3 stroke-[2.5]" />
                              </button>
                              <span className="min-w-[20px] text-center font-bold text-xs text-gray-900 font-mono">
                                {selectedQty}
                              </span>
                              <button
                                type="button"
                                disabled={currentGroupTotalQty >= group.maxSelections}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleIncrementModifier(group, mod);
                                }}
                                className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold transition-all ${
                                  currentGroupTotalQty >= group.maxSelections
                                    ? "opacity-30 cursor-not-allowed text-gray-400"
                                    : "hover:bg-gray-100 text-gray-700 active:scale-95"
                                }`}
                                aria-label={`Tambah ${mod.name}`}
                              >
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                              </button>
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

          {/* 3. Special Instruction / Note Field */}
          <div className="space-y-1.5 pt-1">
            <label htmlFor="modal-notes" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Catatan Khusus (Opsional)
            </label>
            <Textarea
              id="modal-notes"
              placeholder="Contoh: Jangan terlalu manis, ekstra es..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[64px] rounded-xl border-gray-200 text-sm focus-visible:ring-2 focus-visible:ring-[var(--outlet-primary,#0E59F9)]/20"
            />
          </div>
        </div>

        {/* 4. Sticky Bottom Action Bar (Footer) */}
        <div className="bg-white border-t border-gray-150 p-4 sm:p-5 shadow-lg flex flex-col gap-2.5 sticky bottom-0 z-20">
          {/* Missing Requirement or Out-of-Stock Alert */}
          {unavailableRequiredGroups.length > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50/90 border border-amber-200 px-3 py-1.5 rounded-lg animate-in fade-in duration-200">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>
                Bahan untuk pilihan wajib ({unavailableRequiredGroups.map(g => g.name).join(', ')}) sedang habis.
              </span>
            </div>
          ) : !isValid && missingRequiredGroup ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50/90 border border-amber-200 px-3 py-1.5 rounded-lg animate-in fade-in duration-200">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>
                Pilih <strong>{missingRequiredGroup.name}</strong> terlebih dahulu
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            {/* Quantity Stepper with Touch Targets */}
            <div className="flex items-center gap-1 shrink-0 bg-gray-50 p-1 rounded-xl border border-gray-200/80">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || unavailableRequiredGroups.length > 0}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-white border border-gray-200 shadow-2xs flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                aria-label="Kurangi jumlah pesanan"
              >
                <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </button>
              <span className="min-w-[22px] sm:min-w-[28px] text-center font-black text-sm sm:text-base text-gray-900 font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                disabled={unavailableRequiredGroups.length > 0}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-white border border-gray-200 shadow-2xs flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                aria-label="Tambah jumlah pesanan"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Primary Add to Cart CTA Button */}
            <button
              type="button"
              disabled={!isValid}
              onClick={handleAddToCart}
              className="flex-1 h-11 sm:h-12 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-xs transition-all flex items-center justify-between gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.99] cursor-pointer"
              style={{
                backgroundColor: isValid
                  ? "var(--outlet-primary, #0E59F9)"
                  : "#9ca3af",
              }}
            >
              <span className="truncate">
                {unavailableRequiredGroups.length > 0 ? (
                  "Bahan Habis"
                ) : (
                  <>
                    <span>Tambah</span>
                    <span className="hidden sm:inline"> ke Keranjang</span>
                  </>
                )}
              </span>
              {isValid && (
                <span className="shrink-0 font-extrabold whitespace-nowrap pl-2 border-l border-white/25">
                  {formatCurrency(grandTotal)}
                </span>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
