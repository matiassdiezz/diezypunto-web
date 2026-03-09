import { create } from "zustand";
import type { ProductResult } from "../types";
import { searchProducts, refineSearch } from "../api";

const HISTORY_KEY = "diezypunto-search-history";
const MAX_HISTORY = 5;

function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(query: string) {
  if (typeof window === "undefined") return;
  try {
    const normalized = query.trim().toLowerCase();
    const prev = loadHistory();
    const deduped = prev.filter((q) => q.trim().toLowerCase() !== normalized);
    const next = [query.trim(), ...deduped].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable
  }
}

interface SearchState {
  sessionId: string | null;
  query: string;
  results: ProductResult[];
  summary: string;
  isLoading: boolean;
  error: string | null;
  searchTime: number | null;
  search: (query: string) => Promise<void>;
  refine: (query: string) => Promise<void>;
  clear: () => void;
  getHistory: () => string[];
}

export const useSearchStore = create<SearchState>((set, get) => ({
  sessionId: null,
  query: "",
  results: [],
  summary: "",
  isLoading: false,
  error: null,
  searchTime: null,

  search: async (query: string) => {
    const start = Date.now();
    set({ isLoading: true, error: null, query, searchTime: null });
    try {
      const res = await searchProducts(query, get().sessionId);
      const elapsed = Date.now() - start;
      set({
        sessionId: res.session_id,
        results: res.products,
        summary: res.summary,
        isLoading: false,
        searchTime: elapsed,
      });
      if (res.products.length > 0) {
        saveHistory(query);
      }
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Error de busqueda",
        isLoading: false,
        searchTime: null,
      });
    }
  },

  refine: async (query: string) => {
    const sid = get().sessionId;
    if (!sid) return get().search(query);

    const start = Date.now();
    set({ isLoading: true, error: null, searchTime: null });
    try {
      const res = await refineSearch(sid, query);
      const elapsed = Date.now() - start;
      set({
        results: res.products,
        summary: res.summary,
        isLoading: false,
        searchTime: elapsed,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Error refinando busqueda",
        isLoading: false,
        searchTime: null,
      });
    }
  },

  clear: () =>
    set({
      sessionId: null,
      query: "",
      results: [],
      summary: "",
      isLoading: false,
      error: null,
      searchTime: null,
    }),

  getHistory: loadHistory,
}));
