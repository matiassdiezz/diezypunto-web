"use client";

import Link from "next/link";
import { Fragment, startTransition, useDeferredValue, useState, type ReactNode } from "react";
import type {
  AnalyticsMatch,
  AnalyticsSiteId,
  CompetitorAnalyticsSnapshot,
} from "@/lib/analytics/competitor-snapshot";

const PRICE_SIGNAL_THRESHOLD_PCT = 10;
const ALL_VALUE = "all";

const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("es-AR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

type ProductMarketCompetitor = {
  siteId: AnalyticsSiteId;
  siteName: string;
  domain: string;
  averagePrice: number;
  priceCount: number;
  sampleTitle: string;
  sampleUrl: string;
};

type ProductMarketRow = {
  productId: string;
  title: string;
  url: string;
  category: string;
  subcategory: string;
  ourPrice: number;
  marketAveragePrice: number;
  marketGapPct: number;
  marketGapArs: number;
  competitorCount: number;
  competitors: ProductMarketCompetitor[];
};

type AggregateRow = {
  label: string;
  productCount: number;
  averageOurPrice: number | null;
  averageMarketPrice: number | null;
  gapPct: number | null;
  medianGapPct: number | null;
  expensiveCount: number;
  alignedCount: number;
  cheaperCount: number;
};

type HeatmapCell = {
  siteId: AnalyticsSiteId;
  siteName: string;
  gapPct: number | null;
  productCount: number;
};

type HeatmapRow = {
  category: string;
  productCount: number;
  cells: HeatmapCell[];
};

function formatCurrency(value: number | null) {
  return value == null ? "N/D" : priceFormatter.format(value);
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

function getHeatmapCellStyle(value: number | null) {
  if (value == null) {
    return {
      backgroundColor: "rgba(148, 163, 184, 0.10)",
      borderColor: "rgba(148, 163, 184, 0.18)",
      color: "#64748b",
    };
  }

  const intensity = 0.14 + clamp(Math.abs(value) / 40, 0, 1) * 0.22;
  const tone = getSignalTone(value);

  if (tone === "negative") {
    return {
      backgroundColor: `rgba(244, 63, 94, ${intensity})`,
      borderColor: `rgba(225, 29, 72, ${Math.min(intensity + 0.1, 0.52)})`,
      color: "#9f1239",
    };
  }

  if (tone === "positive") {
    return {
      backgroundColor: `rgba(16, 185, 129, ${intensity})`,
      borderColor: `rgba(5, 150, 105, ${Math.min(intensity + 0.1, 0.52)})`,
      color: "#065f46",
    };
  }

  return {
    backgroundColor: `rgba(245, 158, 11, ${intensity})`,
    borderColor: `rgba(217, 119, 6, ${Math.min(intensity + 0.1, 0.52)})`,
    color: "#92400e",
  };
}

function getAverage(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function normalizeComparableText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function splitRawCategory(rawCategory: string) {
  const [root, ...rest] = rawCategory.split(":");
  return {
    category: root?.trim() || rawCategory.trim(),
    subcategory: rest.join(":").trim() || null,
  };
}

function getDashboardCategory(
  rawCategories: string[] | null | undefined,
  fallbackCategory: string,
) {
  const firstRawCategory = rawCategories?.find((category) => category.trim().length > 0);
  if (!firstRawCategory) {
    return fallbackCategory;
  }

  return splitRawCategory(firstRawCategory).category;
}

function getDashboardSubcategory(
  rawCategories: string[] | null | undefined,
  productFamily: string | null | undefined,
  category?: string,
) {
  const firstDetailedRawCategory = rawCategories
    ?.map(splitRawCategory)
    .find((rawCategory) => rawCategory.subcategory);

  if (firstDetailedRawCategory?.subcategory) {
    return firstDetailedRawCategory.subcategory;
  }

  return formatSubcategoryLabel(productFamily, category);
}

function formatSubcategoryLabel(productFamily: string | null | undefined, category?: string) {
  const normalizedFamily = normalizeComparableText(productFamily ?? "");
  const normalizedCategory = normalizeComparableText(category ?? "");

  if (!normalizedFamily || normalizedFamily === normalizedCategory) {
    return "General";
  }

  const labels: Record<string, string> = {
    auriculares: "Auriculares",
    bolsa: "Bolsas",
    bolso: "Bolsos",
    botella: "Botellas",
    boligrafo: "Bolígrafos",
    cargador: "Cargadores",
    cooler: "Coolers",
    cuaderno: "Cuadernos",
    escritura: "Escritura general",
    jarro: "Jarros",
    lapiz: "Lápices",
    libreta: "Libretas",
    mate: "Mates",
    mochila: "Mochilas",
    mouse: "Mouse",
    neceser: "Neceser",
    parlante: "Parlantes",
    power: "Power banks",
    roller: "Rollers",
    soporte: "Soportes",
    tecnologia: "Tecnología general",
    termo: "Termos",
    vaso: "Vasos",
  };

  if (labels[normalizedFamily]) {
    return labels[normalizedFamily];
  }

  return normalizedFamily.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function hasComparablePrice(match: AnalyticsMatch) {
  return (
    match.matchType === "exact_normalized_title" &&
    match.ourPriceArs != null &&
    match.competitorPriceArs != null &&
    match.competitorPriceStatus === "priced"
  );
}

function getSignalTone(value: number | null): "negative" | "neutral" | "positive" {
  if (value == null) return "neutral";
  if (value > PRICE_SIGNAL_THRESHOLD_PCT) return "negative";
  if (value < PRICE_SIGNAL_THRESHOLD_PCT * -1) return "positive";
  return "neutral";
}

function getSignalLabel(value: number | null) {
  const tone = getSignalTone(value);
  if (tone === "negative") return "Rojo";
  if (tone === "positive") return "Verde";
  return "Amarillo";
}

function getToneClass(tone: "negative" | "neutral" | "positive") {
  if (tone === "negative") {
    return {
      badge: "bg-rose-100 text-rose-700 ring-rose-200",
      text: "text-rose-600",
      fill: "bg-rose-500",
      soft: "bg-rose-50 border-rose-200",
    };
  }

  if (tone === "positive") {
    return {
      badge: "bg-emerald-100 text-emerald-700 ring-emerald-200",
      text: "text-emerald-600",
      fill: "bg-emerald-500",
      soft: "bg-emerald-50 border-emerald-200",
    };
  }

  return {
    badge: "bg-amber-100 text-amber-700 ring-amber-200",
    text: "text-amber-700",
    fill: "bg-amber-400",
    soft: "bg-amber-50 border-amber-200",
  };
}

function escapeCsvValue(value: string | number | null) {
  if (value == null) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number | null>>) {
  const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function aggregateRows(label: string, rows: ProductMarketRow[]): AggregateRow {
  const averageOurPrice = getAverage(rows.map((row) => row.ourPrice));
  const averageMarketPrice = getAverage(rows.map((row) => row.marketAveragePrice));
  const gapPcts = rows.map((row) => row.marketGapPct);

  return {
    label,
    productCount: rows.length,
    averageOurPrice,
    averageMarketPrice,
    gapPct:
      averageOurPrice != null && averageMarketPrice != null && averageMarketPrice > 0
        ? ((averageOurPrice - averageMarketPrice) / averageMarketPrice) * 100
        : null,
    medianGapPct: getMedian(gapPcts),
    expensiveCount: rows.filter((row) => row.marketGapPct > PRICE_SIGNAL_THRESHOLD_PCT).length,
    alignedCount: rows.filter(
      (row) => Math.abs(row.marketGapPct) <= PRICE_SIGNAL_THRESHOLD_PCT,
    ).length,
    cheaperCount: rows.filter((row) => row.marketGapPct < PRICE_SIGNAL_THRESHOLD_PCT * -1).length,
  };
}

function matchesProductQuery(row: ProductMarketRow, query: string) {
  if (!query) return true;

  const haystack = normalizeComparableText(
    `${row.title} ${row.category} ${row.subcategory} ${row.competitors
      .map((competitor) => competitor.siteName)
      .join(" ")}`,
  );

  return haystack.includes(query);
}

export default function CompetitorAnalyticsDashboard({
  snapshot,
}: {
  snapshot: CompetitorAnalyticsSnapshot;
}) {
  const competitorSites = snapshot.sites.filter((site) => site.id !== "diezypunto");
  const [selectedCompetitors, setSelectedCompetitors] = useState<AnalyticsSiteId[]>(
    competitorSites.map((site) => site.id),
  );
  const [selectedCategory, setSelectedCategory] = useState(ALL_VALUE);
  const [selectedSubcategory, setSelectedSubcategory] = useState(ALL_VALUE);
  const [productQuery, setProductQuery] = useState("");
  const activeCompetitorSites = competitorSites.filter((site) => selectedCompetitors.includes(site.id));

  const deferredProductQuery = useDeferredValue(normalizeComparableText(productQuery));
  const productsById = new Map(snapshot.products.map((product) => [product.id, product]));

  const comparableMatches = snapshot.matches.filter(
    (match) => selectedCompetitors.includes(match.siteId) && hasComparablePrice(match),
  );

  const groupedByProduct = new Map<
    string,
    {
      productId: string;
      title: string;
      url: string;
      category: string;
      subcategory: string;
      ourPrice: number;
      competitors: Map<
        AnalyticsSiteId,
        {
          siteId: AnalyticsSiteId;
          siteName: string;
          domain: string;
          prices: number[];
          sampleTitle: string;
          sampleUrl: string;
        }
      >;
    }
  >();

  for (const match of comparableMatches) {
    const ownProduct = productsById.get(match.ourProductId);
    if (!ownProduct || match.ourPriceArs == null || match.competitorPriceArs == null) {
      continue;
    }

    const current =
      groupedByProduct.get(match.ourProductId) ??
      {
        productId: match.ourProductId,
        title: match.ourTitle,
        url: match.ourUrl,
        category: getDashboardCategory(ownProduct.rawCategories, match.ourNormalizedCategory),
        subcategory: getDashboardSubcategory(
          ownProduct.rawCategories,
          ownProduct.productFamily,
          getDashboardCategory(ownProduct.rawCategories, match.ourNormalizedCategory),
        ),
        ourPrice: match.ourPriceArs,
        competitors: new Map(),
      };

    const siteCurrent = current.competitors.get(match.siteId) ?? {
      siteId: match.siteId,
      siteName: match.siteName,
      domain: match.domain,
      prices: [],
      sampleTitle: match.competitorTitle,
      sampleUrl: match.competitorUrl,
    };

    siteCurrent.prices.push(match.competitorPriceArs);
    current.competitors.set(match.siteId, siteCurrent);
    groupedByProduct.set(match.ourProductId, current);
  }

  const allProductRows: ProductMarketRow[] = [...groupedByProduct.values()]
    .map((entry) => {
      const competitors = [...entry.competitors.values()]
        .map((competitor) => ({
          siteId: competitor.siteId,
          siteName: competitor.siteName,
          domain: competitor.domain,
          averagePrice: getAverage(competitor.prices) ?? 0,
          priceCount: competitor.prices.length,
          sampleTitle: competitor.sampleTitle,
          sampleUrl: competitor.sampleUrl,
        }))
        .filter((competitor) => competitor.averagePrice > 0)
        .sort((left, right) => left.siteName.localeCompare(right.siteName, "es"));

      const marketAveragePrice = getAverage(competitors.map((competitor) => competitor.averagePrice));
      if (marketAveragePrice == null || marketAveragePrice <= 0) {
        return null;
      }

      return {
        productId: entry.productId,
        title: entry.title,
        url: entry.url,
        category: entry.category,
        subcategory: entry.subcategory,
        ourPrice: entry.ourPrice,
        marketAveragePrice,
        marketGapPct: ((entry.ourPrice - marketAveragePrice) / marketAveragePrice) * 100,
        marketGapArs: entry.ourPrice - marketAveragePrice,
        competitorCount: competitors.length,
        competitors,
      };
    })
    .filter((row): row is ProductMarketRow => row != null)
    .sort((left, right) => left.title.localeCompare(right.title, "es"));

  const availableCategories = [...new Set(allProductRows.map((row) => row.category))].sort((left, right) =>
    left.localeCompare(right, "es"),
  );
  const effectiveCategory =
    selectedCategory !== ALL_VALUE && availableCategories.includes(selectedCategory)
      ? selectedCategory
      : ALL_VALUE;

  const subcategorySourceRows = allProductRows.filter((row) =>
    effectiveCategory === ALL_VALUE ? true : row.category === effectiveCategory,
  );
  const availableSubcategories = [...new Set(subcategorySourceRows.map((row) => row.subcategory))].sort(
    (left, right) => left.localeCompare(right, "es"),
  );
  const effectiveSubcategory =
    selectedSubcategory !== ALL_VALUE && availableSubcategories.includes(selectedSubcategory)
      ? selectedSubcategory
      : ALL_VALUE;

  const searchedProductRows = allProductRows.filter((row) => matchesProductQuery(row, deferredProductQuery));

  const filteredProductRows = searchedProductRows.filter((row) => {
    if (effectiveCategory !== ALL_VALUE && row.category !== effectiveCategory) {
      return false;
    }
    if (effectiveSubcategory !== ALL_VALUE && row.subcategory !== effectiveSubcategory) {
      return false;
    }
    return true;
  });

  const overallSummary = aggregateRows("Mercado promedio", filteredProductRows);

  const categoryRows = availableCategories
    .map((category) => {
      const rows = searchedProductRows.filter((row) => row.category === category);

      return aggregateRows(category, rows);
    })
    .filter((row) => row.productCount > 0)
    .sort(
      (left, right) =>
        Math.abs(right.gapPct ?? 0) - Math.abs(left.gapPct ?? 0) ||
        right.productCount - left.productCount ||
        left.label.localeCompare(right.label, "es"),
    );

  const subcategoryRows =
    effectiveCategory === ALL_VALUE
      ? []
      : availableSubcategories
          .map((subcategory) =>
            aggregateRows(
              subcategory,
              filteredProductRows.filter((row) => row.subcategory === subcategory),
            ),
          )
          .filter((row) => row.productCount > 0)
          .sort(
            (left, right) =>
              Math.abs(right.gapPct ?? 0) - Math.abs(left.gapPct ?? 0) ||
              right.productCount - left.productCount ||
              left.label.localeCompare(right.label, "es"),
          );

  const heatmapRows: HeatmapRow[] = categoryRows.map((categoryRow) => {
    const rows = searchedProductRows.filter((row) => row.category === categoryRow.label);

    const cells = activeCompetitorSites.map((site) => {
      const comparableRows = rows
        .map((row) => {
          const competitor = row.competitors.find((entry) => entry.siteId === site.id);
          if (!competitor || competitor.averagePrice <= 0) {
            return null;
          }

          return ((row.ourPrice - competitor.averagePrice) / competitor.averagePrice) * 100;
        })
        .filter((value): value is number => value != null);

      return {
        siteId: site.id,
        siteName: site.name,
        gapPct: getAverage(comparableRows),
        productCount: comparableRows.length,
      };
    });

    return {
      category: categoryRow.label,
      productCount: categoryRow.productCount,
      cells,
    };
  });

  const moreExpensiveProducts = [...filteredProductRows]
    .filter((row) => row.marketGapPct > PRICE_SIGNAL_THRESHOLD_PCT)
    .sort(
      (left, right) =>
        right.marketGapPct - left.marketGapPct || right.marketGapArs - left.marketGapArs,
    )
    .slice(0, 8);

  const alignedProducts = [...filteredProductRows]
    .filter((row) => Math.abs(row.marketGapPct) <= PRICE_SIGNAL_THRESHOLD_PCT)
    .sort((left, right) => Math.abs(left.marketGapPct) - Math.abs(right.marketGapPct))
    .slice(0, 8);

  const cheaperProducts = [...filteredProductRows]
    .filter((row) => row.marketGapPct < PRICE_SIGNAL_THRESHOLD_PCT * -1)
    .sort((left, right) => left.marketGapPct - right.marketGapPct || left.marketGapArs - right.marketGapArs)
    .slice(0, 8);

  const expensiveCategoryPct =
    categoryRows.length > 0
      ? (categoryRows.filter((row) => (row.gapPct ?? 0) > PRICE_SIGNAL_THRESHOLD_PCT).length /
          categoryRows.length) *
        100
      : null;

  const summaryCsvRows = categoryRows.map((row) => [
    row.label,
    row.productCount,
    row.averageMarketPrice != null ? row.averageMarketPrice.toFixed(2) : null,
    row.averageOurPrice != null ? row.averageOurPrice.toFixed(2) : null,
    row.gapPct != null ? row.gapPct.toFixed(2) : null,
    row.medianGapPct != null ? row.medianGapPct.toFixed(2) : null,
    row.expensiveCount,
    row.alignedCount,
    row.cheaperCount,
  ]);

  const productCsvRows = filteredProductRows.map((row) => [
    row.title,
    row.category,
    row.subcategory,
    row.ourPrice.toFixed(2),
    row.marketAveragePrice.toFixed(2),
    row.marketGapPct.toFixed(2),
    row.marketGapArs.toFixed(2),
    row.competitors.map((competitor) => `${competitor.siteName}: ${competitor.averagePrice.toFixed(2)}`).join(" | "),
    row.url,
  ]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_22%,_#f8fafc_100%)] px-6 pb-20 pt-24 lg:px-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-3">
                <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Categoría
                  <select
                    value={effectiveCategory}
                    onChange={(event) =>
                      startTransition(() => {
                        setSelectedCategory(event.target.value);
                        setSelectedSubcategory(ALL_VALUE);
                      })
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-900 outline-none transition focus:border-teal-500"
                  >
                    <option value={ALL_VALUE}>Todas</option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Subcategoría
                  <select
                    value={effectiveSubcategory}
                    onChange={(event) => startTransition(() => setSelectedSubcategory(event.target.value))}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-900 outline-none transition focus:border-teal-500"
                  >
                    <option value={ALL_VALUE}>Todas</option>
                    {availableSubcategories.map((subcategory) => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Producto
                  <input
                    value={productQuery}
                    onChange={(event) => setProductQuery(event.target.value)}
                    placeholder="Buscar producto"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-900 outline-none transition focus:border-teal-500"
                  />
                </label>

                <div className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Competidores
                  <details className="group relative">
                    <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-900 outline-none transition marker:content-none focus:border-teal-500">
                      <span>
                        {selectedCompetitors.length === competitorSites.length
                          ? "Todos"
                          : `${selectedCompetitors.length} activos`}
                      </span>
                      <span className="text-slate-400 transition group-open:rotate-180">▾</span>
                    </summary>
                    <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
                      <div className="grid gap-2">
                        {competitorSites.map((site) => {
                          const active = selectedCompetitors.includes(site.id);
                          return (
                            <label
                              key={site.id}
                              className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-sm font-normal normal-case tracking-normal text-slate-700 hover:bg-slate-50"
                            >
                              <span>{site.name}</span>
                              <input
                                type="checkbox"
                                checked={active}
                                onChange={() =>
                                  startTransition(() =>
                                    setSelectedCompetitors((current) => {
                                      if (current.includes(site.id)) {
                                        return current.length === 1
                                          ? current
                                          : current.filter((value) => value !== site.id);
                                      }
                                      return [...current, site.id];
                                    }),
                                  )
                                }
                                className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </details>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <ActionButton
                label="Descargar resumen CSV"
                onClick={() =>
                  downloadCsv(
                    "price-benchmark-categorias.csv",
                    [
                      "Categoria",
                      "Productos",
                      "Precio promedio mercado",
                      "Precio promedio DYP",
                      "Gap promedio %",
                      "Gap mediano %",
                      "Mas caro",
                      "Alineado",
                      "Mas barato",
                    ],
                    summaryCsvRows,
                  )
                }
              />
              <ActionButton
                label="Descargar productos CSV"
                onClick={() =>
                  downloadCsv(
                    "price-benchmark-productos.csv",
                    [
                      "Producto",
                      "Categoria",
                      "Subcategoria",
                      "Precio DYP",
                      "Precio mercado",
                      "Gap %",
                      "Gap ARS",
                      "Competidores",
                      "URL",
                    ],
                    productCsvRows,
                  )
                }
              />
              <button
                type="button"
                onClick={() =>
                  startTransition(() => {
                    setSelectedCompetitors(competitorSites.map((site) => site.id));
                    setSelectedCategory(ALL_VALUE);
                    setSelectedSubcategory(ALL_VALUE);
                    setProductQuery("");
                  })
                }
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ExecutiveStatCard
            label="Precio promedio mercado"
            value={formatCurrency(overallSummary.averageMarketPrice)}
          />
          <ExecutiveStatCard
            label="Productos comparables"
            value={formatCompact(filteredProductRows.length)}
          />
          <ExecutiveStatCard
            label="% categorías con DYP más caro"
            value={formatPercent(expensiveCategoryPct)}
            tone={expensiveCategoryPct != null && expensiveCategoryPct > 50 ? "negative" : "neutral"}
          />
          <ExecutiveStatCard
            label="Gap mediano vs mercado"
            value={formatSignedPercent(overallSummary.medianGapPct)}
            tone={getSignalTone(overallSummary.medianGapPct)}
          />
        </section>

        <SectionCard
          title="Heatmap competidores × categorías"
          description="Semáforo rápido para ver dónde DYP está arriba, alineado o abajo contra cada competidor activo."
          collapsible
        >
          {heatmapRows.length === 0 || activeCompetitorSites.length === 0 ? (
            <EmptyState label="No hay datos suficientes para armar el heatmap con los filtros actuales." />
          ) : (
            <div className="overflow-x-auto">
              <div className="mb-4 flex flex-wrap gap-2">
                <InfoChip label="Rojo: DYP más caro" />
                <InfoChip label="Amarillo: alineado" />
                <InfoChip label="Verde: DYP más barato" />
              </div>

              <div
                className="grid min-w-[720px] gap-2"
                style={{
                  gridTemplateColumns: `minmax(190px, 1.4fr) repeat(${activeCompetitorSites.length}, minmax(130px, 1fr))`,
                }}
              >
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Categoría
                </div>
                {activeCompetitorSites.map((site) => (
                  <div
                    key={site.id}
                    className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-400"
                  >
                    {site.name}
                  </div>
                ))}

                {heatmapRows.map((row) => (
                  <Fragment key={row.category}>
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(() => {
                          setSelectedCategory(row.category);
                          setSelectedSubcategory(ALL_VALUE);
                        })
                      }
                      className={`rounded-[1.5rem] border px-4 py-3 text-left transition hover:-translate-y-0.5 ${
                        effectiveCategory === row.category
                          ? "border-slate-950 bg-white ring-2 ring-slate-950/10"
                          : "border-slate-200 bg-slate-50/60"
                      }`}
                    >
                      <p className="text-base font-semibold text-slate-950">{row.category}</p>
                    </button>

                    {row.cells.map((cell) => (
                      <div
                        key={`${row.category}-${cell.siteId}`}
                        className="rounded-[1.5rem] border px-3 py-3 text-center shadow-sm"
                        style={getHeatmapCellStyle(cell.gapPct)}
                      >
                        <p className="text-base font-semibold">{formatSignedPercent(cell.gapPct)}</p>
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Mapa de categorías"
          description="Vista compacta para detectar rápido dónde DYP se aleja del promedio de mercado."
          collapsible
        >
          {categoryRows.length === 0 ? (
            <EmptyState label="No hay categorías comparables bajo el filtro activo." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {categoryRows.map((row) => (
                <CompactGapCard
                  key={row.label}
                  title={row.label}
                  value={row.gapPct}
                  signalLabel={getSignalLabel(row.gapPct)}
                  active={effectiveCategory === row.label}
                  maxAbs={Math.max(...categoryRows.map((item) => Math.abs(item.gapPct ?? 0)), 1)}
                  onClick={() =>
                    startTransition(() => {
                      setSelectedCategory(row.label);
                      setSelectedSubcategory(ALL_VALUE);
                    })
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Subcategorías"
          description={
            effectiveCategory === ALL_VALUE
              ? "Elegí una categoría del bloque anterior para abrir el drill-down."
              : `Dentro de ${effectiveCategory}, dónde está el desvío real.`
          }
          collapsible
        >
          {effectiveCategory === ALL_VALUE ? (
            <EmptyState label="Seleccioná una categoría para ver subcategorías." />
          ) : subcategoryRows.length === 0 ? (
            <EmptyState label="No hay subcategorías comparables con los filtros actuales." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {subcategoryRows.map((row) => (
                <CompactGapCard
                  key={row.label}
                  title={row.label}
                  value={row.gapPct}
                  signalLabel={getSignalLabel(row.gapPct)}
                  active={effectiveSubcategory === row.label}
                  maxAbs={Math.max(...subcategoryRows.map((item) => Math.abs(item.gapPct ?? 0)), 1)}
                  onClick={() =>
                    startTransition(() =>
                      setSelectedSubcategory((current) => (current === row.label ? ALL_VALUE : row.label)),
                    )
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Status productos"
          description="Los productos se ordenan por brecha contra el promedio de mercado del contexto actual."
          collapsible
        >
          <div className="grid gap-4 md:grid-cols-3">
            <ProductActionColumn
              title="DYP más caro"
              tone="negative"
              items={moreExpensiveProducts}
              emptyLabel="No hay productos arriba de +10% bajo este filtro."
            />
            <ProductActionColumn
              title="Alineados"
              tone="neutral"
              items={alignedProducts}
              emptyLabel="No hay productos dentro de la banda de alineación."
            />
            <ProductActionColumn
              title="DYP más barato"
              tone="positive"
              items={cheaperProducts}
              emptyLabel="No hay productos debajo de -10% bajo este filtro."
            />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function InfoChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
      {label}
    </span>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
    >
      {label}
    </button>
  );
}

function ExecutiveStatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "negative" | "neutral" | "positive";
}) {
  const toneClass = getToneClass(tone);

  return (
    <article className={`rounded-[1.6rem] border p-5 shadow-sm ${toneClass.soft}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${toneClass.text}`}>{value}</p>
    </article>
  );
}

function SectionCard({
  title,
  description,
  collapsible = false,
  children,
}: {
  title: string;
  description: string;
  collapsible?: boolean;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          {!collapsed ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
        {collapsible ? (
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
          >
            {collapsed ? "Mostrar" : "Ocultar"}
          </button>
        ) : null}
      </div>
      {!collapsed ? children : null}
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50/70 p-8 text-sm text-slate-600">
      {label}
    </div>
  );
}

function CompactGapCard({
  title,
  value,
  signalLabel,
  active,
  maxAbs,
  onClick,
}: {
  title: string;
  value: number | null;
  signalLabel: string;
  active?: boolean;
  maxAbs: number;
  onClick?: () => void;
}) {
  const tone = getSignalTone(value);
  const toneClass = getToneClass(tone);
  const safeWidth = clamp(((Math.abs(value ?? 0) / Math.max(maxAbs, 1)) * 100), 0, 100);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[2rem] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
        active
          ? "border-slate-950 bg-white ring-2 ring-slate-950/10"
          : "border-slate-200 bg-slate-50/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-950">{title}</p>
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClass.badge}`}>
            {signalLabel}
          </span>
          <p className={`mt-2 text-xl font-semibold ${toneClass.text}`}>{formatSignedPercent(value)}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 rounded-full bg-white">
          <div className={`h-2 rounded-full ${toneClass.fill}`} style={{ width: `${safeWidth}%` }} />
        </div>
      </div>
    </button>
  );
}

function ProductActionColumn({
  title,
  tone,
  items,
  emptyLabel,
}: {
  title: string;
  tone: "negative" | "neutral" | "positive";
  items: ProductMarketRow[];
  emptyLabel: string;
}) {
  const toneClass = getToneClass(tone);

  return (
    <div className={`rounded-[2rem] border p-5 ${toneClass.soft}`}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClass.badge}`}>
          {items.length} visibles
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">{emptyLabel}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <article
              key={`${title}-${item.productId}`}
              className="rounded-[2rem] border border-white bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 max-w-[15rem]">
                  <Link
                    href={item.url}
                    target="_blank"
                    className="line-clamp-2 text-base font-semibold text-slate-950 hover:text-teal-700"
                  >
                    {item.title}
                  </Link>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-base font-semibold ${toneClass.text}`}>
                    {formatSignedPercent(item.marketGapPct)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Link
                  href={item.url}
                  target="_blank"
                  className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-medium text-white ring-1 ring-slate-950 transition hover:bg-slate-800"
                >
                  DYP
                </Link>
                {item.competitors.map((competitor) => (
                  <Link
                    key={`${item.productId}-${competitor.siteId}`}
                    href={competitor.sampleUrl}
                    target="_blank"
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
                  >
                    {competitor.siteName}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
