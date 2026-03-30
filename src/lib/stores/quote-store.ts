import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuoteItem, ProductResult } from "../types";
import { trackEvent } from "../analytics-client";

export const MAX_QTY = 99999;

/** Build a unique cart line id from product + variant */
function lineId(productId: string, color?: string, method?: string): string {
  return [productId, color ?? "", method ?? ""].join("||");
}

interface QuoteState {
  items: QuoteItem[];
  lastAdded: { product: ProductResult; quantity: number } | null;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  addItem: (product: ProductResult, quantity?: number, color?: string, personalization_method?: string) => void;
  removeItem: (itemId: string) => void;
  updateQty: (itemId: string, quantity: number) => void;
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

      addItem: (product, quantity = 1, color?, personalization_method?) => {
        const items = get().items;
        const id = lineId(product.product_id, color, personalization_method);
        const existing = items.find((i) => i.id === id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === id
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            ),
            lastAdded: { product, quantity },
          });
        } else {
          set({ items: [...items, { id, product, quantity, color, personalization_method }], lastAdded: { product, quantity } });
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

      removeItem: (itemId) => {
        const item = get().items.find((i) => i.id === itemId);
        set({
          items: get().items.filter((i) => i.id !== itemId),
        });
        if (item) {
          trackEvent("cart_remove", {
            product_id: item.product.product_id,
            quantity: item.quantity,
            cart_total_items: get().items.reduce((s, i) => s + i.quantity, 0),
          });
        }
      },

      updateQty: (itemId, quantity) => {
        const item = get().items.find((i) => i.id === itemId);
        if (!item) return;
        const minQty = item.product.min_qty || 1;
        if (quantity < minQty) return;
        const capped = Math.min(quantity, MAX_QTY);
        set({
          items: get().items.map((i) =>
            i.id === itemId ? { ...i, quantity: capped } : i,
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
    {
      name: "diezypunto-quote",
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as QuoteState;
        if (version === 0 && state.items) {
          // Fix items from before compound lineId migration — old items lack "||" in id
          const seen = new Set<string>();
          state.items = state.items
            .map((item) => ({
              ...item,
              id: item.id?.includes("||")
                ? item.id
                : lineId((item as any).product?.product_id ?? "", item.color, item.personalization_method),
            }))
            .filter((item) => {
              if (seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            });
        }
        return state;
      },
    },
  ),
);
