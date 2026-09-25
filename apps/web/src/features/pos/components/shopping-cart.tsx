'use client';

import * as React from 'react';
import { Trash2, Plus, Minus, CreditCard, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../stores/use-cart-store';
import { formatCurrency } from '@/lib/utils/format';

interface ShoppingCartProps {
  posSettings?: any;
}

export function ShoppingCart({ posSettings }: ShoppingCartProps) {
  const [mounted, setMounted] = React.useState(false);
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, discount } = useCartStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-card border rounded-2xl shadow-sm p-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
        <div className="flex-1 space-y-4">
          <div className="h-16 bg-muted rounded w-full"></div>
          <div className="h-16 bg-muted rounded w-full"></div>
        </div>
        <div className="h-40 bg-muted rounded w-full mt-4"></div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const taxRate = parseFloat(posSettings?.posTaxRate || '0');
  const serviceRate = parseFloat(posSettings?.serviceChargeRate || '0');
  const taxName = posSettings?.taxName || 'Pajak (PB1)';
  const serviceName = posSettings?.serviceChargeName || 'Biaya Layanan';

  const taxableSubtotal = Math.max(0, subtotal - discount);
  const serviceChargeAmount = serviceRate > 0 ? (taxableSubtotal * serviceRate) / 100 : 0;
  const taxAmount = taxRate > 0 ? (taxableSubtotal * taxRate) / 100 : 0;
  const total = taxableSubtotal + serviceChargeAmount + taxAmount;

  const handleMinus = (itemId: string, currentQty: number) => {
    if (currentQty <= 1) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, currentQty - 1);
    }
  };

  const handlePlus = (itemId: string, currentQty: number) => {
    updateQuantity(itemId, currentQty + 1);
  };

  return (
    <div className="flex flex-col h-full bg-card border rounded-2xl shadow-sm">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg flex items-center">
          Daftar Belanja
          <span className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </h2>
        {items.length > 0 && (
          <button 
            onClick={clearCart}
            className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded-md transition-colors flex items-center cursor-pointer"
          >
            <Trash2 size={14} className="mr-1" />
            Kosongkan
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <ShoppingCartIcon size={48} className="mb-4 opacity-20" />
            <p>Belum ada produk</p>
            <p className="text-xs mt-1">Silakan pilih produk di katalog</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="flex gap-3 bg-muted/30 p-2.5 rounded-xl border border-border/50">
              <div className="h-12 w-12 rounded-lg bg-muted/60 flex-shrink-0 overflow-hidden border border-border/40 relative flex items-center justify-center">
                <CartItemThumbnail src={item.imageUrl} alt={item.name} fallbackName={item.name} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                {item.modifiers && item.modifiers.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    {item.modifiers.map(m => m.name).join(', ')}
                  </p>
                )}
                {item.notes && (
                  <p className="text-[10px] text-muted-foreground italic mt-0.5 line-clamp-1">
                    "{item.notes}"
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <button 
                    type="button"
                    onClick={() => handleMinus(item.id, item.quantity)}
                    className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center shadow-2xs active:scale-90 cursor-pointer"
                    aria-label="Kurangi kuantitas"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <span className="text-sm font-semibold min-w-5 sm:min-w-6 text-center text-foreground select-none">
                    {item.quantity}
                  </span>
                  <button 
                    type="button"
                    onClick={() => handlePlus(item.id, item.quantity)}
                    className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center justify-center active:scale-90 cursor-pointer"
                    aria-label="Tambah kuantitas"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button 
                  onClick={() => removeItem(item.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
                <span className="font-semibold text-sm">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="p-4 border-t bg-muted/10 space-y-2.5">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-xs sm:text-sm text-rose-600 dark:text-rose-400">
            <span>Potongan / Diskon</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}

        {serviceRate > 0 && (
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">{serviceName} ({serviceRate}%)</span>
            <span className="font-medium text-foreground">+{formatCurrency(serviceChargeAmount)}</span>
          </div>
        )}

        {taxRate > 0 && (
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">{taxName} ({taxRate}%)</span>
            <span className="font-medium text-foreground">+{formatCurrency(taxAmount)}</span>
          </div>
        )}

        <div className="pt-2.5 border-t border-border flex justify-between items-center">
          <span className="font-semibold text-base text-foreground">Total</span>
          <span className="font-bold text-xl text-primary">{formatCurrency(total)}</span>
        </div>

        <div className="flex justify-center items-center mt-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
          <ShieldCheck size={14} className="mr-1.5" />
          Semua transaksi aman
        </div>
      </div>
    </div>
  );
}

function ShoppingCartIcon(props: React.ComponentProps<typeof CreditCard>) {
  return <CreditCard {...props} />;
}

function CartItemThumbnail({ src, alt, fallbackName }: { src?: string | null; alt: string; fallbackName: string }) {
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    setError(false);
  }, [src]);

  if (src && !error) {
    return (
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center font-bold text-primary/50 bg-primary/5 text-sm uppercase select-none">
      {fallbackName.charAt(0)}
    </div>
  );
}
