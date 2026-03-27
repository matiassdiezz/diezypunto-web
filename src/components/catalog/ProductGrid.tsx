"use client";

import { motion } from "framer-motion";
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
      <div className="flex flex-col items-center rounded-3xl border border-white/55 bg-white/55 py-20 text-center text-muted shadow-[0_10px_32px_rgba(15,23,42,0.08)] backdrop-blur-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/60 bg-white/70">
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
              className="rounded-xl border border-white/65 bg-white/75 px-6 py-2 text-sm text-foreground backdrop-blur-sm transition-colors hover:bg-white"
            >
              Limpiar filtros
            </button>
          )}
          <Link
            href="/catalogo"
            className="rounded-xl border border-white/65 bg-white/75 px-6 py-2 text-sm text-foreground backdrop-blur-sm transition-colors hover:bg-white"
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
        {products.map((product, i) => (
          <motion.div
            key={product.product_id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.4,
              delay: (i % 6) * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="h-full"
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>

      {hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="mt-8 w-full rounded-2xl border border-white/65 bg-white/65 py-3 text-sm font-medium text-foreground shadow-[0_8px_24px_rgba(15,23,42,0.07)] backdrop-blur-sm transition-colors hover:bg-white/80 disabled:opacity-50"
        >
          {loading ? "Cargando..." : "Cargar mas productos"}
        </button>
      )}
    </div>
  );
}
