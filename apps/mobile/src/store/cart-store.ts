import { create } from 'zustand';
import { Product } from '@/hooks/use-pos-data';

export interface CartItemModifier {
  modifierGroupId: string;
  name: string; // The group name
  selectedOption: { id: string; name: string; price: number };
}

export interface CartItem {
  id: string; // Unique id for the cart item instance (e.g. uuid or timestamp)
  product: Product;
  quantity: number;
  modifiers: CartItemModifier[];
  notes?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addItem: (newItem) => {
    // Check if identical item (same product & same modifiers) exists
    const existingItem = get().items.find(item => {
      if (item.product.id !== newItem.product.id) return false;
      if (item.modifiers.length !== newItem.modifiers.length) return false;
      // Compare modifiers (naive comparison for now)
      const modsMatch = item.modifiers.every((m, i) => 
        m.modifierGroupId === newItem.modifiers[i]?.modifierGroupId &&
        m.selectedOption.name === newItem.modifiers[i]?.selectedOption.name
      );
      return modsMatch;
    });

    if (existingItem) {
      // Just increase quantity
      set((state) => ({
        items: state.items.map(item => 
          item.id === existingItem.id 
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        )
      }));
    } else {
      // Add new item
      set((state) => ({
        items: [...state.items, { ...newItem, id: Date.now().toString() }]
      }));
    }
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter(item => item.id !== id)
    }));
  },

  updateQuantity: (id, delta) => {
    set((state) => ({
      items: state.items.map(item => {
        if (item.id === id) {
          const newQ = item.quantity + delta;
          return { ...item, quantity: Math.max(1, newQ) };
        }
        return item;
      })
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  getCartTotal: () => {
    return (get().items || []).reduce((total, item) => {
      const productPrice = Number(item.product?.price || 0);
      const modifierPrice = (item.modifiers || []).reduce(
        (sum, mod) => sum + (Number(mod.selectedOption?.price) || 0),
        0
      );
      return total + ((productPrice + modifierPrice) * (item.quantity || 1));
    }, 0);
  }
}));
