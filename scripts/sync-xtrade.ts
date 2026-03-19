#!/usr/bin/env npx tsx
/**
 * Sync script — fetches all products from X-Trade Online (WooCommerce)
 * and saves to src/data/xtrade-catalog.json
 *
 * Usage: npx tsx scripts/sync-xtrade.ts
 *
 * X-Trade uses WooCommerce REST API v3.
 * Prices are in USD — converted to ARS using dolarapi.com rate.
 *
 * Required env vars:
 *   XTRADE_API_URL=https://x-tradeonline.com.ar/wp-json/wc/v3
 *   XTRADE_CONSUMER_KEY=ck_...
 *   XTRADE_CONSUMER_SECRET=cs_...
 */

const XTRADE_API_URL =
  process.env.XTRADE_API_URL || "https://x-tradeonline.com.ar/wp-json/wc/v3";
const XTRADE_CONSUMER_KEY = process.env.XTRADE_CONSUMER_KEY;
const XTRADE_CONSUMER_SECRET = process.env.XTRADE_CONSUMER_SECRET;
const PAGE_SIZE = 100;

interface WooProduct {
  id: number;
  name: string;
  slug: string;
  type: string; // "simple" | "variable" | "grouped"
  status: string; // "publish" | "draft" | "pending"
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_status: string; // "instock" | "outofstock" | "onbackorder"
  categories: { id: number; name: string; slug: string }[];
  images: { id: number; src: string; alt: string }[];
  attributes: { id: number; name: string; options: string[] }[];
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

// Map X-Trade categories to Diezypunto normalized categories
const XTRADE_CATEGORY_MAP: Record<string, string> = {
  BOTELLAS: "Drinkware",
  CUPS: "Drinkware",
  TERMICOS: "Drinkware",
  ESCRITURA: "Escritura",
  Plasticos: "Escritura",
  Metalicos: "Escritura",
  Madera: "Escritura",
  Estuches: "Escritura",
  MOCHILAS: "Bolsos y Mochilas",
  BOLSOS: "Bolsos y Mochilas",
  BANDOLERAS: "Bolsos y Mochilas",
  "CARRY ON": "Bolsos y Mochilas",
  TECNOLOGIA: "Tecnología",
  "OFICINA Y ESCRITORIO": "Oficina",
  PORTFOLIOS: "Oficina",
  CALCULADORAS: "Oficina",
  LLAVEROS: "Llaveros",
  PARAGUAS: "Paraguas",
  RELOJES: "Relojes",
  HERRAMIENTAS: "Herramientas",
  "CUIDADO PERSONAL": "Bienestar",
  HOGAR: "Hogar y Tiempo Libre",
  "Accesorios de vino": "Hogar y Tiempo Libre",
  "Utensillos de cocina": "Hogar y Tiempo Libre",
  OUTDOORS: "Outdoor",
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
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/g, " ")
    .trim();
}

function normalizeCategory(categories: { name: string }[]): string {
  for (const cat of categories) {
    const name = cat.name.trim();
    // Direct match
    if (XTRADE_CATEGORY_MAP[name]) return XTRADE_CATEGORY_MAP[name];
    // Case-insensitive match
    for (const [key, value] of Object.entries(XTRADE_CATEGORY_MAP)) {
      if (name.toLowerCase() === key.toLowerCase()) return value;
    }
  }

  // Partial match on any category
  for (const cat of categories) {
    const lower = cat.name.toLowerCase();
    for (const [key, value] of Object.entries(XTRADE_CATEGORY_MAP)) {
      if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
        return value;
      }
    }
  }

  return categories[0]?.name || "General";
}

