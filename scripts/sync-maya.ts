#!/usr/bin/env npx tsx
/**
 * Sync script — fetches all products from Maya Publicidad API
 * and saves to src/data/maya-catalog.json
 *
 * Usage:
 *   MAYA_API_EMAIL=xxx MAYA_API_PASSWORD=xxx npx tsx scripts/sync-maya.ts
 *
 * Maya API docs:
 *   https://api.mayapublicidad.com/
 *   Swagger/OpenAPI: https://api.mayapublicidad.com/docs?api-docs.json
 */

const MAYA_API_URL =
  process.env.MAYA_API_URL || "https://api.mayapublicidad.com/api";
const MAYA_API_EMAIL = process.env.MAYA_API_EMAIL;
const MAYA_API_PASSWORD = process.env.MAYA_API_PASSWORD;
const FETCH_TIMEOUT = 45_000;

interface MayaPhoto {
  id: number | string;
  title: string;
  name: string;
  url_large?: string;
  url_normal?: string;
  url_thumb?: string;
  primary?: boolean | number;
}

interface MayaColor {
  id: number | string;
  name: string;
  hex_code?: string;
  url_picture_color?: string;
  group?: string;
  url?: string;
}

interface MayaVariant {
  id: number | string;
  name: string;
  code: string;
  url?: string;
  units_per_package?: number | string;
  price?: string;
  stock?: {
    quantity?: number;
    last_update?: string;
  };
  color?: MayaColor | null;
  photos?: MayaPhoto[];
}

interface MayaArticle {
  id: number | string;
  name: string;
  code: string;
  url?: string;
  category?: {
    id: number | string;
    name: string;
    url?: string;
  } | null;
  material?: string;
  product_size?: string;
  printing_area?: string;
  printing_type?: {
    id: number | string;
    name: string;
  } | null;
  sales_tips?: string;
  keywords?: string;
  youtube?: {
    id: string;
    url: string;
  } | null;
  photos?: MayaPhoto[];
  variants?: MayaVariant[];
}

interface CatalogProduct {
  product_id: string;
  external_id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
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
  stock_by_color?: Record<string, number>;
}

const MAYA_CATEGORY_MAP: Record<string, string> = {
  CALENDARIOS: "Oficina y Negocios",
  ESCRITORIO: "Oficina y Negocios",
  PORTARRETRATOS: "Oficina y Negocios",
  LLAVEROS: "Llaveros",
  TECNOLOGIA: "Tecnología",
  "TECNOLOGÍA": "Tecnología",
  PARAGUAS: "Paraguas",
  RELOJES: "Relojes",
  REMERAS: "Indumentaria",
  GASTRONOMIA: "Cocina",
  "GASTRONOMÍA": "Cocina",
  "GASTRONOMIA - SUBLIMABLE": "Cocina",
  "GASTRONOMÍA - SUBLIMABLE": "Cocina",
  "GASTRONOMIA - ARTESANAL": "Cocina",
  "GASTRONOMÍA - ARTESANAL": "Cocina",
  "ESCRITURA - PLASTICO": "Escritura",
  "ESCRITURA - PLÁSTICO": "Escritura",
  "ESCRITURA - ECOLOGICOS": "Escritura",
  "ESCRITURA - ECOLÓGICOS": "Escritura",
  "ESCRITURA - LAPICES": "Escritura",
  "ESCRITURA - LÁPICES": "Escritura",
  "ESCRITURA - METALICOS": "Escritura",
  "ESCRITURA - METÁLICOS": "Escritura",
  ECOBOLSAS: "Bolsos y Mochilas",
  "BOLSAS ALGODON": "Bolsos y Mochilas",
  "BOLSAS ALGODÓN": "Bolsos y Mochilas",
  "MOCHILAS Y BOLSOS": "Bolsos y Mochilas",
  "SOLDADURA PLASTICA": "Bolsos y Mochilas",
  "SOLDADURA PLÁSTICA": "Bolsos y Mochilas",
  "USO PERSONAL": "Cuidado Personal",
};

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    console.error(`Error: ${name} not set.`);
    process.exit(1);
  }
  return value;
}

