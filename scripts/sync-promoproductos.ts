#!/usr/bin/env npx tsx
/**
 * Sync script — fetches all products from Promoproductos via Algolia
 * and saves to src/data/promoproductos-catalog.json
 *
 * Usage: npx tsx scripts/sync-promoproductos.ts
 *
 * Promoproductos uses Algolia for their product catalog.
 * Prices are in USD — converted to ARS using USD_RATE env var.
 */

const ALGOLIA_APP_ID = "SERB6WT5QG";
const ALGOLIA_API_KEY = "a1e511c4d6b68bb76ab9cf3e3e83ee62";
const ALGOLIA_INDEX = "prod_products";
const ALGOLIA_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;
const PAGE_SIZE = 100;
const IMAGE_BASE = "https://www.promoproductos.com/upload";

interface AlgoliaHit {
  sku: string;
  root: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number | null;
  stock: number;
  color: string;
  brand: string;
  material: string[] | null;
  picture: string;
  category: string; // comma-separated: "Escritura,Bolígrafos Plásticos"
  kit: boolean;
  keywords: string;
  visible: boolean;
  providerCode: string;
  objectID: string;
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

function getUsdRate(): number {
  const rate = process.env.USD_RATE;
  if (rate) return parseFloat(rate);
  // Default: reasonable ARS/USD rate — update as needed
  return 1300;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/g, " ").trim();
}

// Map Promoproductos categories to our normalized categories
const PROMO_CATEGORY_MAP: Record<string, string> = {
  "Escritura": "Escritura",
  "Bolígrafos Plásticos": "Escritura",
  "Bolígrafos Metálicos": "Escritura",
  "Bolígrafos de Autor": "Escritura",
  "Sets de Escritura": "Escritura",
  "Lápices y Portaminas": "Escritura",
  "Resaltadores y Marcadores": "Escritura",
  "Drinkware": "Drinkware",
  "Botellas y Jarros": "Drinkware",
  "Termos": "Drinkware",
  "Vasos y Tazas": "Drinkware",
  "Mates y Materas": "Mates, termos y materas",
  "Bolsos": "Bolsos y Mochilas",
  "Mochilas": "Bolsos y Mochilas",
  "Riñoneras": "Bolsos y Mochilas",
  "Cartucheras": "Bolsos y Mochilas",
  "Tote Bags": "Bolsos y Mochilas",
  "Tecnología": "Tecnología",
  "Cargadores y Cables": "Tecnología",
  "Auriculares y Parlantes": "Tecnología",
  "Pendrives y Accesorios": "Tecnología",
  "Gorros": "Gorros",
  "Gorras": "Gorros",
  "Paraguas": "Paraguas",
  "Llaveros": "Llaveros",
  "Cuadernos": "Cuadernos",
  "Anotadores": "Cuadernos",
  "Libretas": "Cuadernos",
  "Hogar": "Hogar y Tiempo Libre",
  "Tiempo Libre": "Hogar y Tiempo Libre",
  "Juegos": "Hogar y Tiempo Libre",
  "Cocina": "Cocina",
  "Remeras": "Apparel",
  "Chombas": "Apparel",
  "Camperas": "Apparel",
  "Indumentaria": "Apparel",
  "Sustentables": "Sustentables",
  "Eco": "Sustentables",
  "Kits": "Kits",
  "Viaje": "Viajes",
  "Neceseres": "Viajes",
  "Verano": "Verano",
  "Coolers": "Coolers y luncheras",
};

function normalizeCategory(rawCategory: string): string {
  // Category is comma-separated, e.g. "Escritura,Bolígrafos Plásticos"
  const parts = rawCategory.split(",").map((s) => s.trim());

  // Try each part against the map, most specific first (reverse order)
  for (const part of [...parts].reverse()) {
    if (PROMO_CATEGORY_MAP[part]) return PROMO_CATEGORY_MAP[part];
  }

  // Try partial matching
  for (const part of parts) {
    const lower = part.toLowerCase();
    for (const [key, value] of Object.entries(PROMO_CATEGORY_MAP)) {
      if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
        return value;
      }
    }
  }

  // Use first part as-is
  return parts[0] || "General";
}

