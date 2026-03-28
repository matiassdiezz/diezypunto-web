"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useState, type ReactNode } from "react";
import type {
  AnalyticsMatch,
  AnalyticsProduct,
  AnalyticsSite,
  AnalyticsSiteId,
  CompetitorAnalyticsSnapshot,
  PriceStatus,
} from "@/lib/analytics/competitor-snapshot";

const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("es-AR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const countDeltaFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 1,
});

const PRICE_BUCKETS = [
  { label: "Hasta $500", min: 0, max: 500 },
  { label: "$500 a $1.500", min: 500, max: 1500 },
  { label: "$1.500 a $5.000", min: 1500, max: 5000 },
  { label: "$5.000 a $15.000", min: 5000, max: 15000 },
  { label: "$15.000 a $50.000", min: 15000, max: 50000 },
  { label: "Más de $50.000", min: 50000, max: Number.POSITIVE_INFINITY },
];

function formatCurrency(value: number | null) {
  return value == null ? "Sin precio usable" : priceFormatter.format(value);
}

function formatCompact(value: number) {
  return compactNumberFormatter.format(value);
}

function formatPercent(value: number | null) {
  return value == null ? "N/D" : `${value.toFixed(1)}%`;
}

function formatSignedPercent(value: number | null) {
  return value == null ? "N/D" : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatSignedCount(value: number | null) {
  if (value == null) return "N/D";
  return `${value > 0 ? "+" : value < 0 ? "-" : ""}${countDeltaFormatter.format(Math.abs(value))}`;
}

function formatSignedCurrency(value: number | null) {
  if (value == null) return "N/D";
  if (value === 0) return formatCurrency(0);
  return `${value > 0 ? "+" : "-"}${priceFormatter.format(Math.abs(value))}`;
}

function formatMatchType(value: AnalyticsMatch["matchType"]) {
  switch (value) {
    case "exact_normalized_title":
      return "Exacto";
    case "manual_override":
      return "Manual";
    case "canonical_title_family":
      return "Canónico";
    default:
      return value;
  }
}

function matchTypeClass(value: AnalyticsMatch["matchType"]) {
  switch (value) {
    case "exact_normalized_title":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "manual_override":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "canonical_title_family":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    default:
      return "bg-zinc-100 text-zinc-700 ring-zinc-200";
  }
}

function getMedian(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function getAverage(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatPriceStatus(status: PriceStatus) {
  switch (status) {
    case "priced":
      return "Con precio";
    case "hidden":
      return "Sin precio público";
    case "placeholder":
      return "Placeholder técnico";
    default:
      return "Desconocido";
  }
}

function getPriceStatusClass(status: PriceStatus) {
  switch (status) {
    case "priced":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "hidden":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "placeholder":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    default:
      return "bg-zinc-100 text-zinc-600 ring-zinc-200";
  }
}

function matchesSearch(product: AnalyticsProduct, search: string) {
  if (!search) return true;
  const haystack = [
    product.title,
    product.siteName,
    product.normalizedCategory,
    ...product.rawCategories,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
}

function matchesSearchInMatch(match: AnalyticsMatch, search: string) {
  if (!search) return true;
  const haystack = [
    match.siteName,
    match.ourTitle,
    match.competitorTitle,
    match.ourNormalizedCategory,
    match.competitorNormalizedCategory,
    ...match.ourRawCategories,
    ...match.competitorRawCategories,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
}

function parsePriceBound(value: string) {
  const parsed = Number(value.trim().replace(/\./g, "").replace(/,/g, "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function siteColor(site: AnalyticsSite) {
  return {
    backgroundColor: `${site.color}16`,
    borderColor: `${site.color}33`,
    color: site.color,
  };
}

function gapToneClass(value: number | null, inverted = false) {
  if (value == null) return "text-slate-500";

  const normalized = inverted ? value * -1 : value;
  if (normalized > 0) return "text-rose-600";
  if (normalized < 0) return "text-emerald-600";
  return "text-slate-700";
}

export default function CompetitorAnalyticsDashboard({
  snapshot,
}: {
  snapshot: CompetitorAnalyticsSnapshot;
}) {
  const [selectedCompetitors, setSelectedCompetitors] = useState<AnalyticsSiteId[]>(
    snapshot.sites.filter((site) => site.id !== "diezypunto").map((site) => site.id),
  );
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceMode, setPriceMode] = useState<"all" | "priced" | "without_usable_price">("all");
  const [scope, setScope] = useState<"all_products" | "exact_matches">("all_products");
  const [matchMode, setMatchMode] = useState<"all" | AnalyticsMatch["matchType"]>("all");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const selectedSiteIds = ["diezypunto", ...selectedCompetitors];
  const minPriceValue = parsePriceBound(minPrice);
  const maxPriceValue = parsePriceBound(maxPrice);

  const filteredMatches = snapshot.matches
    .filter((match) => selectedCompetitors.includes(match.siteId))
    .filter((match) =>
      selectedCategory === "all"
        ? true
        : match.ourNormalizedCategory === selectedCategory ||
          match.competitorNormalizedCategory === selectedCategory,
    )
    .filter((match) => matchesSearchInMatch(match, deferredSearch))
    .filter((match) => {
      if (matchMode === "all") {
        return true;
      }
      return match.matchType === matchMode;
    })
    .filter((match) => {
      if (priceMode === "priced") {
        return match.competitorPriceStatus === "priced";
      }
      if (priceMode === "without_usable_price") {
        return match.competitorPriceStatus !== "priced";
      }
      return true;
    })
    .sort((left, right) => {
      const leftGap = Math.abs(left.priceGapPct ?? 0);
      const rightGap = Math.abs(right.priceGapPct ?? 0);
      if (leftGap !== rightGap) {
        return rightGap - leftGap;
      }
      return left.ourTitle.localeCompare(right.ourTitle, "es");
    });

  const exactMatchProductIds = new Set<string>();
  for (const match of filteredMatches) {
    exactMatchProductIds.add(match.ourProductId);
    exactMatchProductIds.add(match.competitorProductId);
  }

  const filteredProducts = snapshot.products
    .filter((product) => selectedSiteIds.includes(product.siteId))
    .filter((product) =>
      selectedCategory === "all" ? true : product.normalizedCategory === selectedCategory,
    )
    .filter((product) => matchesSearch(product, deferredSearch))
    .filter((product) => {
      if (scope === "exact_matches") {
        return exactMatchProductIds.has(product.id);
      }
      return true;
    })
    .filter((product) => {
      if (priceMode === "priced") {
        return product.priceStatus === "priced";
      }
      if (priceMode === "without_usable_price") {
        return product.priceStatus !== "priced";
      }
      return true;
    })
    .filter((product) => {
      if (product.priceArs == null) {
        return minPriceValue == null && maxPriceValue == null;
      }
      if (minPriceValue != null && product.priceArs < minPriceValue) {
        return false;
      }
      if (maxPriceValue != null && product.priceArs > maxPriceValue) {
        return false;
      }
      return true;
    });

  const pricedProducts = filteredProducts.filter((product) => product.priceStatus === "priced");
  const pricedValues = pricedProducts
    .map((product) => product.priceArs)
    .filter((price): price is number => price != null);
  const selectedSites = snapshot.sites.filter((site) => selectedSiteIds.includes(site.id));

  const siteSummaries = selectedSites.map((site) => {
    const siteProducts = filteredProducts.filter((product) => product.siteId === site.id);
    const sitePrices = siteProducts
      .map((product) => product.priceArs)
      .filter((price): price is number => price != null);
    const exactMatches =
      site.id === "diezypunto"
        ? new Set(filteredMatches.map((match) => match.ourProductId)).size
        : new Set(
            filteredMatches
              .filter((match) => match.siteId === site.id)
              .map((match) => match.competitorProductId),
          ).size;

    return {
      site,
      productCount: siteProducts.length,
      pricedCount: siteProducts.filter((product) => product.priceStatus === "priced").length,
      categoryCount: new Set(siteProducts.map((product) => product.normalizedCategory)).size,
      medianPrice: getMedian(sitePrices),
      averagePrice: getAverage(sitePrices),
      exactMatches,
    };
  });

  const categoryRows = snapshot.normalizedCategories
    .map((category) => {
      const perSite = selectedSites.map((site) => {
        const siteProducts = filteredProducts.filter(
          (product) => product.siteId === site.id && product.normalizedCategory === category,
        );
        const priced = siteProducts
          .map((product) => product.priceArs)
          .filter((price): price is number => price != null);

        return {
          siteId: site.id,
          count: siteProducts.length,
          median: getMedian(priced),
        };
      });

      return {
        category,
        totalCount: perSite.reduce((sum, item) => sum + item.count, 0),
        perSite,
      };
    })
    .filter((row) => row.totalCount > 0)
    .sort((left, right) => right.totalCount - left.totalCount);

  const bucketRows = PRICE_BUCKETS.map((bucket) => ({
    ...bucket,
    perSite: selectedSites.map((site) => {
      const count = filteredProducts.filter(
        (product) =>
          product.siteId === site.id &&
          product.priceArs != null &&
          product.priceArs >= bucket.min &&
          product.priceArs < bucket.max,
      ).length;

      return { siteId: site.id, count };
    }),
  }));

  const productRows = [...filteredProducts].sort((left, right) => {
    if (left.siteId !== right.siteId) {
      return left.siteId.localeCompare(right.siteId);
    }
    return left.title.localeCompare(right.title, "es");
  });

  const exactMatchCount = filteredMatches.filter(
    (match) => match.matchType === "exact_normalized_title",
  ).length;
  const manualMatchCount = filteredMatches.filter(
    (match) => match.matchType === "manual_override",
  ).length;
  const canonicalMatchCount = filteredMatches.filter(
    (match) => match.matchType === "canonical_title_family",
  ).length;
  const competitorSummaries = siteSummaries.filter(({ site }) => site.id !== "diezypunto");
  const strongestCoverageSite = [...competitorSummaries].sort(
    (left, right) => right.exactMatches - left.exactMatches || right.productCount - left.productCount,
  )[0];
  const pricedMatches = filteredMatches.filter(
    (match) => match.ourPriceArs != null && match.competitorPriceArs != null,
  );
  const cheaperMatches = [...pricedMatches]
    .filter((match) => (match.priceGapPct ?? 0) < 0)
    .sort((left, right) => (left.priceGapPct ?? 0) - (right.priceGapPct ?? 0));
  const pricierMatches = [...pricedMatches]
    .filter((match) => (match.priceGapPct ?? 0) > 0)
    .sort((left, right) => (right.priceGapPct ?? 0) - (left.priceGapPct ?? 0));
  const bestPriceWin = cheaperMatches[0] ?? null;
  const worstPriceLoss = pricierMatches[0] ?? null;
  const categoryBalanceRows = snapshot.normalizedCategories
    .map((category) => {
      const ownProductsInCategory = filteredProducts.filter(
        (product) => product.siteId === "diezypunto" && product.normalizedCategory === category,
      );
      const ownPricedValues = ownProductsInCategory
        .map((product) => product.priceArs)
        .filter((price): price is number => price != null);
      const competitorRows = competitorSummaries.map(({ site }) => {
        const products = filteredProducts.filter(
          (product) => product.siteId === site.id && product.normalizedCategory === category,
        );
        const prices = products
          .map((product) => product.priceArs)
          .filter((price): price is number => price != null);

        return {
          count: products.length,
          median: getMedian(prices),
        };
      });

      const competitorCountTotal = competitorRows.reduce((sum, row) => sum + row.count, 0);
      const competitorAverageCount =
        competitorRows.length > 0 ? competitorCountTotal / competitorRows.length : 0;
      const competitorMedianAverage = getAverage(
        competitorRows
          .map((row) => row.median)
          .filter((median): median is number => median != null),
      );

      return {
        category,
        ownCount: ownProductsInCategory.length,
        ownMedian: getMedian(ownPricedValues),
        competitorCountTotal,
        competitorAverageCount,
        competitorMedianAverage,
        deltaCount: ownProductsInCategory.length - competitorAverageCount,
      };
    })
    .filter((row) => row.ownCount > 0 || row.competitorCountTotal > 0);
  const strongestCategory = [...categoryBalanceRows]
    .filter((row) => row.deltaCount > 0)
    .sort((left, right) => right.deltaCount - left.deltaCount)[0];
  const weakestCategory = [...categoryBalanceRows]
    .filter((row) => row.deltaCount < 0)
    .sort((left, right) => left.deltaCount - right.deltaCount)[0];
  const executiveCategoryRows = [...categoryBalanceRows]
    .sort(
      (left, right) =>
        Math.abs(right.deltaCount) - Math.abs(left.deltaCount) ||
        right.ownCount - left.ownCount,
    )
    .slice(0, 10);
  const competitorCoverageRows = competitorSummaries
    .map(({ site, productCount, pricedCount, exactMatches }) => ({
      site,
      productCount,
      pricedCount,
      exactMatches,
      matchCoveragePct: productCount > 0 ? (exactMatches / productCount) * 100 : null,
      priceCoveragePct: productCount > 0 ? (pricedCount / productCount) * 100 : null,
    }))
    .sort(
      (left, right) =>
        (right.matchCoveragePct ?? 0) - (left.matchCoveragePct ?? 0) ||
        right.exactMatches - left.exactMatches,
    );
  const competitorsWithoutUsablePricing = competitorCoverageRows.filter((row) => row.pricedCount === 0);
  const executiveSignals = [
    strongestCoverageSite
      ? {
          label: "Cobertura comparable",
          title: `${strongestCoverageSite.site.name} es hoy la referencia más sólida`,
          detail: `${formatCompact(strongestCoverageSite.exactMatches)} matches visibles sobre ${formatCompact(strongestCoverageSite.productCount)} artículos filtrados.`,
          tone: "neutral" as const,
        }
      : null,
    strongestCategory
      ? {
          label: "Ventaja de surtido",
          title: `${strongestCategory.category} es la categoría más fuerte de DYP`,
          detail: `${formatSignedCount(strongestCategory.deltaCount)} artículos contra el promedio de competidores seleccionados.`,
          tone: "positive" as const,
        }
      : null,
    weakestCategory
      ? {
          label: "Brecha de surtido",
          title: `${weakestCategory.category} es la mayor brecha actual`,
          detail: `${formatSignedCount(weakestCategory.deltaCount)} artículos frente al promedio competidor bajo el filtro activo.`,
          tone: "negative" as const,
        }
      : null,
    competitorsWithoutUsablePricing.length > 0
      ? {
          label: "Limitación de pricing",
          title: `${competitorsWithoutUsablePricing.map((row) => row.site.name).join(" y ")} no aportan precio usable`,
          detail: "La lectura de pricing comparable se apoya principalmente en los matches de Merch bajo el snapshot actual.",
          tone: "neutral" as const,
        }
      : bestPriceWin || worstPriceLoss
        ? {
            label: "Lectura de precio",
            title: worstPriceLoss ? "Hay sobreprecios detectables en DYP" : "DYP conserva ventajas puntuales de precio",
            detail: worstPriceLoss
              ? `${formatSignedPercent(worstPriceLoss.priceGapPct)} en ${worstPriceLoss.ourTitle} frente a ${worstPriceLoss.siteName}.`
              : `${formatSignedPercent(bestPriceWin?.priceGapPct ?? null)} en ${bestPriceWin?.ourTitle} frente a ${bestPriceWin?.siteName}.`,
            tone: worstPriceLoss ? ("negative" as const) : ("positive" as const),
          }
        : null,
  ]
    .filter((item): item is NonNullable<typeof item> => item != null)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(89,198,242,0.14),_transparent_38%),linear-gradient(180deg,_#f8fcff_0%,_#ffffff_28%,_#f8fafc_100%)] px-6 pb-20 pt-28 lg:px-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">
                Analytics
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 lg:text-5xl">
                Benchmark interactivo de Diez y Punto vs competidores
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Snapshot único con comparación de surtido, cobertura de precio, distribución por
                categoría y matches exactos, manuales y canónicos contra Diez y Punto.
              </p>
            </div>
            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-600">
              <div>
                <span className="font-semibold text-slate-900">Snapshot:</span>{" "}
                {snapshot.snapshotDate}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Generado:</span>{" "}
                {new Date(snapshot.generatedAt).toLocaleString("es-AR")}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Productos:</span>{" "}
                {formatCompact(snapshot.products.length)}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Matches:</span>{" "}
                {formatCompact(snapshot.matches.length)}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {snapshot.notes.map((note) => (
              <span
                key={note}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
              >
                {note}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Filtros</h2>
                <p className="mt-1 text-sm text-slate-600">
                  El catálogo de Diez y Punto queda fijo como referencia. Los filtros afectan todas
                  las secciones.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    startTransition(() => setScope("all_products"))
                  }
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    scope === "all_products"
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Todos los productos
                </button>
                <button
                  type="button"
                  onClick={() =>
                    startTransition(() => setScope("exact_matches"))
                  }
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    scope === "exact_matches"
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Solo productos con match
                </button>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
              <label className="grid gap-2 text-sm text-slate-600">
                Buscar producto o categoría
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-accent"
                  placeholder="Ej. bolígrafo, botellas, mochila"
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-600">
                Categoría normalizada
                <select
                  value={selectedCategory}
                  onChange={(event) =>
                    startTransition(() => setSelectedCategory(event.target.value))
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-accent"
                >
                  <option value="all">Todas</option>
                  {snapshot.normalizedCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-slate-600">
                Cobertura de precio
                <select
                  value={priceMode}
                  onChange={(event) =>
                    startTransition(
                      () =>
                        setPriceMode(
                          event.target.value as "all" | "priced" | "without_usable_price",
                        ),
                    )
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-accent"
                >
                  <option value="all">Todo</option>
                  <option value="priced">Solo con precio usable</option>
                  <option value="without_usable_price">Solo sin precio usable</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm text-slate-600">
                Tipo de match
                <select
                  value={matchMode}
                  onChange={(event) =>
                    startTransition(
                      () =>
                        setMatchMode(
                          event.target.value as "all" | AnalyticsMatch["matchType"],
                        ),
                    )
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-accent"
                >
                  <option value="all">Todos</option>
                  <option value="exact_normalized_title">Exacto</option>
                  <option value="manual_override">Manual</option>
                  <option value="canonical_title_family">Canónico</option>
                </select>
              </label>

              <div className="grid gap-2 text-sm text-slate-600">
                <span>Rango de precio ARS</span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-accent"
                    placeholder="Mín."
                  />
                  <input
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-accent"
                    placeholder="Máx."
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {snapshot.sites
                .filter((site) => site.id !== "diezypunto")
                .map((site) => {
                  const active = selectedCompetitors.includes(site.id);
                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() =>
                        startTransition(() =>
                          setSelectedCompetitors((current) =>
                            current.includes(site.id)
                              ? current.filter((value) => value !== site.id)
                              : [...current, site.id],
                          ),
                        )
                      }
                      className={`rounded-full px-4 py-2 text-sm font-medium ring-1 transition ${
                        active
                          ? "bg-slate-950 text-white ring-slate-950"
                          : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {site.name}
                    </button>
                  );
                })}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Productos filtrados"
            value={formatCompact(filteredProducts.length)}
            detail={`${formatCompact(pricedProducts.length)} con precio usable`}
          />
          <MetricCard
            label="Mediana filtrada"
            value={formatCurrency(getMedian(pricedValues))}
            detail="Solo productos con precio usable"
          />
          <MetricCard
            label="Categorías activas"
            value={String(
              new Set(filteredProducts.map((product) => product.normalizedCategory)).size,
            )}
            detail="Esquema unificado"
          />
          <MetricCard
            label="Matches filtrados"
            value={formatCompact(filteredMatches.length)}
            detail={`${exactMatchCount} exactos · ${manualMatchCount} manuales · ${canonicalMatchCount} canónicos`}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard
            title="Hallazgos Clave"
            description="Lectura rápida para presentar el benchmark sin entrar todavía a las tablas operativas."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {executiveSignals.map((signal) => (
                <NarrativeCard
                  key={`${signal.label}-${signal.title}`}
                  label={signal.label}
                  title={signal.title}
                  detail={signal.detail}
                  tone={signal.tone}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Cobertura Por Competidor"
            description="Qué tan comparable quedó cada sitio bajo el filtro actual y cuánta data de precio realmente aporta."
          >
            <div className="grid gap-4">
              {competitorCoverageRows.map((row) => (
                <CoverageCard
                  key={row.site.id}
                  site={row.site}
                  matchCount={row.exactMatches}
                  productCount={row.productCount}
                  matchCoveragePct={row.matchCoveragePct}
                  pricedCount={row.pricedCount}
                  priceCoveragePct={row.priceCoveragePct}
                />
              ))}
            </div>
          </SectionCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          {siteSummaries.map(({ site, productCount, pricedCount, categoryCount, medianPrice, averagePrice, exactMatches }) => (
            <article
              key={site.id}
              className="rounded-[1.75rem] border bg-white p-5 shadow-sm"
              style={siteColor(site)}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{site.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                    {site.domain}
                  </p>
                </div>
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5">
                  {formatCompact(productCount)} artículos
                </span>
              </div>

              <dl className="mt-5 grid gap-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4">
                  <dt>Con precio usable</dt>
                  <dd className="font-semibold text-slate-950">
                    {pricedCount}/{productCount}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Mediana</dt>
                  <dd className="font-semibold text-slate-950">{formatCurrency(medianPrice)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Promedio</dt>
                  <dd className="font-semibold text-slate-950">{formatCurrency(averagePrice)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Categorías</dt>
                  <dd className="font-semibold text-slate-950">{categoryCount}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Matches</dt>
                  <dd className="font-semibold text-slate-950">{exactMatches}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>

        <SectionCard
          title="Lectura Ejecutiva"
          description="Resumen rápido de cobertura comparable, surtido relativo y gaps de precio con data usable."
        >
          <div className="grid gap-4 xl:grid-cols-4">
            <ExecutiveInsightCard
              eyebrow="Cobertura comparable"
              title={
                strongestCoverageSite
                  ? strongestCoverageSite.site.name
                  : "Sin competidores activos"
              }
              value={
                strongestCoverageSite
                  ? `${formatCompact(strongestCoverageSite.exactMatches)} matches`
                  : "N/D"
              }
              detail={
                strongestCoverageSite
                  ? `${formatCompact(strongestCoverageSite.productCount)} artículos filtrados en ${strongestCoverageSite.site.domain}`
                  : "Seleccioná al menos un competidor para medir cobertura."
              }
            />
            <ExecutiveInsightCard
              eyebrow="Fortaleza de surtido"
              title={strongestCategory ? strongestCategory.category : "Sin diferencial claro"}
              value={strongestCategory ? formatSignedCount(strongestCategory.deltaCount) : "N/D"}
              detail={
                strongestCategory
                  ? "Delta de DYP contra el promedio de competidores seleccionados."
                  : "No aparece una ventaja positiva bajo el filtro actual."
              }
              tone="positive"
            />
            <ExecutiveInsightCard
              eyebrow="Brecha de surtido"
              title={weakestCategory ? weakestCategory.category : "Sin brecha clara"}
              value={weakestCategory ? formatSignedCount(weakestCategory.deltaCount) : "N/D"}
              detail={
                weakestCategory
                  ? "Delta de DYP contra el promedio de competidores seleccionados."
                  : "No aparece una desventaja bajo el filtro actual."
              }
              tone="negative"
            />
            <ExecutiveInsightCard
              eyebrow="Lectura de precio"
              title={
                worstPriceLoss
                  ? "Mayor sobreprecio detectado"
                  : bestPriceWin
                    ? "Mayor ventaja detectada"
                    : "Sin precio comparable"
              }
              value={
                worstPriceLoss
                  ? formatSignedPercent(worstPriceLoss.priceGapPct)
                  : bestPriceWin
                    ? formatSignedPercent(bestPriceWin.priceGapPct)
                    : "N/D"
              }
              detail={
                worstPriceLoss
                  ? `${worstPriceLoss.ourTitle} vs ${worstPriceLoss.siteName}`
                  : bestPriceWin
                    ? `${bestPriceWin.ourTitle} vs ${bestPriceWin.siteName}`
                    : "Con los filtros actuales no hay matches con precio usable en ambos lados."
              }
              tone={worstPriceLoss ? "negative" : bestPriceWin ? "positive" : "neutral"}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Oportunidades De Precio"
          description="Productos comparables con precio usable para detectar dónde DYP aparece más caro o más competitivo."
        >
          <div className="grid gap-4 xl:grid-cols-2">
            <OpportunityList
              title="DYP más caro que el competidor"
              emptyLabel="No hay matches filtrados donde DYP quede por encima del competidor."
              items={pricierMatches.slice(0, 6)}
              tone="negative"
            />
            <OpportunityList
              title="DYP más barato que el competidor"
              emptyLabel="No hay matches filtrados donde DYP quede por debajo del competidor."
              items={cheaperMatches.slice(0, 6)}
              tone="positive"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Balance Por Categoría"
          description="Diferencia de surtido de Diez y Punto contra el promedio de los competidores seleccionados."
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-medium">Categoría</th>
                  <th className="px-3 py-3 font-medium">DYP</th>
                  <th className="px-3 py-3 font-medium">Prom. competidor</th>
                  <th className="px-3 py-3 font-medium">Delta</th>
                  <th className="px-3 py-3 font-medium">Mediana DYP</th>
                  <th className="px-3 py-3 font-medium">Mediana comp.</th>
                </tr>
              </thead>
              <tbody>
                {executiveCategoryRows.map((row) => (
                  <tr key={row.category} className="border-t border-slate-100 text-slate-700">
                    <td className="px-3 py-4 font-medium text-slate-950">{row.category}</td>
                    <td className="px-3 py-4">{row.ownCount}</td>
                    <td className="px-3 py-4">
                      {countDeltaFormatter.format(row.competitorAverageCount)}
                    </td>
                    <td className={`px-3 py-4 font-semibold ${gapToneClass(row.deltaCount)}`}>
                      {formatSignedCount(row.deltaCount)}
                    </td>
                    <td className="px-3 py-4">{formatCurrency(row.ownMedian)}</td>
                    <td className="px-3 py-4">{formatCurrency(row.competitorMedianAverage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Comparación por categoría"
          description="Cantidad de artículos y mediana de precio por rubro normalizado."
        >
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-2 font-medium">Categoría</th>
                  {selectedSites.map((site) => (
                    <th key={site.id} className="px-4 py-2 font-medium">
                      {site.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categoryRows.map((row) => (
                  <tr key={row.category} className="rounded-2xl bg-slate-50 text-slate-700">
                    <td className="rounded-l-2xl px-4 py-3 font-medium text-slate-950">
                      {row.category}
                    </td>
                    {row.perSite.map((cell, index) => (
                      <td
                        key={`${row.category}-${cell.siteId}`}
                        className={`px-4 py-3 ${index === row.perSite.length - 1 ? "rounded-r-2xl" : ""}`}
                      >
                        <div className="font-medium text-slate-950">{cell.count}</div>
                        <div className="text-xs text-slate-500">
                          Mediana: {formatCurrency(cell.median)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Distribución de precios"
          description="Buckets simples para leer en qué tramo compite cada sitio cuando sí hay precio usable."
        >
          <div className="grid gap-3">
            {bucketRows.map((bucket) => (
              <div
                key={bucket.label}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold text-slate-950">{bucket.label}</h3>
                </div>
                <div className="grid gap-2">
                  {selectedSites.map((site) => {
                    const value = bucket.perSite.find((item) => item.siteId === site.id)?.count ?? 0;
                    const maxValue = Math.max(
                      1,
                      ...bucket.perSite.map((item) => item.count),
                    );
                    return (
                      <div key={`${bucket.label}-${site.id}`} className="grid gap-1">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>{site.name}</span>
                          <span>{value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${(value / maxValue) * 100}%`,
                              backgroundColor: site.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Matches con Diez y Punto"
          description="Tabla operativa de artículos comparables por match exacto, manual curado o canónico."
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-medium">Producto DYP</th>
                  <th className="px-3 py-3 font-medium">Competidor</th>
                  <th className="px-3 py-3 font-medium">Tipo</th>
                  <th className="px-3 py-3 font-medium">Categoría</th>
                  <th className="px-3 py-3 font-medium">Precio DYP</th>
                  <th className="px-3 py-3 font-medium">Precio comp.</th>
                  <th className="px-3 py-3 font-medium">Gap</th>
                  <th className="px-3 py-3 font-medium">Gap %</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.slice(0, 250).map((match) => (
                  <tr
                    key={`${match.siteId}-${match.ourProductId}-${match.competitorProductId}`}
                    className="border-t border-slate-100 text-slate-700"
                  >
                    <td className="px-3 py-4">
                      <Link href={match.ourUrl} target="_blank" className="font-medium text-slate-950 hover:text-accent">
                        {match.ourTitle}
                      </Link>
                    </td>
                    <td className="px-3 py-4">
                      <div className="font-medium text-slate-950">{match.siteName}</div>
                      <Link href={match.competitorUrl} target="_blank" className="text-xs text-slate-500 hover:text-accent">
                        {match.competitorTitle}
                      </Link>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ring-1 ${matchTypeClass(
                          match.matchType,
                        )}`}
                      >
                        {formatMatchType(match.matchType)}
                      </span>
                      <div className="mt-1 text-xs text-slate-500">
                        Score {match.matchScore.toFixed(2)}
                      </div>
                      {match.matchNote ? (
                        <div className="mt-1 max-w-[16rem] text-xs leading-5 text-slate-500">
                          {match.matchNote}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-4">{match.ourNormalizedCategory}</td>
                    <td className="px-3 py-4">{formatCurrency(match.ourPriceArs)}</td>
                    <td className="px-3 py-4">
                      <div>{formatCurrency(match.competitorPriceArs)}</div>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-1 text-[11px] font-medium ring-1 ${getPriceStatusClass(
                          match.competitorPriceStatus,
                        )}`}
                      >
                        {formatPriceStatus(match.competitorPriceStatus)}
                      </span>
                    </td>
                    <td className="px-3 py-4">{formatCurrency(match.priceGapArs)}</td>
                    <td className="px-3 py-4">{formatPercent(match.priceGapPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Mostrando hasta 250 matches filtrados. Los matches combinan coincidencia exacta,
            overrides manuales curados y equivalencias canónicas por familia/categoría.
          </p>
        </SectionCard>

        <SectionCard
          title="Explorador de catálogo"
          description="Vista producto a producto para filtrar surtido, categoría y cobertura de precio."
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-medium">Sitio</th>
                  <th className="px-3 py-3 font-medium">Producto</th>
                  <th className="px-3 py-3 font-medium">Categoría</th>
                  <th className="px-3 py-3 font-medium">Precio</th>
                  <th className="px-3 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {productRows.slice(0, 300).map((product) => {
                  const site = snapshot.sites.find((item) => item.id === product.siteId);
                  return (
                    <tr key={product.id} className="border-t border-slate-100 text-slate-700">
                      <td className="px-3 py-4">
                        <span
                          className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1"
                          style={site ? siteColor(site) : undefined}
                        >
                          {product.siteName}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <Link href={product.url} target="_blank" className="font-medium text-slate-950 hover:text-accent">
                          {product.title}
                        </Link>
                        <div className="mt-1 text-xs text-slate-500">
                          {product.rawCategories.slice(0, 3).join(" / ")}
                        </div>
                      </td>
                      <td className="px-3 py-4">{product.normalizedCategory}</td>
                      <td className="px-3 py-4">{formatCurrency(product.priceArs)}</td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ring-1 ${getPriceStatusClass(
                            product.priceStatus,
                          )}`}
                        >
                          {formatPriceStatus(product.priceStatus)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Mostrando hasta 300 filas del filtro actual. Si querés revisar un producto puntual, usá
            la búsqueda o abrilo desde la tabla.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </article>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ExecutiveInsightCard({
  eyebrow,
  title,
  value,
  detail,
  tone = "neutral",
}: {
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-200 bg-emerald-50/60"
      : tone === "negative"
        ? "border-rose-200 bg-rose-50/60"
        : "border-slate-200 bg-slate-50/60";

  return (
    <article className={`rounded-[1.6rem] border p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
      <h3 className="mt-3 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function OpportunityList({
  title,
  items,
  emptyLabel,
  tone,
}: {
  title: string;
  items: AnalyticsMatch[];
  emptyLabel: string;
  tone: "positive" | "negative";
}) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            tone === "positive" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}
        >
          {items.length} visibles
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">{emptyLabel}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((match) => (
            <div
              key={`${title}-${match.siteId}-${match.ourProductId}-${match.competitorProductId}`}
              className="rounded-2xl border border-white bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <p className="text-sm font-semibold text-slate-950">{match.ourTitle}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    vs {match.siteName}: {match.competitorTitle}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${gapToneClass(match.priceGapPct)}`}>
                    {formatSignedPercent(match.priceGapPct)}
                  </p>
                  <p className={`text-sm ${gapToneClass(match.priceGapArs)}`}>
                    {formatSignedCurrency(match.priceGapArs)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {match.ourNormalizedCategory}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${matchTypeClass(
                    match.matchType,
                  )}`}
                >
                  {formatMatchType(match.matchType)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NarrativeCard({
  label,
  title,
  detail,
  tone,
}: {
  label: string;
  title: string;
  detail: string;
  tone: "neutral" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-200 bg-emerald-50/70"
      : tone === "negative"
        ? "border-rose-200 bg-rose-50/70"
        : "border-slate-200 bg-slate-50/70";

  return (
    <article className={`rounded-[1.6rem] border p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <h3 className="mt-3 text-lg font-semibold leading-7 text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function CoverageCard({
  site,
  matchCount,
  productCount,
  matchCoveragePct,
  pricedCount,
  priceCoveragePct,
}: {
  site: AnalyticsSite;
  matchCount: number;
  productCount: number;
  matchCoveragePct: number | null;
  pricedCount: number;
  priceCoveragePct: number | null;
}) {
  const safeMatchWidth = Math.max(0, Math.min(matchCoveragePct ?? 0, 100));
  const safePriceWidth = Math.max(0, Math.min(priceCoveragePct ?? 0, 100));

  return (
    <article className="rounded-[1.6rem] border border-slate-200 bg-slate-50/70 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{site.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{site.domain}</p>
        </div>
        <span
          className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1"
          style={siteColor(site)}
        >
          {matchCount} matches
        </span>
      </div>

      <div className="mt-5 grid gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-4 text-xs text-slate-600">
            <span>Cobertura comparable</span>
            <span>{formatPercent(matchCoveragePct)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-white">
            <div
              className="h-2.5 rounded-full"
              style={{
                width: `${safeMatchWidth}%`,
                backgroundColor: site.color,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {formatCompact(matchCount)} de {formatCompact(productCount)} productos filtrados con match.
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-4 text-xs text-slate-600">
            <span>Precio usable</span>
            <span>{formatPercent(priceCoveragePct)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-white">
            <div
              className="h-2.5 rounded-full rounded-r-full bg-slate-400"
              style={{ width: `${safePriceWidth}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {formatCompact(pricedCount)} de {formatCompact(productCount)} productos filtrados con precio usable.
          </p>
        </div>
      </div>
    </article>
  );
}
