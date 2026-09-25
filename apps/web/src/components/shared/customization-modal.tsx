'use client';

import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { X, Plus, Minus, AlertCircle } from 'lucide-react';
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

  // Increment for multi-select group
  const handleIncrement = (group: ModifierGroup, modifier: Modifier, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (modifier.isAvailable === false) return;

    const currentGroup = selectedMap[group.id] || {};
    const currentQty = currentGroup[modifier.id] || 0;
    const currentGroupTotal = Object.values(currentGroup).reduce((a, b) => a + b, 0);

    if (group.maxSelections && currentGroupTotal >= group.maxSelections) {
      showMaxLimitWarning(group);
      return;
    }

    setSelectedMap(prev => ({
      ...prev,
      [group.id]: {
        ...(prev[group.id] || {}),
        [modifier.id]: currentQty + 1,
      },
    }));
    setLimitWarningGroupId(null);
  };

  // Decrement for multi-select group
  const handleDecrement = (group: ModifierGroup, modifier: Modifier, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentGroup = selectedMap[group.id] || {};
    const currentQty = currentGroup[modifier.id] || 0;
    if (currentQty <= 0) return;

    setSelectedMap(prev => {
      const updated = { ...(prev[group.id] || {}) };
      if (currentQty <= 1) {
        delete updated[modifier.id];
      } else {
        updated[modifier.id] = currentQty - 1;
      }
      return { ...prev, [group.id]: updated };
    });
  };

  // Single-select toggle handler
  const handleSingleSelectToggle = (group: ModifierGroup, modifier: Modifier) => {
    if (modifier.isAvailable === false) return;
    setSelectedMap(prev => {
      const currentGroup = { ...(prev[group.id] || {}) };
      const currentQty = currentGroup[modifier.id] || 0;

      if (currentQty > 0) {
        // Deselect / toggle off
        return { ...prev, [group.id]: {} };
      }
      return { ...prev, [group.id]: { [modifier.id]: 1 } };
    });
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
        className="fixed bottom-0 top-auto left-0 right-0 sm:bottom-auto sm:top-[50%] sm:left-[50%] translate-x-0 translate-y-0 sm:translate-x-[-50%] sm:translate-y-[-50%] w-full max-w-full sm:max-w-xl md:max-w-2xl rounded-t-[28px] sm:rounded-2xl max-h-[90vh] sm:max-h-[85vh] p-0 flex flex-col gap-0 bg-white dark:bg-slate-950 border-t sm:border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden focus:outline-hidden z-50 font-sans"
      >
        {/* Mobile Swipe Handle Indicator */}
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" aria-hidden="true" />

        {/* 1. Header: Product Name & Clean Close Button */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-white dark:bg-slate-950 sticky top-0 z-10">
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-lg sm:text-xl text-slate-900 dark:text-slate-100 leading-snug">
              {product.name}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {formatCurrency(basePrice)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Tutup kustomisasi"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* 2. Scrollable Body: Pill & Stepper Modifier Grid */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 overscroll-contain">
          {productGroups.map(group => {
            const groupSelections = selectedMap[group.id] || {};
            const currentGroupTotalQty = Object.values(groupSelections).reduce((a, b) => a + b, 0);
            const isSingleSelect = group.maxSelections === 1;
            const isGroupSatisfied = group.isRequired
              ? currentGroupTotalQty >= Math.max(1, group.minSelections || 1)
              : true;

            return (
              <div key={group.id} className="space-y-2.5">
                {/* Group Title Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      {group.name}
                    </h4>
                    {group.maxSelections > 1 && (
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                        (bisa lebih dari 1)
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      group.isRequired
                        ? isGroupSatisfied
                          ? "text-slate-400 dark:text-slate-500"
                          : "text-amber-600 dark:text-amber-400"
                        : "text-slate-400 dark:text-slate-500"
                    )}
                  >
                    {group.isRequired
                      ? isGroupSatisfied
                        ? "Sudah dipilih"
                        : "Wajib dipilih"
                      : "Opsional"}
                  </span>
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

                {/* Pill / Tile Buttons in Flex-Wrap Layout */}
                <div className="flex flex-wrap gap-2.5 pt-0.5">
                  {group.modifiers?.map(mod => {
                    const isAvailable = mod.isAvailable !== false;
                    const selectedQty = groupSelections[mod.id] || 0;
                    const isSelected = selectedQty > 0;
                    const modPrice = Number(mod.price);

                    // Formatted Price String
                    const priceLabel = modPrice > 0 
                      ? `+ ${modPrice.toLocaleString('id-ID')}`
                      : '+ 0';

                    // CASE A: Single-Select Group (e.g. UKURAN GELAS, TINGKAT KEMANISAN, ES)
                    if (isSingleSelect) {
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => handleSingleSelectToggle(group, mod)}
                          className={cn(
                            "min-h-[46px] sm:min-h-[48px] px-4 py-2.5 rounded-xl sm:rounded-md text-xs sm:text-sm transition-all select-none flex items-center gap-2 cursor-pointer active:scale-[0.98]",
                            !isAvailable
                              ? "opacity-40 bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed pointer-events-none"
                              : isSelected
                              ? "bg-blue-50/70 dark:bg-blue-950/40 border-2 border-blue-600 dark:border-blue-500 text-slate-900 dark:text-slate-100 font-semibold"
                              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 font-medium"
                          )}
                        >
                          <span>{mod.name}</span>
                          <span className={cn(
                            "font-semibold",
                            isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                          )}>
                            {priceLabel}
                          </span>
                        </button>
                      );
                    }

                    // CASE B: Multi-Select Group with Quantity Stepper (e.g. EXTRA TOPPING)
                    // If selected (qty >= 1): Shows inline stepper [-] [qty] [+] with total price
                    // PLUS: Tapping the tile body will increment the quantity directly!
                    if (isSelected) {
                      const totalModPrice = modPrice * selectedQty;
                      const totalModPriceLabel = totalModPrice > 0
                        ? `+ ${totalModPrice.toLocaleString('id-ID')}`
                        : '+ 0';

                      return (
                        <div
                          key={mod.id}
                          onClick={() => handleIncrement(group, mod)}
                          role="button"
                          tabIndex={0}
                          className="min-h-[46px] sm:min-h-[48px] inline-flex items-center gap-2 bg-blue-50/70 dark:bg-blue-950/40 border-2 border-blue-600 dark:border-blue-500 rounded-xl sm:rounded-md pl-2 pr-4 py-1.5 transition-all select-none cursor-pointer active:scale-[0.98]"
                          title="Klik tombol ini lagi untuk menambah kuantitas"
                        >
                          {/* Round Minus Button (Cart Style) */}
                          <button
                            type="button"
                            onClick={(e) => handleDecrement(group, mod, e)}
                            className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center shadow-2xs active:scale-90 cursor-pointer shrink-0"
                            aria-label="Kurangi kuantitas"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>

                          {/* Quantity Number */}
                          <span className="min-w-5 sm:min-w-6 text-center text-xs sm:text-sm font-semibold text-foreground font-mono select-none">
                            {selectedQty}
                          </span>

                          {/* Round Plus Button (Cart Style) */}
                          <button
                            type="button"
                            onClick={(e) => handleIncrement(group, mod, e)}
                            className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center justify-center active:scale-90 cursor-pointer shrink-0"
                            aria-label="Tambah kuantitas"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>

                          {/* Option Name & Calculated Multiplied Price */}
                          <span className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5 pl-0.5">
                            <span>{mod.name}</span>
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              {totalModPriceLabel}
                            </span>
                          </span>
                        </div>
                      );
                    }

                    // Multi-select option unselected (qty = 0)
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleIncrement(group, mod)}
                        className={cn(
                          "min-h-[46px] sm:min-h-[48px] px-4 py-2.5 rounded-xl sm:rounded-md text-xs sm:text-sm transition-all select-none flex items-center gap-2 cursor-pointer active:scale-[0.98]",
                          !isAvailable
                            ? "opacity-40 bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed pointer-events-none"
                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-800 font-medium"
                        )}
                      >
                        <span className="w-4.5 h-4.5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                        <span>{mod.name}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">
                          {priceLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 3. Special Notes (Always Visible / Open) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label htmlFor="pos-modal-notes" className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Catatan Pesanan
              </label>
              <span className="text-[11px] text-muted-foreground font-medium">Opsional</span>
            </div>
            <Textarea
              id="pos-modal-notes"
              placeholder="Contoh: Tanpa sedotan, saus dipisah, es batu sedikit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[64px] rounded-xl border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-blue-600/20"
            />
          </div>
        </div>

        {/* 4. Sticky Bottom Action Bar (Footer) */}
        <div className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 p-4 sm:p-5 shadow-lg flex items-center justify-between gap-4 sticky bottom-0 z-20">
          {/* Left: Total Price Display & Required Alert */}
          <div className="text-left shrink-0">
            {!isValid && missingRequiredGroup ? (
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block leading-none mb-1">
                Pilih {missingRequiredGroup.name}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground font-medium block leading-none mb-1">
                Total
              </span>
            )}
            <span className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400 leading-none">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          {/* Right: Plus-Minus Stepper beside SIMPAN button */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Stepper [-] 1 [+] with Round Circle Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || unavailableRequiredGroups.length > 0}
                className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                aria-label="Kurangi jumlah pesanan"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span className="min-w-6 text-center font-semibold text-sm sm:text-base text-foreground font-mono select-none px-1">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                disabled={unavailableRequiredGroups.length > 0}
                className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                aria-label="Tambah jumlah pesanan"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Primary Action Button: SIMPAN (Tanpa Harga) */}
            <button
              type="button"
              disabled={!isValid}
              onClick={handleAddToCart}
              className={cn(
                "h-10 sm:h-11 px-5 sm:px-7 rounded-xl font-semibold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center transition-all cursor-pointer active:scale-[0.98] shadow-xs",
                isValid
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              )}
            >
              <span>
                {unavailableRequiredGroups.length > 0 ? "Bahan Habis" : "SIMPAN"}
              </span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
