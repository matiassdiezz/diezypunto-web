"use client";

import type { ProductResult } from "@/lib/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: ProductResult[];
  hasMore?: boolean;
  loading?: boolean;
  onLoadMore?: () => void;
  onClearFilters?: () => void;
}

export default function ProductGrid({
  products,
  hasMore,
  loading,
  onLoadMore,
  onClearFilters,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-20 text-center text-muted">
        <p className="text-lg">No se encontraron productos</p>
        <p className="mt-1 text-sm">
          Proba con otros filtros o terminos de busqueda.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="mt-4 rounded-xl border border-border bg-white px-6 py-2 text-sm text-foreground transition-colors hover:bg-surface"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.product_id} product={product} />
        ))}
      </div>

      {hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="mt-8 w-full rounded-xl border border-border bg-white py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
        >
          {loading ? "Cargando..." : "Cargar mas productos"}
        </button>
      )}
    </div>
  );
}
