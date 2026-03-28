#!/usr/bin/env npx tsx

import fs from "node:fs/promises";
import path from "node:path";
import {
  ANALYTICS_SITES,
  type AnalyticsMatch,
  type AnalyticsProduct,
  type AnalyticsSiteId,
  type CompetitorAnalyticsSnapshot,
  type PriceBasis,
  type PriceStatus,
} from "../src/lib/analytics/competitor-snapshot";
import { getAllProducts } from "../src/lib/engine/local-catalog";
import { MANUAL_MATCH_OVERRIDES } from "../src/lib/analytics/manual-match-overrides";

const OUTPUT_DIR = path.resolve("analytics");
const SNAPSHOT_DIR = path.join(OUTPUT_DIR, "snapshots");
const OUR_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://diezypunto-web.vercel.app";
const REQUEST_TIMEOUT_MS = 20000;
const RETRIES = 3;
const PAGE_CONCURRENCY = 8;
const PRODUCT_CONCURRENCY = 10;

type ParsedListingPage = {
  categoryName: string;
  pageCount: number;
  products: Array<{
    url: string;
    title: string;
    rawCategories: string[];
  }>;
};

type MerchParsedProduct = {
  id: string;
  title: string;
  rawCategories: string[];
  priceArs: number | null;
  priceBasis: PriceBasis;
  priceStatus: PriceStatus;
  priceLabel: string | null;
  notes: string | null;
  url: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url: string, attempt = 1): Promise<string> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; diezypunto-analytics/1.0; +https://diezypunto-web.vercel.app)",
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

