"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle, CaretDown, ArrowClockwise, MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";
import { useQuoteStore } from "@/lib/stores/quote-store";
import type { CartReviewResponse, CartInsight } from "@/lib/types";
import LoadingDots from "../shared/LoadingDots";

export default function CartReview() {
  const items = useQuoteStore((s) => s.items);
  const [review, setReview] = useState<CartReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const reviewedItemsRef = useRef<string>("");

  const currentFingerprint = items
    .map((i) => `${i.product.product_id}:${i.quantity}`)
    .sort()
    .join(",");

  // Detect cart changes after review
  const isStale =
    stale ||
    (review && reviewedItemsRef.current !== currentFingerprint);

  const analyze = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStale(false);

    try {
      const res = await fetch("/api/cart-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product.product_id,
            title: i.product.title,
            category: i.product.category,
            qty: i.quantity,
            price: i.product.price,
            eco_friendly: i.product.eco_friendly,
            personalization_methods: i.product.personalization_methods,
            min_qty: i.product.min_qty,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al analizar");
      }

      const data: CartReviewResponse = await res.json();
      setReview(data);
      setIsOpen(true);
      reviewedItemsRef.current = currentFingerprint;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al analizar el carrito");
    } finally {
      setIsLoading(false);
    }
  }, [items, currentFingerprint]);

  if (items.length < 2) return null;

  const stars = review
    ? "★".repeat(review.score) + "☆".repeat(5 - review.score)
    : "";

  return (
    <div className="mb-6">
      {!review ? (
        // Collapsed: trigger button
        <button
          onClick={analyze}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-accent/20 bg-accent-light px-4 py-3 text-sm font-medium text-accent transition-all hover:border-accent/40 hover:shadow-sm disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <LoadingDots />
              <span className="ml-2">Analizando pedido...</span>
            </>
          ) : (
            <>
              <Sparkle className="h-4 w-4" />
              Analizar pedido con AI
              <span className="text-accent/60">→</span>
            </>
          )}
        </button>
      ) : (
        // Expanded: review panel
        <div className="rounded-2xl border border-accent/20 bg-white overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex w-full items-center justify-between px-5 py-3.5"
          >
            <div className="flex items-center gap-2">
              <Sparkle className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold">Analisis AI</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-amber-500">{stars}</span>
              <CaretDown
                className={`h-4 w-4 text-muted transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="border-t border-border px-5 pb-4 pt-3">
                  {/* Stale warning */}
                  {isStale && (
                    <button
                      onClick={analyze}
                      disabled={isLoading}
                      className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 hover:bg-amber-100"
                    >
                      <ArrowClockwise className="h-3 w-3" />
                      Tu carrito cambio — actualizar analisis
                    </button>
                  )}

                  {/* Summary */}
                  <p className="text-sm text-muted italic">
                    &ldquo;{review.summary}&rdquo;
                  </p>

                  {/* Insights */}
                  {review.insights.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {review.insights.map((insight, i) => (
                        <InsightRow key={i} insight={insight} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {error && (
        <p className="mt-2 text-center text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

function InsightRow({ insight }: { insight: CartInsight }) {
  const bgColor = {
    gap: "bg-blue-50",
    optimization: "bg-green-50",
    warning: "bg-amber-50",
    tip: "bg-emerald-50",
  }[insight.type];

  return (
    <div className={`flex items-start gap-2.5 rounded-lg ${bgColor} px-3 py-2.5`}>
      <span className="text-base shrink-0">{insight.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{insight.message}</p>
        {insight.action && (
          <Link
            href={`/catalogo?search=${encodeURIComponent(insight.action)}`}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            <MagnifyingGlass className="h-3 w-3" />
            Buscar {insight.action}
          </Link>
        )}
      </div>
    </div>
  );
}
