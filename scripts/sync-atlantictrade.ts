#!/usr/bin/env npx tsx
/**
 * Sync script — fetches all products from Atlantic Trade (WooCommerce)
 * and saves to src/data/atlantictrade-catalog.json
 *
 * Usage: npx tsx scripts/sync-atlantictrade.ts
 *
 * Atlantic Trade uses WooCommerce REST API v3.
 * Prices are assumed to be in USD — converted to ARS using dolarapi.com rate.
 *
 * Required env vars:
 *   ATLANTICTRADE_API_URL=https://atlantictrade.com.ar/wp-json/wc/v3
 *   ATLANTICTRADE_CONSUMER_KEY=ck_...
 *   ATLANTICTRADE_CONSUMER_SECRET=cs_...
 *
 * Operational note:
 *   Run manually after 20:00 Buenos Aires time and at most once per day.
 */

const ATLANTICTRADE_API_URL =
  process.env.ATLANTICTRADE_API_URL ||
  "https://atlantictrade.com.ar/wp-json/wc/v3";
const ATLANTICTRADE_CONSUMER_KEY = process.env.ATLANTICTRADE_CONSUMER_KEY;
const ATLANTICTRADE_CONSUMER_SECRET =
  process.env.ATLANTICTRADE_CONSUMER_SECRET;
const ATLANTICTRADE_STORE_API_URL =
  process.env.ATLANTICTRADE_STORE_API_URL ||
  "https://atlantictrade.com.ar/wp-json/wc/store/v1";
const PAGE_SIZE = 50;
const FETCH_TIMEOUT = 45_000;

interface WooProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  purchasable: boolean;
  stock_status: string;
  categories: { id: number; name: string; slug: string }[];
  images: { id: number; src: string; alt: string }[];
  attributes: { id: number; name: string; options: string[] }[];
}

interface StoreProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  sku: string;
  short_description: string;
  description: string;
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_code: string;
    currency_minor_unit: number;
  };
  images: { id: number; src: string; alt: string }[];
  categories: { id: number; name: string; slug: string }[];
  attributes: {
    id: number;
    name: string;
    terms: { id: number; name: string; slug: string }[];
  }[];
  is_purchasable: boolean;
  is_in_stock: boolean;
  add_to_cart?: {
    minimum?: number;
    maximum?: number;
    multiple_of?: number;
  };
}

interface CatalogProduct {
  product_id: string;
  external_id: string;
  title: string;
  description: string;
  category: string;
  materials: string[];
  colors: string[];
  personalization_methods: string[];
  eco_friendly: boolean;
  price: number | null;
  price_max: number | null;
  currency: string;
  min_qty: number;
  image_urls: string[];
  source: string;
}

const ATLANTICTRADE_CATEGORY_MAP: Record<string, string> = {
  "Accesorios Para Celular": "Tecnología",
  Cargadores: "Tecnología",
  Cables: "Tecnología",
  "Parlantes Bluetooth": "Tecnología",
  "Pen Drives": "Tecnología",
  "Power Banks": "Tecnología",
  Auriculares: "Tecnología",
  Otros: "Tecnología",
};

async function getUsdRate(): Promise<number> {
  const envRate = process.env.USD_RATE;
  if (envRate) return parseFloat(envRate);

  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/oficial");
    if (res.ok) {
      const data = await res.json();
      const rate = data.venta;
      if (typeof rate === "number" && rate > 0) {
        console.log(
          `Fetched USD oficial venta: $${rate} (${data.fechaActualizacion})`
        );
        return rate;
      }
    }
  } catch {
    // fallback
  }

  console.warn("Could not fetch USD rate, using fallback $1415");
  return 1415;
}

function stripHtml(html: string): string {
  const namedEntities: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    ldquo: '"',
    rdquo: '"',
    lsquo: "'",
    rsquo: "'",
    ndash: "-",
    mdash: "-",
  };

  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    )
    .replace(
      /&(nbsp|amp|quot|apos|lt|gt|ldquo|rdquo|lsquo|rsquo|ndash|mdash);/gi,
      (entity) => namedEntities[entity.slice(1, -1).toLowerCase()] || " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function extractAttributeOptions(
  attributes: WooProduct["attributes"],
  names: string[]
): string[] {
  const normalizedNames = names.map((name) => name.toLowerCase());
  const values = attributes
    .filter((attr) => normalizedNames.includes(attr.name.toLowerCase()))
    .flatMap((attr) => attr.options || [])
    .map((option) => option.trim())
    .filter(Boolean);

  return [...new Set(values)];
}

