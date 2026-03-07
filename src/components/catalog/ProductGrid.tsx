"use client";

import type { ProductResult } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function ProductGrid({
  products,
}: {
  products: ProductResult[];
}) {
  if (products.length === 0) {
    return (
      <div className="py-20 text-center text-muted">
        <p className="text-lg">No se encontraron productos</p>
        <p className="mt-1 text-sm">Proba con otros filtros o terminos de busqueda.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.product_id} product={product} />
      ))}
    </div>
  );
}
