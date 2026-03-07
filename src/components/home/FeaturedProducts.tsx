"use client";

import { useEffect, useState } from "react";
import { listProducts } from "@/lib/api";
import type { ProductResult } from "@/lib/types";
import ProductCard from "../catalog/ProductCard";
import ScrollReveal from "../shared/ScrollReveal";

export default function FeaturedProducts() {
  const [products, setProducts] = useState<ProductResult[]>([]);

  useEffect(() => {
    listProducts({ limit: 8 })
      .then((res) => setProducts(res.products))
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="bg-card py-20">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <h2 className="text-center text-2xl font-bold">
            Productos destacados
          </h2>
          <p className="mt-2 text-center text-muted">
            Los mas pedidos por nuestros clientes
          </p>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, i) => (
            <ScrollReveal key={product.product_id} delay={i * 0.05}>
              <ProductCard product={product} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
