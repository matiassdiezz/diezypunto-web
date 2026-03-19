/**
 * Catalog facade — delegates to local-catalog (default) or vault-catalog.
 *
 * The local catalog (catalog.json, 528 products) has rich data needed for
 * AI search (materials, colors, personalization_methods, eco_friendly).
 * The vault-api catalog is a Zecat proxy without those fields.
 *
 * Use CATALOG_SOURCE=api to switch to vault-api (future use).
 */

import {
  searchLocalCatalog,
  getAllProducts,
  getLocalProduct,
} from "./local-catalog";

const CATALOG_SOURCE = process.env.CATALOG_SOURCE || "local";

export async function catalogSearch(
  query: string,
  options?: { category?: string; limit?: number; offset?: number },
) {
  if (CATALOG_SOURCE === "api") {
    const { searchVaultCatalog } = await import("./vault-catalog");
    return searchVaultCatalog(query, options);
  }
  return searchLocalCatalog(query, options);
}

export async function catalogGetAll(options?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  eco_friendly?: boolean;
  personalization?: string;
  min_price?: number;
  max_price?: number;
}) {
  // Local catalog handles all filter options natively
  return getAllProducts(options);
}

export async function catalogGetProduct(productId: string) {
  if (CATALOG_SOURCE === "api") {
    // Fallback to local — vault-api doesn't have single-product endpoint
    return getLocalProduct(productId);
  }
  return getLocalProduct(productId);
}

export { getAllProducts, getLocalProduct, searchLocalCatalog } from "./local-catalog";
