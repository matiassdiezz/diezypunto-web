#!/usr/bin/env npx tsx

import fs from "node:fs/promises";
import path from "node:path";

const MERCH_SITEMAP_URL = "https://merch.com.ar/product-sitemap.xml";
const MERCH_DOMAIN = "merch.com.ar";
const OUTPUT_DIR = path.resolve("reports");
const REQUEST_TIMEOUT_MS = 20000;
const RETRIES = 3;
const CONCURRENCY = 10;
const OUR_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://diezypunto-web.vercel.app";

type CatalogProduct = {
  product_id: string;
  title: string;
  category: string;
  price: number | null;
  currency?: string;
  source?: string;
};

type CatalogFile = {
  products: CatalogProduct[];
};

type MerchProduct = {
  title: string | null;
  normalizedTitle: string;
  category: string | null;
  price: number | null;
  url: string;
  priceBasis: "plus_vat";
  includesPersonalization: "unknown";
  fetchError?: string;
};

type DatasetRow = {
  snapshot_month: string;
  snapshot_at: string;
  our_product_id: string;
  our_product_title: string;
  our_category: string;
  our_product_url: string;
  our_price_ars: number | null;
  our_price_basis: "final";
  competitor_domain: string;
  competitor_product_title: string | null;
  competitor_product_url: string | null;
  competitor_category: string | null;
  competitor_price_ars: number | null;
  competitor_price_basis: "plus_vat" | null;
  competitor_includes_personalization: "unknown" | null;
  title_match_key: string;
  match_type: "exact_normalized_title" | "none" | "ambiguous_competitor_title";
  price_gap_ars: number | null;
  price_gap_pct: number | null;
  coverage_status:
    | "matched_with_price"
    | "matched_without_price"
    | "no_title_match"
    | "ambiguous_title_match";
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url: string, attempt = 1): Promise<string> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; diezypunto-price-dashboard/1.0; +https://diezypunto-web.vercel.app)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    if (attempt >= RETRIES) {
      throw error;
    }
    await sleep(500 * attempt);
    return fetchText(url, attempt + 1);
  }
}

function extractMatches(input: string, regex: RegExp) {
  return [...input.matchAll(regex)].map((match) => match[1]).filter(Boolean);
}

function decodeJsonString(value: string | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    return value;
  }
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#0?34;/g, '"')
    .replace(/&#0?36;/g, "$")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseJsonAttribute<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(decodeHtmlEntities(value)) as T;
  } catch {
    return null;
  }
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function slugToNormalizedTitle(url: string) {
  const pathname = new URL(url).pathname;
  const slug = decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "");
  return normalizeText(slug.replace(/[-_]+/g, " "));
}

function parsePrice(value: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const direct = Number(trimmed);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const normalized = trimmed.replace(/\./g, "").replace(/,/g, ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPrice(value: number | null) {
  return value == null ? "" : value.toFixed(2);
}

function csvEscape(value: string | number | null) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  worker: (item: T, idx: number) => Promise<R>,
  concurrency = CONCURRENCY,
) {
  const results = new Array<R>(items.length);
  let index = 0;

  async function run() {
    while (true) {
      const current = index++;
      if (current >= items.length) return;
      results[current] = await worker(items[current], current);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => run()),
  );

  return results;
}

function parseMerchProductPage(html: string, url: string): MerchProduct {
  const gtmProductData = parseJsonAttribute<{
    item_name?: string;
    price?: number;
    item_category?: string;
  }>(html.match(/name="gtm4wp_product_data"\s+value="([^"]+)"/)?.[1]);

  const productId =
    html.match(/"content_ids":\s*"\[\\"(\d+)\\"\]"/)?.[1] ??
    html.match(/data-product_id="(\d+)"/)?.[1] ??
    html.match(/var pid\s*=\s*(\d+);/)?.[1] ??
    null;

  const fallbackTitle =
    gtmProductData?.item_name?.trim() ??
    decodeJsonString(html.match(/"content_name":\s*"((?:\\.|[^"])*)"/)?.[1]) ??
    decodeJsonString(html.match(/<title>([^<]+)<\/title>/)?.[1]?.replace(/\s+\|\s+MERCH$/, "")) ??
    null;

  const category =
    gtmProductData?.item_category?.trim() ??
    decodeJsonString(html.match(/"content_category":\s*"((?:\\.|[^"])*)"/)?.[1]) ??
    null;

  let mappedTitle = fallbackTitle;
  let mappedPrice: number | null =
    typeof gtmProductData?.price === "number" ? gtmProductData.price : null;

  if (productId) {
    const entryPattern = new RegExp(`"${productId}":\\{([^}]+)\\}`);
    const entry = html.match(entryPattern)?.[1] ?? null;
    if (entry) {
      mappedTitle =
        decodeJsonString(entry.match(/"name":"((?:\\\\.|[^"])*)"/)?.[1]) ?? mappedTitle;

      const rawPrice = entry.match(/"price":([0-9.]+)/)?.[1] ?? null;
      mappedPrice = parsePrice(rawPrice);
    }
  }

  if (mappedPrice == null) {
    const displayPrice =
      html.match(/"display_price":([0-9.]+)/)?.[1] ??
      html.match(/<p class="price">[\s\S]*?<bdi>[\s\S]*?\$<\/span>([0-9.,]+)/)?.[1] ??
      null;

    mappedPrice = parsePrice(displayPrice);
  }

  const title = mappedTitle?.trim() || null;

  return {
    title,
    normalizedTitle: title ? normalizeText(title) : slugToNormalizedTitle(url),
    category,
    price: Number.isFinite(mappedPrice) ? mappedPrice : null,
    url,
    priceBasis: "plus_vat",
    includesPersonalization: "unknown",
  };
}

