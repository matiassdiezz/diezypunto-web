"use client";

import { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import { useCatalogFilters } from "@/lib/hooks/use-catalog-filters";
import ProductGrid from "@/components/catalog/ProductGrid";
import CatalogSearch from "@/components/catalog/CatalogSearch";
import CatalogSidebar from "@/components/catalog/CatalogSidebar";
import CatalogToolbar from "@/components/catalog/CatalogToolbar";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import ScrollReveal from "@/components/shared/ScrollReveal";

function CategoryContent() {
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
  } = useCatalogFilters(category);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Catalogo", href: "/catalogo" },
    { label: category },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-28">
      <Breadcrumbs items={breadcrumbs} />

      <ScrollReveal>
        <h1 className="mt-4 text-3xl font-bold">{category}</h1>
        <p className="mt-2 text-muted">
          Productos en la categoria &quot;{category}&quot;.
        </p>
      </ScrollReveal>

      <div className="mt-6">
        <CatalogSearch
          value={filters.search}
          onChange={(v) => setFilter("search", v)}
        />
      </div>

      <div className="mt-8 flex gap-10">
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

          <div className="mt-6">
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

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-28">
          <p className="py-20 text-center text-muted">Cargando productos...</p>
        </div>
      }
    >
      <CategoryContent />
    </Suspense>
  );
}
