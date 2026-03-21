"use client";

import { useEffect, useState } from "react";
import { Star } from "@phosphor-icons/react";
import type { ProductResult } from "@/lib/types";
import ProductCard from "./ProductCard";

interface TopPicksRowProps {
  category?: string;
}

export default function TopPicksRow({ category }: TopPicksRowProps) {
  const [products, setProducts] = useState<ProductResult[]>([]);

  useEffect(() => {
    const params = category ? `?category=${encodeURIComponent(category)}` : "";
    fetch(`/api/top-picks${params}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {});
  }, [category]);

  if (products.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Star className="h-4 w-4 text-accent" weight="fill" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-accent">
          Destacados{category ? ` en ${category}` : ""}
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible lg:grid-cols-4 xl:grid-cols-6">
        {products.map((product) => (
          <div key={product.product_id} className="w-40 shrink-0 sm:w-auto">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
