import type { ProductResult } from "./types";

export const SITE_NAME = "diezypunto";

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}

export function productMetaDescription(product: ProductResult): string {
  const parts: string[] = [product.title];
  if (product.materials.length > 0) {
    parts.push(`en ${product.materials.slice(0, 3).join(", ")}`);
  }
  if (product.personalization_methods.length > 0) {
    parts.push(
      `con ${product.personalization_methods.slice(0, 2).join(" y ")}`
    );
  }
  parts.push("para merchandising corporativo");
  if (product.eco_friendly) {
    parts.push("| Eco-friendly");
  }
  return `${parts.join(" ")}. Pedilo online en ${SITE_NAME}.`;
}

export function categoryMetaDescription(
  category: string,
  count?: number
): string {
  const base = `Productos de ${category} para merchandising corporativo`;
  if (count != null && count > 0) {
    return `${base}. ${count} opciones personalizables. Pedí online en ${SITE_NAME}.`;
  }
  return `${base} personalizables. Pedí online en ${SITE_NAME}.`;
}
