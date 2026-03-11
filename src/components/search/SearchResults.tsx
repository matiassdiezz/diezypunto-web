"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ProductResult } from "@/lib/types";
import ProductCard from "../catalog/ProductCard";

function getDominantCategory(products: ProductResult[]): string | null {
  if (products.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const p of products) {
    counts[p.category] = (counts[p.category] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topCategory, topCount] = sorted[0];
  return topCount >= products.length * 0.5 ? topCategory : null;
}

export default function SearchResults({
  products,
}: {
  products: ProductResult[];
}) {
  const dominantCategory = getDominantCategory(products);

  return (
    <div className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product, i) => (
          <motion.div
            key={product.product_id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
          >
            <ProductCard product={product} showScore />
          </motion.div>
        ))}
      </div>

      {dominantCategory && (
        <div className="mt-6 text-center">
          <Link
            href={`/catalogo/${encodeURIComponent(dominantCategory)}`}
            className="inline-flex items-center gap-1 text-sm text-accent transition-colors hover:underline"
          >
            Ver todos los productos de {dominantCategory}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
