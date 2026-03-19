/* Zecat API client — fetches products from Zecat and transforms to our types.
   Currently used only as fallback for individual product lookup (getZecatProduct)
   when a product isn't found in catalog.json. Main catalog browsing uses local-catalog.ts. */

import type { ProductResult, CategoriesResponse, ProductListResponse } from "../types";
import { calculatePricing } from "./pricing";

const ZECAT_BASE = "https://api.zecat.com/v1";

function getToken(): string {
  const token = process.env.ZECAT_API_TOKEN;
  if (!token) throw new Error("ZECAT_API_TOKEN not configured");
  return token;
}

async function zecatFetch(path: string): Promise<Response> {
  const res = await fetch(`${ZECAT_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    throw new Error(`Zecat API ${res.status}: ${await res.text()}`);
  }
  return res;
}

// --- Zecat types (loose to handle both list and detail shapes) ---

/* eslint-disable @typescript-eslint/no-explicit-any */

// Attribute ID → name mapping (single product endpoint uses IDs, list uses names)
const ATTRIBUTE_MAP: Record<number, string> = {
  8: "Técnica de aplicación",
  9: "Material",
  2: "Marca",
};

interface ZecatFamilyFull {
  id: string;
  description: string;
  show: boolean;
}

// --- Families cache ---

let familiesCache: { data: ZecatFamilyFull[]; ts: number } | null = null;
const FAMILIES_TTL = 60 * 60 * 1000; // 1 hour

async function getFamilies(): Promise<ZecatFamilyFull[]> {
  if (familiesCache && Date.now() - familiesCache.ts < FAMILIES_TTL) {
    return familiesCache.data;
  }
  const res = await zecatFetch("/family/");
  const data: { families: ZecatFamilyFull[] } = await res.json();
  familiesCache = { data: data.families, ts: Date.now() };
  return data.families;
}

// --- Transform ---

function resolveAttributeName(sa: any): string {
  // List endpoint has attribute_name, detail endpoint has attribute_id
  if (sa.attribute_name) return sa.attribute_name;
  if (sa.attribute_id) return ATTRIBUTE_MAP[sa.attribute_id] || "";
  return "";
}

function resolveDiscountPrice(z: any): number | null {
  // List endpoint has discountPrice directly
  if (z.discountPrice) return z.discountPrice;

  // Detail endpoint has discountRanges array with ranges
  if (Array.isArray(z.discountRanges) && z.discountRanges.length > 0) {
    const firstRange = z.discountRanges[0];
    if (firstRange.ranges && firstRange.ranges.length > 0) {
      return parseFloat(firstRange.ranges[0].price);
    }
  }

  // Fallback: list endpoint has discountRanges as object with minPrice
  if (z.discountRanges && typeof z.discountRanges === "object" && !Array.isArray(z.discountRanges)) {
    if (z.discountRanges.minPrice) return parseFloat(z.discountRanges.minPrice);
  }

  return z.price || null;
}

function transformProduct(z: any): ProductResult {
  const families: any[] = z.families || [];
  const mainFamily = families.find((f: any) => f.show) || families[0];

  // Images: list uses image_url, detail might use imageUrl in variant images
  const images: any[] = z.images || [];
  const sortedImages = [...images].sort((a: any, b: any) => {
    if (a.main && !b.main) return -1;
    if (!a.main && b.main) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  // Variants: list uses element_description_1, detail uses same in products array
  const variants: any[] = z.products || [];
  const colors = [
    ...new Set(
      variants
        .map((v: any) => v.element_description_1 || v.elementDescription1)
        .filter((c: string) => c && c !== "." && c !== "..."),
    ),
  ];

  const subattributes: any[] = z.subattributes || [];
  const personalizationMethods = subattributes
    .filter((sa: any) => resolveAttributeName(sa) === "Técnica de aplicación")
    .map((sa: any) => sa.name.trim());

  const materials = subattributes
    .filter((sa: any) => resolveAttributeName(sa) === "Material")
    .map((sa: any) => sa.name.trim());

  const ecoFriendly =
    families.some((f: any) =>
      f.description?.toLowerCase().includes("sustentable"),
    ) || z.tag?.toLowerCase().includes("sustentable");

  const listPrice = z.price || null;
  const category = mainFamily?.description || "Sin categoría";

  // Apply D&P pricing
  let priceTiers: ProductResult["price_tiers"];
  let personalizationPrice: number | undefined;
  let displayPrice = resolveDiscountPrice(z);

  if (listPrice != null && listPrice > 0) {
    const pricing = calculatePricing(listPrice, category, "zecat");
    priceTiers = pricing.tiers.map((t) => ({
      label: t.label,
      min: t.min,
      max: t.max,
      unitPrice: t.unitPrice,
      finalPrice: t.finalPrice,
    }));
    personalizationPrice = pricing.personalizationPrice;
    displayPrice = pricing.tiers[0].finalPrice;
  }

  return {
    product_id: z.id,
    external_id: z.external_id,
    title: z.name,
    description: z.description || "",
    category,
    subcategory: "",
    price: displayPrice,
    price_max: listPrice,
    currency: z.currency || "ARS",
    min_qty: z.minimum_order_quantity || 1,
    materials,
    colors,
    personalization_methods: personalizationMethods,
    eco_friendly: ecoFriendly,
    premium_tier: false,
    image_urls: sortedImages.map((img: any) => img.image_url || img.imageUrl),
    lead_time_days: null,
    score: 0,
    reason: "",
    price_tiers: priceTiers,
    personalization_price: personalizationPrice,
    list_price: listPrice,
  };
}

// --- Public API ---

export async function listZecatProducts(params?: {
  category?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  eco_friendly?: boolean;
  personalization?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}): Promise<ProductListResponse> {
  const limit = params?.limit || 24;
  const offset = params?.offset || 0;
  const page = Math.floor(offset / limit) + 1;

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  qs.set("only_products", "true");

  // Category → family ID
  if (params?.category) {
    const families = await getFamilies();
    const family = families.find(
      (f) => f.description.trim().toLowerCase() === params.category!.trim().toLowerCase(),
    );
    if (family) qs.set("families[]", family.id);
  }

  // Eco-friendly → Sustentables family
  if (params?.eco_friendly) {
    const families = await getFamilies();
    const ecoFamily = families.find((f) =>
      f.description.toLowerCase().includes("sustentable"),
    );
    if (ecoFamily && !qs.has("families[]")) {
      qs.set("families[]", ecoFamily.id);
    }
  }

  if (params?.search) qs.set("name", params.search);
  if (params?.min_price != null) qs.set("price[from]", String(params.min_price));
  if (params?.max_price != null) qs.set("price[to]", String(params.max_price));

  // Sort
  if (params?.sort === "price_asc") qs.set("order[price]", "asc");
  else if (params?.sort === "price_desc") qs.set("order[price]", "desc");

  const res = await zecatFetch(`/generic_product?${qs.toString()}`);
  const data = await res.json();

  let products: ProductResult[] = (data.generic_products || []).map(transformProduct);

  // Client-side filter for personalization (Zecat doesn't support this)
  if (params?.personalization) {
    products = products.filter((p) =>
      p.personalization_methods.some((m) =>
        m.toLowerCase().includes(params.personalization!.toLowerCase()),
      ),
    );
  }

  // Client-side sort for name (Zecat doesn't support this)
  if (params?.sort === "name_asc") {
    products.sort((a, b) => a.title.localeCompare(b.title));
  }

  return {
    products,
    total: data.count || 0,
    limit,
    offset,
    has_more: page < (data.total_pages || 0),
  };
}

export async function getZecatProduct(
  id: string,
): Promise<ProductResult | null> {
  try {
    const res = await zecatFetch(`/generic_product/${id}`);
    const data = await res.json();
    return transformProduct(data.generic_product);
  } catch {
    return null;
  }
}

export async function getZecatCategories(): Promise<CategoriesResponse> {
  const families = await getFamilies();
  const visible = families.filter((f) => f.show);

  return {
    categories: visible.map((f) => ({
      name: f.description,
      count: 0,
      subcategories: [],
    })),
    total_products: 0,
  };
}
