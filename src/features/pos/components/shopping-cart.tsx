'use client';

import * as React from 'react';
import { Trash2, Plus, Minus, CreditCard, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../stores/use-cart-store';
import { formatCurrency } from '@/lib/utils/format';

export function ShoppingCart() {
  const [mounted, setMounted] = React.useState(false);
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, getTaxAmount, getTotal, discount } = useCartStore();

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
  const tax = getTaxAmount();
  const total = getTotal();

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
              <div className="h-12 w-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />}
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
      <div className="p-4 border-t bg-muted/10 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-destructive">
            <span>Diskon</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="pt-3 border-t flex justify-between items-center">
          <span className="font-bold text-lg">Total</span>
          <span className="font-bold text-2xl text-primary">{formatCurrency(total)}</span>
        </div>

        <div className="flex justify-center items-center mt-3 text-xs text-success bg-success/10 py-1.5 rounded-lg">
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
