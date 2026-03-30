export type AnalyticsSiteId =
  | "diezypunto"
  | "merch"
  | "grupovelski"
  | "kapoi";

export type PriceStatus = "priced" | "hidden" | "placeholder" | "unknown";

export type PriceBasis =
  | "final"
  | "plus_vat"
  | "from_price"
  | "placeholder"
  | "hidden"
  | "unknown";

export type AnalyticsSite = {
  id: AnalyticsSiteId;
  name: string;
  domain: string;
  color: string;
};

export type AnalyticsProduct = {
  id: string;
  siteId: AnalyticsSiteId;
  siteName: string;
  domain: string;
  title: string;
  normalizedTitle: string;
  matchKey: string;
  canonicalTitle: string;
  productFamily: string;
  url: string;
  rawCategories: string[];
  normalizedCategory: string;
  priceArs: number | null;
  priceStatus: PriceStatus;
  priceBasis: PriceBasis;
  priceLabel: string | null;
  notes: string | null;
};

export type AnalyticsMatch = {
  siteId: Exclude<AnalyticsSiteId, "diezypunto">;
  siteName: string;
  domain: string;
  matchType: "exact_normalized_title" | "canonical_title_family" | "manual_override";
  matchScore: number;
  matchNote?: string | null;
  ourProductId: string;
  ourTitle: string;
  ourUrl: string;
  ourRawCategories: string[];
  ourNormalizedCategory: string;
  ourPriceArs: number | null;
  competitorProductId: string;
  competitorTitle: string;
  competitorUrl: string;
  competitorRawCategories: string[];
  competitorNormalizedCategory: string;
  competitorPriceArs: number | null;
  competitorPriceStatus: PriceStatus;
  competitorPriceBasis: PriceBasis;
  priceGapArs: number | null;
  priceGapPct: number | null;
};

export type AnalyticsCategoryBenchmark = {
  siteId: Exclude<AnalyticsSiteId, "diezypunto">;
  siteName: string;
  domain: string;
  normalizedCategory: string;
  ownProductCount: number;
  competitorProductCount: number;
  catalogDeltaCount: number;
  matchedProductCount: number;
  pricedMatchCount: number;
  catalogOverlapPct: number | null;
  pricedMatchCoveragePct: number | null;
  ownMedianPrice: number | null;
  competitorMedianPrice: number | null;
  medianPriceGapArs: number | null;
  medianPriceGapPct: number | null;
  cheaperMatchCount: number;
  alignedMatchCount: number;
  pricierMatchCount: number;
};

export type ManualMatchOverride = {
  siteId: Exclude<AnalyticsSiteId, "diezypunto">;
  ourProductId: string;
  competitorProductId: string;
  note: string;
  score?: number;
};

export type CompetitorAnalyticsSnapshot = {
  generatedAt: string;
  snapshotDate: string;
  notes: string[];
  sites: AnalyticsSite[];
  normalizedCategories: string[];
  products: AnalyticsProduct[];
  matches: AnalyticsMatch[];
  categoryBenchmarks?: AnalyticsCategoryBenchmark[];
};

export const ANALYTICS_SITES: AnalyticsSite[] = [
  {
    id: "diezypunto",
    name: "Diez y Punto",
    domain: "diezypunto-web.vercel.app",
    color: "#59C6F2",
  },
  {
    id: "merch",
    name: "Merch",
    domain: "merch.com.ar",
    color: "#0F766E",
  },
  {
    id: "grupovelski",
    name: "Grupo Velski",
    domain: "grupovelski.com",
    color: "#1D4ED8",
  },
  {
    id: "kapoi",
    name: "Kapoi",
    domain: "kapoi.com.ar",
    color: "#C2410C",
  },
];
