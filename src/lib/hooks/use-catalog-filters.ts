"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { listProducts } from "@/lib/api";
import type { ProductResult } from "@/lib/types";

const LIMIT = 24;

export type SortOption =
  | "relevancia"
  | "price_asc"
  | "price_desc"
  | "name_asc";

export interface CatalogFilters {
  category?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  eco_friendly?: boolean;
  personalization?: string;
  sort?: SortOption;
  page?: number;
}

function parseFilters(params: URLSearchParams): CatalogFilters {
  return {
    category: params.get("category") ?? undefined,
    search: params.get("search") ?? undefined,
    min_price: params.has("min_price")
      ? Number(params.get("min_price"))
      : undefined,
    max_price: params.has("max_price")
      ? Number(params.get("max_price"))
      : undefined,
    eco_friendly: params.get("eco_friendly") === "true" || undefined,
    personalization: params.get("personalization") ?? undefined,
    sort: (params.get("sort") as SortOption) ?? undefined,
    page: params.has("page") ? Number(params.get("page")) : undefined,
  };
}

export function useCatalogFilters(initialCategory?: string) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = parseFilters(searchParams);
  // If on /catalogo/[category] route, use that as the category
  const effectiveCategory = initialCategory ?? filters.category;

  const [products, setProducts] = useState<ProductResult[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const fetchId = useRef(0);

  const page = filters.page ?? 1;

  useEffect(() => {
    const id = ++fetchId.current;
    setLoading(true);

    const apiParams: Record<string, unknown> = {
      limit: LIMIT,
      offset: (page - 1) * LIMIT,
    };
    if (effectiveCategory) apiParams.category = effectiveCategory;
    if (filters.search) apiParams.search = filters.search;
    if (filters.min_price != null) apiParams.min_price = filters.min_price;
    if (filters.max_price != null) apiParams.max_price = filters.max_price;
    if (filters.eco_friendly) apiParams.eco_friendly = true;
    if (filters.personalization) apiParams.personalization = filters.personalization;
    if (filters.sort && filters.sort !== "relevancia") apiParams.sort = filters.sort;

    listProducts(apiParams as Parameters<typeof listProducts>[0])
      .then((res) => {
        if (id !== fetchId.current) return;
        setProducts(res.products);
        setTotal(res.total);
        setHasMore(res.has_more);
      })
      .catch(console.error)
      .finally(() => {
        if (id === fetchId.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), effectiveCategory]);

  const setFilter = useCallback(
    (key: string, value: string | boolean | number | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === undefined || value === "" || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
      // Reset page when changing filters
      if (key !== "page") params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    const id = ++fetchId.current;

    const apiParams: Record<string, unknown> = {
      limit: LIMIT,
      offset: (nextPage - 1) * LIMIT,
    };
    if (effectiveCategory) apiParams.category = effectiveCategory;
    if (filters.search) apiParams.search = filters.search;
    if (filters.min_price != null) apiParams.min_price = filters.min_price;
    if (filters.max_price != null) apiParams.max_price = filters.max_price;
    if (filters.eco_friendly) apiParams.eco_friendly = true;
    if (filters.personalization) apiParams.personalization = filters.personalization;
    if (filters.sort && filters.sort !== "relevancia") apiParams.sort = filters.sort;

    setLoading(true);
    listProducts(apiParams as Parameters<typeof listProducts>[0])
      .then((res) => {
        if (id !== fetchId.current) return;
        setProducts((prev) => [...prev, ...res.products]);
        setTotal(res.total);
        setHasMore(res.has_more);
        // Update page in URL without scroll
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(nextPage));
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      })
      .catch(console.error)
      .finally(() => {
        if (id === fetchId.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), effectiveCategory, page]);

  const activeFilterCount = [
    effectiveCategory,
    filters.search,
    filters.min_price,
    filters.max_price,
    filters.eco_friendly,
    filters.personalization,
  ].filter(Boolean).length;

  return {
    products,
    total,
    hasMore,
    loading,
    filters: { ...filters, category: effectiveCategory },
    setFilter,
    clearFilters,
    loadMore,
    activeFilterCount,
  };
}
