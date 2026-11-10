import { describe, expect, it, beforeEach } from 'vitest';
import { useCartStore } from './use-cart-store';

const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('useCartStore displayMode', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    useCartStore.setState({ displayMode: 'image', items: [] });
  });

  it('supports image, color, and side-image display modes', () => {
    expect(useCartStore.getState().displayMode).toBe('image');

    useCartStore.getState().setDisplayMode('side-image');
    expect(useCartStore.getState().displayMode).toBe('side-image');
    expect(mockLocalStorage.getItem('menuin_pos_display_mode')).toBe('side-image');

    useCartStore.getState().setDisplayMode('color');
    expect(useCartStore.getState().displayMode).toBe('color');
    expect(mockLocalStorage.getItem('menuin_pos_display_mode')).toBe('color');

    useCartStore.getState().setDisplayMode('image');
    expect(useCartStore.getState().displayMode).toBe('image');
    expect(mockLocalStorage.getItem('menuin_pos_display_mode')).toBe('image');
  });
});