function extractStoreAttributeOptions(
  attributes: StoreProduct["attributes"],
  names: string[]
): string[] {
  const normalizedNames = names.map((name) => name.toLowerCase());
  const values = attributes
    .filter((attr) => normalizedNames.includes(attr.name.toLowerCase()))
    .flatMap((attr) => attr.terms || [])
    .map((term) => term.name.trim())
    .filter(Boolean);

  return [...new Set(values)];
}

function normalizeCategory(categories: { name: string }[]): string {
  for (const cat of categories) {
    const name = cat.name.trim();
    if (ATLANTICTRADE_CATEGORY_MAP[name]) return ATLANTICTRADE_CATEGORY_MAP[name];
    for (const [key, value] of Object.entries(ATLANTICTRADE_CATEGORY_MAP)) {
      if (name.toLowerCase() === key.toLowerCase()) return value;
    }
  }

  return "Tecnología";
}

async function fetchPage(
  page: number
): Promise<{ products: WooProduct[]; totalPages: number }> {
  const url = new URL(`${ATLANTICTRADE_API_URL}/products`);
  url.searchParams.set("consumer_key", ATLANTICTRADE_CONSUMER_KEY!);
  url.searchParams.set("consumer_secret", ATLANTICTRADE_CONSUMER_SECRET!);
  url.searchParams.set("per_page", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("status", "publish");

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) {
    throw new Error(`WooCommerce ${res.status}: ${await res.text()}`);
  }

  const totalPages = parseInt(res.headers.get("x-wp-totalpages") || "1", 10);
  const products = (await res.json()) as WooProduct[];
  return { products, totalPages };
}

async function fetchStorePage(page: number): Promise<StoreProduct[]> {
  const url = new URL(`${ATLANTICTRADE_STORE_API_URL}/products`);
  url.searchParams.set("per_page", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) {
    throw new Error(`Store API ${res.status}: ${await res.text()}`);
  }

  return (await res.json()) as StoreProduct[];
}

async function fetchAllWooProducts(): Promise<WooProduct[]> {
  const allProducts: WooProduct[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    process.stdout.write(`  Page ${page}/${totalPages}...`);
    const { products, totalPages: currentTotalPages } = await fetchPage(page);
    totalPages = currentTotalPages;
    console.log(` ${products.length} products`);

    if (products.length === 0) break;
    allProducts.push(...products);

    if (page >= totalPages) break;
    page++;
  }

  return allProducts;
}

async function fetchAllStoreProducts(): Promise<StoreProduct[]> {
  const allProducts: StoreProduct[] = [];
  let page = 1;

  while (true) {
    process.stdout.write(`  Page ${page}...`);
    const products = await fetchStorePage(page);
    console.log(` ${products.length} products`);

    if (products.length === 0) break;
    allProducts.push(...products);

    if (products.length < PAGE_SIZE) break;
    page++;
  }

  return allProducts;
}

function transformProduct(
  product: WooProduct,
  usdRate: number
): CatalogProduct | null {
  if (product.status !== "publish") return null;
  if (product.stock_status === "outofstock") return null;

  const colors = extractAttributeOptions(product.attributes, [
    "color",
    "colores",
  ]);
  const materials = extractAttributeOptions(product.attributes, [
    "material",
    "materiales",
  ]);

  const priceStr = product.sale_price || product.price || product.regular_price;
  const priceUsd = priceStr ? parseFloat(priceStr) : null;
  const priceArs =
    priceUsd != null && !Number.isNaN(priceUsd)
      ? Math.round(priceUsd * usdRate * 100) / 100
      : null;

  const regularPriceUsd = product.regular_price
    ? parseFloat(product.regular_price)
    : null;
  const priceMaxArs =
    regularPriceUsd != null && !Number.isNaN(regularPriceUsd)
      ? Math.round(regularPriceUsd * usdRate * 100) / 100
      : priceArs;

  const imageUrls = product.images.map((img) => img.src).filter(Boolean);
  const description = stripHtml(
    product.short_description || product.description || ""
  );

  const searchText =
    `${product.name} ${description} ${product.categories.map((c) => c.name).join(" ")}`.toLowerCase();
  const ecoFriendly =
    searchText.includes("sustentable") ||
    searchText.includes("eco") ||
    searchText.includes("bambú") ||
    searchText.includes("bamboo") ||
    searchText.includes("reciclad");

  return {
    product_id: `atl_${product.id}`,
    external_id: product.sku || String(product.id),
    title: product.name,
    description,
    category: normalizeCategory(product.categories),
    materials,
    colors,
    personalization_methods: [],
    eco_friendly: ecoFriendly,
    price: priceArs,
    price_max: priceMaxArs,
    currency: "ARS",
    min_qty: 1,
    image_urls: imageUrls,
    source: "atlantictrade",
  };
}