async function fetchPage(page: number): Promise<{ hits: AlgoliaHit[]; nbPages: number; nbHits: number }> {
  const res = await fetch(ALGOLIA_URL, {
    method: "POST",
    headers: {
      "X-Algolia-Application-Id": ALGOLIA_APP_ID,
      "X-Algolia-API-Key": ALGOLIA_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      params: `query=&hitsPerPage=${PAGE_SIZE}&page=${page}&filters=visible%3D1`,
    }),
  });

  if (!res.ok) {
    throw new Error(`Algolia ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

async function fetchAllProducts(): Promise<AlgoliaHit[]> {
  // Algolia limits to 1000 hits per query. To get all ~1900+ products,
  // we use the browse-like pattern: paginate with hitsPerPage=100
  // and use offset-based cursor via distinct + page.
  // Since Algolia search caps at 1000, we split by first letter of name.
  const allHits: AlgoliaHit[] = [];
  const seenIds = new Set<string>();

  // First, try a simple paginated fetch
  const first = await fetchPage(0);
  console.log(`Total reported: ${first.nbHits} products`);

  allHits.push(...first.hits);
  first.hits.forEach((h) => seenIds.add(h.objectID));

  const maxPage = Math.min(first.nbPages, 10); // Algolia caps at page 10 (1000 hits)
  for (let page = 1; page < maxPage; page++) {
    process.stdout.write(`  Page ${page + 1}/${first.nbPages}...`);
    const { hits } = await fetchPage(page);
    hits.forEach((h) => {
      if (!seenIds.has(h.objectID)) {
        allHits.push(h);
        seenIds.add(h.objectID);
      }
    });
    console.log(` ${hits.length} hits`);
  }

  // If we got fewer than total, do alphabetical queries to fill gaps
  if (allHits.length < first.nbHits) {
    console.log(`\n  Got ${allHits.length}/${first.nbHits} from pagination, fetching remainder by letter...`);
    const letters = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
    for (const letter of letters) {
      for (let page = 0; page < 10; page++) {
        const res = await fetch(ALGOLIA_URL, {
          method: "POST",
          headers: {
            "X-Algolia-Application-Id": ALGOLIA_APP_ID,
            "X-Algolia-API-Key": ALGOLIA_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            params: `query=${letter}&hitsPerPage=${PAGE_SIZE}&page=${page}&filters=visible%3D1`,
          }),
        });
        if (!res.ok) break;
        const data = await res.json();
        const hits: AlgoliaHit[] = data.hits || [];
        if (hits.length === 0) break;
        let added = 0;
        for (const h of hits) {
          if (!seenIds.has(h.objectID)) {
            allHits.push(h);
            seenIds.add(h.objectID);
            added++;
          }
        }
        if (added === 0 && page > 0) break; // No new results for this letter
        if (page >= (data.nbPages || 0) - 1) break;
      }
    }
    console.log(`  Total after letter queries: ${allHits.length}`);
  }

  return allHits;
}

async function main() {
  const usdRate = getUsdRate();
  console.log(`Fetching catalog from Promoproductos (Algolia)...`);
  console.log(`USD/ARS rate: ${usdRate}\n`);

  const allHits = await fetchAllProducts();
  console.log(`\nFetched ${allHits.length} raw products (including color variants)`);

  // Group by root SKU to collapse color variants
  const grouped = new Map<string, AlgoliaHit[]>();
  for (const hit of allHits) {
    const key = hit.root || hit.sku;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(hit);
  }

  console.log(`Unique products (by root SKU): ${grouped.size}`);

  // Transform each group into a single CatalogProduct
  const catalog: CatalogProduct[] = [];

  for (const [root, variants] of grouped) {
    const primary = variants[0];

    // Collect all colors across variants
    const colors = [
      ...new Set(
        variants
          .map((v) => v.color)
          .filter((c) => c && c !== "." && c !== "...")
      ),
    ];

    // Collect all images (main variant first, then others)
    const imageUrls = [
      ...new Set(
        variants
          .map((v) => v.picture)
          .filter(Boolean)
          .map((pic) => `${IMAGE_BASE}/preview_${pic}`)
      ),
    ];

    // Parse materials (can be array, string, or null)
    const rawMat = primary.material;
    const materials = Array.isArray(rawMat)
      ? rawMat.filter(Boolean)
      : typeof rawMat === "string" && rawMat
        ? [rawMat]
        : [];

    // Convert price USD → ARS
    const priceUsd = primary.price;
    const priceArs = priceUsd != null ? Math.round(priceUsd * usdRate * 100) / 100 : null;

    const ecoFriendly =
      primary.category.toLowerCase().includes("sustentable") ||
      primary.category.toLowerCase().includes("eco") ||
      primary.keywords?.toLowerCase().includes("sustentable");

    catalog.push({
      product_id: `promo_${primary.objectID}`,
      external_id: root,
      title: primary.name,
      description: stripHtml(primary.shortDescription || primary.description || ""),
      category: normalizeCategory(primary.category),
      materials,
      colors,
      personalization_methods: [],
      eco_friendly: ecoFriendly,
      price: priceArs,
      price_max: priceArs,
      currency: "ARS",
      min_qty: 1,
      image_urls: imageUrls,
      source: "promoproductos",
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
    source: "promoproductos",
    usd_rate: usdRate,
    total: catalog.length,
    products: catalog,
  };

  const { writeFileSync } = await import("fs");
  const { fileURLToPath } = await import("url");
  const outPath = fileURLToPath(
    new URL("../src/data/promoproductos-catalog.json", import.meta.url)
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
