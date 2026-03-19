"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import type { ProductResult } from "@/lib/types";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useDrawerStore } from "@/components/shared/AddToCartDrawer";
import ScrollReveal from "@/components/shared/ScrollReveal";

interface KitSuggestionProps {
  products: ProductResult[];
  currentProductId: string;
}

export default function KitSuggestion({ products, currentProductId }: KitSuggestionProps) {
  const suggestions = products.filter((p) => p.product_id !== currentProductId).slice(0, 3);
  const addItem = useQuoteStore((s) => s.addItem);
  const openDrawer = useDrawerStore((s) => s.open);
  const [allAdded, setAllAdded] = useState(false);

  if (suggestions.length === 0) return null;

  function handleAddAll() {
    suggestions.forEach((p) => addItem(p, 10));
    openDrawer(suggestions[suggestions.length - 1], 10);
    setAllAdded(true);
    setTimeout(() => setAllAdded(false), 1500);
  }

  return (
    <ScrollReveal>
      <section className="mt-8 sm:mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold sm:text-xl">Arma tu kit</h2>
          <button
            onClick={handleAddAll}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-white transition-all sm:text-sm ${
              allAdded
                ? "bg-success"
                : "bg-accent hover:bg-accent-hover"
            }`}
          >
            {allAdded ? (
              <>
                <Check className="h-4 w-4" /> Agregados
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> Agregar los {suggestions.length} al carrito
              </>
            )}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {suggestions.map((p) => (
            <KitCard key={p.product_id} product={p} />
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}

function KitCard({ product }: { product: ProductResult }) {
  const addItem = useQuoteStore((s) => s.addItem);
  const openDrawer = useDrawerStore((s) => s.open);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product, 1);
    openDrawer(product, 10);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 transition-all hover:shadow-md">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">
        {product.image_urls[0] ? (
          <img
            src={product.image_urls[0]}
            alt={product.title}
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted/30">
            <ShoppingBag className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted">{product.category}</p>
        <p className="truncate text-sm font-medium">{product.title}</p>
        {product.price != null && (
          <p className="text-sm font-bold text-accent">
            ${product.price.toLocaleString("es-AR")}
          </p>
        )}
      </div>
      <button
        onClick={handleAdd}
        className={`shrink-0 rounded-lg p-2 text-white transition-all ${
          added ? "bg-success" : "bg-accent hover:bg-accent-hover"
        }`}
      >
        {added ? (
          <Check className="h-4 w-4" />
        ) : (
          <ShoppingBag className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
