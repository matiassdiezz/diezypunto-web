"use client";

import { useState } from "react";
import { ShoppingBag, Check, Plus } from "lucide-react";
import { useAdvisorStore } from "@/lib/stores/advisor-store";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useDrawerStore } from "@/components/shared/AddToCartDrawer";

export default function AdvisorResults() {
  const { results, products, close } = useAdvisorStore();
  const addItem = useQuoteStore((s) => s.addItem);
  const openDrawer = useDrawerStore((s) => s.open);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [allAdded, setAllAdded] = useState(false);

  if (!results || products.length === 0) return null;

  // Map product IDs to reasons
  const reasonMap = new Map(
    results.selected.map((s) => [s.id, s.reason])
  );

  function handleAddOne(product: (typeof products)[0]) {
    const qty = product.min_qty > 1 ? product.min_qty : 1;
    addItem(product, qty);
    setAddedIds((prev) => new Set(prev).add(product.product_id));
  }

  function handleAddAll() {
    for (const product of products) {
      if (!addedIds.has(product.product_id)) {
        const qty = product.min_qty > 1 ? product.min_qty : 1;
        addItem(product, qty);
      }
    }
    setAllAdded(true);
    // Close drawer after a moment
    setTimeout(() => close(), 1500);
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <p className="text-sm text-muted italic">&ldquo;{results.summary}&rdquo;</p>

      {/* Product list */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {products.map((product) => {
          const reason = reasonMap.get(product.product_id) || "";
          const isAdded = addedIds.has(product.product_id);

          return (
            <div
              key={product.product_id}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                {product.image_urls[0] ? (
                  <img
                    src={product.image_urls[0]}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted/30">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.title}</p>
                {reason && (
                  <p className="text-xs text-accent truncate">{reason}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted">{product.category}</p>
                  {product.price != null && (
                    <p className="text-xs font-medium">
                      ${product.price.toLocaleString("es-AR")}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleAddOne(product)}
                disabled={isAdded}
                className={`shrink-0 rounded-lg p-2 text-white transition-all ${
                  isAdded
                    ? "bg-success"
                    : "bg-accent hover:bg-accent-hover"
                }`}
              >
                {isAdded ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add all button */}
      <button
        onClick={handleAddAll}
        disabled={allAdded}
        className={`w-full rounded-xl py-3 text-sm font-medium text-white transition-all ${
          allAdded
            ? "bg-success"
            : "bg-accent hover:bg-accent-hover"
        }`}
      >
        {allAdded ? (
          <span className="flex items-center justify-center gap-2">
            <Check className="h-4 w-4" />
            Agregados al carrito
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Agregar todos al carrito
          </span>
        )}
      </button>

      {/* Follow-up questions */}
      {results.follow_up_questions.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
            Para refinar
          </p>
          {results.follow_up_questions.map((q, i) => (
            <p key={i} className="text-sm text-muted">&bull; {q}</p>
          ))}
        </div>
      )}
    </div>
  );
}
