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
  subcategory: string;
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
    subcategory: "",
    materials,
    colors,
    personalization_methods: personalizationMethods,
    eco_friendly: ecoFriendly,
    price: resolvePrice(z),
    price_max: z.price || null,
    currency: z.currency || "ARS",
    min_qty: 1,
    image_urls: images.map((img) => img.image_url).filter(Boolean),
  };
}

// --- Category normalization: Zecat → D&P categories ---
// Source: "Diez & Punto - Categorías Página Web - Mar 26.xlsx", hoja CATEGORIAS WEB

interface CategoryResult {
  category: string;
  subcategory: string;
}

/** Direct Zecat family → D&P category mapping */
const FAMILY_TO_DP: Record<string, CategoryResult> = {
  "Escritura": { category: "Escritura", subcategory: "" }, // resolved by subcategory below
  "Drinkware": { category: "Drinkware", subcategory: "" },
  "Bolsos y Mochilas": { category: "Bolsos y Mochilas", subcategory: "" },
  "Coolers y luncheras": { category: "Hogar & Tiempo Libre", subcategory: "" },
  "Coolers & Luncheras": { category: "Hogar & Tiempo Libre", subcategory: "" },
  "Tecnología": { category: "Tecnología", subcategory: "Tecnología: Básicos" },
  "Tecnologia": { category: "Tecnología", subcategory: "Tecnología: Básicos" },
  "Sustentables": { category: "Eco", subcategory: "" },
  "Hogar y Tiempo Libre": { category: "Hogar & Tiempo Libre", subcategory: "" },
  "Cocina": { category: "Hogar & Tiempo Libre", subcategory: "" },
  "Escritorio": { category: "Oficina y Negocios", subcategory: "Oficina y Negocios: Varios" },
  "Cuadernos": { category: "Oficina y Negocios", subcategory: "Oficina y Negocios: Cuadernos" },
  "Paraguas": { category: "Paraguas", subcategory: "" },
  "Llaveros": { category: "Llaveros", subcategory: "" },
  "Gorros": { category: "Gorros", subcategory: "" },
  "Apparel": { category: "Indumentaria", subcategory: "" },
  "Uniformes": { category: "Indumentaria", subcategory: "" },
  "Mates, termos y materas": { category: "Drinkware", subcategory: "Drinkware: Botellas, Jarros y Otros" },
  "Viajes": { category: "Bolsos y Mochilas", subcategory: "Bolsos y Mochilas: Bolsos, Maletines y Mochilas" },
  "Verano": { category: "Hogar & Tiempo Libre", subcategory: "" },
  "Packaging": { category: "Hogar & Tiempo Libre", subcategory: "" },
  "General": { category: "Hogar & Tiempo Libre", subcategory: "" },
};

/** Sale/promo categories → remap to base */
const SALE_REMAP: Record<string, string> = {
  "70%OFF Bolsos y Mochilas": "Bolsos y Mochilas",
  "70%OFF Hogar y Tiempo Libre": "Hogar y Tiempo Libre",
  "70%OFF Apparel": "Apparel",
  "70%OFF Back to School": "Escritorio",
  "Back to School": "Escritorio",
  "Bolsas y Tote Bags": "Bolsos y Mochilas",
  "Apparel - Abrigo": "Apparel",
  "Apparel - Chombas": "Apparel",
};

const TEMPORAL_CATEGORIES = new Set([
  "2026 Reingresos",
  "2026 Novedades",
  "2026 Agro",
  "2026 Día del trabajador",
  "Mundial 2026",
  "Logo 24hs",
  "Próximos Arribos",
]);

