/* Local catalog — loads products from catalog.json and provides text search */

import type { ProductResult } from "../types";

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

interface CatalogData {
  synced_at: string;
  total: number;
  products: CatalogProduct[];
}

// --- Normalize & tokenize for Spanish text search ---

const STOPWORDS = new Set([
  "de", "del", "la", "las", "el", "los", "un", "una", "unos", "unas",
  "y", "o", "en", "con", "por", "para", "que", "al", "se", "su",
  "es", "no", "lo", "le", "da", "mas", "muy", "sin",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/** Simple Spanish stemming — strips common suffixes */
function stem(word: string): string {
  if (word.length <= 3) return word;
  // Diminutives
  if (word.endsWith("itos") || word.endsWith("itas")) return word.slice(0, -4);
  if (word.endsWith("ito") || word.endsWith("ita")) return word.slice(0, -3);
  // Plurals
  if (word.endsWith("ces")) return word.slice(0, -3) + "z"; // lapices -> lapiz
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

// --- Synonyms for merchandising context ---

const SYNONYMS: Record<string, string[]> = {
  botella: ["termo", "termica", "termos", "termicas", "botellas"],
  termo: ["botella", "termica", "termos", "botellas", "termicas"],
  mochila: ["bolso", "morral", "mochilas", "bolsos"],
  bolso: ["mochila", "morral", "bolsos", "mochilas", "totebag"],
  remera: ["camiseta", "remeras", "camisetas", "polera"],
  gorra: ["cap", "gorras", "visera"],
  lapicera: ["boligrafo", "lapiceras", "boligrafos", "pen"],
  cuaderno: ["anotador", "libreta", "cuadernos", "notebook"],
  taza: ["mug", "tazas", "pocillo"],
  mate: ["mates", "matero", "matera"],
  pendrive: ["usb", "memoria", "pendrives"],
  cargador: ["charger", "powerbank", "cargadores"],
  parlante: ["speaker", "parlantes", "bluetooth"],
  auricular: ["auriculares", "headphones", "earbuds"],
  eco: ["ecologico", "sustentable", "reciclado", "reciclable", "bambu", "organico"],
  sustentable: ["eco", "ecologico", "reciclado", "reciclable", "green"],
  premium: ["ejecutivo", "lujo", "alta gama", "exclusivo"],
  kit: ["combo", "set", "pack", "kits", "combos", "sets"],
  regalo: ["obsequio", "presente", "gift", "regalos"],
  corporativo: ["empresa", "empresarial", "institucional", "branding", "corporate"],
  evento: ["conferencia", "congreso", "feria", "exposicion", "eventos"],
  personalizado: ["personalizar", "personalizacion", "grabado", "bordado", "estampado", "serigrafia"],
};

function expandWithSynonyms(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const stemmed = stem(token);
    // Check synonyms for both original and stemmed
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      if (token === key || stemmed === stem(key) || syns.some((s) => stem(s) === stemmed)) {
        expanded.add(key);
        for (const s of syns) expanded.add(s);
      }
    }
  }
  return [...expanded];
}

// --- Search index ---

interface IndexedProduct {
  product: CatalogProduct;
  titleTokens: string[];
  titleStems: string[];
  descTokens: string[];
  descStems: string[];
  categoryStems: string[];
  materialStems: string[];
  allStems: Set<string>;
}

let _catalog: CatalogData | null = null;
let _index: IndexedProduct[] | null = null;

function loadCatalog(): CatalogData {
  if (_catalog) return _catalog;
  // Dynamic require to load the JSON file
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _catalog = require("@/data/catalog.json") as CatalogData;
  return _catalog;
}

function buildIndex(): IndexedProduct[] {
  if (_index) return _index;
  const catalog = loadCatalog();
  _index = catalog.products.map((p) => {
    const titleTokens = tokenize(p.title);
    const descTokens = tokenize(p.description);
    const categoryTokens = tokenize(p.category);
    const materialTokens = p.materials.flatMap((m) => tokenize(m));

    const titleStems = titleTokens.map(stem);
    const descStems = descTokens.map(stem);
    const categoryStems = categoryTokens.map(stem);
    const materialStems = materialTokens.map(stem);

    const allStems = new Set([
      ...titleStems,
      ...descStems,
      ...categoryStems,
      ...materialStems,
    ]);

    return {
      product: p,
      titleTokens,
      titleStems,
      descTokens,
      descStems,
      categoryStems,
      materialStems,
      allStems,
    };
  });
  return _index;
}

/** Score a product against query tokens. Returns 0-1. */
function scoreProduct(indexed: IndexedProduct, queryStems: string[]): number {
  if (queryStems.length === 0) return 0;

  let score = 0;
  const weights = { title: 3, category: 2, material: 1.5, description: 1 };

  for (const qs of queryStems) {
    // Title match (highest weight)
    if (indexed.titleStems.some((ts) => ts === qs || ts.startsWith(qs) || qs.startsWith(ts))) {
      score += weights.title;
    }
    // Category match
    else if (indexed.categoryStems.some((cs) => cs === qs || cs.startsWith(qs) || qs.startsWith(cs))) {
      score += weights.category;
    }
    // Material match
    else if (indexed.materialStems.some((ms) => ms === qs || ms.startsWith(qs) || qs.startsWith(ms))) {
      score += weights.material;
    }
    // Description match
    else if (indexed.descStems.some((ds) => ds === qs || ds.startsWith(qs) || qs.startsWith(ds))) {
      score += weights.description;
    }
  }

  // Normalize: max possible = queryStems.length * max_weight
  const maxPossible = queryStems.length * weights.title;
  return Math.min(1, score / maxPossible);
}

/** Text search over local catalog. Returns top N candidates sorted by relevance. */
export function searchLocalCatalog(
  query: string,
  options?: {
    category?: string;
    eco_friendly?: boolean;
    maxResults?: number;
  }
): ProductResult[] {
  const index = buildIndex();
  const max = options?.maxResults ?? 50;

  // Tokenize and expand query with synonyms
  const queryTokens = tokenize(query);
  const expandedTokens = expandWithSynonyms(queryTokens);
  const queryStems = expandedTokens.map(stem);

  // Score all products
  let scored = index.map((indexed) => ({
    indexed,
    score: scoreProduct(indexed, queryStems),
  }));

  // Apply filters
  if (options?.category) {
    const catNorm = normalize(options.category);
    scored = scored.filter((s) =>
      normalize(s.indexed.product.category).includes(catNorm)
    );
  }
  if (options?.eco_friendly) {
    scored = scored.filter((s) => s.indexed.product.eco_friendly);
  }

  // Sort by score desc, filter out zero scores
  scored = scored.filter((s) => s.score > 0);
  scored.sort((a, b) => b.score - a.score);

  // Convert to ProductResult
  return scored.slice(0, max).map((s) => toProductResult(s.indexed.product, s.score));
}

/** Diversified sample across categories — fallback when text search returns too few results */
export function getDiversifiedSample(
  maxPerCategory = 3,
  totalMax = 50
): ProductResult[] {
  const catalog = loadCatalog();
  const byCategory = new Map<string, CatalogProduct[]>();
  for (const p of catalog.products) {
    const arr = byCategory.get(p.category) || [];
    arr.push(p);
    byCategory.set(p.category, arr);
  }

  const sampled: CatalogProduct[] = [];
  for (const [, products] of byCategory) {
    // Shuffle deterministically by product_id for variety
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    sampled.push(...shuffled.slice(0, maxPerCategory));
  }

  // Shuffle the combined result for variety
  sampled.sort(() => Math.random() - 0.5);

  return sampled.slice(0, totalMax).map((p) => toProductResult(p, 0));
}

/** Get all products (for catalog browsing, not AI search) */
export function getAllProducts(options?: {
  category?: string;
  search?: string;
  eco_friendly?: boolean;
  personalization?: string;
  min_price?: number;
  max_price?: number;
  sort?: string;
  limit?: number;
  offset?: number;
}): { products: ProductResult[]; total: number } {
  const catalog = loadCatalog();
  let products = catalog.products;

  // Filters
  if (options?.category) {
    const catNorm = normalize(options.category);
    products = products.filter((p) =>
      normalize(p.category).includes(catNorm)
    );
  }
  if (options?.search) {
    const searchTokens = tokenize(options.search).map(stem);
    const expanded = expandWithSynonyms(tokenize(options.search)).map(stem);
    const index = buildIndex();
    const matching = index
      .map((indexed) => ({
        indexed,
        score: scoreProduct(indexed, expanded.length > 0 ? expanded : searchTokens),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);
    products = matching.map((s) => s.indexed.product);
  }
  if (options?.eco_friendly) {
    products = products.filter((p) => p.eco_friendly);
  }
  if (options?.personalization) {
    const persNorm = normalize(options.personalization);
    products = products.filter((p) =>
      p.personalization_methods.some((m) =>
        normalize(m).includes(persNorm)
      )
    );
  }
  if (options?.min_price != null) {
    products = products.filter(
      (p) => p.price != null && p.price >= options.min_price!
    );
  }
  if (options?.max_price != null) {
    products = products.filter(
      (p) => p.price != null && p.price <= options.max_price!
    );
  }

  // Sort
  const sorted = [...products];
  if (options?.sort === "price_asc") {
    sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  } else if (options?.sort === "price_desc") {
    sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  } else if (options?.sort === "name_asc") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  }

  const total = sorted.length;
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 24;
  const page = sorted.slice(offset, offset + limit);

  return {
    products: page.map((p) => toProductResult(p, 0)),
    total,
  };
}

/** Get single product by ID */
export function getLocalProduct(productId: string): ProductResult | null {
  const catalog = loadCatalog();
  const product = catalog.products.find((p) => p.product_id === productId);
  return product ? toProductResult(product, 0) : null;
}

/** Get catalog metadata */
export function getCatalogInfo(): { synced_at: string; total: number; categories: string[] } {
  const catalog = loadCatalog();
  const categories = [...new Set(catalog.products.map((p) => p.category))].sort();
  return { synced_at: catalog.synced_at, total: catalog.total, categories };
}

function toProductResult(p: CatalogProduct, score: number): ProductResult {
  return {
    product_id: p.product_id,
    external_id: p.external_id,
    title: p.title,
    description: p.description,
    category: p.category,
    subcategory: "",
    price: p.price,
    price_max: p.price_max,
    currency: p.currency,
    min_qty: p.min_qty,
    materials: p.materials,
    colors: p.colors,
    personalization_methods: p.personalization_methods,
    eco_friendly: p.eco_friendly,
    premium_tier: false,
    image_urls: p.image_urls,
    lead_time_days: null,
    score,
    reason: "",
  };
}
