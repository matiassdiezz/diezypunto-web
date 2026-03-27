"use client";

import { motion } from "framer-motion";
import Image from "next/image";
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center rounded-3xl border border-white/55 bg-white/55 px-6 py-16 text-center text-muted shadow-[0_10px_32px_rgba(15,23,42,0.08)] backdrop-blur-md sm:py-20"
      >
        <Image
          src="/illustrations/empty-search.svg"
          alt=""
          width={240}
          height={180}
          className="pointer-events-none select-none"
          priority
        />
        <p className="mt-6 text-lg font-medium text-foreground">No se encontraron productos</p>
        <p className="mt-1.5 max-w-xs text-sm">
          Proba con otros filtros o terminos de busqueda.
        </p>
        <div className="mt-5 flex gap-2">
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="rounded-xl border border-white/65 bg-white/75 px-6 py-2.5 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:bg-white hover:-translate-y-0.5 hover:shadow-md"
            >
              Limpiar filtros
            </button>
          )}
          <Link
            href="/catalogo"
            className="rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-md"
          >
            Ver todo el catalogo
          </Link>
        </div>
      </motion.div>
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