/** Title-based hints for subcategory resolution */
const SUBCATEGORY_HINTS: Array<[RegExp, CategoryResult]> = [
  // Escritura subcategories
  [/\b(roller|ejecutiv|fino|premium|mont|cross|parker|waterman)\b/i, { category: "Escritura", subcategory: "Escritura: Fina" }],
  [/\b(metal|metálic|acero|aluminio|inox)\b/i, { category: "Escritura", subcategory: "Escritura: Metálica" }],
  // Drinkware subcategories
  [/\b(termo|termica|térmic)\b/i, { category: "Drinkware", subcategory: "Drinkware: Termos" }],
  // Bolsos subcategories — accesorios
  [/\b(cartuchera|riñonera|neceser|necessaire|billetera|passport|organizer|tablet holder|set.?de.?baño)\b/i, { category: "Bolsos y Mochilas", subcategory: "Bolsos y Mochilas: Accesorios" }],
  // Tecnología Pro
  [/\b(parlante|auricular|headphone|earbud|speaker|smartwatch|tablet|notebook)\b/i, { category: "Tecnología", subcategory: "Tecnología: Pro" }],
  // Indumentaria subcategories
  [/\b(remera|camiseta|t-shirt)\b/i, { category: "Indumentaria", subcategory: "Indumentaria: Remeras" }],
  [/\b(chomba|campera|buzo|polar|abrigo|chaleco|jacket)\b/i, { category: "Indumentaria", subcategory: "Indumentaria: Chombas y Abrigo" }],
];

/** Fallback: infer D&P category from product title */
const TITLE_CATEGORY_HINTS: Array<[RegExp, CategoryResult]> = [
  [/\b(botella|vaso|taza|mug|jarro)\b/i, { category: "Drinkware", subcategory: "Drinkware: Botellas, Jarros y Otros" }],
  [/\b(termo|termica|térmic)\b/i, { category: "Drinkware", subcategory: "Drinkware: Termos" }],
  [/\b(mate|matera|matero)\b/i, { category: "Drinkware", subcategory: "Drinkware: Botellas, Jarros y Otros" }],
  [/\b(mochila|bolso|morral|totebag|tote.?bag|portfolio|portafolio|trolley|valija)\b/i, { category: "Bolsos y Mochilas", subcategory: "Bolsos y Mochilas: Bolsos, Maletines y Mochilas" }],
  [/\b(riñonera|cartuchera|neceser|necessaire|billetera)\b/i, { category: "Bolsos y Mochilas", subcategory: "Bolsos y Mochilas: Accesorios" }],
  [/\b(remera|chomba|campera|buzo|camiseta|chaleco|polar|abrigo)\b/i, { category: "Indumentaria", subcategory: "" }],
  [/\b(gorra|gorro|cap|visera|sombrero)\b/i, { category: "Gorros", subcategory: "" }],
  [/\b(cuaderno|anotador|libreta|notebook)\b/i, { category: "Oficina y Negocios", subcategory: "Oficina y Negocios: Cuadernos" }],
  [/\b(lapicera|boligrafo|roller|marcador|resaltador|pen\b)\b/i, { category: "Escritura", subcategory: "" }],
  [/\b(pendrive|usb|cargador|powerbank|parlante|auricular|cable|adaptador)\b/i, { category: "Tecnología", subcategory: "Tecnología: Básicos" }],
  [/\b(paraguas|sombrilla)\b/i, { category: "Paraguas", subcategory: "" }],
  [/\b(llavero)\b/i, { category: "Llaveros", subcategory: "" }],
  [/\b(cooler|lunchera|conservadora)\b/i, { category: "Hogar & Tiempo Libre", subcategory: "" }],
  [/\b(reposera|silla.?playa|toalla|ojotas|pelota)\b/i, { category: "Hogar & Tiempo Libre", subcategory: "" }],
  [/\b(organizador|portaretrato|porta.?lápices|escritorio)\b/i, { category: "Oficina y Negocios", subcategory: "Oficina y Negocios: Varios" }],
  [/\b(delantal|tabla|cuchillo|sacacorcho|cocina)\b/i, { category: "Hogar & Tiempo Libre", subcategory: "" }],
  [/\b(sustentable|ecológico|reciclado|bambú|bambu)\b/i, { category: "Eco", subcategory: "" }],
];

