"use client";

import { useState } from "react";
import Link from "next/link";
import { Tote, Check } from "@phosphor-icons/react";
import type { ProductResult } from "@/lib/types";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useDrawerStore } from "@/components/shared/AddToCartDrawer";
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
  if (cheaper) tiers.push({ product: cheaper, label: "Good" });
  tiers.push({ product: currentProduct, label: "Better" });
  if (pricier) tiers.push({ product: pricier, label: "Best" });

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
  const addItem = useQuoteStore((s) => s.addItem);
  const openDrawer = useDrawerStore((s) => s.open);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product, 1);
    openDrawer(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-3 sm:p-4 ${
        isCurrent
          ? "border-accent bg-accent-light/50"
          : "border-border bg-white"
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
      <div className="mt-2 aspect-square overflow-hidden rounded-lg bg-surface">
        {product.image_urls[0] ? (
          <img src={product.image_urls[0]} alt="" className="h-full w-full object-contain p-2" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted/30">
            <Tote className="h-6 w-6" />
          </div>
        )}
      </div>
      {isCurrent ? (
        <Link href={`/producto/${product.product_id}`}>
          <p className="mt-2 line-clamp-2 text-xs font-medium sm:text-sm">{product.title}</p>
        </Link>
      ) : (
        <Link href={`/producto/${product.product_id}`} className="group">
          <p className="mt-2 line-clamp-2 text-xs font-medium group-hover:text-accent sm:text-sm">
            {product.title}
          </p>
        </Link>
      )}
      {product.materials.length > 0 && (
        <p className="mt-1 text-[10px] text-muted">{product.materials.slice(0, 2).join(", ")}</p>
      )}
      {product.price != null && (
        <p className="mt-auto pt-2 text-sm font-bold sm:text-base">
          ${product.price.toLocaleString("es-AR")}
        </p>
      )}
      {!isCurrent && (
        <button
          onClick={handleAdd}
          className={`mt-2 rounded-lg py-1.5 text-xs font-medium text-white transition-all ${
            added ? "bg-success" : "bg-accent hover:bg-accent-hover"
          }`}
        >
          {added ? <Check className="mx-auto h-3.5 w-3.5" /> : "Agregar"}
        </button>
      )}
    </div>
  );
}
