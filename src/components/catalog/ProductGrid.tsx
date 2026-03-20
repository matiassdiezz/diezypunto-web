"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";
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
      <div className="flex flex-col items-center py-20 text-center text-muted">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
          <MagnifyingGlass className="h-7 w-7 text-muted/50" />
        </div>
        <p className="mt-4 text-lg font-medium text-foreground">No se encontraron productos</p>
        <p className="mt-1 text-sm">
          Proba con otros filtros o terminos de busqueda.
        </p>
        <div className="mt-4 flex gap-2">
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="rounded-xl border border-border bg-white px-6 py-2 text-sm text-foreground transition-colors hover:bg-surface"
            >
              Limpiar filtros
            </button>
          )}
          <Link
            href="/catalogo"
            className="rounded-xl border border-border bg-white px-6 py-2 text-sm text-foreground transition-colors hover:bg-surface"
          >
            Ver todo el catalogo
          </Link>
        </div>
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
