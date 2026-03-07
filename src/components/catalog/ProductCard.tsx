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
  const [qty, setQty] = useState(product.min_qty > 1 ? product.min_qty : 1);

  const imageUrl = product.image_urls[0];
  const hasPersonalization = product.personalization_methods.length > 0;

  function handleAdd() {
    addItem(product, qty);
    toast(`${qty}u agregadas al carrito`, {
      label: "Ver carrito →",
      href: "/carrito",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-white transition-all hover:shadow-lg sm:rounded-2xl">
      {/* Image */}
      <Link
        href={`/producto/${product.product_id}`}
        className="relative aspect-square overflow-hidden bg-surface"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105 sm:p-4"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted/30">
            <ShoppingBag className="h-8 w-8 sm:h-12 sm:w-12" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
          {product.eco_friendly && (
            <span className="flex items-center gap-1 rounded-full bg-eco/10 px-1.5 py-0.5 text-[10px] font-medium text-eco sm:px-2 sm:text-xs">
              <Leaf className="h-3 w-3" /> Eco
            </span>
          )}
          {product.premium_tier && (
            <span className="rounded-full bg-accent-light px-1.5 py-0.5 text-[10px] font-medium text-accent sm:px-2 sm:text-xs">
              Premium
            </span>
          )}
        </div>

        {showScore && product.score > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-[#59C6F2] px-2 py-0.5 text-[10px] font-medium text-white sm:right-3 sm:top-3 sm:px-2.5 sm:text-xs">
            {Math.round(product.score * 100)}%
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link href={`/producto/${product.product_id}`}>
          <p className="text-[10px] text-muted sm:text-xs">{product.category}</p>
          <h3 className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-foreground sm:text-sm">
            {product.title}
          </h3>
        </Link>

        {hasPersonalization && (
          <div className="mt-1.5 hidden flex-wrap gap-1 sm:flex">
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
          <p className="mt-2 hidden text-xs text-success sm:block">{product.reason}</p>
        )}

        <div className="mt-auto pt-2 sm:pt-3">
          {/* Price */}
          <div className="flex items-end justify-between">
            <div>
              {product.price != null ? (
                <p className="text-sm font-bold text-foreground sm:text-lg">
                  ${product.price.toLocaleString("es-AR")}
                </p>
              ) : (
                <p className="text-xs text-muted sm:text-sm">Consultar</p>
              )}
              {product.min_qty > 1 && (
                <p className="text-[10px] text-muted sm:text-xs">Min. {product.min_qty} u.</p>
              )}
            </div>
          </div>

          {/* Quantity + Add */}
          <div className="mt-2 flex items-center gap-1.5">
            <input
              type="number"
              min={product.min_qty > 1 ? product.min_qty : 1}
              value={qty}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v > 0) setQty(v);
              }}
              className="w-full min-w-0 rounded-lg border border-border bg-white px-2 py-1.5 text-center text-xs tabular-nums outline-none focus:border-accent sm:text-sm"
            />
            <button
              onClick={handleAdd}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all sm:rounded-xl sm:px-4 sm:text-sm ${
                added
                  ? "bg-success"
                  : "bg-[#59C6F2] hover:bg-[#3BB5E8] hover:shadow-[0_0_15px_rgba(89,198,242,0.3)]"
              }`}
              title="Agregar al carrito"
            >
              {added ? (
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
