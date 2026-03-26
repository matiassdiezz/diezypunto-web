#!/usr/bin/env npx tsx
/**
 * Sync script — fetches all products from CDO Promocionales API v2
 * and saves to src/data/cdo-catalog.json
 *
 * Usage:
 *   CDO_API_TOKEN=xxx npx tsx scripts/sync-cdo.ts
 *
 * CDO prices are in USD — converted to ARS using USD_RATE env var or dolarapi.com.
 * Uses net_price (already discounted) as the base price.
 *
 * API v2 (production): http://api.argentina.cdopromocionales.com/v2/products?auth_token=TOKEN
 * API v1 (test):       http://api.argentina.cdo.dev.yellowspot.com.ar/v1/products?auth_token=TOKEN
 */

// Production (v2) or test (v1) — set CDO_API_URL to override
const CDO_API_BASE =
  process.env.CDO_API_URL || "http://api.argentina.cdopromocionales.com/v2/products";
const FETCH_TIMEOUT = 30_000; // 30s

interface CDOVariant {
  // v1: color is string, v2: color is {id, name, hex_code, picture}
  color: string | { id: number; name: string; hex_code?: string; picture?: string };
  novedad: boolean;
  stock_available: number;
  stock_existent: number;
  list_price: string;
  net_price: string;
  picture: {
    small: string;
    medium: string;
    original: string;
  };
  detail_picture: {
    small: string;
    medium: string;
    original: string;
  };
  other_pictures?: Array<{ original: string }>;
}

interface CDOProduct {
  code: string;
  name: string;
  description: string;
  // v1: category is a string, v2: categories is array of {id, name}
  category?: string;
  categories?: Array<{ id: number; name: string }>;
  // v2 extras
  icons?: Array<{ label: string; short_name: string }>;
  variants: CDOVariant[];
}

/** Extract color name from v1 string or v2 object */
function getColorName(color: CDOVariant["color"]): string {
  if (typeof color === "string") return color;
  return color?.name ?? "";
}

/** Extract category string from v1 or v2 format */
function getCategoryString(p: CDOProduct): string | undefined {
  if (p.categories && p.categories.length > 0) {
    return p.categories.map((c) => c.name).join(",");
  }
  return p.category;
}

interface CDOResponse {
  products: CDOProduct[];
  meta?: {
    pagination?: {
      current_page: number;
      next_page: number | null;
      total_pages: number;
      total_count: number;
    };
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

// Map CDO categories → D&P taxonomy (same as other sync scripts)
const CDO_CATEGORY_MAP: Record<string, string> = {
  "Escritura": "Escritura",
  "Drinkware": "Drinkware",
  "Hogar": "Hogar y Tiempo Libre",
  "Tiempo Libre": "Hogar y Tiempo Libre",
  "Tecnología": "Tecnología",
  "Tecnologia": "Tecnología",
  "Bolsos": "Bolsos y Mochilas",
  "Mochilas": "Bolsos y Mochilas",
  "Gorros": "Gorros",
  "Gorras": "Gorros",
  "Paraguas": "Paraguas",
  "Llaveros": "Llaveros",
  "Cuadernos": "Cuadernos",
  "Libretas": "Cuadernos",
  "Oficina": "Oficina y Negocios",
  "Kits": "Kits",
  "Indumentaria": "Apparel",
  "Textil": "Apparel",
  "Sustentables": "Sustentables",
  "Eco": "Sustentables",
  "Cocina": "Cocina",
  "Viaje": "Viajes",
  "Verano": "Verano",
  "Coolers": "Coolers y luncheras",
  "Mates": "Mates, termos y materas",
};

function normalizeCategory(rawCategory: string | undefined): string {
  if (!rawCategory) return "General";

  // CDO categories can be comma-separated: "Tiempo Libre,Hogar"
  const parts = rawCategory.split(",").map((s) => s.trim());

  // Try each part against the map (most specific first = reverse)
  for (const part of [...parts].reverse()) {
    if (CDO_CATEGORY_MAP[part]) return CDO_CATEGORY_MAP[part];
  }

  // Partial matching
  for (const part of parts) {
    const lower = part.toLowerCase();
    for (const [key, value] of Object.entries(CDO_CATEGORY_MAP)) {
      if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
        return value;
      }
    }
  }

  return parts[0] || "General";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/g, " ").replace(/\r\n/g, " ").replace(/\s+/g, " ").trim();
}

function isValidProduct(p: CDOProduct): boolean {
  // Filter out test/garbage products
  if (!p.name || p.name.length < 2) return false;
  if (!p.code || p.code.length > 20) return false; // codes like "25% de descuento!!!!!" are junk
  if (/[%!]/.test(p.code)) return false;
  if (p.variants.length === 0) return false;
  return true;
}

async function getUsdRate(): Promise<number> {
  const envRate = process.env.USD_RATE;
  if (envRate) return parseFloat(envRate);

  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/oficial");
    if (res.ok) {
      const data = await res.json();
      const rate = data.venta;
      if (typeof rate === "number" && rate > 0) {
        console.log(`Fetched USD oficial venta: $${rate} (${data.fechaActualizacion})`);
        return rate;
      }
    }
  } catch {
    // fallback
  }

  console.warn("Could not fetch USD rate, using fallback $1400");
  return 1400;
}

