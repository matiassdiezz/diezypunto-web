/* Ranking engine — TypeScript port of kairos-merch-core's rank_products */

import type { ProductResult } from "../types";

export interface ExtractedNeeds {
  event_type?: string;
  audience?: string;
  quantity?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  budget_range?: [number, number] | null;
  desired_categories?: string[];
  style_keywords?: string[];
  urgency?: "low" | "normal" | "high" | "urgent";
  must_have_constraints?: string[];
  preferred_materials?: string[];
  personalization_needed?: boolean | null;
  brand_profile?: string;
  unknown_required_fields?: string[];
}

interface ScoredProduct extends ProductResult {
  score: number;
  reason: string;
}

const WEIGHTS: Record<string, number> = {
  semantic_relevance: 0.25,
  quantity_match: 0.15,
  price_range_match: 0.15,
  delivery_speed: 0.1,
  personalization_fit: 0.15,
  commercial_priority: 0.1,
  popularity: 0.1,
};

const CATEGORY_BOOSTS: Record<string, number> = {
  drinkware: 1.2,
  bags: 1.1,
  apparel: 1.1,
  kits: 1.15,
  tech: 1.0,
  premium: 0.9,
};

function scoreSemantic(product: ProductResult, needs: ExtractedNeeds): number {
  const corpus =
    `${product.title} ${product.description} ${product.category} ${product.subcategory} ${product.materials.join(" ")}`.toLowerCase();

  const keywords = [
    ...(needs.desired_categories || []),
    ...(needs.style_keywords || []),
    ...(needs.must_have_constraints || []),
    ...(needs.preferred_materials || []),
  ];

  if (keywords.length === 0) return 0.5;

  let matches = 0;
  for (const kw of keywords) {
    const kwl = kw.toLowerCase();
    if (corpus.includes(kwl)) {
      matches++;
    } else {
      // Simple stem: try without trailing 's'
      const stem = kwl.endsWith("s") ? kwl.slice(0, -1) : kwl + "s";
      if (corpus.includes(stem)) matches++;
    }
  }

  return Math.min(1.0, matches / keywords.length);
}

function scoreQuantity(product: ProductResult, needs: ExtractedNeeds): number {
  if (!needs.quantity) return 0.5;
  if (product.min_qty <= needs.quantity) return 1.0;
  return Math.max(0, needs.quantity / product.min_qty);
}

function scorePrice(product: ProductResult, needs: ExtractedNeeds): number {
  const low = needs.budget_min ?? needs.budget_range?.[0];
  const high = needs.budget_max ?? needs.budget_range?.[1];
  if ((!low && !high) || product.price == null) return 0.5;
  const lo = low || 0;
  const hi = high || lo * 3 || 999999;
  if (product.price >= lo && product.price <= hi) return 1.0;
  if (product.price < lo) return 0.7;
  const overshoot = hi > 0 ? (product.price - hi) / hi : 1.0;
  return Math.max(0, 1.0 - overshoot);
}

function scoreDelivery(product: ProductResult, needs: ExtractedNeeds): number {
  if (product.lead_time_days == null) return 0.5;
  const maxDays: Record<string, number> = {
    urgent: 5,
    high: 10,
    normal: 20,
    low: 60,
  };
  const max = maxDays[needs.urgency || "normal"] || 20;
  if (product.lead_time_days <= max) return 1.0;
  const excess = product.lead_time_days - max;
  return Math.max(0, 1.0 + -0.005 * excess * 10);
}

function scorePersonalization(
  product: ProductResult,
  needs: ExtractedNeeds,
): number {
  if (needs.personalization_needed == null) return 0.5;
  if (!needs.personalization_needed) return 1.0;
  return product.personalization_methods.length > 0 ? 1.0 : 0.1;
}

export function rankProducts(
  products: ProductResult[],
  needs: ExtractedNeeds,
  maxResults = 15,
): ScoredProduct[] {
  const scored: ScoredProduct[] = products.map((product) => {
    const breakdown: Record<string, number> = {
      semantic_relevance: scoreSemantic(product, needs),
      quantity_match: scoreQuantity(product, needs),
      price_range_match: scorePrice(product, needs),
      delivery_speed: scoreDelivery(product, needs),
      personalization_fit: scorePersonalization(product, needs),
      commercial_priority:
        CATEGORY_BOOSTS[product.subcategory] || 1.0,
      popularity: 0.5,
    };

    const total = Object.entries(breakdown).reduce(
      (sum, [k, v]) => sum + v * (WEIGHTS[k] || 0),
      0,
    );
    const score = Math.round(Math.max(0, Math.min(1, total)) * 1000) / 1000;

    // Build reason
    const reasons: string[] = [];
    if (breakdown.semantic_relevance >= 0.7)
      reasons.push("Coincide con lo que buscas");
    if (breakdown.quantity_match >= 0.8) reasons.push("Cantidad compatible");
    if (breakdown.price_range_match >= 0.8)
      reasons.push("Dentro de tu presupuesto");
    if (breakdown.personalization_fit >= 0.8 && needs.personalization_needed)
      reasons.push("Soporta personalizacion");
    if (
      breakdown.delivery_speed >= 0.8 &&
      (needs.urgency === "urgent" || needs.urgency === "high")
    )
      reasons.push("Entrega rapida");

    const reason =
      reasons.length > 0
        ? reasons.join(". ")
        : `Categoria: ${product.category}`;

    return { ...product, score, reason };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults);
}
