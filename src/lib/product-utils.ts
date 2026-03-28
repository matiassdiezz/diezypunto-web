import type { ProductResult, PriceTier } from "./types";

/** Get minimum order quantity for a product (tier-aware) */
export function getMinQty(product: ProductResult): number {
  return product.price_tiers?.[0]?.min ?? product.min_qty ?? 1;
}

/** Find the active price tier for a given quantity, or first tier as fallback */
export function getActiveTier(product: ProductResult, qty: number): PriceTier | null {
  if (!product.price_tiers?.length) return null;
  return (
    product.price_tiers.find((t) => qty >= t.min && (t.max === null || qty <= t.max)) ??
    product.price_tiers[0]
  );
}

/** Get unit price for a product at a given quantity (tier-aware) */
export function getUnitPrice(product: ProductResult, qty: number): number | null {
  const tier = getActiveTier(product, qty);
  return tier?.finalPrice ?? product.price;
}

/** Get available stock for a specific color variant */
export function getColorStock(
  product: ProductResult,
  color?: string | null,
): number | undefined {
  if (!color) return undefined;
  return product.stock_by_color?.[color];
}
