"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useState, type ReactNode } from "react";
import type {
  AnalyticsMatch,
  AnalyticsSite,
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

function formatSnapshotTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const argentinaOffsetMs = -3 * 60 * 60 * 1000;
  const localDate = new Date(date.getTime() + argentinaOffsetMs);
  const day = String(localDate.getUTCDate()).padStart(2, "0");
  const month = String(localDate.getUTCMonth() + 1).padStart(2, "0");
  const year = localDate.getUTCFullYear();
  const hours = String(localDate.getUTCHours()).padStart(2, "0");
  const minutes = String(localDate.getUTCMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes} ART`;
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

function siteColor(site: AnalyticsSite) {
  return {
    backgroundColor: `${site.color}18`,
    borderColor: `${site.color}33`,
    color: site.color,
  };
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
        category: match.ourNormalizedCategory,
        subcategory: formatSubcategoryLabel(ownProduct.productFamily, match.ourNormalizedCategory),
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

  const filteredProductRows = allProductRows.filter((row) => {
    if (effectiveCategory !== ALL_VALUE && row.category !== effectiveCategory) {
      return false;
    }
    if (effectiveSubcategory !== ALL_VALUE && row.subcategory !== effectiveSubcategory) {
      return false;
    }
    if (deferredProductQuery) {
      const haystack = normalizeComparableText(
        `${row.title} ${row.category} ${row.subcategory} ${row.competitors
          .map((competitor) => competitor.siteName)
          .join(" ")}`,
      );
      if (!haystack.includes(deferredProductQuery)) {
        return false;
      }
    }
    return true;
  });

  const overallSummary = aggregateRows("Mercado promedio", filteredProductRows);

  const categoryRows = availableCategories
    .map((category) => {
      const rows = allProductRows.filter((row) => {
        if (row.category !== category) return false;
        if (deferredProductQuery) {
          return normalizeComparableText(
            `${row.title} ${row.category} ${row.subcategory} ${row.competitors
              .map((competitor) => competitor.siteName)
              .join(" ")}`,
          ).includes(deferredProductQuery);
        }
        return true;
      });

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

  const marketBenchmarkRows = [
    {
      label: "Promedio mercado",
      averagePrice: overallSummary.averageMarketPrice,
      gapPct: 0,
      productCount: overallSummary.productCount,
      site: null,
    },
    {
      label: "Diez y Punto",
      averagePrice: overallSummary.averageOurPrice,
      gapPct: overallSummary.gapPct,
      productCount: overallSummary.productCount,
      site: snapshot.sites.find((site) => site.id === "diezypunto") ?? null,
    },
    ...competitorSites
      .filter((site) => selectedCompetitors.includes(site.id))
      .map((site) => {
        const sitePrices = filteredProductRows
          .map((row) => row.competitors.find((competitor) => competitor.siteId === site.id)?.averagePrice)
          .filter((value): value is number => value != null);
        const averagePrice = getAverage(sitePrices);
        const marketPrice = overallSummary.averageMarketPrice;

        return {
          label: site.name,
          averagePrice,
          gapPct:
            averagePrice != null && marketPrice != null && marketPrice > 0
              ? ((averagePrice - marketPrice) / marketPrice) * 100
              : null,
          productCount: sitePrices.length,
          site,
        };
      })
      .filter((row) => row.averagePrice != null),
  ];

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

  const activeLabel =
    effectiveCategory === ALL_VALUE
      ? "Mercado completo"
      : effectiveSubcategory === ALL_VALUE
        ? effectiveCategory
        : `${effectiveCategory} / ${effectiveSubcategory}`;

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
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700">
                One Page
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 lg:text-5xl">
                Precio DYP vs mercado
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Lectura visual de categorías, subcategorías y productos usando solo matches exactos
                con precio usable en ambos lados. El benchmark principal compara Diez y Punto
                contra el promedio de mercado de los competidores activos.
              </p>
            </div>
            <div className="grid gap-2 rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-5 text-sm text-slate-600">
              <div>
                <span className="font-semibold text-slate-950">Snapshot:</span> {snapshot.snapshotDate}
              </div>
              <div>
                <span className="font-semibold text-slate-950">Generado:</span>{" "}
                {formatSnapshotTimestamp(snapshot.generatedAt)}
              </div>
              <div>
                <span className="font-semibold text-slate-950">Competidores activos:</span>{" "}
                {selectedCompetitors.length}
              </div>
              <div>
                <span className="font-semibold text-slate-950">Lectura actual:</span> {activeLabel}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <InfoChip label="Solo matches exactos" />
            <InfoChip label="Solo precio válido" />
            <InfoChip label="Benchmark: promedio de mercado" />
            <InfoChip label={`${formatCompact(filteredProductRows.length)} productos comparables`} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Filtros</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Todo el dashboard responde a competidor, categoría, subcategoría y producto.
                </p>
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
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr_1fr]">
              <label className="grid gap-2 text-sm text-slate-600">
                Categoría
                <select
                  value={effectiveCategory}
                  onChange={(event) =>
                    startTransition(() => {
                      setSelectedCategory(event.target.value);
                      setSelectedSubcategory(ALL_VALUE);
                    })
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500"
                >
                  <option value={ALL_VALUE}>Todas</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-slate-600">
                Subcategoría
                <select
                  value={effectiveSubcategory}
                  onChange={(event) => startTransition(() => setSelectedSubcategory(event.target.value))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500"
                >
                  <option value={ALL_VALUE}>Todas</option>
                  {availableSubcategories.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-slate-600">
                Producto
                <input
                  value={productQuery}
                  onChange={(event) => setProductQuery(event.target.value)}
                  placeholder="Buscar por producto"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              {competitorSites.map((site) => {
                const active = selectedCompetitors.includes(site.id);
                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() =>
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
            detail={`${activeLabel} · promedio de competidores activos`}
          />
          <ExecutiveStatCard
            label="Productos comparables"
            value={formatCompact(filteredProductRows.length)}
            detail="Solo exact matches con precio válido"
          />
          <ExecutiveStatCard
            label="% categorías con DYP más caro"
            value={formatPercent(expensiveCategoryPct)}
            detail="Gap promedio mayor a +10%"
            tone={expensiveCategoryPct != null && expensiveCategoryPct > 50 ? "negative" : "neutral"}
          />
          <ExecutiveStatCard
            label="Gap mediano vs mercado"
            value={formatSignedPercent(overallSummary.medianGapPct)}
            detail="Referencia de pricing del contexto activo"
            tone={getSignalTone(overallSummary.medianGapPct)}
          />
        </section>

        <SectionCard
          title="Mapa de categorías"
          description="Vista compacta para detectar rápido dónde DYP se aleja del promedio de mercado."
        >
          {categoryRows.length === 0 ? (
            <EmptyState label="No hay categorías comparables bajo el filtro activo." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {categoryRows.map((row) => (
                <CompactGapCard
                  key={row.label}
                  title={row.label}
                  subtitle={`${row.productCount} prod.`}
                  marketLabel={formatCurrency(row.averageMarketPrice)}
                  value={row.gapPct}
                  signalLabel={getSignalLabel(row.gapPct)}
                  active={effectiveCategory === row.label}
                  maxAbs={Math.max(...categoryRows.map((item) => Math.abs(item.gapPct ?? 0)), 1)}
                  footer={`${row.expensiveCount} caros · ${row.cheaperCount} baratos`}
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

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionCard
            title="Subcategorías"
            description={
              effectiveCategory === ALL_VALUE
                ? "Elegí una categoría del bloque anterior para abrir el drill-down."
                : `Dentro de ${effectiveCategory}, dónde está el desvío real.`
            }
          >
            {effectiveCategory === ALL_VALUE ? (
              <EmptyState label="Seleccioná una categoría para ver subcategorías." />
            ) : subcategoryRows.length === 0 ? (
              <EmptyState label="No hay subcategorías comparables con los filtros actuales." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {subcategoryRows.map((row) => (
                  <CompactGapCard
                    key={row.label}
                    title={row.label}
                    subtitle={`${row.productCount} prod.`}
                    marketLabel={formatCurrency(row.averageMarketPrice)}
                    value={row.gapPct}
                    signalLabel={getSignalLabel(row.gapPct)}
                    active={effectiveSubcategory === row.label}
                    maxAbs={Math.max(...subcategoryRows.map((item) => Math.abs(item.gapPct ?? 0)), 1)}
                    footer={`${row.expensiveCount} caros · ${row.cheaperCount} baratos`}
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
            title="Detalle por competidor"
            description="Primero contra el promedio de mercado y debajo el desvío de cada competidor contra ese promedio."
          >
            {marketBenchmarkRows.length === 0 ? (
              <EmptyState label="No hay benchmark disponible para este filtro." />
            ) : (
              <div className="grid gap-3">
                {marketBenchmarkRows.map((row) => (
                  <BenchmarkProviderRow
                    key={row.label}
                    label={row.label}
                    averagePrice={row.averagePrice}
                    gapPct={row.gapPct}
                    productCount={row.productCount}
                    site={row.site}
                    maxAbs={Math.max(...marketBenchmarkRows.map((item) => Math.abs(item.gapPct ?? 0)), 1)}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </section>

        <SectionCard
          title="Status productos"
          description="Los productos se ordenan por brecha contra el promedio de mercado del contexto actual."
        >
          <div className="grid gap-4 xl:grid-cols-3">
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
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "negative" | "neutral" | "positive";
}) {
  const toneClass = getToneClass(tone);

  return (
    <article className={`rounded-[1.6rem] border p-5 shadow-sm ${toneClass.soft}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${toneClass.text}`}>{value}</p>
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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50/70 p-8 text-sm text-slate-600">
      {label}
    </div>
  );
}

function CompactGapCard({
  title,
  subtitle,
  marketLabel,
  value,
  signalLabel,
  active,
  maxAbs,
  footer,
  onClick,
}: {
  title: string;
  subtitle: string;
  marketLabel: string;
  value: number | null;
  signalLabel: string;
  active?: boolean;
  maxAbs: number;
  footer: string;
  onClick?: () => void;
}) {
  const tone = getSignalTone(value);
  const toneClass = getToneClass(tone);
  const safeWidth = clamp(((Math.abs(value ?? 0) / Math.max(maxAbs, 1)) * 100), 0, 100);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.35rem] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
        active
          ? "border-slate-950 bg-white ring-2 ring-slate-950/10"
          : "border-slate-200 bg-slate-50/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {subtitle} · mercado {marketLabel}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClass.badge}`}>
            {signalLabel}
          </span>
          <p className={`mt-2 text-xl font-semibold ${toneClass.text}`}>{formatSignedPercent(value)}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.16em] text-slate-400">
          <span>Desvío</span>
          <span>{footer}</span>
        </div>
        <div className="h-2 rounded-full bg-white">
          <div className={`h-2 rounded-full ${toneClass.fill}`} style={{ width: `${safeWidth}%` }} />
        </div>
      </div>
    </button>
  );
}