function normalizeText(value: string | undefined | null): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeCategoryKey(value: string): string {
  return stripAccents(value).toUpperCase().trim();
}

function parseMoney(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/,/g, "").trim();
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

function parsePositiveInt(value: number | string | undefined): number | null {
  if (value == null) return null;
  const parsed =
    typeof value === "number"
      ? value
      : parseInt(String(value).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function pickPhotoUrl(photo: MayaPhoto): string | null {
  return photo.url_large || photo.url_normal || photo.url_thumb || null;
}

function resolveCategory(article: MayaArticle): {
  category: string;
  subcategory: string;
} {
  const rawCategory = normalizeText(article.category?.name);
  const lookup = MAYA_CATEGORY_MAP[normalizeCategoryKey(rawCategory)];
  const title = normalizeText(article.name);
  const text = `${title} ${article.keywords || ""} ${article.material || ""}`;
  const normalized = stripAccents(text).toLowerCase();

  if (
    /\b(mochila|bolso|salvatraje|equipaje|marbete|portadocument|portacarnet|billetera|ticket)\b/i.test(
      normalized
    )
  ) {
    const subcategory = /\b(mochila|bolso)\b/i.test(normalized)
      ? "Bolsos y Mochilas: Bolsos, Maletines y Mochilas"
      : "Bolsos y Mochilas: Accesorios";
    return { category: "Bolsos y Mochilas", subcategory };
  }

  if (/\b(jarro|vaso|termo|mate|taza|mug|botella)\b/i.test(normalized)) {
    return {
      category: "Drinkware",
      subcategory: /\b(termo)\b/i.test(normalized)
        ? "Drinkware: Termos"
        : "Drinkware: Botellas, Jarros y Otros",
    };
  }

  if (
    /\b(lapicera|boligrafo|lapiz|marcador|resaltador|portaminas|pen)\b/i.test(
      normalized
    )
  ) {
    return { category: "Escritura", subcategory: "" };
  }

  if (lookup === "Oficina y Negocios") {
    return { category: lookup, subcategory: "Oficina y Negocios: Varios" };
  }

  if (lookup === "Bolsos y Mochilas") {
    return {
      category: lookup,
      subcategory: "Bolsos y Mochilas: Accesorios",
    };
  }

  return {
    category: lookup || rawCategory || "General",
    subcategory: "",
  };
}

function detectEcoFriendly(article: MayaArticle): boolean {
  const text = stripAccents(
    [
      article.name,
      article.category?.name,
      article.material,
      article.sales_tips,
      article.keywords,
    ]
      .filter(Boolean)
      .join(" ")
  ).toLowerCase();

  return (
    text.includes("eco") ||
    text.includes("ecologico") ||
    text.includes("ecologica") ||
    text.includes("recicl") ||
    text.includes("algodon") ||
    text.includes("bambu") ||
    text.includes("sustent")
  );
}

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${MAYA_API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) {
    throw new Error(`Maya login ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    access_token?: string;
  };
  if (!data.access_token) {
    throw new Error("Maya login succeeded but no access_token was returned");
  }
  return data.access_token;
}

async function fetchArticles(token: string): Promise<MayaArticle[]> {
  const res = await fetch(`${MAYA_API_URL}/v1/article/without-print`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) {
    throw new Error(`Maya articles ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Maya articles endpoint returned a non-array payload");
  }

  return data as MayaArticle[];
}

function transformArticle(article: MayaArticle): CatalogProduct | null {
  const variants = Array.isArray(article.variants) ? article.variants : [];
  if (!article.code || !normalizeText(article.name) || variants.length === 0) {
    return null;
  }

  const validVariants = variants.filter((variant) => {
    const price = parseMoney(variant.price);
    return price != null && price > 0;
  });
  if (validVariants.length === 0) return null;

  const totalStock = validVariants.reduce(
    (sum, variant) => sum + Math.max(0, variant.stock?.quantity || 0),
    0
  );
  if (totalStock <= 0) return null;

  const stockByColor: Record<string, number> = {};
  const colors: string[] = [];
  for (const variant of validVariants) {
    const colorName = normalizeText(variant.color?.name);
    if (!colorName) continue;
    stockByColor[colorName] =
      (stockByColor[colorName] || 0) + Math.max(0, variant.stock?.quantity || 0);
    if (!colors.includes(colorName)) {
      colors.push(colorName);
    }
  }

  const imageSet = new Set<string>();
  for (const photo of article.photos || []) {
    const url = pickPhotoUrl(photo);
    if (url) imageSet.add(url);
  }
  for (const variant of validVariants) {
    for (const photo of variant.photos || []) {
      const url = pickPhotoUrl(photo);
      if (url) imageSet.add(url);
    }
  }

  const prices = validVariants
    .map((variant) => parseMoney(variant.price))
    .filter((value): value is number => value != null && value > 0);
  const price = prices.length > 0 ? Math.min(...prices) : null;
  const priceMax = prices.length > 0 ? Math.max(...prices) : null;

  const minUnits = validVariants
    .map((variant) => parsePositiveInt(variant.units_per_package))
    .filter((value): value is number => value != null);

  const { category, subcategory } = resolveCategory(article);

  const descriptionParts = [
    normalizeText(article.sales_tips),
    normalizeText(article.product_size)
      ? `Medida: ${normalizeText(article.product_size)}`
      : "",
    normalizeText(article.printing_area)
      ? `Area de impresion: ${normalizeText(article.printing_area)}`
      : "",
  ].filter(Boolean);

  return {
    product_id: `maya_${article.id}`,
    external_id: article.code,
    title: normalizeText(article.name),
    description: descriptionParts.join(" | "),
    category,
    subcategory,
    materials: normalizeText(article.material) ? [normalizeText(article.material)] : [],
    colors,
    personalization_methods: [],
    eco_friendly: detectEcoFriendly(article),
    price,
    price_max: priceMax,
    currency: "ARS",
    min_qty: minUnits.length > 0 ? Math.max(10, Math.min(...minUnits)) : 10,
    image_urls: [...imageSet],
    source: "maya",
    stock_by_color:
      Object.keys(stockByColor).length > 0 ? stockByColor : undefined,
  };
}

async function main() {
  const email = requireEnv("MAYA_API_EMAIL", MAYA_API_EMAIL);
  const password = requireEnv("MAYA_API_PASSWORD", MAYA_API_PASSWORD);

  console.log("Fetching catalog from Maya Publicidad...");
  const token = await login(email, password);
  const rawArticles = await fetchArticles(token);
  console.log(`Fetched ${rawArticles.length} raw articles`);

  const catalog = rawArticles
    .map(transformArticle)
    .filter((product): product is CatalogProduct => product != null);

  const categories = [...new Set(catalog.map((product) => product.category))];
  console.log(`Transformed: ${catalog.length} products`);
  console.log(`Categories: ${categories.length}`);
  categories.sort().forEach((category) => {
    const count = catalog.filter((product) => product.category === category).length;
    console.log(`  - ${category}: ${count}`);
  });

  const output = {
    synced_at: new Date().toISOString(),
    source: "maya",
    total: catalog.length,
    products: catalog,
  };

  const { writeFileSync } = await import("fs");
  const { fileURLToPath } = await import("url");
  const outPath = fileURLToPath(
    new URL("../src/data/maya-catalog.json", import.meta.url)
  );
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  const sizeKB =
    Math.round((Buffer.byteLength(JSON.stringify(output)) / 1024) * 10) / 10;
  console.log(`Written to ${outPath} (${sizeKB} KB)`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
