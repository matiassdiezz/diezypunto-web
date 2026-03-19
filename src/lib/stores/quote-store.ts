import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuoteItem, ProductResult } from "../types";

interface QuoteState {
  items: QuoteItem[];
  lastAdded: { product: ProductResult; quantity: number } | null;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  addItem: (product: ProductResult, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  setSyncing: (syncing: boolean) => void;
  setSyncedAt: (timestamp: number) => void;
}

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set, get) => ({
      items: [],
      lastAdded: null,
      lastSyncedAt: null,
      isSyncing: false,

      addItem: (product, quantity = 10) => {
        const items = get().items;
        const existing = items.find(
          (i) => i.product.product_id === product.product_id,
        );
        if (existing) {
          set({
            items: items.map((i) =>
              i.product.product_id === product.product_id
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            ),
            lastAdded: { product, quantity },
          });
        } else {
          set({ items: [...items, { product, quantity }], lastAdded: { product, quantity } });
        }
      },

      removeItem: (productId) =>
        set({
          items: get().items.filter((i) => i.product.product_id !== productId),
        }),

      updateQty: (productId, quantity) => {
        if (quantity < 10) return; // Minimum 10 units
        set({
          items: get().items.map((i) =>
            i.product.product_id === productId ? { ...i, quantity } : i,
          ),
        });
      },

      clearCart: () => set({ items: [], lastSyncedAt: null }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp, isSyncing: false }),
    }),
    { name: "diezypunto-quote" },
  ),
);
