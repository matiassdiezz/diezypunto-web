"use client";

import Link from "next/link";
import { ShoppingBag, Leaf } from "lucide-react";
import type { ProductResult } from "@/lib/types";
import { useQuoteStore } from "@/lib/stores/quote-store";

interface ProductCardProps {
  product: ProductResult;
  showScore?: boolean;
  dark?: boolean;
}

export default function ProductCard({
  product,
  showScore = false,
  dark = false,
}: ProductCardProps) {
  const addItem = useQuoteStore((s) => s.addItem);

  const imageUrl = product.image_urls[0];
  const hasPersonalization = product.personalization_methods.length > 0;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all ${
        dark
          ? "border-white/[0.08] bg-white/[0.03] backdrop-blur-sm hover:border-white/[0.15] hover:shadow-[0_0_30px_rgba(59,130,246,0.08)]"
          : "border-border bg-white hover:shadow-lg"
      }`}
    >
      {/* Image */}
      <Link
        href={`/producto/${product.product_id}`}
        className={`relative aspect-square overflow-hidden ${
          dark ? "bg-zinc-900/50" : "bg-surface"
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full items-center justify-center ${
              dark ? "text-zinc-700" : "text-muted/30"
            }`}
          >
            <ShoppingBag className="h-12 w-12" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.eco_friendly && (
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                dark
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-eco/10 text-eco"
              }`}
            >
              <Leaf className="h-3 w-3" /> Eco
            </span>
          )}
          {product.premium_tier && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                dark
                  ? "bg-blue-500/10 text-blue-400"
                  : "bg-accent/10 text-accent"
              }`}
            >
              Premium
            </span>
          )}
        </div>

        {showScore && product.score > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-2.5 py-0.5 text-xs font-medium text-white">
            {Math.round(product.score * 100)}%
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/producto/${product.product_id}`}>
          <p className={`text-xs ${dark ? "text-zinc-500" : "text-muted"}`}>
            {product.category}
          </p>
          <h3
            className={`mt-0.5 line-clamp-2 text-sm font-semibold leading-snug ${
              dark ? "text-zinc-200" : "text-foreground"
            }`}
          >
            {product.title}
          </h3>
        </Link>

        {hasPersonalization && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.personalization_methods.slice(0, 3).map((m) => (
              <span
                key={m}
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  dark
                    ? "bg-white/[0.05] text-zinc-500"
                    : "bg-surface text-muted"
                }`}
              >
                {m}
              </span>
            ))}
          </div>
        )}

        {showScore && product.reason && (
          <p
            className={`mt-2 text-xs ${
              dark ? "text-emerald-400/80" : "text-success"
            }`}
          >
            {product.reason}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            {product.price != null ? (
              <p
                className={`text-lg font-bold ${
                  dark ? "text-white" : "text-foreground"
                }`}
              >
                ${product.price.toLocaleString("es-AR")}
              </p>
            ) : (
              <p
                className={`text-sm ${dark ? "text-zinc-500" : "text-muted"}`}
              >
                Consultar precio
              </p>
            )}
            {product.min_qty > 1 && (
              <p
                className={`text-xs ${dark ? "text-zinc-600" : "text-muted"}`}
              >
                Min. {product.min_qty} u.
              </p>
            )}
          </div>

          <button
            onClick={() => addItem(product)}
            className={`rounded-xl p-2 text-white transition-all ${
              dark
                ? "bg-white/[0.08] hover:bg-white/[0.15] hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                : "bg-accent hover:bg-accent-hover"
            }`}
            title="Agregar al presupuesto"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