async function fetchAllProducts(token: string): Promise<CDOProduct[]> {
  const allProducts: CDOProduct[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${CDO_API_BASE}?auth_token=${token}&page=${page}`;
    console.log(`  Fetching page ${page}/${totalPages}...`);

    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });

    if (!res.ok) {
      throw new Error(`CDO API ${res.status}: ${await res.text()}`);
    }

    const raw = await res.json();

    // Detect response structure — v2 production may differ from v1 test
    let products: CDOProduct[];
    let pagination: CDOResponse["meta"] | undefined;

    if (Array.isArray(raw)) {
      // Response is a bare array of products
      products = raw;
    } else if (Array.isArray(raw?.products)) {
      // Standard { products: [...], meta?: {...} }
      products = raw.products;
      pagination = raw.meta;
    } else if (Array.isArray(raw?.data?.products)) {
      // Wrapped { data: { products: [...] }, meta?: {...} }
      products = raw.data.products;
      pagination = raw.data.meta ?? raw.meta;
    } else if (Array.isArray(raw?.data)) {
      // { data: [...] } format
      products = raw.data;
      pagination = raw.meta;
    } else {
      // Unknown structure — log for debugging and bail
      const keys = Object.keys(raw ?? {});
      const sample = JSON.stringify(raw, null, 2).slice(0, 500);
      throw new Error(
        `CDO API returned unexpected structure. Keys: [${keys.join(", ")}]\nSample:\n${sample}`
      );
    }

    allProducts.push(...products);

    // Handle pagination if present
    if (pagination?.pagination) {
      totalPages = pagination.pagination.total_pages;
      console.log(`    Got ${products.length} products (total: ${pagination.pagination.total_count})`);
      if (!pagination.pagination.next_page) break;
    } else {
      // No pagination — got everything in one shot
      console.log(`    Got ${products.length} products (no pagination)`);
      break;
    }

    page++;
  }

  return allProducts;
}

async function main() {
  const token = process.env.CDO_API_TOKEN;
  if (!token) {
    console.error("CDO_API_TOKEN env var required");
    process.exit(1);
  }

  const usdRate = await getUsdRate();
  console.log(`Fetching catalog from CDO Promocionales (API v2)...`);
  console.log(`USD/ARS rate: ${usdRate}\n`);

  const rawProducts = await fetchAllProducts(token);
  console.log(`\nFetched ${rawProducts.length} raw products`);

  // Filter valid products
  const valid = rawProducts.filter(isValidProduct);
  console.log(`Valid products (after filtering junk): ${valid.length}`);

  // Transform to CatalogProduct
  const catalog: CatalogProduct[] = [];

  for (const p of valid) {
    // Collect colors from variants (v1: string, v2: {name})
    const colors = [
      ...new Set(
        p.variants
          .map((v) => getColorName(v.color))
          .filter((c) => c && c !== "." && c !== "...")
      ),
    ];

    // Collect images from variants + other_pictures (v2)
    const imageSet = new Set<string>();
    for (const v of p.variants) {
      if (v.picture?.original) imageSet.add(v.picture.original);
      if (v.other_pictures) {
        for (const op of v.other_pictures) {
          if (op.original) imageSet.add(op.original);
        }
      }
    }
    const imageUrls = [...imageSet];

    // Use net_price (already discounted) — parse as float, take the lowest across variants
    const prices = p.variants
      .map((v) => parseFloat(v.net_price))
      .filter((n) => !isNaN(n) && n > 0);

    const priceUsd = prices.length > 0 ? Math.min(...prices) : null;
    const priceMaxUsd = prices.length > 0 ? Math.max(...prices) : null;
    const priceArs = priceUsd != null ? Math.round(priceUsd * usdRate * 100) / 100 : null;
    const priceMaxArs = priceMaxUsd != null ? Math.round(priceMaxUsd * usdRate * 100) / 100 : null;

    // Skip products with zero/null price
    if (priceArs == null || priceArs <= 0) continue;

    const categoryStr = getCategoryString(p);
    const ecoFriendly =
      (categoryStr?.toLowerCase().includes("sustentable") ||
       categoryStr?.toLowerCase().includes("eco")) ?? false;

    // Extract personalization methods from v2 icons (filter out eco badges)
    const ECO_BADGES = new Set(["RECICLABLE", "REUTILIZABLE", "BIODEGRADABLE", "COMPOSTABLE", "ECO", "ECO FRIENDLY"]);
    const personalizationMethods = (p.icons ?? [])
      .map((i) => i.label)
      .filter((label) => label && !ECO_BADGES.has(label.toUpperCase()));

    catalog.push({
      product_id: `cdo_${p.code}`,
      external_id: p.code,
      title: p.name,
      description: stripHtml(p.description || ""),
      category: normalizeCategory(categoryStr),
      materials: [],
      colors,
      personalization_methods: personalizationMethods,
      eco_friendly: ecoFriendly,
      price: priceArs,
      price_max: priceMaxArs,
      currency: "ARS",
      min_qty: 10,
      image_urls: imageUrls,
      source: "cdo",
    });
  }

  // Stats
  const withImages = catalog.filter((p) => p.image_urls.length > 0).length;
  const withPrice = catalog.filter((p) => p.price != null).length;
  const categories = [...new Set(catalog.map((p) => p.category))];
  console.log(`\nTransformed: ${catalog.length} products`);
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
    source: "cdo",
    usd_rate: usdRate,
    total: catalog.length,
    products: catalog,
  };

  const { writeFileSync } = await import("fs");
  const { fileURLToPath } = await import("url");
  const outPath = fileURLToPath(
    new URL("../src/data/cdo-catalog.json", import.meta.url)
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
