import fs from "node:fs/promises";
import path from "node:path";

const OFFICIAL_SITEMAP_INDEX_URL = "https://www.diezypunto.com.ar/sitemap_index.xml";
const OUR_PRODUCT_URL_BASE = "https://diezypunto-web.vercel.app/producto";
const OUTPUT_DIR = path.resolve("reports");
const CSV_PATH = path.join(OUTPUT_DIR, "price-comparison.csv");
const JSON_PATH = path.join(OUTPUT_DIR, "price-comparison-summary.json");
const CONCURRENCY = 12;
const REQUEST_TIMEOUT_MS = 15000;
const RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; price-audit/1.0; +https://diezypunto-web.vercel.app)",
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

function extractMatches(input, regex) {
  return [...input.matchAll(regex)].map((match) => match[1]).filter(Boolean);
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&#0?36;/g, "$")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeOfficialPrice(raw) {
  const cleaned = decodeHtmlEntities(raw)
    .replace(/\$/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .trim();

  const price = Number(cleaned);
  return Number.isFinite(price) ? price : null;
}

function normalizeDecimal(raw) {
  const price = Number(String(raw).replace(/,/g, "").trim());
  return Number.isFinite(price) ? price : null;
}

function formatPrice(price) {
  return price == null ? "" : price.toFixed(2);
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function parseOfficialProduct(html, url) {
  const retailerId =
    html.match(/property="product:retailer_item_id"\s+content="ZT([^"]+)"/)?.[1] ??
    html.match(/"productGroupID":"ZT([^"]+)"/)?.[1] ??
    null;
  const title =
    decodeHtmlEntities(
      html.match(/<title>([^<]+?)\s+-\s+Diez y Punto<\/title>/)?.[1] ??
        html.match(/property="og:title"\s+content="([^"]+)"/)?.[1] ??
        "",
    ) || null;
  const rawPrice =
    html.match(/name="twitter:data1"\s+content="([^"]+)"/)?.[1] ??
    html.match(/"price":"([0-9.]+)"/)?.[1] ??
    null;

  return {
    url,
    retailerId,
    title,
    officialPrice:
      rawPrice && rawPrice.includes("&#036;")
        ? normalizeOfficialPrice(rawPrice)
        : normalizeDecimal(rawPrice),
  };
}

function parseOurProduct(html) {
  const title =
    decodeHtmlEntities(
      html.match(/<title>([^<]+?)\s+\|\s+Merchandising Corporativo \| diezypunto<\/title>/)?.[1] ??
        "",
    ) || null;
  const rawPrice =
    html.match(/"offers":\{"@type":"Offer","priceCurrency":"ARS","price":"([0-9.]+)"/)?.[1] ??
    html.match(/"price":([0-9.]+),"price_max"/)?.[1] ??
    null;

  return {
    title,
    ourPrice: normalizeDecimal(rawPrice),
  };
}

async function mapWithConcurrency(items, worker, concurrency = CONCURRENCY) {
  const results = new Array(items.length);
  let index = 0;

  async function run() {
    while (true) {
      const current = index++;
      if (current >= items.length) {
        return;
      }
      results[current] = await worker(items[current], current);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => run()),
  );

  return results;
}

async function main() {
  const catalogPath = path.resolve("src/data/catalog.json");
  const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
  const localByExternalId = new Map(
    catalog.products
      .filter((product) => product.external_id)
      .map((product) => [
        String(product.external_id),
        { productId: String(product.product_id), title: product.title },
      ]),
  );

  console.log("Descargando sitemap oficial...");
  const sitemapIndexXml = await fetchText(OFFICIAL_SITEMAP_INDEX_URL);
  const productSitemapUrls = extractMatches(
    sitemapIndexXml,
    /<loc>(https:\/\/www\.diezypunto\.com\.ar\/product-sitemap\d+\.xml)<\/loc>/g,
  );

  const sitemapXmls = await mapWithConcurrency(
    productSitemapUrls,
    async (url) => fetchText(url),
    4,
  );

  const officialUrls = [
    ...new Set(
      sitemapXmls.flatMap((xml) =>
        extractMatches(
          xml,
          /<loc>(https:\/\/www\.diezypunto\.com\.ar\/producto\/[^<]+)<\/loc>/g,
        ),
      ),
    ),
  ];

  console.log(`Productos oficiales detectados: ${officialUrls.length}`);

  const officialProducts = await mapWithConcurrency(
    officialUrls,
    async (url, idx) => {
      let parsed;
      try {
        const html = await fetchText(url);
        parsed = parseOfficialProduct(html, url);
      } catch (error) {
        parsed = {
          url,
          retailerId: null,
          title: null,
          officialPrice: null,
          fetchError: String(error),
        };
      }
      if ((idx + 1) % 50 === 0 || idx === officialUrls.length - 1) {
        console.log(`Oficial ${idx + 1}/${officialUrls.length}`);
      }
      return parsed;
    },
  );

  const matchedProducts = officialProducts
    .map((product) => {
      const local = product.retailerId
        ? localByExternalId.get(String(product.retailerId))
        : null;
      return { ...product, local };
    })
    .filter((product) => product.local);

  const unmatchedProducts = officialProducts.filter((product) => !product.retailerId);
  const missingInOurCatalog = officialProducts.filter(
    (product) => product.retailerId && !localByExternalId.has(String(product.retailerId)),
  );
  const officialFetchErrors = officialProducts.filter((product) => product.fetchError).length;

  console.log(`Productos cruzados con nuestro catálogo: ${matchedProducts.length}`);

  const ourProducts = await mapWithConcurrency(
    matchedProducts,
    async (product, idx) => {
      const url = `${OUR_PRODUCT_URL_BASE}/${product.local.productId}?qty=10`;
      let parsed;
      try {
        const html = await fetchText(url);
        parsed = parseOurProduct(html);
      } catch (error) {
        parsed = {
          title: null,
          ourPrice: null,
          fetchError: String(error),
        };
      }
      if ((idx + 1) % 50 === 0 || idx === matchedProducts.length - 1) {
        console.log(`Nuestro ${idx + 1}/${matchedProducts.length}`);
      }
      return {
        product: parsed.title ?? product.title ?? product.local.title ?? product.retailerId,
        precio_diez_y_punto: product.officialPrice,
        precio_nuestro: parsed.ourPrice,
      };
    },
  );

  const missingRows = missingInOurCatalog.map((product) => ({
    product: product.title ?? product.retailerId ?? product.url,
    precio_diez_y_punto: product.officialPrice,
    precio_nuestro: null,
  }));

  const rows = [...ourProducts, ...missingRows].sort((a, b) =>
    a.product.localeCompare(b.product, "es"),
  );

  const csvLines = [
    ["producto", "precio_diez_y_punto", "precio_nuestro"].join(","),
    ...rows.map((row) =>
      [
        csvEscape(row.product),
        csvEscape(formatPrice(row.precio_diez_y_punto)),
        csvEscape(formatPrice(row.precio_nuestro)),
      ].join(","),
    ),
  ];

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(CSV_PATH, `${csvLines.join("\n")}\n`, "utf8");

  const summary = {
    generatedAt: new Date().toISOString(),
    productSitemaps: productSitemapUrls.length,
    officialProducts: officialUrls.length,
    matchedProducts: matchedProducts.length,
    missingInOurCatalog: missingInOurCatalog.length,
    missingOfficialRetailerId: unmatchedProducts.length,
    officialFetchErrors,
    ourFetchErrors: ourProducts.filter((row) => row.precio_nuestro == null).length,
    csvPath: CSV_PATH,
  };

  await fs.writeFile(JSON_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
