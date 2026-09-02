import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  modifiers?: any[];
  notes?: string;
}

interface CartStore {
  items: CartItem[];
  discount: number;
  taxRate: number; // e.g., 0.11 for 11%
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setDiscount: (amount: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTaxAmount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
      (set, get) => ({
        items: [],
        discount: 0,
        taxRate: 0, // No tax for POS

        addItem: (newItem) => {
        set((state) => {
          const modString = newItem.modifiers ? JSON.stringify(newItem.modifiers.map((m: any) => m.id).sort()) : '';
          const noteString = newItem.notes ? newItem.notes.trim().toLowerCase() : '';
          const uniqueId = `${newItem.productId}-${modString}-${noteString}`;

          const existingItem = state.items.find((i) => i.id === uniqueId);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === uniqueId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...newItem, id: uniqueId, quantity: 1 }],
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }));
      },

      setDiscount: (discount) => set({ discount }),

      clearCart: () => set({ items: [], discount: 0 }),

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getTaxAmount: () => {
        return 0; // Forced to 0 regardless of localStorage
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const afterDiscount = Math.max(0, subtotal - get().discount);
        return afterDiscount; // Pure total, no tax added
      },
    }),
    {
      name: 'pos-cart-storage',
    }
  )
);
