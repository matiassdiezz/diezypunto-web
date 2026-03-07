"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Leaf, Star } from "lucide-react";
import type { ProductResult } from "@/lib/types";
import { listProducts } from "@/lib/api";

interface AlternativeBadgeProps {
  product: ProductResult;
}

export default function AlternativeBadge({ product }: AlternativeBadgeProps) {
  const [ecoAlt, setEcoAlt] = useState<ProductResult | null>(null);
  const [premiumAlt, setPremiumAlt] = useState<ProductResult | null>(null);

  useEffect(() => {
    // Only look for alternatives if the product DOESN'T have the attribute
    if (!product.eco_friendly) {
      listProducts({ category: product.category, eco_friendly: true, limit: 1 })
        .then((r) => {
          const alt = r.products.find((p) => p.product_id !== product.product_id);
          if (alt) setEcoAlt(alt);
        })
        .catch(() => {});
    }
    // Premium alternative not available via API filter, skip for now
  }, [product]);

  if (!ecoAlt && !premiumAlt) return null;

  return (
    <div className="mt-3 space-y-2">
      {ecoAlt && (
        <Link
          href={`/producto/${ecoAlt.product_id}`}
          className="flex items-center gap-2 rounded-lg border border-eco/30 bg-eco/5 px-3 py-2 text-sm text-eco transition-colors hover:bg-eco/10"
        >
          <Leaf className="h-4 w-4 shrink-0" />
          <span>
            Disponible en version eco-friendly:{" "}
            <span className="font-medium underline">{ecoAlt.title}</span>
          </span>
        </Link>
      )}
      {premiumAlt && (
        <Link
          href={`/producto/${premiumAlt.product_id}`}
          className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 transition-colors hover:bg-amber-100"
        >
          <Star className="h-4 w-4 shrink-0" />
          <span>
            Disponible en version premium:{" "}
            <span className="font-medium underline">{premiumAlt.title}</span>
          </span>
        </Link>
      )}
    </div>
  );
}
