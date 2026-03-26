import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductResult } from "../types";

const MAX_ITEMS = 8;

interface RecentlyViewedState {
  products: ProductResult[];
  addProduct: (product: ProductResult) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (product) => {
        const current = get().products.filter(
          (p) => p.product_id !== product.product_id,
        );
        set({ products: [product, ...current].slice(0, MAX_ITEMS) });
      },
    }),
    { name: "diezypunto-recently-viewed" },
  ),
);
