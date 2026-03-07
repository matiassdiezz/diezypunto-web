"use client";

import { useEffect, useState } from "react";
import { listProducts, listCategories } from "@/lib/api";
import type { ProductResult, CategoryInfo } from "@/lib/types";
import ProductGrid from "@/components/catalog/ProductGrid";
import CategoryFilter from "@/components/catalog/CategoryFilter";
import ScrollReveal from "@/components/shared/ScrollReveal";

export default function CatalogoPage() {
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listProducts(), listCategories()])
      .then(([prods, cats]) => {
        setProducts(prods.products);
        setCategories(cats.categories);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-28">
      <ScrollReveal>
        <h1 className="text-3xl font-bold">Catalogo</h1>
        <p className="mt-2 text-muted">
          Explora todos nuestros productos de merchandising corporativo.
        </p>
      </ScrollReveal>

      <div className="mt-8">
        <CategoryFilter categories={categories} />
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="py-20 text-center text-muted">Cargando productos...</p>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
}
