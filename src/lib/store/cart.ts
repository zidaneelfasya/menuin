import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string; // product id
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
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
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
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
      
      addItem: (item) => set((state) => {
        const existing = state.items.find((i) => i.id === item.id);
        if (existing) {
          return {
            items: state.items.map((i) => 
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          };
        }
        return { items: [...state.items, { ...item, quantity: 1 }] };
      }),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id)
      })),
      
      updateQuantity: (id, quantity) => set((state) => {
        if (quantity <= 0) {
          return { items: state.items.filter((i) => i.id !== id) };
        }
        return {
          items: state.items.map((i) => 
            i.id === id ? { ...i, quantity } : i
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
