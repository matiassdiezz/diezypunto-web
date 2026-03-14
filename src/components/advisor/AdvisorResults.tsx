"use client";

import { useState } from "react";
import { ShoppingBag, Check, Plus, Sparkles } from "lucide-react";
import { useAdvisorStore } from "@/lib/stores/advisor-store";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useDrawerStore } from "@/components/shared/AddToCartDrawer";
import type { ProductResult } from "@/lib/types";

export default function AdvisorResults() {
  const { results, products, close } = useAdvisorStore();
  const addItem = useQuoteStore((s) => s.addItem);
  const openDrawer = useDrawerStore((s) => s.open);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [allAdded, setAllAdded] = useState(false);

  if (!results || products.length === 0) return null;

  // Map product IDs to selection data (reason + qty + upsell)
  const selectionMap = new Map(
    results.selected.map((s) => [s.id, { reason: s.reason, qty: s.qty, upsell: s.upsell }])
  );

  // Split products into core and upsell
  const coreProducts: ProductResult[] = [];
  const upsellProducts: ProductResult[] = [];
  for (const product of products) {
    const sel = selectionMap.get(product.product_id);
    if (sel?.upsell) {
      upsellProducts.push(product);
    } else {
      coreProducts.push(product);
    }
  }

  // Calculate core total per person (sum of unit prices)
  const coreTotal = coreProducts.reduce(
    (sum, p) => sum + (p.price ?? 0),
    0
  );

  function getQty(product: ProductResult) {
    const sel = selectionMap.get(product.product_id);
    const qty = sel?.qty ?? 1;
    return Math.max(qty, 1);
  }

  function handleAddOne(product: ProductResult) {
    addItem(product, getQty(product));
    setAddedIds((prev) => new Set(prev).add(product.product_id));
  }

  function handleAddAll() {
    // Only add core products
    for (const product of coreProducts) {
      if (!addedIds.has(product.product_id)) {
        addItem(product, getQty(product));
      }
    }
    setAllAdded(true);
    setTimeout(() => close(), 1500);
  }

  function renderProductCard(product: ProductResult, isUpsell?: boolean) {
    const isAdded = addedIds.has(product.product_id);
    const sel = selectionMap.get(product.product_id);
    const reason = sel?.reason || "";
    const qty = getQty(product);
    const subtotal = product.price != null ? product.price * qty : null;
    const upsellDelta = isUpsell && product.price != null ? product.price : null;

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
            {isUpsell && upsellDelta != null ? (
              <p className="text-xs font-medium">
                +${upsellDelta.toLocaleString("es-AR")}/persona → ${(coreTotal + upsellDelta).toLocaleString("es-AR")} total
              </p>
            ) : subtotal != null ? (
              <p className="text-xs font-medium">
                {qty} u. &times; ${product.price!.toLocaleString("es-AR")} = ${subtotal.toLocaleString("es-AR")}
              </p>
            ) : (
              <p className="text-xs text-muted">
                {qty} u. &mdash; Consultar precio
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
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <p className="text-sm text-muted italic">&ldquo;{results.summary}&rdquo;</p>

      {/* Core products */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {coreProducts.map((product) => renderProductCard(product))}

        {/* Upsell section */}
        {upsellProducts.length > 0 && (
          <>
            <div className="flex items-center gap-2 pt-2 pb-1">
              <div className="flex-1 border-t border-border" />
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wider shrink-0">
                <Sparkles className="h-3 w-3" />
                Mejora tu combo
              </span>
              <div className="flex-1 border-t border-border" />
            </div>
            {upsellProducts.map((product) => renderProductCard(product, true))}
          </>
        )}
      </div>

      {/* Add all button — only adds core */}
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
            Agregar combo al carrito
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
