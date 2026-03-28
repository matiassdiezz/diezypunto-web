"use client";

import Link from "next/link";
import { Tote, ArrowRight } from "@phosphor-icons/react";
import type { ProductResult } from "@/lib/types";
import ScrollReveal from "@/components/shared/ScrollReveal";

interface TierComparisonProps {
  products: ProductResult[];
  currentProduct: ProductResult;
}

export default function TierComparison({ products, currentProduct }: TierComparisonProps) {
  // Get products from same category at different price points
  const sameCat = products
    .filter(
      (p) =>
        p.category === currentProduct.category &&
        p.product_id !== currentProduct.product_id &&
        p.price != null,
    )
    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0));

  if (sameCat.length < 2 || currentProduct.price == null) return null;

  // Pick one cheaper and one more expensive if possible
  const cheaper = sameCat.find((p) => (p.price ?? 0) < (currentProduct.price ?? 0));
  const pricier = sameCat.find((p) => (p.price ?? 0) > (currentProduct.price ?? 0));

  const tiers: { product: ProductResult; label: string }[] = [];
  if (cheaper) tiers.push({ product: cheaper, label: "Económico" });
  tiers.push({ product: currentProduct, label: "Elegido" });
  if (pricier) tiers.push({ product: pricier, label: "Superior" });

  if (tiers.length < 3) return null;

  return (
    <ScrollReveal>
      <section className="mt-8 sm:mt-12">
        <h2 className="text-lg font-bold sm:text-xl">Compara opciones</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          {tiers.map(({ product, label }) => (
            <TierCard
              key={product.product_id}
              product={product}
              label={label}
              isCurrent={product.product_id === currentProduct.product_id}
            />
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}

function TierCard({
  product,
  label,
  isCurrent,
}: {
  product: ProductResult;
  label: string;
  isCurrent: boolean;
}) {
  const content = (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md transition-all sm:p-4 ${
        isCurrent
          ? "border-accent/40 bg-accent-light/30"
          : "border-white/55 bg-white/60 hover:border-accent/30 hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
      }`}
    >
      {isCurrent && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-medium text-white">
          Estás viendo
        </span>
      )}
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <div className="mt-2 aspect-square overflow-hidden rounded-xl border border-white/50 bg-white/70 backdrop-blur-sm">
        {product.image_urls[0] ? (
          <img src={product.image_urls[0]} alt="" className="h-full w-full object-contain p-2" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted/30">
            <Tote className="h-6 w-6" />
          </div>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-medium sm:text-sm">
        {product.title}
      </p>
      {product.materials.length > 0 && (
        <p className="mt-1 text-[10px] text-muted">{product.materials.slice(0, 2).join(", ")}</p>
      )}
      {product.price != null && (
        <p className="mt-auto pt-2 text-sm font-bold sm:text-base">
          ${product.price.toLocaleString("es-AR")}
        </p>
      )}
      {!isCurrent && (
        <span className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-accent py-1.5 text-xs font-medium text-white transition-all hover:bg-accent-hover">
          Elegir <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );

  if (isCurrent) return <div className="block">{content}</div>;

  return (
    <Link href={`/producto/${product.product_id}`} className="block">
      {content}
    </Link>
  );
}
