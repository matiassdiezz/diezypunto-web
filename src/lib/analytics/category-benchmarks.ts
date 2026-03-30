import type {
  AnalyticsCategoryBenchmark,
  AnalyticsSite,
  CompetitorAnalyticsSnapshot,
} from "./competitor-snapshot";

const PRICE_ALIGNMENT_TOLERANCE_PCT = 5;

function getMedian(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function buildSiteCategoryKey(siteId: AnalyticsSite["id"], category: string) {
  return `${siteId}::${category}`;
}

export function buildCategoryBenchmarks(
  snapshot: Pick<
    CompetitorAnalyticsSnapshot,
    "sites" | "products" | "matches" | "normalizedCategories"
  >,
): AnalyticsCategoryBenchmark[] {
  const ownProductsByCategory = new Map<string, typeof snapshot.products>();
  const competitorProductsBySiteCategory = new Map<string, typeof snapshot.products>();
  const matchesBySiteCategory = new Map<string, typeof snapshot.matches>();

  for (const category of snapshot.normalizedCategories) {
    ownProductsByCategory.set(category, []);
  }

  for (const product of snapshot.products) {
    if (product.siteId === "diezypunto") {
      const current = ownProductsByCategory.get(product.normalizedCategory) ?? [];
      current.push(product);
      ownProductsByCategory.set(product.normalizedCategory, current);
      continue;
    }

    const key = buildSiteCategoryKey(product.siteId, product.normalizedCategory);
    const current = competitorProductsBySiteCategory.get(key) ?? [];
    current.push(product);
    competitorProductsBySiteCategory.set(key, current);
  }

  for (const match of snapshot.matches) {
    const key = buildSiteCategoryKey(match.siteId, match.ourNormalizedCategory);
    const current = matchesBySiteCategory.get(key) ?? [];
    current.push(match);
    matchesBySiteCategory.set(key, current);
  }

  const benchmarks: AnalyticsCategoryBenchmark[] = [];

  for (const site of snapshot.sites) {
    if (site.id === "diezypunto") {
      continue;
    }

    for (const category of snapshot.normalizedCategories) {
      const ownProducts = ownProductsByCategory.get(category) ?? [];
      const competitorProducts =
        competitorProductsBySiteCategory.get(buildSiteCategoryKey(site.id, category)) ?? [];
      const categoryMatches =
        matchesBySiteCategory.get(buildSiteCategoryKey(site.id, category)) ?? [];
      const pricedMatches = categoryMatches.filter(
        (match) => match.ourPriceArs != null && match.competitorPriceArs != null,
      );
      const matchedOwnIds = new Set(categoryMatches.map((match) => match.ourProductId));
      const matchedCompetitorIds = new Set(
        categoryMatches.map((match) => match.competitorProductId),
      );
      const ownMedianPrice = getMedian(
        ownProducts
          .map((product) => product.priceArs)
          .filter((price): price is number => price != null),
      );
      const competitorMedianPrice = getMedian(
        competitorProducts
          .map((product) => product.priceArs)
          .filter((price): price is number => price != null),
      );
      const medianPriceGapArs = getMedian(
        pricedMatches
          .map((match) => match.priceGapArs)
          .filter((gap): gap is number => gap != null),
      );
      const medianPriceGapPct = getMedian(
        pricedMatches
          .map((match) => match.priceGapPct)
          .filter((gap): gap is number => gap != null),
      );

      if (
        ownProducts.length === 0 &&
        competitorProducts.length === 0 &&
        categoryMatches.length === 0
      ) {
        continue;
      }

      const cheaperMatchCount = pricedMatches.filter(
        (match) => (match.priceGapPct ?? 0) < -PRICE_ALIGNMENT_TOLERANCE_PCT,
      ).length;
      const pricierMatchCount = pricedMatches.filter(
        (match) => (match.priceGapPct ?? 0) > PRICE_ALIGNMENT_TOLERANCE_PCT,
      ).length;
      const alignedMatchCount = pricedMatches.length - cheaperMatchCount - pricierMatchCount;
      const overlapBase = Math.min(ownProducts.length, competitorProducts.length);
      const overlapComparableCount = Math.min(matchedOwnIds.size, matchedCompetitorIds.size);

      benchmarks.push({
        siteId: site.id,
        siteName: site.name,
        domain: site.domain,
        normalizedCategory: category,
        ownProductCount: ownProducts.length,
        competitorProductCount: competitorProducts.length,
        catalogDeltaCount: ownProducts.length - competitorProducts.length,
        matchedProductCount: categoryMatches.length,
        pricedMatchCount: pricedMatches.length,
        catalogOverlapPct:
          overlapBase > 0 ? Math.min((overlapComparableCount / overlapBase) * 100, 100) : null,
        pricedMatchCoveragePct:
          categoryMatches.length > 0 ? (pricedMatches.length / categoryMatches.length) * 100 : null,
        ownMedianPrice,
        competitorMedianPrice,
        medianPriceGapArs,
        medianPriceGapPct,
        cheaperMatchCount,
        alignedMatchCount,
        pricierMatchCount,
      });
    }
  }

  return benchmarks.sort(
    (left, right) =>
      left.normalizedCategory.localeCompare(right.normalizedCategory, "es") ||
      left.siteName.localeCompare(right.siteName, "es"),
  );
}
