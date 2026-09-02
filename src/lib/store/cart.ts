import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  cartItemId: string; // Unique ID for cart item (productId + modifiers + notes hash)
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  modifiers?: any[];
  notes?: string;
};

type CartState = {
  tenantSlug: string | null;
  items: CartItem[];
  tableNumber: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  
  // Actions
  setTenant: (slug: string) => void;
  setTableNumber: (table: string | null) => void;
  setOrderType: (type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => void;
  addItem: (item: Omit<CartItem, 'quantity' | 'cartItemId'>, quantity?: number) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      tenantSlug: null,
      items: [],
      tableNumber: null,
      orderType: 'DINE_IN',
      
      setTenant: (slug) => {
        const current = get().tenantSlug;
        if (current !== slug) {
          // If shopping at a new store, clear old cart
          set({ tenantSlug: slug, items: [], tableNumber: null });
        }
      },
      
      setTableNumber: (table) => set({ tableNumber: table }),
      setOrderType: (type) => set({ orderType: type }),
      
      addItem: (item, quantity = 1) => set((state) => {
        // Generate a unique cart item ID based on productId, modifiers, and notes
        const modString = item.modifiers ? JSON.stringify(item.modifiers.map((m: any) => m.id).sort()) : '';
        const noteString = item.notes ? item.notes.trim().toLowerCase() : '';
        const cartItemId = `${item.productId}-${modString}-${noteString}`;

        const existing = state.items.find((i) => i.cartItemId === cartItemId);
        if (existing) {
          return {
            items: state.items.map((i) => 
              i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + quantity } : i
            )
          };
        }
        return { items: [...state.items, { ...item, cartItemId, quantity }] };
      }),
      
      removeItem: (cartItemId) => set((state) => ({
        items: state.items.filter((i) => i.cartItemId !== cartItemId)
      })),
      
      updateQuantity: (cartItemId, quantity) => set((state) => {
        if (quantity <= 0) {
          return { items: state.items.filter((i) => i.cartItemId !== cartItemId) };
        }
        return {
          items: state.items.map((i) => 
            i.cartItemId === cartItemId ? { ...i, quantity } : i
          )
        };
      }),
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getTotalPrice: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),
    }),
    {
      name: 'menuin-cart-storage',
    }
  )
);
