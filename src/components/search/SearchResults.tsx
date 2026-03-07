"use client";

import { motion } from "framer-motion";
import type { ProductResult } from "@/lib/types";
import ProductCard from "../catalog/ProductCard";

export default function SearchResults({
  products,
}: {
  products: ProductResult[];
}) {
  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
  );
}
