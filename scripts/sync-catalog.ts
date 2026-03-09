#!/usr/bin/env npx tsx
/**
 * Sync script — fetches all products from Zecat API and saves to src/data/catalog.json
 *
 * Usage: ZECAT_API_TOKEN=xxx npx tsx scripts/sync-catalog.ts
 * Or:    source .env.local && npx tsx scripts/sync-catalog.ts
 */

const ZECAT_BASE = "https://api.zecat.com/v1";
const OUTPUT_PATH = new URL("../src/data/catalog.json", import.meta.url);
const PAGE_SIZE = 50;

interface ZecatProduct {
  id: string;
  external_id: string;
  name: string;
  description: string;
  price: number | null;
  discountPrice: number | null;
  discountRanges: unknown;
  currency: string;
  minimum_order_quantity: number;
  families: Array<{ id: string; description: string; show: boolean }>;
  images: Array<{ image_url: string; main: boolean; order: number }>;
  products: Array<{
    element_description_1?: string;
    elementDescription1?: string;
  }>;
  subattributes: Array<{
    name: string;
    attribute_name?: string;
    attribute_id?: number;
  }>;
  tag?: string;
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
}

const ATTRIBUTE_MAP: Record<number, string> = {
  8: "Técnica de aplicación",
  9: "Material",
  2: "Marca",
};

function getToken(): string {
  const token = process.env.ZECAT_API_TOKEN;
  if (!token) {
    console.error("Error: ZECAT_API_TOKEN not set.");
    console.error(
      "Run: source .env.local && npx tsx scripts/sync-catalog.ts"
    );
    process.exit(1);
  }
  return token;
}

function resolveAttributeName(sa: {
  attribute_name?: string;
  attribute_id?: number;
}): string {
  if (sa.attribute_name) return sa.attribute_name;
  if (sa.attribute_id) return ATTRIBUTE_MAP[sa.attribute_id] || "";
  return "";
}

function resolvePrice(z: ZecatProduct): number | null {
  if (z.discountPrice) return z.discountPrice;
  if (
    Array.isArray(z.discountRanges) &&
    (z.discountRanges as Array<{ ranges: Array<{ price: string }> }>).length > 0
  ) {
    const first = (
      z.discountRanges as Array<{ ranges: Array<{ price: string }> }>
    )[0];
    if (first.ranges?.length > 0) return parseFloat(first.ranges[0].price);
  }
  if (
    z.discountRanges &&
    typeof z.discountRanges === "object" &&
    !Array.isArray(z.discountRanges)
  ) {
    const dr = z.discountRanges as { minPrice?: string };
    if (dr.minPrice) return parseFloat(dr.minPrice);
  }
  return z.price || null;
}

function transformProduct(z: ZecatProduct): CatalogProduct {
  const families = z.families || [];
  const mainFamily = families.find((f) => f.show) || families[0];

  const images = [...(z.images || [])].sort((a, b) => {
    if (a.main && !b.main) return -1;
    if (!a.main && b.main) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const variants = z.products || [];
  const colors = [
    ...new Set(
      variants
        .map((v) => v.element_description_1 || v.elementDescription1 || "")
        .filter((c) => c && c !== "." && c !== "...")
    ),
  ];

  const subattributes = z.subattributes || [];
  const personalizationMethods = subattributes
    .filter((sa) => resolveAttributeName(sa) === "Técnica de aplicación")
    .map((sa) => sa.name.trim());

  const materials = subattributes
    .filter((sa) => resolveAttributeName(sa) === "Material")
    .map((sa) => sa.name.trim());

  const ecoFriendly =
    families.some((f) =>
      f.description?.toLowerCase().includes("sustentable")
    ) || !!z.tag?.toLowerCase().includes("sustentable");

  return {
    product_id: z.id,
    external_id: z.external_id,
    title: z.name,
    description: (z.description || "").trim(),
    category: (mainFamily?.description || "Sin categoría").trim(),
    materials,
    colors,
    personalization_methods: personalizationMethods,
    eco_friendly: ecoFriendly,
    price: resolvePrice(z),
    price_max: z.price || null,
    currency: z.currency || "ARS",
    min_qty: z.minimum_order_quantity || 1,
    image_urls: images.map((img) => img.image_url).filter(Boolean),
  };
}

async function fetchPage(
  page: number,
  token: string
): Promise<{ products: ZecatProduct[]; totalPages: number; count: number }> {
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    only_products: "true",
  });

  const res = await fetch(`${ZECAT_BASE}/generic_product?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Zecat API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return {
    products: data.generic_products || [],
    totalPages: data.total_pages || 0,
    count: data.count || 0,
  };
}

async function main() {
  const token = getToken();
  console.log("Fetching catalog from Zecat API...\n");

  // First page to get total
  const first = await fetchPage(1, token);
  console.log(`Total products: ${first.count} (${first.totalPages} pages)`);

  const allRaw: ZecatProduct[] = [...first.products];

  // Fetch remaining pages
  for (let page = 2; page <= first.totalPages; page++) {
    process.stdout.write(`  Page ${page}/${first.totalPages}...`);
    const { products } = await fetchPage(page, token);
    allRaw.push(...products);
    console.log(` ${products.length} products`);
  }

  console.log(`\nFetched ${allRaw.length} raw products`);

  // Transform
  const catalog = allRaw.map(transformProduct);

  // Deduplicate by product_id
  const seen = new Set<string>();
  const unique = catalog.filter((p) => {
    if (seen.has(p.product_id)) return false;
    seen.add(p.product_id);
    return true;
  });

  console.log(`Unique products: ${unique.length}`);

  // Stats
  const withImages = unique.filter((p) => p.image_urls.length > 0).length;
  const withPrice = unique.filter((p) => p.price != null).length;
  const categories = [...new Set(unique.map((p) => p.category))];
  console.log(`  With images: ${withImages}`);
  console.log(`  With price: ${withPrice}`);
  console.log(`  Categories: ${categories.length}`);
  categories.forEach((c) => {
    const count = unique.filter((p) => p.category === c).length;
    console.log(`    - ${c}: ${count}`);
  });

  // Write
  const output = {
    synced_at: new Date().toISOString(),
    total: unique.length,
    products: unique,
  };

  const { writeFileSync } = await import("fs");
  const { fileURLToPath } = await import("url");
  const outPath = fileURLToPath(OUTPUT_PATH);
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  const sizeKB = Math.round(
    (Buffer.byteLength(JSON.stringify(output)) / 1024) * 10
  ) / 10;
  console.log(`\nWritten to ${outPath} (${sizeKB} KB)`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
