import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuoteItem, ProductResult } from "../types";
import { trackEvent } from "../analytics-client";

interface AddItemOptions {
  color?: string;
  personalizationMethod?: string;
}

function buildQuoteItemId(
  productId: string,
  color?: string,
  personalizationMethod?: string,
): string {
  const normalizedColor = color?.trim().toLowerCase() || "sin-color";
  const normalizedMethod =
    personalizationMethod?.trim().toLowerCase() || "sin-metodo";
  return `${productId}::${normalizedColor}::${normalizedMethod}`;
}

function normalizePersistedItem(
  item: Partial<QuoteItem> | undefined,
): QuoteItem | null {
  if (!item?.product?.product_id) return null;
  return {
    id:
      item.id ??
      buildQuoteItemId(
        item.product.product_id,
        item.color,
        item.personalization_method,
      ),
    product: item.product,
    quantity: item.quantity ?? 1,
    color: item.color,
    personalization_method: item.personalization_method,
  };
}

interface QuoteState {
  items: QuoteItem[];
  lastAdded: { itemId: string; product: ProductResult; quantity: number } | null;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  addItem: (product: ProductResult, quantity?: number, options?: AddItemOptions) => void;
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

      addItem: (product, quantity = 1, options) => {
        const items = get().items;
        const itemId = buildQuoteItemId(
          product.product_id,
          options?.color,
          options?.personalizationMethod,
        );
        const existing = items.find((i) => i.id === itemId);
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === itemId
                ? {
                    ...i,
                    quantity: i.quantity + quantity,
                    color: options?.color ?? i.color,
                    personalization_method:
                      options?.personalizationMethod ?? i.personalization_method,
                  }
                : i,
            ),
            lastAdded: { itemId, product, quantity },
          });
        } else {
          set({
            items: [
              ...items,
              {
                id: itemId,
                product,
                quantity,
                color: options?.color,
                personalization_method: options?.personalizationMethod,
              },
            ],
            lastAdded: { itemId, product, quantity },
          });
        }
        const newItems = get().items;
        trackEvent("cart_add", {
          product_id: product.product_id,
          title: product.title,
          category: product.category,
          quantity,
          price: product.price,
          color: options?.color,
          personalization_method: options?.personalizationMethod,
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
        if (quantity < 1) return; // Minimum 1 unit
        set({
          items: get().items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i,
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
      version: 2,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return persistedState as QuoteState;
        }

        const state = persistedState as Partial<QuoteState> & {
          items?: Partial<QuoteItem>[];
        };

        return {
          ...state,
          items: (state.items ?? [])
            .map(normalizePersistedItem)
            .filter((item): item is QuoteItem => item !== null),
          lastAdded: state.lastAdded?.product?.product_id
            ? {
                itemId:
                  state.lastAdded.itemId ??
                  buildQuoteItemId(state.lastAdded.product.product_id),
                product: state.lastAdded.product,
                quantity: state.lastAdded.quantity,
              }
            : null,
        } as QuoteState;
      },
    },
  ),
);