function resolveSubcategory(product: CatalogProduct): string {
  const cat = product.category;
  const title = product.title;
  const materials = product.materials.join(" ");

  // Escritura: resolve by material/title
  if (cat === "Escritura") {
    if (/\b(roller|ejecutiv|fino|premium|mont|cross|parker|waterman)\b/i.test(title + " " + materials)) {
      return "Escritura: Fina";
    }
    if (/\b(metal|metálic|acero|aluminio|inox|silver|chrome|steel)\b/i.test(title + " " + materials)) {
      return "Escritura: Metálica";
    }
    return "Escritura: Plástica y otras";
  }

  // Drinkware: termos vs rest
  if (cat === "Drinkware") {
    if (/\b(termo|termica|térmic)\b/i.test(title)) {
      return "Drinkware: Termos";
    }
    return "Drinkware: Botellas, Jarros y Otros";
  }

  // Bolsos: accesorios vs bolsos/mochilas
  if (cat === "Bolsos y Mochilas") {
    if (/\b(cartuchera|riñonera|neceser|necessaire|billetera|passport|organizer|tablet.?holder|set.?de.?baño)\b/i.test(title)) {
      return "Bolsos y Mochilas: Accesorios";
    }
    return "Bolsos y Mochilas: Bolsos, Maletines y Mochilas";
  }

  // Tecnología: pro vs básicos
  if (cat === "Tecnología") {
    if (/\b(parlante|auricular|headphone|earbud|speaker|smartwatch)\b/i.test(title)) {
      return "Tecnología: Pro";
    }
    return "Tecnología: Básicos";
  }

  // Indumentaria: remeras vs chombas/abrigo
  if (cat === "Indumentaria") {
    if (/\b(remera|camiseta|t-shirt)\b/i.test(title)) {
      return "Indumentaria: Remeras";
    }
    if (/\b(chomba|campera|buzo|polar|abrigo|chaleco|jacket|hoodie|softshell|pantalon|cargo|stream)\b/i.test(title)) {
      return "Indumentaria: Chombas y Abrigo";
    }
    // Default indumentaria to Remeras (simpler items)
    return "Indumentaria: Remeras";
  }

  // Oficina
  if (cat === "Oficina y Negocios") {
    if (/\b(cuaderno|anotador|libreta)\b/i.test(title)) {
      return "Oficina y Negocios: Cuadernos";
    }
    return "Oficina y Negocios: Varios";
  }

  return "";
}

function normalizeCategory(product: CatalogProduct): CatalogProduct {
  let cat = product.category;

  // Sale/promo → base category
  if (SALE_REMAP[cat]) {
    cat = SALE_REMAP[cat];
  }

  // Temporal categories — infer from title
  if (TEMPORAL_CATEGORIES.has(cat)) {
    for (const [pattern, target] of TITLE_CATEGORY_HINTS) {
      if (pattern.test(product.title)) {
        return { ...product, category: target.category, subcategory: target.subcategory };
      }
    }
    return { ...product, category: "Hogar & Tiempo Libre", subcategory: "" };
  }

  // Family → D&P category
  const mapped = FAMILY_TO_DP[cat];
  if (mapped) {
    let updated = { ...product, category: mapped.category, subcategory: mapped.subcategory };
    // Override: title-based reclassification for misplaced products
    if (/\b(cooler|lunchera|conservadora)\b/i.test(product.title)) {
      updated = { ...updated, category: "Hogar & Tiempo Libre", subcategory: "" };
    } else if (/\b(mochila|bolso|morral)\b/i.test(product.title) && updated.category !== "Bolsos y Mochilas") {
      updated = { ...updated, category: "Bolsos y Mochilas", subcategory: "Bolsos y Mochilas: Bolsos, Maletines y Mochilas" };
    } else if (/\b(matera|matero)\b/i.test(product.title) && updated.category !== "Drinkware") {
      updated = { ...updated, category: "Drinkware", subcategory: "Drinkware: Botellas, Jarros y Otros" };
    }
    // Resolve subcategory if not already set
    if (!updated.subcategory) {
      updated.subcategory = resolveSubcategory(updated);
    }
    return updated;
  }

  // Unknown category — try title hints
  for (const [pattern, target] of TITLE_CATEGORY_HINTS) {
    if (pattern.test(product.title)) {
      const updated = { ...product, category: target.category, subcategory: target.subcategory };
      if (!updated.subcategory) {
        updated.subcategory = resolveSubcategory(updated);
      }
      return updated;
    }
  }

  return { ...product, subcategory: "" };
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

  // Transform + normalize categories + resolve remaining subcategories
  const catalog = allRaw.map(transformProduct).map(normalizeCategory).map((p) => {
    if (!p.subcategory) {
      p = { ...p, subcategory: resolveSubcategory(p) };
    }
    return p;
  });

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