function parseStorePrice(
  value: string,
  minorUnit: number,
  usdRate: number
): number | null {
  if (!value) return null;

  const numeric = parseFloat(value);
  if (Number.isNaN(numeric) || numeric <= 0) return null;

  const divisor = 10 ** minorUnit;
  const priceUsd = numeric / divisor;
  return Math.round(priceUsd * usdRate * 100) / 100;
}

function transformStoreProduct(
  product: StoreProduct,
  usdRate: number
): CatalogProduct | null {
  if (!product.is_in_stock) return null;

  const colors = extractStoreAttributeOptions(product.attributes, [
    "color",
    "colores",
  ]);
  const materials = extractStoreAttributeOptions(product.attributes, [
    "material",
    "materiales",
  ]);

  const minorUnit = product.prices.currency_minor_unit ?? 2;
  const priceArs =
    parseStorePrice(
      product.prices.sale_price || product.prices.price,
      minorUnit,
      usdRate
    ) ?? parseStorePrice(product.prices.regular_price, minorUnit, usdRate);
  const priceMaxArs =
    parseStorePrice(product.prices.regular_price, minorUnit, usdRate) ?? priceArs;

  const imageUrls = product.images.map((img) => img.src).filter(Boolean);
  const description = stripHtml(
    product.short_description || product.description || ""
  );

  const searchText =
    `${product.name} ${description} ${product.categories.map((c) => c.name).join(" ")}`.toLowerCase();
  const ecoFriendly =
    searchText.includes("sustentable") ||
    searchText.includes("eco") ||
    searchText.includes("bambú") ||
    searchText.includes("bamboo") ||
    searchText.includes("reciclad");

  return {
    product_id: `atl_${product.id}`,
    external_id: product.sku || String(product.id),
    title: stripHtml(product.name),
    description,
    category: normalizeCategory(product.categories),
    materials,
    colors,
    personalization_methods: [],
    eco_friendly: ecoFriendly,
    price: priceArs,
    price_max: priceMaxArs,
    currency: "ARS",
    min_qty: Math.max(1, product.add_to_cart?.minimum || 1),
    image_urls: imageUrls,
    source: "atlantictrade",
  };
}

async function main() {
  console.log(
    "Atlantic Trade should be synced manually after 20:00 Buenos Aires time and at most once per day."
  );

  const usdRate = await getUsdRate();
  const hasWooCredentials = Boolean(
    ATLANTICTRADE_CONSUMER_KEY && ATLANTICTRADE_CONSUMER_SECRET
  );
  const sourceLabel = hasWooCredentials
    ? "WooCommerce REST API"
    : "WooCommerce Store API (public fallback)";

  console.log(`Fetching catalog from Atlantic Trade (${sourceLabel})...`);
  console.log(`USD/ARS rate: ${usdRate}\n`);

  const allProducts = hasWooCredentials
    ? await fetchAllWooProducts()
    : await fetchAllStoreProducts();
  console.log(`\nFetched ${allProducts.length} raw products`);

  const catalog: CatalogProduct[] = [];
  let skipped = 0;

  for (const product of allProducts) {
    const transformed = hasWooCredentials
      ? transformProduct(product as WooProduct, usdRate)
      : transformStoreProduct(product as StoreProduct, usdRate);
    if (transformed) {
      catalog.push(transformed);
    } else {
      skipped++;
    }
  }

  console.log(`Transformed: ${catalog.length} products (${skipped} skipped)`);

  const withImages = catalog.filter((p) => p.image_urls.length > 0).length;
  const withPrice = catalog.filter((p) => p.price != null).length;
  const categories = [...new Set(catalog.map((p) => p.category))];
  console.log(`  With images: ${withImages}`);
  console.log(`  With price: ${withPrice}`);
  console.log(`  Categories: ${categories.length}`);
  categories.sort().forEach((category) => {
    const count = catalog.filter((p) => p.category === category).length;
    console.log(`    - ${category}: ${count}`);
  });

  const output = {
    synced_at: new Date().toISOString(),
    source: "atlantictrade",
    usd_rate: usdRate,
    total: catalog.length,
    products: catalog,
  };

  const { writeFileSync } = await import("fs");
  const { fileURLToPath } = await import("url");
  const outPath = fileURLToPath(
    new URL("../src/data/atlantictrade-catalog.json", import.meta.url)
  );
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  const sizeKB =
    Math.round((Buffer.byteLength(JSON.stringify(output)) / 1024) * 10) / 10;
  console.log(`\nWritten to ${outPath} (${sizeKB} KB)`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
