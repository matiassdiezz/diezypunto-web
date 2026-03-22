import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuoteItem, ProductResult } from "../types";
import { trackEvent } from "../analytics-client";

interface QuoteState {
  items: QuoteItem[];
  lastAdded: { product: ProductResult; quantity: number } | null;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  addItem: (product: ProductResult, quantity?: number, color?: string) => void;
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

      addItem: (product, quantity = 1, color?) => {
        const items = get().items;
        const existing = items.find(
          (i) => i.product.product_id === product.product_id,
        );
        if (existing) {
          set({
            items: items.map((i) =>
              i.product.product_id === product.product_id
                ? { ...i, quantity: i.quantity + quantity, color: color ?? i.color }
                : i,
            ),
            lastAdded: { product, quantity },
          });
        } else {
          set({ items: [...items, { product, quantity, color }], lastAdded: { product, quantity } });
        }
        const newItems = get().items;
        trackEvent("cart_add", {
          product_id: product.product_id,
          title: product.title,
          category: product.category,
          quantity,
          price: product.price,
          cart_total_items: newItems.reduce((s, i) => s + i.quantity, 0),
          referrer: typeof window !== "undefined" ? document.referrer : "",
        });
      },

      removeItem: (productId) => {
        const item = get().items.find((i) => i.product.product_id === productId);
        set({
          items: get().items.filter((i) => i.product.product_id !== productId),
        });
        if (item) {
          trackEvent("cart_remove", {
            product_id: productId,
            quantity: item.quantity,
            cart_total_items: get().items.reduce((s, i) => s + i.quantity, 0),
          });
        }
      },

      updateQty: (productId, quantity) => {
        if (quantity < 1) return; // Minimum 1 unit
        set({
          items: get().items.map((i) =>
            i.product.product_id === productId ? { ...i, quantity } : i,
          ),
        });
      },

      clearCart: () => {
        const items = get().items;
        trackEvent("cart_clear", {
          items_count: items.length,
          total_qty: items.reduce((s, i) => s + i.quantity, 0),
        });
        set({ items: [], lastSyncedAt: null });
      },

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp, isSyncing: false }),
    }),
    { name: "diezypunto-quote" },
  ),
);
