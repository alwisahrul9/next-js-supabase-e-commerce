import { create } from 'zustand';
import { 
  getCartItems, 
  updateCartItemQuantity, 
  removeCartItem, 
  updateCartItemWarehouse,
  addToCart as serverAddToCart 
} from '@/app/actions/cart';

export type WarehouseOption = {
  id: string;
  name: string;
  qty: number;
  isMain: boolean;
  distance: number | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  cityId?: string | null;
};

export type CartItemType = {
  id: string;
  cartId: string;
  productId: string;
  warehouseId: string | null;
  size: string;
  availableWarehouses: WarehouseOption[];
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    price: number;
    stocks: {
      id: string;
      productId: string;
      warehouseId: string;
      size: string;
      qty: number;
    }[];
    images: string[];
  };
};

interface CartState {
  items: CartItemType[];
  hasAddress: boolean;
  isLoaded: boolean;
  isPending: boolean;
  dirtyItems: Set<string>;
  
  // Actions
  fetchCart: (addressId?: string) => Promise<void>;
  updateQuantity: (itemId: string, newQuantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  updateWarehouse: (itemId: string, warehouseId: string) => Promise<boolean>;
  addToCart: (productId: string, quantity?: number, size?: string) => Promise<{ success: boolean; msg: string }>;
}

// Keep track of timeouts outside the state
const debounceRefs: Record<string, NodeJS.Timeout> = {};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  hasAddress: false,
  isLoaded: false,
  isPending: false,
  dirtyItems: new Set(),

  fetchCart: async (addressId) => {
    set({ isPending: true });
    try {
      const { items, hasAddress } = await getCartItems(addressId);
      set({ items, hasAddress, isLoaded: true, isPending: false });
    } catch (error) {
      set({ isPending: false });
      console.error('Failed to fetch cart:', error);
    }
  },

  updateQuantity: async (itemId, newQuantity) => {
    const state = get();
    const item = state.items.find(i => i.id === itemId);
    if (!item) return false;

    if (newQuantity < 1) return false;

    // Optimistic update
    set((state) => ({
      items: state.items.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i),
      dirtyItems: new Set(state.dirtyItems).add(itemId)
    }));

    if (debounceRefs[itemId]) {
      clearTimeout(debounceRefs[itemId]);
    }

    return new Promise((resolve) => {
      debounceRefs[itemId] = setTimeout(async () => {
        try {
          const res = await updateCartItemQuantity(itemId, newQuantity);
          set((state) => {
            const nextDirty = new Set(state.dirtyItems);
            nextDirty.delete(itemId);
            return { dirtyItems: nextDirty };
          });
          resolve(res.success);
        } catch (e) {
          set((state) => {
            const nextDirty = new Set(state.dirtyItems);
            nextDirty.delete(itemId);
            return { dirtyItems: nextDirty };
          });
          resolve(false);
        }
      }, 1000); // 1 second debounce instead of 3 for better perceived performance
    });
  },

  removeItem: async (itemId) => {
    set({ isPending: true });
    try {
      const res = await removeCartItem(itemId);
      if (res.success) {
        set((state) => ({
          items: state.items.filter(i => i.id !== itemId),
          isPending: false
        }));
        return true;
      }
      set({ isPending: false });
      return false;
    } catch (error) {
      set({ isPending: false });
      return false;
    }
  },

  updateWarehouse: async (itemId, warehouseId) => {
    // Optimistic update
    set((state) => ({
      items: state.items.map(i => i.id === itemId ? { ...i, warehouseId } : i)
    }));

    try {
      const res = await updateCartItemWarehouse(itemId, warehouseId);
      return res.success;
    } catch (error) {
      return false;
    }
  },

  addToCart: async (productId, quantity = 1, size = "ALL") => {
    try {
      const res = await serverAddToCart(productId, quantity, size);
      if (res.success) {
        await get().fetchCart();
      }
      return res;
    } catch (error) {
      return { success: false, msg: "Failed to add to cart" };
    }
  }
}));
