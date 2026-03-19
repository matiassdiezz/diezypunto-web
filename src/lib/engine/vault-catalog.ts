/**
 * Vault-api catalog client.
 * Calls vault-api /catalog endpoints. For future use when vault-api
 * has enriched product data.
 */

const VAULT_API_URL = process.env.VAULT_API_URL || "http://localhost:8001";

export interface VaultProduct {
  product_id: string;
  title: string;
  category: string;
  price: number | null;
  image_urls: string[];
}

export async function searchVaultCatalog(
  query: string,
  options?: { category?: string; limit?: number; offset?: number },
): Promise<{ products: VaultProduct[]; total: number }> {
  const params = new URLSearchParams();
  if (query) params.set("search", query);
  if (options?.category) params.set("category", options.category);
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.offset) params.set("offset", String(options.offset));

  const res = await fetch(
    `${VAULT_API_URL}/api/v1/catalog/products?${params}`,
  );
  if (!res.ok) throw new Error("Vault catalog unavailable");
  return res.json();
}

export async function getVaultCategories(): Promise<
  { name: string; count: number }[]
> {
  const res = await fetch(`${VAULT_API_URL}/api/v1/catalog/categories`);
  if (!res.ok) throw new Error("Vault catalog unavailable");
  const data = await res.json();
  return data.categories || [];
}
