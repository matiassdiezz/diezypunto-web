"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tote, Check, Minus, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import type { ProductResult } from "@/lib/types";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { listProducts } from "@/lib/api";
import { getComplementaryCategories } from "@/lib/engine/affinity";

interface DrawerState {
  isOpen: boolean;
  product: ProductResult | null;
  quantity: number;
  open: (product: ProductResult, quantity: number) => void;
  close: () => void;
}

export const useDrawerStore = create<DrawerState>((set) => ({
  isOpen: false,
  product: null,
  quantity: 0,
  open: (product, quantity) => set({ isOpen: true, product, quantity }),
  close: () => set({ isOpen: false }),
}));

export default function AddToCartDrawer() {
  const { isOpen, product, quantity, close } = useDrawerStore();
  const cartItems = useQuoteStore((s) => s.items);
  const [suggestions, setSuggestions] = useState<ProductResult[]>([]);
  const addedColor = product
    ? cartItems.find((i) => i.product.product_id === product.product_id)?.color
    : undefined;

  useEffect(() => {
    if (!product) return;
    const categories = getComplementaryCategories(product.category);
    if (categories.length === 0) {
      setSuggestions([]);
      return;
    }
    // Fetch 1 product from each complementary category
    Promise.all(
      categories.slice(0, 3).map((cat) =>
        listProducts({ category: cat, limit: 1 }).then((r) => r.products[0]).catch(() => null),
      ),
    ).then((results) => setSuggestions(results.filter(Boolean) as ProductResult[]));
  }, [product]);

  // Auto-close after 8 seconds
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(close, 8000);
    return () => clearTimeout(timer);
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-black/20"
          />
          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white p-5 shadow-2xl sm:mx-auto sm:max-w-lg sm:rounded-2xl sm:bottom-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-success">
                <Check className="h-4 w-4" />
                Agregado al carrito
              </div>
              <button onClick={close} className="text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Added product */}
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/55 bg-white/60 p-3 shadow-[0_4px_16px_rgba(15,23,42,0.06)] backdrop-blur-sm">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/50 bg-white/70 backdrop-blur-sm">
                {product.image_urls[0] ? (
                  <img src={product.image_urls[0]} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted/30">
                    <Tote className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.title}</p>
                <p className="text-xs text-muted">
                  {quantity}u{addedColor ? ` · ${addedColor}` : ""}
                </p>
              </div>
              {product.price != null && (
                <p className="text-sm font-bold">
                  ${(product.price * quantity).toLocaleString("es-AR")}
                  <span className="ml-0.5 text-xs font-normal text-muted">+ IVA</span>
                </p>
              )}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Complementa tu pedido
                </p>
                <div className="mt-2 space-y-2">
                  {suggestions.map((s) => (
                    <SuggestionRow key={s.product_id} product={s} />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={close}
                className="rounded-xl border border-border py-2.5 text-sm font-medium transition-colors hover:bg-surface"
              >
                Seguir comprando
              </button>
              <Link
                href="/carrito"
                onClick={close}
                className="flex items-center justify-center rounded-xl bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Ir al carrito
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SuggestionRow({ product }: { product: ProductResult }) {
  const addItem = useQuoteStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState<number | "">(1);

  function handleAdd() {
    addItem(product, qty || 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/50 bg-white/55 p-2 shadow-[0_4px_16px_rgba(15,23,42,0.06)] backdrop-blur-sm">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/50 bg-white/70 backdrop-blur-sm">
        {product.image_urls[0] ? (
          <img src={product.image_urls[0]} alt="" className="h-full w-full object-contain p-0.5" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted/30">
            <Tote className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{product.title}</p>
        {product.price != null && (
          <p className="text-xs text-accent">${product.price.toLocaleString("es-AR")} <span className="text-muted">+ IVA</span></p>
        )}
      </div>
      <div className="flex shrink-0 items-center rounded-lg border border-white/60 bg-white/70 backdrop-blur-sm">
        <button
          onClick={() => setQty((q) => Math.max(1, (q || 1) - 1))}
          className="px-1.5 py-1 text-muted transition-colors hover:bg-white/80"
          aria-label="Disminuir cantidad"
        >
          <Minus className="h-3 w-3" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={qty}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") { setQty(""); return; }
            const v = parseInt(raw);
            if (!isNaN(v) && v >= 1) setQty(v);
          }}
          onBlur={() => { if (qty === "" || qty < 1) setQty(1); }}
          className="w-7 border-x border-white/60 bg-transparent py-1 text-center text-[11px] font-medium tabular-nums outline-none"
          aria-label="Cantidad"
        />
        <button
          onClick={() => setQty((q) => (q || 0) + 1)}
          className="px-1.5 py-1 text-muted transition-colors hover:bg-white/80"
          aria-label="Aumentar cantidad"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <button
        onClick={handleAdd}
        className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white transition-all ${
          added ? "bg-success" : "bg-accent hover:bg-accent-hover"
        }`}
      >
        {added ? <Check className="h-3.5 w-3.5" /> : "Agregar"}
      </button>
    </div>
  );
}