async function fetchPage(page: number): Promise<WooProduct[]> {
  const url = new URL(`${XTRADE_API_URL}/products`);
  url.searchParams.set("consumer_key", XTRADE_CONSUMER_KEY!);
  url.searchParams.set("consumer_secret", XTRADE_CONSUMER_SECRET!);
  url.searchParams.set("per_page", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("status", "publish");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`WooCommerce ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

async function fetchAllProducts(): Promise<WooProduct[]> {
  const allProducts: WooProduct[] = [];
  let page = 1;

  while (true) {
    process.stdout.write(`  Page ${page}...`);
    const products = await fetchPage(page);
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
  // Filter: only published, in-stock products
  if (product.status !== "publish") return null;
  if (product.stock_status !== "instock") return null;

  // Extract colors from attributes
  const colorAttr = product.attributes.find(
    (a) => a.name.toLowerCase() === "color"
  );
  const colors = colorAttr?.options || [];

  // Extract materials from attributes
  const materialAttr = product.attributes.find(
    (a) => a.name.toLowerCase() === "material"
  );
  const materials = materialAttr?.options || [];

  // Price: USD → ARS
  const priceStr = product.sale_price || product.price || product.regular_price;
  const priceUsd = priceStr ? parseFloat(priceStr) : null;
  const priceArs =
    priceUsd != null && !isNaN(priceUsd)
      ? Math.round(priceUsd * usdRate * 100) / 100
      : null;

  const regularPriceUsd = product.regular_price
    ? parseFloat(product.regular_price)
    : null;
  const priceMaxArs =
    regularPriceUsd != null && !isNaN(regularPriceUsd)
      ? Math.round(regularPriceUsd * usdRate * 100) / 100
      : priceArs;

  // Images
  const imageUrls = product.images.map((img) => img.src).filter(Boolean);

  // Description
  const description = stripHtml(
    product.short_description || product.description || ""
  );

  // Eco-friendly detection
  const searchText =
    `${product.name} ${description} ${product.categories.map((c) => c.name).join(" ")}`.toLowerCase();
  const ecoFriendly =
    searchText.includes("sustentable") ||
    searchText.includes("eco") ||
    searchText.includes("bambú") ||
    searchText.includes("bamboo") ||
    searchText.includes("reciclad");

  return {
    product_id: `xt_${product.id}`,
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
    source: "xtrade",
  };
}

async function main() {
  if (!XTRADE_CONSUMER_KEY || !XTRADE_CONSUMER_SECRET) {
    console.error(
      "Missing XTRADE_CONSUMER_KEY or XTRADE_CONSUMER_SECRET env vars"
    );
    process.exit(1);
  }

  const usdRate = await getUsdRate();
  console.log(`Fetching catalog from X-Trade Online (WooCommerce)...`);
  console.log(`USD/ARS rate: ${usdRate}\n`);

  const allProducts = await fetchAllProducts();
  console.log(`\nFetched ${allProducts.length} raw products`);

  // Transform
  const catalog: CatalogProduct[] = [];
  let skipped = 0;

  for (const product of allProducts) {
    const transformed = transformProduct(product, usdRate);
    if (transformed) {
      catalog.push(transformed);
    } else {
      skipped++;
    }
  }

  console.log(`Transformed: ${catalog.length} products (${skipped} skipped)`);

  // Stats
  const withImages = catalog.filter((p) => p.image_urls.length > 0).length;
  const withPrice = catalog.filter((p) => p.price != null).length;
  const categories = [...new Set(catalog.map((p) => p.category))];
  console.log(`  With images: ${withImages}`);
  console.log(`  With price: ${withPrice}`);
  console.log(`  Categories: ${categories.length}`);
  categories.sort().forEach((c) => {
    const count = catalog.filter((p) => p.category === c).length;
    console.log(`    - ${c}: ${count}`);
  });

  // Write
  const output = {
    synced_at: new Date().toISOString(),
    source: "xtrade",
    usd_rate: usdRate,
    total: catalog.length,
    products: catalog,
  };

  const { writeFileSync } = await import("fs");
  const { fileURLToPath } = await import("url");
  const outPath = fileURLToPath(
    new URL("../src/data/xtrade-catalog.json", import.meta.url)
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