async function mapWithConcurrency<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency: number,
) {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function run() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) {
        return;
      }
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => run()),
  );

  return results;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#0?34;/g, '"')
    .replace(/&#0?36;/g, "$")
    .replace(/&#039;/g, "'")
    .replace(/&#8211;|&#8212;/g, " - ")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function stripTags(value: string) {
  return decodeHtmlEntities(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeText(value: string) {
  return decodeHtmlEntities(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeMatchTitle(value: string) {
  return normalizeText(value);
}

const GENERIC_TITLE_TOKENS = new Set([
  "de",
  "del",
  "con",
  "para",
  "y",
  "en",
  "la",
  "el",
  "los",
  "las",
  "set",
  "standard",
  "medida",
  "medidas",
  "incluye",
  "logo",
  "logos",
]);

const PRODUCT_FAMILY_TOKENS = [
  "bolsa",
  "mochila",
  "bolso",
  "morral",
  "cooler",
  "neceser",
  "llavero",
  "destapador",
  "botella",
  "termo",
  "mate",
  "vaso",
  "jarro",
  "taza",
  "cuaderno",
  "agenda",
  "libreta",
  "lapiz",
  "lapices",
  "boligrafo",
  "roller",
  "marcador",
  "marcadores",
  "auricular",
  "auriculares",
  "power",
  "cargador",
  "parlante",
  "mouse",
  "teclado",
  "pendrive",
  "soporte",
];

function tokenizeText(value: string) {
  return normalizeText(value).split(" ").filter(Boolean);
}

function extractProductFamily(title: string, normalizedCategory: string) {
  const tokens = tokenizeText(title);
  for (const token of tokens) {
    if (PRODUCT_FAMILY_TOKENS.includes(token)) {
      return token;
    }
  }

  return normalizeText(normalizedCategory);
}

function buildCanonicalTitle(title: string) {
  return tokenizeText(title)
    .filter((token) => !GENERIC_TITLE_TOKENS.has(token))
    .filter((token) => !/^\d+x\d+(x\d+)?$/.test(token))
    .join(" ")
    .trim();
}

function slugToLabel(slug: string) {
  return decodeHtmlEntities(slug)
    .replace(/^product-cat-/, "")
    .replace(/^product_cat-/, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];
}

function parseXmlLocs(xml: string) {
  return [...xml.matchAll(/<loc>(?:<!\[CDATA\[)?([^<\]]+?)(?:\]\]>)?<\/loc>/g)].map(
    (match) => match[1].trim(),
  );
}

function productIdFromUrl(url: string) {
  const pathname = new URL(url).pathname;
  const slug = pathname.split("/").filter(Boolean).pop() || pathname;
  return decodeURIComponent(slug);
}

function categoryNameFromUrl(url: string) {
  const pathname = new URL(url).pathname;
  const slug = pathname.split("/").filter(Boolean).slice(-1)[0] || pathname;
  return slugToLabel(decodeURIComponent(slug));
}

function parsePrice(value: string | null | undefined) {
  if (!value) return null;

  const trimmed = decodeHtmlEntities(value)
    .replace(/\s+/g, "")
    .replace(/\$/g, "")
    .trim();
  if (!trimmed) return null;

  if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    const parsedThousands = Number(trimmed.replace(/\./g, ""));
    return Number.isFinite(parsedThousands) ? parsedThousands : null;
  }

  if (/^\d{1,3}(,\d{3})+$/.test(trimmed)) {
    const parsedThousands = Number(trimmed.replace(/,/g, ""));
    return Number.isFinite(parsedThousands) ? parsedThousands : null;
  }

  if (trimmed.includes(".") && trimmed.includes(",")) {
    const lastDot = trimmed.lastIndexOf(".");
    const lastComma = trimmed.lastIndexOf(",");
    const normalized =
      lastComma > lastDot
        ? trimmed.replace(/\./g, "").replace(/,/g, ".")
        : trimmed.replace(/,/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (trimmed.includes(",")) {
    const parsed = Number(trimmed.replace(/,/g, "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  const direct = Number(trimmed);
  return Number.isFinite(direct) ? direct : null;
}

function extractMerchPrimaryScope(html: string) {
  const titleMatch = html.match(/<h1 class="product_title[^"]*">[\s\S]*?<\/h1>/);
  if (!titleMatch || titleMatch.index == null) {
    return html;
  }

  const start = titleMatch.index;
  const tail = html.slice(start);
  const endMarkers = [
    /<section class="related products/i,
    /<div class="related-and-upsells/i,
    /<div class="products related/i,
    /id="tab-related"/i,
    /class="merch\.com\.artir"/i,
    /data-gtm4wp_product_data=/i,
  ];

  const end = endMarkers.reduce((currentEnd, pattern) => {
    const match = tail.match(pattern);
    if (!match || match.index == null) {
      return currentEnd;
    }
    return Math.min(currentEnd, match.index);
  }, Math.min(tail.length, 20000));

  return tail.slice(0, end);
}

function parseMerchVisiblePrice(html: string) {
  return (
    html.match(
      /<p class="price">[\s\S]*?woocommerce-Price-currencySymbol[^>]*>(?:&#36;|\$)<\/span>(?:&nbsp;|\s*)([0-9.,]+)/,
    )?.[1] ?? null
  );
}

function sortProducts(products: AnalyticsProduct[]) {
  return [...products].sort((left, right) => {
    if (left.siteId !== right.siteId) {
      return left.siteId.localeCompare(right.siteId);
    }
    return left.title.localeCompare(right.title, "es");
  });
}

function normalizeCategory(rawCategories: string[], title: string) {
  const haystack = normalizeText([...rawCategories, title].join(" "));

  if (
    /\b(boligrafo|boligrafos|boligrafos|birome|biromes|lapiz|lapices|roller|marcador|marcadores|pluma|plumas|escritura)\b/.test(
      haystack,
    )
  ) {
    return "Escritura";
  }

  if (
    /\b(cuaderno|cuadernos|libreta|libretas|agenda|agendas|anotador|anotadores|calendario|calendarios|bitacora|bitacoras)\b/.test(
      haystack,
    )
  ) {
    return "Cuadernos y Libretas";
  }

  if (
    /\b(botella|botellas|termo|termos|tumbler|shaker|hidratacion|hidratacion|vaso termico)\b/.test(
      haystack,
    )
  ) {
    return "Botellas y Termos";
  }

  if (
    /\b(mate|mates|matero|materos|taza|tazas|jarro|jarros|copa|copas|cocina|cubiertos|tabla|tablas|set de vino|vino)\b/.test(
      haystack,
    )
  ) {
    return "Mates, Tazas y Cocina";
  }

  if (
    /\b(auricular|auriculares|parlante|parlantes|pendrive|usb|power bank|cargador|cargadores|speaker|mouse|teclado|soporte|tecnologia|teconologia|smart|adaptador|cable)\b/.test(
      haystack,
    )
  ) {
    return "Tecnología";
  }

  if (
    /\b(mochila|mochilas|morral|morrales|bolso|bolsos|cooler|neceser|valija|viaje|viajes|maletin|maletin|bag|bags|bolsa|bolsas)\b/.test(
      haystack,
    )
  ) {
    return "Bolsos y Viaje";
  }

  if (
    /\b(indumentaria|textil|remera|remeras|campera|camperas|buzo|buzos|chaleco|chalecos|gorra|gorras|sombrero|sombreros|ropa)\b/.test(
      haystack,
    )
  ) {
    return "Textil e Indumentaria";
  }

  if (
    /\b(llavero|llaveros|lanyard|lanyards|credencial|credenciales|identificacion)\b/.test(
      haystack,
    )
  ) {
    return "Llaveros y Credenciales";
  }

  if (
    /\b(oficina|escritorio|negocios|portfolio|portfolios|carpeta|carpetas|post it|organizador|organizadores)\b/.test(
      haystack,
    )
  ) {
    return "Oficina y Escritorio";
  }

  if (
    /\b(herramienta|herramientas|auto|automovil|linterna|cutter|destornillador|martillo)\b/.test(
      haystack,
    )
  ) {
    return "Herramientas y Auto";
  }

  if (
    /\b(bienestar|cuidado personal|cuidado pers|salud|fitness|beauty|belleza|spa|wellness)\b/.test(
      haystack,
    )
  ) {
    return "Bienestar y Cuidado";
  }

  if (
    /\b(paraguas|sombrilla|sombrillas|parasoles|playa)\b/.test(haystack)
  ) {
    return "Paraguas y Playa";
  }

  if (
    /\b(outdoor|camping|aire libre|tiempo libre|parrilla|asado)\b/.test(haystack)
  ) {
    return "Outdoor y Tiempo Libre";
  }

  if (
    /\b(kit|kits|caja|cajas|packaging|estuche|estuches)\b/.test(haystack)
  ) {
    return "Kits y Packaging";
  }

  if (
    /\b(eco|ecologico|ecologicos|ecologica|sustentable|sustentables|reciclado|reciclable|bambu|corcho)\b/.test(
      haystack,
    )
  ) {
    return "Eco y Sustentables";
  }

  if (
    /\b(hogar|deco|vela|mantas|almohada|reloj|relojes|lifestyle)\b/.test(haystack)
  ) {
    return "Hogar y Lifestyle";
  }

  return "Otros";
}

function buildProduct(input: {
  id: string;
  siteId: AnalyticsSiteId;
  title: string;
  url: string;
  rawCategories: string[];
  priceArs: number | null;
  priceStatus: PriceStatus;
  priceBasis: PriceBasis;
  priceLabel: string | null;
  notes: string | null;
}): AnalyticsProduct {
  const site = ANALYTICS_SITES.find((item) => item.id === input.siteId);
  if (!site) {
    throw new Error(`Unknown analytics site: ${input.siteId}`);
  }

  const title = stripTags(input.title);
  const rawCategories = uniqueStrings(input.rawCategories);
  const normalizedCategory = normalizeCategory(rawCategories, title);

  return {
    id: input.id,
    siteId: site.id,
    siteName: site.name,
    domain: site.domain,
    title,
    normalizedTitle: normalizeText(title),
    matchKey: normalizeMatchTitle(title),
    canonicalTitle: buildCanonicalTitle(title),
    productFamily: extractProductFamily(title, normalizedCategory),
    url: input.url,
    rawCategories,
    normalizedCategory,
    priceArs: input.priceArs,
    priceStatus: input.priceStatus,
    priceBasis: input.priceBasis,
    priceLabel: input.priceLabel,
    notes: input.notes,
  };
}

async function collectDiezypuntoProducts() {
  const { products } = getAllProducts({ limit: 10_000, offset: 0, sort: "name_asc" });

  return products
    .filter((product) => product.title?.trim())
    .map((product) =>
      buildProduct({
        id: `diezypunto:${product.product_id}`,
        siteId: "diezypunto",
        title: product.title,
        url: `${OUR_SITE_URL}/producto/${product.product_id}`,
        rawCategories: uniqueStrings([product.category, product.subcategory]),
        priceArs: product.price,
        priceStatus: product.price != null ? "priced" : "unknown",
        priceBasis: product.price != null ? "plus_vat" : "unknown",
        priceLabel: product.price != null ? "Precio visible + IVA" : null,
        notes: null,
      }),
    );
}

function parseJsonAttribute<T>(value: string | undefined) {
  if (!value) return null;

  try {
    return JSON.parse(decodeHtmlEntities(value)) as T;
  } catch {
    return null;
  }
}

function parseMerchProductPage(html: string, url: string): MerchParsedProduct {
  const gtmProductData = parseJsonAttribute<{
    item_name?: string;
    price?: number;
    item_category?: string;
  }>(html.match(/name="gtm4wp_product_data"\s+value="([^"]+)"/)?.[1]);
  const primaryScope = extractMerchPrimaryScope(html);

  const title =
    stripTags(
      gtmProductData?.item_name ??
        html.match(/<h1 class="product_title[^"]*">([\s\S]*?)<\/h1>/)?.[1] ??
        html.match(/<title>([^<]+?)\s+\|/i)?.[1] ??
        productIdFromUrl(url),
    ) || productIdFromUrl(url);

  const rawPrice =
    parseMerchVisiblePrice(primaryScope) ??
    primaryScope.match(/&quot;display_price&quot;:([0-9.]+)/)?.[1] ??
    (gtmProductData?.price != null && gtmProductData.price > 0 ? String(gtmProductData.price) : null) ??
    null;

  const classCategorySlugs = [
    ...new Set(
      [...primaryScope.matchAll(/\bproduct_cat-([a-z0-9-]+)/g)].map((match) =>
        slugToLabel(match[1]),
      ),
    ),
  ];

  const rawCategories = uniqueStrings([
    gtmProductData?.item_category,
    ...classCategorySlugs,
  ]);

  const notes = html.includes("incluye impresión")
    ? "Desde, incluye impresión"
    : html.includes("+ IVA")
      ? "Precio + IVA"
      : null;

  return {
    id: `merch:${html.match(/id="product-(\d+)"/)?.[1] ?? productIdFromUrl(url)}`,
    title,
    rawCategories,
    priceArs: parsePrice(rawPrice),
    priceBasis: "plus_vat",
    priceStatus: parsePrice(rawPrice) != null ? "priced" : "unknown",
    priceLabel: html.includes("+ IVA") ? "Desde + IVA" : null,
    notes,
    url,
  };
}

async function collectMerchProducts() {
  console.log("Merch: descargando sitemap de productos...");
  const sitemapXml = await fetchText("https://merch.com.ar/product-sitemap.xml");
  const productUrls = parseXmlLocs(sitemapXml).filter((url) =>
    url.startsWith("https://merch.com.ar/producto/"),
  );

  console.log(`Merch: ${productUrls.length} productos en sitemap`);

  const parsedProducts = await mapWithConcurrency(
    productUrls,
    async (url, index) => {
      let parsed: MerchParsedProduct;
      try {
        const html = await fetchText(url);
        parsed = parseMerchProductPage(html, url);
      } catch (error) {
        parsed = {
          id: `merch:${productIdFromUrl(url)}`,
          title: slugToLabel(productIdFromUrl(url)),
          rawCategories: [],
          priceArs: null,
          priceBasis: "unknown",
          priceStatus: "unknown",
          priceLabel: null,
          notes: `Fetch error: ${String(error)}`,
          url,
        };
      }
      if ((index + 1) % 50 === 0 || index === productUrls.length - 1) {
        console.log(`Merch: ${index + 1}/${productUrls.length}`);
      }
      return parsed;
    },
    PRODUCT_CONCURRENCY,
  );

  return parsedProducts.map((product) =>
    buildProduct({
      ...product,
      siteId: "merch",
    }),
  );
}

function extractVelskiPageCount(html: string) {
  const pages = [...html.matchAll(/product-category\/[^"']+\/page\/(\d+)\//g)].map((match) =>
    Number(match[1]),
  );
  return Math.max(1, ...pages);
}

function parseVelskiCategoryPage(html: string): ParsedListingPage {
  const categoryName =
    stripTags(
      html.match(/<title>([^<]+?)\s+archivos\s+-\s+Grupo Velski<\/title>/i)?.[1] ??
        html.match(/"position":2,"name":"([^"]+)"/)?.[1] ??
        "Sin categoría",
    ) || "Sin categoría";

  const chunks = html.match(/<li class="ast-grid-common-col[\s\S]*?<\/li>/g) ?? [];

  const products = chunks
    .map((chunk) => {
      const url = chunk.match(/href="(https:\/\/grupovelski\.com\/product\/[^"]+)"/)?.[1] ?? null;
      const title = chunk.match(
        /<h2 class="woocommerce-loop-product__title">([\s\S]*?)<\/h2>/,
      )?.[1];
      const visibleCategory = chunk.match(
        /<span class="woocommerce-product-category__title">([^<]+)<\/span>/,
      )?.[1];
      const classCategories = [
        ...new Set(
          [...chunk.matchAll(/\bproduct_cat-([a-z0-9-]+)/g)].map((match) => slugToLabel(match[1])),
        ),
      ];

      if (!url || !title) {
        return null;
      }

      return {
        url,
        title: stripTags(title),
        rawCategories: uniqueStrings([categoryName, visibleCategory, ...classCategories]),
      };
    })
    .filter(Boolean) as ParsedListingPage["products"];

  return {
    categoryName,
    pageCount: extractVelskiPageCount(html),
    products,
  };
}

function extractKapoiPageCount(html: string) {
  const explicit = html.match(/Página\s+\d+\s+de\s+(\d+)/i)?.[1];
  if (explicit) {
    return Number(explicit);
  }

  const pages = [...html.matchAll(/categoria-producto\/[^"']+\/page\/(\d+)\//g)].map((match) =>
    Number(match[1]),
  );
  return Math.max(1, ...pages);
}

function parseKapoiCategoryPage(html: string): ParsedListingPage {
  const categoryName =
    stripTags(
      html.match(/<title>([^<]+?)(?:\s+-\s+Página\s+\d+\s+de\s+\d+)?\s+-\s+KAPOI Merchandising<\/title>/i)?.[1] ??
        html.match(/"position":2,"name":"([^"]+)"/)?.[1] ??
        "Sin categoría",
    ) || "Sin categoría";

  const chunks = html.match(/<li class="pd-wh[\s\S]*?<\/li>/g) ?? [];

  const products = chunks
    .map((chunk) => {
      const url = chunk.match(/href="(https:\/\/kapoi\.com\.ar\/producto\/[^"]+)"/)?.[1] ?? null;
      const title = chunk.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? null;
      const categoryLinks = [
        ...chunk.matchAll(/categoria-producto\/[^"]+"[^>]*>([^<]+)<\/a>/g),
      ].map((match) => stripTags(match[1]));

      if (!url || !title) {
        return null;
      }

      return {
        url,
        title: stripTags(title),
        rawCategories: uniqueStrings([categoryName, ...categoryLinks]),
      };
    })
    .filter(Boolean) as ParsedListingPage["products"];

  return {
    categoryName,
    pageCount: extractKapoiPageCount(html),
    products,
  };
}

async function collectCategoryListingProducts(options: {
  label: string;
  siteId: Extract<AnalyticsSiteId, "grupovelski" | "kapoi">;
  categorySitemapUrl: string;
  pageParser: (html: string) => ParsedListingPage;
  buildPageUrl: (categoryUrl: string, page: number) => string;
}) {
  console.log(`${options.label}: descargando sitemap de categorías...`);
  const sitemapXml = await fetchText(options.categorySitemapUrl);
  const categoryUrls = parseXmlLocs(sitemapXml).filter((url) =>
    url.startsWith(options.categorySitemapUrl.includes("grupovelski") ? "https://grupovelski.com/product-category/" : "https://kapoi.com.ar/categoria-producto/"),
  );

  const uniqueCategoryUrls = [...new Set(categoryUrls)];
  console.log(`${options.label}: ${uniqueCategoryUrls.length} categorías detectadas`);

  const firstPages = await mapWithConcurrency(
    uniqueCategoryUrls,
    async (categoryUrl, index) => {
      let parsed: ParsedListingPage;
      try {
        const html = await fetchText(categoryUrl);
        parsed = options.pageParser(html);
      } catch (error) {
        parsed = {
          categoryName: categoryNameFromUrl(categoryUrl),
          pageCount: 1,
          products: [],
        };
        console.error(`${options.label}: error en categoría ${categoryUrl}`, error);
      }
      if ((index + 1) % 20 === 0 || index === uniqueCategoryUrls.length - 1) {
        console.log(`${options.label}: categoría ${index + 1}/${uniqueCategoryUrls.length}`);
      }
      return { categoryUrl, parsed };
    },
    PAGE_CONCURRENCY,
  );

  const aggregated = new Map<
    string,
    {
      title: string;
      rawCategories: Set<string>;
    }
  >();

  function addProducts(products: ParsedListingPage["products"]) {
    for (const product of products) {
      const current = aggregated.get(product.url) ?? {
        title: product.title,
        rawCategories: new Set<string>(),
      };

      current.title = product.title;
      for (const category of product.rawCategories) {
        current.rawCategories.add(category);
      }

      aggregated.set(product.url, current);
    }
  }

  for (const page of firstPages) {
    addProducts(page.parsed.products);
  }

  const remainingPageUrls = firstPages.flatMap(({ categoryUrl, parsed }) =>
    Array.from({ length: Math.max(parsed.pageCount - 1, 0) }, (_, index) =>
      options.buildPageUrl(categoryUrl, index + 2),
    ),
  );

  console.log(`${options.label}: ${remainingPageUrls.length} páginas adicionales`);

  if (remainingPageUrls.length > 0) {
    const additionalPages = await mapWithConcurrency(
      remainingPageUrls,
      async (url, index) => {
        let parsed: ParsedListingPage;
        try {
          const html = await fetchText(url);
          parsed = options.pageParser(html);
        } catch (error) {
          parsed = {
            categoryName: categoryNameFromUrl(url),
            pageCount: 1,
            products: [],
          };
          console.error(`${options.label}: error en página ${url}`, error);
        }
        if ((index + 1) % 50 === 0 || index === remainingPageUrls.length - 1) {
          console.log(`${options.label}: página ${index + 1}/${remainingPageUrls.length}`);
        }
        return parsed;
      },
      PAGE_CONCURRENCY,
    );

    for (const page of additionalPages) {
      addProducts(page.products);
    }
  }

  return sortProducts(
    [...aggregated.entries()].map(([url, product]) =>
      buildProduct({
        id: `${options.siteId}:${productIdFromUrl(url)}`,
        siteId: options.siteId,
        title: product.title,
        url,
        rawCategories: [...product.rawCategories],
        priceArs: null,
        priceStatus: "hidden",
        priceBasis: "hidden",
        priceLabel: null,
        notes: null,
      }),
    ),
  );
}

async function collectVelskiProducts() {
  return collectCategoryListingProducts({
    label: "Grupo Velski",
    siteId: "grupovelski",
    categorySitemapUrl: "https://grupovelski.com/product_cat-sitemap.xml",
    pageParser: parseVelskiCategoryPage,
    buildPageUrl: (categoryUrl, page) => `${categoryUrl.replace(/\/$/, "")}/page/${page}/`,
  });
}

async function collectKapoiProducts() {
  return collectCategoryListingProducts({
    label: "Kapoi",
    siteId: "kapoi",
    categorySitemapUrl: "https://kapoi.com.ar/product_cat-sitemap.xml",
    pageParser: parseKapoiCategoryPage,
    buildPageUrl: (categoryUrl, page) => `${categoryUrl.replace(/\/$/, "")}/page/${page}/`,
  });
}

function buildExactMatches(products: AnalyticsProduct[], siteId: AnalyticsMatch["siteId"]) {
  const ownProducts = products.filter((product) => product.siteId === "diezypunto");
  const competitorProducts = products.filter((product) => product.siteId === siteId);
  const site = ANALYTICS_SITES.find((item) => item.id === siteId);

  if (!site) {
    throw new Error(`Unknown site for match building: ${siteId}`);
  }

  const ownByKey = new Map<string, AnalyticsProduct[]>();
  for (const product of ownProducts) {
    const current = ownByKey.get(product.matchKey) || [];
    current.push(product);
    ownByKey.set(product.matchKey, current);
  }

  const competitorByKey = new Map<string, AnalyticsProduct[]>();
  for (const product of competitorProducts) {
    const current = competitorByKey.get(product.matchKey) || [];
    current.push(product);
    competitorByKey.set(product.matchKey, current);
  }

  const matches: AnalyticsMatch[] = [];

  for (const [matchKey, competitorItems] of competitorByKey.entries()) {
    const ownItems = ownByKey.get(matchKey) || [];

    if (ownItems.length !== 1 || competitorItems.length !== 1) {
      continue;
    }

    const own = ownItems[0];
    const competitor = competitorItems[0];
    const priceGapArs =
      own.priceArs != null && competitor.priceArs != null
        ? own.priceArs - competitor.priceArs
        : null;
    const priceGapPct =
      priceGapArs != null && competitor.priceArs != null && competitor.priceArs !== 0
        ? (priceGapArs / competitor.priceArs) * 100
        : null;

    matches.push({
      siteId,
      siteName: site.name,
      domain: site.domain,
      matchType: "exact_normalized_title",
      matchScore: 1,
      ourProductId: own.id,
      ourTitle: own.title,
      ourUrl: own.url,
      ourRawCategories: own.rawCategories,
      ourNormalizedCategory: own.normalizedCategory,
      ourPriceArs: own.priceArs,
      competitorProductId: competitor.id,
      competitorTitle: competitor.title,
      competitorUrl: competitor.url,
      competitorRawCategories: competitor.rawCategories,
      competitorNormalizedCategory: competitor.normalizedCategory,
      competitorPriceArs: competitor.priceArs,
      competitorPriceStatus: competitor.priceStatus,
      competitorPriceBasis: competitor.priceBasis,
      priceGapArs,
      priceGapPct,
    });
  }

  return matches.sort((left, right) => left.ourTitle.localeCompare(right.ourTitle, "es"));
}

function buildCanonicalFamilyMatches(
  products: AnalyticsProduct[],
  siteId: AnalyticsMatch["siteId"],
  existingMatches: AnalyticsMatch[],
) {
  const ownMatchedIds = new Set(existingMatches.map((match) => match.ourProductId));
  const competitorMatchedIds = new Set(
    existingMatches
      .filter((match) => match.siteId === siteId)
      .map((match) => match.competitorProductId),
  );

  const ownProducts = products.filter(
    (product) => product.siteId === "diezypunto" && !ownMatchedIds.has(product.id),
  );
  const competitorProducts = products.filter(
    (product) => product.siteId === siteId && !competitorMatchedIds.has(product.id),
  );
  const site = ANALYTICS_SITES.find((item) => item.id === siteId);

  if (!site) {
    throw new Error(`Unknown site for canonical match building: ${siteId}`);
  }

  const groups = new Map<
    string,
    {
      own: AnalyticsProduct[];
      competitor: AnalyticsProduct[];
    }
  >();

  function groupKey(product: AnalyticsProduct) {
    return [
      product.normalizedCategory,
      product.productFamily,
      product.canonicalTitle,
    ].join("::");
  }

  for (const product of ownProducts) {
    if (!product.canonicalTitle) continue;
    const key = groupKey(product);
    const current = groups.get(key) || { own: [], competitor: [] };
    current.own.push(product);
    groups.set(key, current);
  }

  for (const product of competitorProducts) {
    if (!product.canonicalTitle) continue;
    const key = groupKey(product);
    const current = groups.get(key) || { own: [], competitor: [] };
    current.competitor.push(product);
    groups.set(key, current);
  }

  const matches: AnalyticsMatch[] = [];

  for (const [, group] of groups) {
    if (group.own.length !== 1 || group.competitor.length !== 1) {
      continue;
    }

    const own = group.own[0];
    const competitor = group.competitor[0];

    if (!own.canonicalTitle || own.canonicalTitle.length < 3) {
      continue;
    }

    const priceGapArs =
      own.priceArs != null && competitor.priceArs != null
        ? own.priceArs - competitor.priceArs
        : null;
    const priceGapPct =
      priceGapArs != null && competitor.priceArs != null && competitor.priceArs !== 0
        ? (priceGapArs / competitor.priceArs) * 100
        : null;

    matches.push({
      siteId,
      siteName: site.name,
      domain: site.domain,
      matchType: "canonical_title_family",
      matchScore: 0.92,
      ourProductId: own.id,
      ourTitle: own.title,
      ourUrl: own.url,
      ourRawCategories: own.rawCategories,
      ourNormalizedCategory: own.normalizedCategory,
      ourPriceArs: own.priceArs,
      competitorProductId: competitor.id,
      competitorTitle: competitor.title,
      competitorUrl: competitor.url,
      competitorRawCategories: competitor.rawCategories,
      competitorNormalizedCategory: competitor.normalizedCategory,
      competitorPriceArs: competitor.priceArs,
      competitorPriceStatus: competitor.priceStatus,
      competitorPriceBasis: competitor.priceBasis,
      priceGapArs,
      priceGapPct,
    });
  }

  return matches.sort((left, right) => left.ourTitle.localeCompare(right.ourTitle, "es"));
}

function buildManualOverrideMatches(
  products: AnalyticsProduct[],
  existingMatches: AnalyticsMatch[],
) {
  const matchedOwnIds = new Set(existingMatches.map((match) => match.ourProductId));
  const matchedCompetitorIds = new Set(existingMatches.map((match) => match.competitorProductId));

  const productsById = new Map(products.map((product) => [product.id, product]));
  const matches: AnalyticsMatch[] = [];

  for (const override of MANUAL_MATCH_OVERRIDES) {
    const own = productsById.get(override.ourProductId);
    const competitor = productsById.get(override.competitorProductId);
    const site = ANALYTICS_SITES.find((item) => item.id === override.siteId);

    if (!site) {
      throw new Error(`Unknown site for manual override: ${override.siteId}`);
    }

    if (!own || !competitor) {
      console.warn(
        `Skipping manual override because product id is missing: ${override.ourProductId} <> ${override.competitorProductId}`,
      );
      continue;
    }

    if (own.siteId !== "diezypunto" || competitor.siteId !== override.siteId) {
      console.warn(
        `Skipping manual override because site ids do not align: ${override.ourProductId} <> ${override.competitorProductId}`,
      );
      continue;
    }

    if (matchedOwnIds.has(own.id) || matchedCompetitorIds.has(competitor.id)) {
      continue;
    }

    const priceGapArs =
      own.priceArs != null && competitor.priceArs != null
        ? own.priceArs - competitor.priceArs
        : null;
    const priceGapPct =
      priceGapArs != null && competitor.priceArs != null && competitor.priceArs !== 0
        ? (priceGapArs / competitor.priceArs) * 100
        : null;

    matches.push({
      siteId: override.siteId,
      siteName: site.name,
      domain: site.domain,
      matchType: "manual_override",
      matchScore: override.score ?? 0.98,
      matchNote: override.note,
      ourProductId: own.id,
      ourTitle: own.title,
      ourUrl: own.url,
      ourRawCategories: own.rawCategories,
      ourNormalizedCategory: own.normalizedCategory,
      ourPriceArs: own.priceArs,
      competitorProductId: competitor.id,
      competitorTitle: competitor.title,
      competitorUrl: competitor.url,
      competitorRawCategories: competitor.rawCategories,
      competitorNormalizedCategory: competitor.normalizedCategory,
      competitorPriceArs: competitor.priceArs,
      competitorPriceStatus: competitor.priceStatus,
      competitorPriceBasis: competitor.priceBasis,
      priceGapArs,
      priceGapPct,
    });

    matchedOwnIds.add(own.id);
    matchedCompetitorIds.add(competitor.id);
  }

  return matches.sort((left, right) => left.ourTitle.localeCompare(right.ourTitle, "es"));
}

async function enrichKapoiPlaceholderMatches(
  matches: AnalyticsMatch[],
  products: AnalyticsProduct[],
) {
  const kapoiMatches = matches.filter((match) => match.siteId === "kapoi");
  if (kapoiMatches.length === 0) {
    return;
  }

  const priceByUrl = new Map<
    string,
    {
      priceArs: number | null;
      priceStatus: PriceStatus;
      priceBasis: PriceBasis;
    }
  >();

  const uniqueUrls = [...new Set(kapoiMatches.map((match) => match.competitorUrl))];

  console.log(`Kapoi: validando placeholders en ${uniqueUrls.length} matches exactos...`);

  const parsedPrices = await mapWithConcurrency(
    uniqueUrls,
    async (url, index) => {
      const html = await fetchText(url);
      const rawPrice =
        html.match(/"price":"([0-9.]+)"/)?.[1] ??
        html.match(/"priceSpecification":\[\{"@type":"UnitPriceSpecification","price":"([0-9.]+)"/)?.[1] ??
        null;
      const priceArs = parsePrice(rawPrice);

      const priceStatus: PriceStatus =
        priceArs === 1 ? "placeholder" : priceArs != null ? "priced" : "hidden";
      const priceBasis: PriceBasis =
        priceArs === 1 ? "placeholder" : priceArs != null ? "unknown" : "hidden";

      if ((index + 1) % 25 === 0 || index === uniqueUrls.length - 1) {
        console.log(`Kapoi: placeholder ${index + 1}/${uniqueUrls.length}`);
      }

      return { url, priceArs, priceStatus, priceBasis };
    },
    6,
  );

  for (const item of parsedPrices) {
    priceByUrl.set(item.url, {
      priceArs: item.priceArs,
      priceStatus: item.priceStatus,
      priceBasis: item.priceBasis,
    });
  }

  for (const match of matches) {
    if (match.siteId !== "kapoi") {
      continue;
    }

    const parsed = priceByUrl.get(match.competitorUrl);
    if (!parsed) {
      continue;
    }

    match.competitorPriceArs = parsed.priceStatus === "placeholder" ? null : parsed.priceArs;
    match.competitorPriceStatus = parsed.priceStatus;
    match.competitorPriceBasis = parsed.priceBasis;
  }

  for (const product of products) {
    if (product.siteId !== "kapoi") {
      continue;
    }

    const parsed = priceByUrl.get(product.url);
    if (!parsed) {
      continue;
    }

    product.priceArs = parsed.priceStatus === "placeholder" ? null : parsed.priceArs;
    product.priceStatus = parsed.priceStatus;
    product.priceBasis = parsed.priceBasis;
    product.priceLabel = parsed.priceStatus === "placeholder" ? "Placeholder ARS 1.00" : null;
    product.notes =
      parsed.priceStatus === "placeholder"
        ? "Kapoi publica placeholder técnico ARS 1.00 en schema y opera en modo presupuesto."
        : product.notes;
  }
}

async function main() {
  const diezypuntoProducts = await collectDiezypuntoProducts();
  const merchProducts = await collectMerchProducts();
  const velskiProducts = await collectVelskiProducts();
  const kapoiProducts = await collectKapoiProducts();

  const products = sortProducts([
    ...diezypuntoProducts,
    ...merchProducts,
    ...velskiProducts,
    ...kapoiProducts,
  ]);

  const matches = [
    ...buildExactMatches(products, "merch"),
    ...buildExactMatches(products, "grupovelski"),
    ...buildExactMatches(products, "kapoi"),
  ];

  matches.push(...buildManualOverrideMatches(products, matches));
  matches.push(
    ...buildCanonicalFamilyMatches(products, "merch", matches),
    ...buildCanonicalFamilyMatches(products, "grupovelski", matches),
    ...buildCanonicalFamilyMatches(products, "kapoi", matches),
  );

  await enrichKapoiPlaceholderMatches(matches, products);

  const snapshotDate = new Date().toISOString().slice(0, 10);
  const normalizedCategories = [...new Set(products.map((product) => product.normalizedCategory))].sort(
    (left, right) => left.localeCompare(right, "es"),
  );

  const snapshot: CompetitorAnalyticsSnapshot = {
    generatedAt: new Date().toISOString(),
    snapshotDate,
    notes: [
      "Diez y Punto se toma desde el catálogo local del repo.",
      "Merch publica precio usable y se incluye en KPIs de precio.",
      "Grupo Velski expone catálogo público, pero no muestra precio público consistente; sus productos quedan fuera de KPIs de precio.",
      "Kapoi opera en modo presupuesto y en productos muestreados usa placeholder técnico ARS 1.00; queda fuera de KPIs agregados de precio.",
      "El matching usa tres niveles: exacto por título normalizado, manual por override curado y canónico por misma familia/categoría para variantes menores.",
      "La categoría normalizada agrupa taxonomías distintas en un esquema común para comparar volumen y nivel de precio por rubro.",
    ],
    sites: ANALYTICS_SITES,
    normalizedCategories,
    products,
    matches,
  };

  const datedFile = path.join(SNAPSHOT_DIR, `competitor-benchmark-${snapshotDate}.json`);
  const latestFile = path.join(OUTPUT_DIR, "latest.json");

  await fs.mkdir(SNAPSHOT_DIR, { recursive: true });
  await fs.writeFile(datedFile, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await fs.writeFile(latestFile, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        generatedAt: snapshot.generatedAt,
        snapshotDate,
        productCounts: ANALYTICS_SITES.map((site) => ({
          site: site.name,
          products: products.filter((product) => product.siteId === site.id).length,
          priced: products.filter(
            (product) => product.siteId === site.id && product.priceStatus === "priced",
          ).length,
        })),
        matchCounts: ANALYTICS_SITES.filter((site) => site.id !== "diezypunto").map((site) => ({
          site: site.name,
          exactMatches: matches.filter((match) => match.siteId === site.id).length,
          exactTitleMatches: matches.filter(
            (match) =>
              match.siteId === site.id && match.matchType === "exact_normalized_title",
          ).length,
          manualMatches: matches.filter(
            (match) => match.siteId === site.id && match.matchType === "manual_override",
          ).length,
          canonicalMatches: matches.filter(
            (match) => match.siteId === site.id && match.matchType === "canonical_title_family",
          ).length,
        })),
        output: {
          latestFile,
          datedFile,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
