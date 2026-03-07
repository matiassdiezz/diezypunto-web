"use client";

import { Suspense, useState } from "react";
import { useCatalogFilters } from "@/lib/hooks/use-catalog-filters";
import ProductGrid from "@/components/catalog/ProductGrid";
import CatalogSearch from "@/components/catalog/CatalogSearch";
import CatalogSidebar from "@/components/catalog/CatalogSidebar";
import CatalogToolbar from "@/components/catalog/CatalogToolbar";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import ScrollReveal from "@/components/shared/ScrollReveal";

function CatalogContent() {
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
  } = useCatalogFilters();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Catalogo", ...(filters.category ? { href: "/catalogo" } : {}) },
    ...(filters.category ? [{ label: filters.category }] : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-28">
      <Breadcrumbs items={breadcrumbs} />

      <ScrollReveal>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Catalogo</h1>
        <p className="mt-1 text-sm text-muted sm:mt-2 sm:text-base">
          Explora todos nuestros productos de merchandising corporativo.
        </p>
      </ScrollReveal>

      <div className="mt-4 sm:mt-6">
        <CatalogSearch
          value={filters.search}
          onChange={(v) => setFilter("search", v)}
        />
      </div>

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
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-28">
          <p className="py-20 text-center text-muted">Cargando productos...</p>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
