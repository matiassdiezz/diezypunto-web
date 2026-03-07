import { create } from "zustand";
import type { ProductResult } from "../types";
import { searchProducts, refineSearch } from "../api";

interface SearchState {
  sessionId: string | null;
  query: string;
  results: ProductResult[];
  needs: Record<string, unknown>;
  summary: string;
  isLoading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  refine: (query: string) => Promise<void>;
  clear: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  sessionId: null,
  query: "",
  results: [],
  needs: {},
  summary: "",
  isLoading: false,
  error: null,

  search: async (query: string) => {
    set({ isLoading: true, error: null, query });
    try {
      const res = await searchProducts(query, get().sessionId);
      set({
        sessionId: res.session_id,
        results: res.products,
        needs: res.extracted_needs,
        summary: res.summary,
        isLoading: false,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Error de busqueda",
        isLoading: false,
      });
    }
  },

  refine: async (query: string) => {
    const sid = get().sessionId;
    if (!sid) return get().search(query);

    set({ isLoading: true, error: null });
    try {
      const res = await refineSearch(sid, query);
      set({
        results: res.products,
        needs: res.extracted_needs,
        summary: res.summary,
        isLoading: false,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Error refinando busqueda",
        isLoading: false,
      });
    }
  },

  clear: () =>
    set({
      sessionId: null,
      query: "",
      results: [],
      needs: {},
      summary: "",
      isLoading: false,
      error: null,
    }),
}));
