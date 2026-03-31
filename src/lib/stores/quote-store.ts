import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuoteItem, ProductResult } from "../types";
import { trackEvent } from "../analytics-client";
import { getMinQty } from "../product-utils";

export const MAX_QTY = 99999;

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
    id: buildQuoteItemId(
      item.product.product_id,
      item.color,
      item.personalization_method,
    ),
    product: item.product,
    quantity: Math.max(
      getMinQty(item.product),
      Math.min(item.quantity ?? 1, MAX_QTY),
    ),
    color: item.color,
    personalization_method: item.personalization_method,
  };
}

function dedupePersistedItems(items: Partial<QuoteItem>[] = []): QuoteItem[] {
  const merged = new Map<string, QuoteItem>();

  for (const rawItem of items) {
    const item = normalizePersistedItem(rawItem);
    if (!item) continue;

    const existing = merged.get(item.id);
    if (existing) {
      merged.set(item.id, {
        ...existing,
        quantity: Math.min(existing.quantity + item.quantity, MAX_QTY),
      });
      continue;
    }

    merged.set(item.id, item);
  }

  return Array.from(merged.values());
}

interface QuoteState {
  items: QuoteItem[];
  lastAdded: { itemId: string; product: ProductResult; quantity: number } | null;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  addItem: (
    product: ProductResult,
    quantity?: number,
    options?: AddItemOptions,
  ) => void;
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
        const normalizedQty = Math.max(
          getMinQty(product),
          Math.min(quantity, MAX_QTY),
        );
        const itemId = buildQuoteItemId(
          product.product_id,
          options?.color,
          options?.personalizationMethod,
        );
        const existing = items.find((item) => item.id === itemId);

        if (existing) {
          set({
            items: items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    quantity: Math.min(item.quantity + normalizedQty, MAX_QTY),
                    color: options?.color ?? item.color,
                    personalization_method:
                      options?.personalizationMethod ??
                      item.personalization_method,
                  }
                : item,
            ),
            lastAdded: { itemId, product, quantity: normalizedQty },
          });
        } else {
          set({
            items: [
              ...items,
              {
                id: itemId,
                product,
                quantity: normalizedQty,
                color: options?.color,
                personalization_method: options?.personalizationMethod,
              },
            ],
            lastAdded: { itemId, product, quantity: normalizedQty },
          });
        }

        const newItems = get().items;
        trackEvent("cart_add", {
          product_id: product.product_id,
          title: product.title,
          category: product.category,
          quantity: normalizedQty,
          price: product.price,
          color: options?.color,
          personalization_method: options?.personalizationMethod,
          cart_total_items: newItems.reduce((sum, item) => sum + item.quantity, 0),
          referrer: typeof window !== "undefined" ? document.referrer : "",
        });
      },

      removeItem: (itemId) => {
        const item = get().items.find((entry) => entry.id === itemId);
        set({
          items: get().items.filter((entry) => entry.id !== itemId),
        });
        if (item) {
          trackEvent("cart_remove", {
            product_id: item.product.product_id,
            quantity: item.quantity,
            cart_total_items: get().items.reduce(
              (sum, entry) => sum + entry.quantity,
              0,
            ),
          });
        }
      },

      updateQty: (itemId, quantity) => {
        const item = get().items.find((entry) => entry.id === itemId);
        if (!item) return;

        const minQty = getMinQty(item.product);
        if (quantity < minQty) return;

        const capped = Math.min(quantity, MAX_QTY);
        set({
          items: get().items.map((entry) =>
            entry.id === itemId ? { ...entry, quantity: capped } : entry,
          ),
        });
      },

      clearCart: () => {
        const items = get().items;
        trackEvent("cart_clear", {
          items_count: items.length,
          total_qty: items.reduce((sum, item) => sum + item.quantity, 0),
        });
        set({ items: [], lastSyncedAt: null });
      },

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setSyncedAt: (timestamp) =>
        set({ lastSyncedAt: timestamp, isSyncing: false }),
    }),
    {
      name: "diezypunto-quote",
      version: 3,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return persistedState as QuoteState;
        }

        const state = persistedState as Partial<QuoteState> & {
          items?: Partial<QuoteItem>[];
        };
        const items = dedupePersistedItems(state.items);
        const lastAddedProduct = state.lastAdded?.product;
        const lastAddedItem =
          lastAddedProduct &&
          items.find(
            (item) => item.product.product_id === lastAddedProduct.product_id,
          );

        return {
          ...state,
          items,
          lastAdded: lastAddedProduct
            ? {
                itemId:
                  state.lastAdded?.itemId ??
                  lastAddedItem?.id ??
                  buildQuoteItemId(lastAddedProduct.product_id),
                product: lastAddedProduct,
                quantity:
                  state.lastAdded?.quantity ?? lastAddedItem?.quantity ?? 1,
              }
            : null,
        } as QuoteState;
      },
    },
  ),
);
