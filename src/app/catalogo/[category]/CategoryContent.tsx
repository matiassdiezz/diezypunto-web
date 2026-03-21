"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useCatalogFilters } from "@/lib/hooks/use-catalog-filters";
import { useSearchStore } from "@/lib/stores/search-store";
import ProductGrid from "@/components/catalog/ProductGrid";
import CatalogAISearch from "@/components/catalog/CatalogAISearch";
import CatalogAIResults from "@/components/catalog/CatalogAIResults";
import CatalogSidebar from "@/components/catalog/CatalogSidebar";
import CatalogToolbar from "@/components/catalog/CatalogToolbar";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import ScrollReveal from "@/components/shared/ScrollReveal";

export default function CategoryContent() {
  const params = useParams();
  const category = decodeURIComponent(params.category as string);

  const {
    products,
    total,
    hasMore,
    loading,
    filters,
    setFilter,
    clearFilters,
    loadMore,
    activeFilterCount,
    featuredIds,
  } = useCatalogFilters(category);

  const { query: aiQuery, isLoading: aiLoading, results: aiResults } = useSearchStore();
  const aiActive = !!(aiQuery || aiLoading || aiResults.length > 0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Catalogo", href: "/catalogo" },
    { label: category },
  ];

  return (
    <div className="px-4 pb-20 pt-6 sm:px-6 lg:px-16 sm:pt-8">
      <Breadcrumbs items={breadcrumbs} />

      <ScrollReveal>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{category}</h1>
        <p className="mt-1 text-sm text-muted sm:mt-2 sm:text-base">
          Productos en la categoria &quot;{category}&quot;.
        </p>
      </ScrollReveal>

      <div className="mt-4 sm:mt-6">
        <CatalogAISearch
          value={filters.search}
          onChange={(v) => setFilter("search", v)}
          categoryContext={category}
        />
      </div>

      {aiActive ? (
        <div className="mt-6">
          <CatalogAIResults />
        </div>
      ) : (
        <div className="mt-6 lg:mt-8 lg:flex lg:gap-10">
          <CatalogSidebar
            filters={filters}
            setFilter={setFilter}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <div className="min-w-0 flex-1">
            <CatalogToolbar
              total={total}
              filters={filters}
              setFilter={setFilter}
              clearFilters={clearFilters}
              activeFilterCount={activeFilterCount}
              onOpenFilters={() => setSidebarOpen(true)}
            />

            <div className="mt-4 sm:mt-6">
              {loading && products.length === 0 ? (
                <p className="py-20 text-center text-muted">
                  Cargando productos...
                </p>
              ) : (
                <ProductGrid
                  products={products}
                  hasMore={hasMore}
                  loading={loading}
                  onLoadMore={loadMore}
                  onClearFilters={clearFilters}
                  featuredIds={featuredIds}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
