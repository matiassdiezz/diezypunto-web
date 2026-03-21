import topPicksData from "@/data/top-picks.json";
import { getLocalProduct } from "@/lib/engine/local-catalog";
import type { ProductResult } from "@/lib/types";

const picks = topPicksData as Record<string, string[]>;

export function getTopPickIds(category?: string): string[] {
  if (category && picks[category]) return picks[category];
  return picks.general || [];
}

export function getTopPickProducts(category?: string): ProductResult[] {
  const ids = getTopPickIds(category);
  return ids
    .map((id) => getLocalProduct(id))
    .filter((p): p is ProductResult => p !== null);
}
