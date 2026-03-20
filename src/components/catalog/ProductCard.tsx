"use client";

import { useState } from "react";
import Link from "next/link";
import { Tote, Leaf, Check, Minus, Plus } from "@phosphor-icons/react";
import type { ProductResult } from "@/lib/types";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useDrawerStore } from "@/components/shared/AddToCartDrawer";
import SocialProofBadge from "@/components/catalog/SocialProofBadge";

interface ProductCardProps {
  product: ProductResult;
  showScore?: boolean;
}

export default function ProductCard({
  product,
  showScore = false,
}: ProductCardProps) {
  const addItem = useQuoteStore((s) => s.addItem);
  const openDrawer = useDrawerStore((s) => s.open);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  const imageUrl = product.image_urls[0];

  function handleAdd() {
    addItem(product, qty);
    openDrawer(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white/70 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Image */}
      <Link
        href={`/producto/${product.product_id}`}
        className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-accent-light"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105 sm:p-5"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-accent/20">
            <Tote className="h-8 w-8 sm:h-12 sm:w-12" />
          </div>
        )}

        {/* Badges — frosted glass */}
        <div className="absolute left-2 top-2 flex flex-col gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
          {product.eco_friendly && (
            <span className="flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-eco shadow-sm backdrop-blur-sm sm:text-xs">
              <Leaf className="h-3 w-3" /> Eco
            </span>
          )}
          {product.premium_tier && (
            <span className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-accent shadow-sm backdrop-blur-sm sm:text-xs">
              Premium
            </span>
          )}
          <SocialProofBadge product={product} />
        </div>

        {showScore && product.score > 0 && (
          <span className="absolute right-2 top-2 rounded-lg bg-accent px-2 py-0.5 text-[10px] font-bold text-white shadow-sm sm:right-3 sm:top-3 sm:px-2.5 sm:text-xs">
            {Math.round(product.score * 100)}%
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link href={`/producto/${product.product_id}`}>
          <p className="text-[10px] uppercase tracking-wide font-medium text-muted/70 sm:text-xs">
            {product.category}
          </p>
          <h3 className="mt-1 line-clamp-2 text-xs font-bold leading-snug text-foreground sm:text-sm">
            {product.title}
          </h3>
        </Link>

        <div className="mt-auto pt-2 sm:pt-3">
          {/* Price */}
          <div>
            {product.price != null ? (
              <p className="text-sm font-bold text-foreground sm:text-base">
                {product.price_tiers && product.price_tiers.length > 1 && (
                  <span className="text-[10px] font-normal text-muted sm:text-xs">Desde </span>
                )}
                ${(product.price_tiers
                  ? product.price_tiers[product.price_tiers.length - 1].finalPrice
                  : product.price
                ).toLocaleString("es-AR")}
                <span className="ml-0.5 text-[10px] font-normal text-muted sm:text-xs">+ IVA</span>
              </p>
            ) : (
              <p className="text-xs text-muted sm:text-sm">Consultar</p>
            )}
          </div>

          {/* Stepper + Add */}
          <div className="mt-2 flex items-center gap-1.5">
            <div
              className="flex items-center rounded-xl border border-border"
              role="group"
              aria-label="Cantidad"
            >
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="rounded-l-xl px-2 py-1.5 text-muted hover:bg-surface sm:px-2.5 sm:py-2"
                aria-label="Disminuir cantidad"
              >
                <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
              <span className="w-8 border-x border-border py-1.5 text-center text-xs font-medium tabular-nums sm:w-10 sm:py-2 sm:text-sm">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="rounded-r-xl px-2 py-1.5 text-muted hover:bg-surface sm:px-2.5 sm:py-2"
                aria-label="Aumentar cantidad"
              >
                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-medium text-white transition-all sm:py-2 sm:text-sm ${
                added
                  ? "bg-success"
                  : "bg-[#59C6F2] hover:bg-[#3BB5E8] hover:shadow-[0_0_15px_rgba(89,198,242,0.3)]"
              }`}
              title="Agregar al carrito"
            >
              {added ? (
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Tote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
