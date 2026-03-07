"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Leaf, Check } from "lucide-react";
import type { ProductResult } from "@/lib/types";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useToastStore } from "@/components/shared/Toast";

interface ProductCardProps {
  product: ProductResult;
  showScore?: boolean;
}

export default function ProductCard({
  product,
  showScore = false,
}: ProductCardProps) {
  const addItem = useQuoteStore((s) => s.addItem);
  const toast = useToastStore((s) => s.toast);
  const [added, setAdded] = useState(false);

  const imageUrl = product.image_urls[0];
  const hasPersonalization = product.personalization_methods.length > 0;

  function handleAdd() {
    addItem(product);
    toast("Agregado al presupuesto", {
      label: "Ver presupuesto →",
      href: "/presupuesto",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-all hover:shadow-lg">
      {/* Image */}
      <Link
        href={`/producto/${product.product_id}`}
        className="relative aspect-square overflow-hidden bg-surface"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted/30">
            <ShoppingBag className="h-12 w-12" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.eco_friendly && (
            <span className="flex items-center gap-1 rounded-full bg-eco/10 px-2 py-0.5 text-xs font-medium text-eco">
              <Leaf className="h-3 w-3" /> Eco
            </span>
          )}
          {product.premium_tier && (
            <span className="rounded-full bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
              Premium
            </span>
          )}
        </div>

        {showScore && product.score > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-[#59C6F2] px-2.5 py-0.5 text-xs font-medium text-white">
            {Math.round(product.score * 100)}%
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/producto/${product.product_id}`}>
          <p className="text-xs text-muted">{product.category}</p>
          <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {product.title}
          </h3>
        </Link>

        {hasPersonalization && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.personalization_methods.slice(0, 3).map((m) => (
              <span
                key={m}
                className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted"
              >
                {m}
              </span>
            ))}
          </div>
        )}

        {showScore && product.reason && (
          <p className="mt-2 text-xs text-success">{product.reason}</p>
        )}

        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            {product.price != null ? (
              <p className="text-lg font-bold text-foreground">
                ${product.price.toLocaleString("es-AR")}
              </p>
            ) : (
              <p className="text-sm text-muted">Consultar precio</p>
            )}
            {product.min_qty > 1 && (
              <p className="text-xs text-muted">Min. {product.min_qty} u.</p>
            )}
          </div>

          <button
            onClick={handleAdd}
            className={`rounded-xl p-2 text-white transition-all ${
              added
                ? "bg-success"
                : "bg-[#59C6F2] hover:bg-[#3BB5E8] hover:shadow-[0_0_15px_rgba(89,198,242,0.3)]"
            }`}
            title="Agregar al presupuesto"
          >
            {added ? (
              <Check className="h-4 w-4" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
