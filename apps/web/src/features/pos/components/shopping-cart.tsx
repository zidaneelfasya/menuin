'use client';

import * as React from 'react';
import { Trash2, Plus, Minus, CreditCard, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../stores/use-cart-store';
import { formatCurrency } from '@/lib/utils/format';

interface ShoppingCartProps {
  posSettings?: {
    posTaxRate?: string | number;
    taxName?: string;
    serviceChargeRate?: string | number;
  } | null;
}

export function ShoppingCart({ posSettings }: ShoppingCartProps = {}) {
  const [mounted, setMounted] = React.useState(false);
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, discount } = useCartStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const subtotal = getSubtotal();
  const taxRate = parseFloat(String(posSettings?.posTaxRate || '0'));
  const serviceRate = parseFloat(String(posSettings?.serviceChargeRate || '0'));
  const taxName = posSettings?.taxName || 'Pajak (PB1)';

  const afterDiscount = Math.max(0, subtotal - discount);
  const taxAmount = (afterDiscount * taxRate) / 100;
  const serviceChargeAmount = (afterDiscount * serviceRate) / 100;
  const total = afterDiscount + taxAmount + serviceChargeAmount;

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
            className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded-md transition-colors flex items-center"
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
                <div className="flex items-center mt-1.5 space-x-2">
                  <div className="flex items-center bg-background border rounded-lg overflow-hidden">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2 py-1 hover:bg-muted text-muted-foreground"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-medium px-2 min-w-[20px] text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2 py-1 hover:bg-muted text-muted-foreground"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button 
                  onClick={() => removeItem(item.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
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
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-destructive font-medium">
            <span>Potongan / Diskon</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        {taxRate > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{taxName} ({taxRate}%)</span>
            <span>+{formatCurrency(taxAmount)}</span>
          </div>
        )}
        {serviceRate > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Biaya Layanan ({serviceRate}%)</span>
            <span>+{formatCurrency(serviceChargeAmount)}</span>
          </div>
        )}
        <div className="pt-2.5 border-t flex justify-between items-center">
          <span className="font-bold text-base">Total</span>
          <span className="font-bold text-xl text-primary">{formatCurrency(total)}</span>
        </div>

        <div className="flex justify-center items-center mt-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 py-1.5 rounded-lg font-medium">
          <ShieldCheck size={14} className="mr-1.5" />
          Transaksi aman & tersinkronisasi
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