async function fetchMerchProduct(url: string) {
  const html = await fetchText(url);
  return parseMerchProductPage(html, url);
}

function getSnapshotMonth() {
  const explicitArg = process.argv.find((arg) => arg.startsWith("--snapshot-month="));
  if (explicitArg) {
    return explicitArg.slice("--snapshot-month=".length);
  }
  return new Date().toISOString().slice(0, 7);
}

async function main() {
  const snapshotAt = new Date().toISOString();
  const snapshotMonth = getSnapshotMonth();
  const catalogPath = path.resolve("src/data/catalog.json");
  const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8")) as CatalogFile;

  const ourProducts = catalog.products.filter(
    (product) => typeof product.title === "string" && product.title.trim(),
  );

  const ourProductsByKey = new Map<string, CatalogProduct[]>();
  for (const product of ourProducts) {
    const key = normalizeText(product.title);
    const current = ourProductsByKey.get(key) || [];
    current.push(product);
    ourProductsByKey.set(key, current);
  }

  const duplicateOurTitleKeys = [...ourProductsByKey.entries()].filter(
    ([, products]) => products.length > 1,
  ).length;

  console.log("Descargando sitemap de merch...");
  const sitemapXml = await fetchText(MERCH_SITEMAP_URL);
  const merchUrls = extractMatches(
    sitemapXml,
    /<loc><!\[CDATA\[(https:\/\/merch\.com\.ar\/producto\/[^[]+?)\]\]><\/loc>/g,
  );

  const candidateUrls = merchUrls.filter((url) =>
    ourProductsByKey.has(slugToNormalizedTitle(url)),
  );

  console.log(`Productos en sitemap: ${merchUrls.length}`);
  console.log(`Candidatos por slug normalizado: ${candidateUrls.length}`);

  const merchProducts = await mapWithConcurrency(candidateUrls, async (url, idx) => {
    try {
      return await fetchMerchProduct(url);
    } catch (error) {
      return {
        title: null,
        normalizedTitle: slugToNormalizedTitle(url),
        category: null,
        price: null,
        url,
        priceBasis: "plus_vat" as const,
        includesPersonalization: "unknown" as const,
        fetchError: String(error),
      };
    } finally {
      if ((idx + 1) % 25 === 0 || idx === candidateUrls.length - 1) {
        console.log(`Merch ${idx + 1}/${candidateUrls.length}`);
      }
    }
  });

  const failedUrls = merchProducts.filter((product) => product.fetchError).map((product) => product.url);

  if (failedUrls.length > 0) {
    console.log(`Reintentando ${failedUrls.length} páginas con throttling...`);

    const recoveredProducts = await mapWithConcurrency(
      failedUrls,
      async (url, idx) => {
        try {
          await sleep(150);
          return await fetchMerchProduct(url);
        } catch (error) {
          return {
            title: null,
            normalizedTitle: slugToNormalizedTitle(url),
            category: null,
            price: null,
            url,
            priceBasis: "plus_vat" as const,
            includesPersonalization: "unknown" as const,
            fetchError: String(error),
          };
        } finally {
          if ((idx + 1) % 25 === 0 || idx === failedUrls.length - 1) {
            console.log(`Retry ${idx + 1}/${failedUrls.length}`);
          }
        }
      },
      2,
    );

    const recoveredByUrl = new Map(
      recoveredProducts.map((product) => [product.url, product] as const),
    );

    for (let index = 0; index < merchProducts.length; index += 1) {
      const recovered = recoveredByUrl.get(merchProducts[index].url);
      if (recovered) {
        merchProducts[index] = recovered;
      }
    }
  }

  const merchByKey = new Map<string, MerchProduct[]>();
  for (const product of merchProducts) {
    const current = merchByKey.get(product.normalizedTitle) || [];
    current.push(product);
    merchByKey.set(product.normalizedTitle, current);
  }

  const duplicateCompetitorTitleKeys = [...merchByKey.entries()].filter(
    ([, products]) => products.length > 1,
  ).length;

  const rows: DatasetRow[] = ourProducts.map((product) => {
    const titleMatchKey = normalizeText(product.title);
    const matches = merchByKey.get(titleMatchKey) || [];
    const baseRow = {
      snapshot_month: snapshotMonth,
      snapshot_at: snapshotAt,
      our_product_id: product.product_id,
      our_product_title: product.title,
      our_category: product.category,
      our_product_url: `${OUR_SITE_URL}/producto/${product.product_id}`,
      our_price_ars: product.price,
      our_price_basis: "final" as const,
      competitor_domain: MERCH_DOMAIN,
      title_match_key: titleMatchKey,
    };

    if (matches.length === 0) {
      return {
        ...baseRow,
        competitor_product_title: null,
        competitor_product_url: null,
        competitor_category: null,
        competitor_price_ars: null,
        competitor_price_basis: null,
        competitor_includes_personalization: null,
        match_type: "none" as const,
        price_gap_ars: null,
        price_gap_pct: null,
        coverage_status: "no_title_match" as const,
      };
    }

    if (matches.length > 1) {
      return {
        ...baseRow,
        competitor_product_title: null,
        competitor_product_url: null,
        competitor_category: null,
        competitor_price_ars: null,
        competitor_price_basis: null,
        competitor_includes_personalization: null,
        match_type: "ambiguous_competitor_title" as const,
        price_gap_ars: null,
        price_gap_pct: null,
        coverage_status: "ambiguous_title_match" as const,
      };
    }

    const match = matches[0];
    const priceGapArs =
      product.price != null && match.price != null ? product.price - match.price : null;
    const priceGapPct =
      product.price != null && match.price != null && match.price !== 0
        ? (priceGapArs! / match.price) * 100
        : null;

    return {
      ...baseRow,
      competitor_product_title: match.title,
      competitor_product_url: match.url,
      competitor_category: match.category,
      competitor_price_ars: match.price,
      competitor_price_basis: match.priceBasis,
      competitor_includes_personalization: match.includesPersonalization,
      match_type: "exact_normalized_title" as const,
      price_gap_ars: priceGapArs,
      price_gap_pct: priceGapPct,
      coverage_status: match.price != null ? "matched_with_price" : "matched_without_price",
    };
  });

  rows.sort((a, b) => a.our_product_title.localeCompare(b.our_product_title, "es"));

  const csvHeader = [
    "snapshot_month",
    "snapshot_at",
    "our_product_id",
    "our_product_title",
    "our_category",
    "our_product_url",
    "our_price_ars",
    "our_price_basis",
    "competitor_domain",
    "competitor_product_title",
    "competitor_product_url",
    "competitor_category",
    "competitor_price_ars",
    "competitor_price_basis",
    "competitor_includes_personalization",
    "title_match_key",
    "match_type",
    "price_gap_ars",
    "price_gap_pct",
    "coverage_status",
  ];

  const csvLines = [
    csvHeader.join(","),
    ...rows.map((row) =>
      [
        csvEscape(row.snapshot_month),
        csvEscape(row.snapshot_at),
        csvEscape(row.our_product_id),
        csvEscape(row.our_product_title),
        csvEscape(row.our_category),
        csvEscape(row.our_product_url),
        csvEscape(formatPrice(row.our_price_ars)),
        csvEscape(row.our_price_basis),
        csvEscape(row.competitor_domain),
        csvEscape(row.competitor_product_title),
        csvEscape(row.competitor_product_url),
        csvEscape(row.competitor_category),
        csvEscape(formatPrice(row.competitor_price_ars)),
        csvEscape(row.competitor_price_basis),
        csvEscape(row.competitor_includes_personalization),
        csvEscape(row.title_match_key),
        csvEscape(row.match_type),
        csvEscape(formatPrice(row.price_gap_ars)),
        csvEscape(row.price_gap_pct == null ? "" : row.price_gap_pct.toFixed(4)),
        csvEscape(row.coverage_status),
      ].join(","),
    ),
  ];

  const summary = {
    generatedAt: snapshotAt,
    snapshotMonth,
    competitor: MERCH_DOMAIN,
    ourProducts: ourProducts.length,
    sitemapProducts: merchUrls.length,
    candidateUrls: candidateUrls.length,
    fetchedCompetitorPages: merchProducts.length,
    duplicateOurTitleKeys,
    duplicateCompetitorTitleKeys,
    matchedWithPrice: rows.filter((row) => row.coverage_status === "matched_with_price").length,
    matchedWithoutPrice: rows.filter((row) => row.coverage_status === "matched_without_price")
      .length,
    noTitleMatch: rows.filter((row) => row.coverage_status === "no_title_match").length,
    ambiguousTitleMatch: rows.filter((row) => row.coverage_status === "ambiguous_title_match")
      .length,
    competitorFetchErrors: merchProducts.filter((product) => product.fetchError).length,
  };

  const slug = `price-dashboard-${MERCH_DOMAIN.replace(/\./g, "-")}-${snapshotMonth}`;
  const csvPath = path.join(OUTPUT_DIR, `${slug}.csv`);
  const summaryPath = path.join(OUTPUT_DIR, `${slug}-summary.json`);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(csvPath, `${csvLines.join("\n")}\n`, "utf8");
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(JSON.stringify({ ...summary, csvPath, summaryPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
