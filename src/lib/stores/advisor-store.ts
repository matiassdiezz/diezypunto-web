import { create } from "zustand";
import type { AdvisorContext, AdvisorResponse, ProductResult } from "../types";

type Step = "event" | "audience" | "budget" | "extra" | "loading" | "results";

interface AdvisorState {
  isOpen: boolean;
  step: Step;
  context: AdvisorContext;
  results: AdvisorResponse | null;
  products: ProductResult[];
  error: string | null;

  open: () => void;
  close: () => void;
  setStep: (step: Step) => void;
  setContext: (partial: Partial<AdvisorContext>) => void;
  setResults: (results: AdvisorResponse, products: ProductResult[]) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialContext: AdvisorContext = {
  event_type: "",
  audience_size: "",
  budget_range: "",
  extra: "",
};

export const useAdvisorStore = create<AdvisorState>((set) => ({
  isOpen: false,
  step: "event",
  context: { ...initialContext },
  results: null,
  products: [],
  error: null,

  open: () => set({ isOpen: true, step: "event", context: { ...initialContext }, results: null, products: [], error: null }),
  close: () => set({ isOpen: false }),
  setStep: (step) => set({ step }),
  setContext: (partial) =>
    set((s) => ({ context: { ...s.context, ...partial } })),
  setResults: (results, products) => set({ results, products, step: "results" }),
  setError: (error) => set({ error, step: "event" }),
  reset: () => set({ step: "event", context: { ...initialContext }, results: null, products: [], error: null }),
}));