function BenchmarkProviderRow({
  label,
  averagePrice,
  gapPct,
  productCount,
  site,
  maxAbs,
}: {
  label: string;
  averagePrice: number | null;
  gapPct: number | null;
  productCount: number;
  site: AnalyticsSite | null;
  maxAbs: number;
}) {
  const tone = label === "Promedio mercado" ? "neutral" : getSignalTone(gapPct);
  const toneClass = getToneClass(tone);
  const normalizedWidth = gapPct == null ? 0 : (Math.abs(gapPct) / Math.max(maxAbs, 1)) * 50;
  const safeWidth = clamp(normalizedWidth, 0, 50);
  const left = gapPct == null ? 50 : gapPct >= 0 ? 50 : 50 - safeWidth;

  return (
    <article className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {site ? (
            <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1" style={siteColor(site)}>
              {label}
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white">
              {label}
            </span>
          )}
          <span className="text-xs text-slate-500">{productCount} productos</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-950">{formatCurrency(averagePrice)}</p>
          <p className={`mt-1 text-lg font-semibold ${toneClass.text}`}>
            {label === "Promedio mercado" ? "Base 0%" : formatSignedPercent(gapPct)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="relative h-3 rounded-full bg-white">
          <div className="absolute inset-y-0 left-1/2 w-px bg-slate-300" />
          {label !== "Promedio mercado" && gapPct != null ? (
            <div
              className={`absolute inset-y-0 rounded-full ${toneClass.fill}`}
              style={{ left: `${left}%`, width: `${safeWidth}%` }}
            />
          ) : (
            <div className="absolute inset-y-0 left-[49.5%] w-[1%] rounded-full bg-slate-900" />
          )}
        </div>
      </div>
    </article>
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
    <div className={`rounded-[1.6rem] border p-5 ${toneClass.soft}`}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClass.badge}`}>
          {items.length} visibles
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">{emptyLabel}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <article key={`${title}-${item.productId}`} className="rounded-2xl border border-white bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-[16rem]">
                  <Link href={item.url} target="_blank" className="text-sm font-semibold text-slate-950 hover:text-teal-700">
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.category} · {item.subcategory}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${toneClass.text}`}>{formatSignedPercent(item.marketGapPct)}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(item.marketAveragePrice)} mercado</p>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-slate-600">
                <div className="flex items-center justify-between gap-4">
                  <span>DYP</span>
                  <span className="font-semibold text-slate-950">{formatCurrency(item.ourPrice)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Promedio mercado</span>
                  <span className="font-semibold text-slate-950">{formatCurrency(item.marketAveragePrice)}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {item.competitors.map((competitor) => (
                  <span
                    key={`${item.productId}-${competitor.siteId}`}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200"
                  >
                    {competitor.siteName} {formatCurrency(competitor.averagePrice)}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
