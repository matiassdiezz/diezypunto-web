import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuoteItem, ProductResult } from "../types";

interface QuoteState {
  items: QuoteItem[];
  lastAdded: { product: ProductResult; quantity: number } | null;
  addItem: (product: ProductResult, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
}

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set, get) => ({
      items: [],
      lastAdded: null,

      addItem: (product, quantity = 1) => {
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
        const item = get().items.find((i) => i.product.product_id === productId);
        if (!item) return;
        const min = item.product.min_qty > 1 ? item.product.min_qty : 1;
        if (quantity < min) return get().removeItem(productId);
        set({
          items: get().items.map((i) =>
            i.product.product_id === productId ? { ...i, quantity } : i,
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "diezypunto-quote" },
  ),
);
