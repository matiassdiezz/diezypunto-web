/* API client — calls Next.js proxy routes which forward to merch-core */

import type {
  SearchResponse,
  CategoriesResponse,
  ProductListResponse,
  ProductResult,
} from "./types";

const BASE = "/api";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function searchProducts(
  query: string,
  sessionId?: string | null,
): Promise<SearchResponse> {
  return fetchJSON<SearchResponse>(`${BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, session_id: sessionId ?? null }),
  });
}

export async function refineSearch(
  sessionId: string,
  query: string,
): Promise<SearchResponse> {
  return fetchJSON<SearchResponse>(`${BASE}/search/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, query }),
  });
}

export async function listProducts(params?: {
  category?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  eco_friendly?: boolean;
  personalization?: string;
  limit?: number;
  offset?: number;
}): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) searchParams.set(k, String(v));
    });
  }
  return fetchJSON<ProductListResponse>(
    `${BASE}/products?${searchParams.toString()}`,
  );
}

export async function getProduct(productId: string): Promise<ProductResult> {
  return fetchJSON<ProductResult>(`${BASE}/products/${productId}`);
}

export async function listCategories(): Promise<CategoriesResponse> {
  return fetchJSON<CategoriesResponse>(`${BASE}/categories`);
}
