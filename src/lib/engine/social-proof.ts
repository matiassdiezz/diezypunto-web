/** Social proof labels — static mapping by category/attribute */

import type { ProductResult } from "../types";

const CATEGORY_LABELS: Record<string, string> = {
  "Drinkware": "Clasico corporativo",
  "Escritura": "Infaltable en cualquier kit",
  "Bolsos y Mochilas": "Top para eventos",
};

export function getSocialProofLabel(product: ProductResult): string | null {
  if (product.eco_friendly) return "Elegido por empresas sustentables";
  if (product.premium_tier) return "Para regalos ejecutivos";
  return CATEGORY_LABELS[product.category] ?? null;
}
