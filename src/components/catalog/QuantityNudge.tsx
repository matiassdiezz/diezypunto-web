"use client";

import type { ProductResult } from "@/lib/types";

interface QuantityNudgeProps {
  qty: number | "";
  product: ProductResult;
}

export default function QuantityNudge({ qty: rawQty, product }: QuantityNudgeProps) {
  const qty = rawQty || 0;
  const tiers = product.price_tiers;
  if (!tiers || tiers.length === 0) return null;

  // Find current tier
  const currentTier = tiers.find(
    (t) => qty >= t.min && (t.max === null || qty <= t.max)
  );

  // Find next tier (cheaper)
  const currentIndex = currentTier ? tiers.indexOf(currentTier) : -1;
  const nextTier = currentIndex >= 0 && currentIndex < tiers.length - 1
    ? tiers[currentIndex + 1]
    : null;

  // Below minimum of first tier
  if (qty < tiers[0].min) {
    return (
      <p className="mt-2 text-xs text-muted sm:text-sm">
        Pedido mínimo: {tiers[0].min} unidades — ${tiers[0].finalPrice.toLocaleString("es-AR")}/u.
      </p>
    );
  }

  // Show next tier savings
  if (nextTier && currentTier) {
    const savings = currentTier.finalPrice - nextTier.finalPrice;
    return (
      <div className="mt-2 rounded-lg bg-accent-light px-3 py-2 text-xs text-accent sm:text-sm">
        Pedí {nextTier.min}+ y pagás <span className="font-bold">${nextTier.finalPrice.toLocaleString("es-AR")}/u.</span>
        <span className="ml-1 text-accent/70">(ahorrás ${savings.toLocaleString("es-AR")} por unidad)</span>
      </div>
    );
  }

  // Already at best tier
  if (currentTier && !nextTier) {
    return (
      <div className="mt-2 rounded-lg bg-eco/10 px-3 py-2 text-xs text-eco sm:text-sm">
        Mejor precio por volumen: <span className="font-bold">${currentTier.finalPrice.toLocaleString("es-AR")}/u.</span>
      </div>
    );
  }

  return null;
}
