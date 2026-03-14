"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  X,
  Zap,
} from "lucide-react";
import type { ProductResult } from "@/lib/types";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useDrawerStore } from "@/components/shared/AddToCartDrawer";
import { useTopBarStore } from "@/lib/stores/topbar-store";
import fastDeliveryData from "@/data/fast-delivery.json";

const FAST_DELIVERY_KEY = "Entrega Rápida";

const CATEGORIES = [
  FAST_DELIVERY_KEY,
  "Bolsos & Mochilas",
  "Drinkware",
  "Sustentables",
  "Hogar",
  "Escritorio",
  "Indumentaria",
  "Tecnología",
  "Mates & Termos",
];

const CATEGORY_SLUGS: Record<string, string> = {
  "Bolsos & Mochilas": "Bolsos y Mochilas",
  Drinkware: "Drinkware",
  Sustentables: "Sustentables",
  Hogar: "Hogar y Tiempo Libre",
  Escritorio: "Escritorio",
  Indumentaria: "Apparel",
  Tecnología: "Tecnología",
  "Mates & Termos": "Mates, termos y materas",
};

// Cache fetched products per category
const cache: Record<string, ProductResult[]> = {};

// ----- Mini product card (catalog products) -----
function MiniProduct({ product }: { product: ProductResult }) {
  const addItem = useQuoteStore((s) => s.addItem);
  const openDrawer = useDrawerStore((s) => s.open);
  const img = product.image_urls[0];

  return (
    <div className="group/card flex flex-col rounded-lg border border-transparent p-2 transition-all hover:border-border hover:bg-surface">
      <Link
        href={`/producto/${product.product_id}`}
        className="flex flex-col items-center"
      >
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-surface">
          {img ? (
            <img
              src={img}
              alt={product.title}
              className="h-full w-full object-contain p-2 transition-transform duration-200 group-hover/card:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted/30">
              <ShoppingBag className="h-8 w-8" />
            </div>
          )}
        </div>
        <h4 className="mt-2 line-clamp-2 text-center text-xs font-medium leading-snug text-foreground">
          {product.title}
        </h4>
        {product.price != null && (
          <p className="mt-1 text-xs font-semibold text-foreground">
            ${product.price.toLocaleString("es-AR")}
            <span className="ml-0.5 text-[10px] font-normal text-muted">
              + IVA
            </span>
          </p>
        )}
      </Link>
      <button
        onClick={() => {
          addItem(product, product.min_qty > 1 ? product.min_qty : 1);
          openDrawer(product, product.min_qty > 1 ? product.min_qty : 1);
        }}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent py-1.5 text-[11px] font-medium text-white opacity-0 transition-all hover:bg-accent-hover group-hover/card:opacity-100"
      >
        <ShoppingBag className="h-3 w-3" />
        Agregar
      </button>
    </div>
  );
}

// ----- Mini product card (fast delivery — external link) -----
interface FastProduct {
  id: string;
  title: string;
  price: number;
  image: string | null;
  url: string;
  category: string;
}

function MiniProductFast({ product }: { product: FastProduct }) {
  return (
    <div className="group/card flex flex-col rounded-lg border border-transparent p-2 transition-all hover:border-border hover:bg-surface">
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center"
      >
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-surface">
          {product.image ? (
            <img
              src={product.image}
              alt={product.title}
              className="h-full w-full object-contain p-2 transition-transform duration-200 group-hover/card:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted/30">
              <ShoppingBag className="h-8 w-8" />
            </div>
          )}
        </div>
        <h4 className="mt-2 line-clamp-2 text-center text-xs font-medium leading-snug text-foreground">
          {product.title}
        </h4>
        <p className="mt-1 text-xs font-semibold text-foreground">
          ${product.price.toLocaleString("es-AR")}
          <span className="ml-0.5 text-[10px] font-normal text-muted">
            + IVA
          </span>
        </p>
      </a>
    </div>
  );
}

// ----- Fast Delivery dropdown -----
function FastDeliveryDropdown({ onClose }: { onClose: () => void }) {
  const products = fastDeliveryData as FastProduct[];

  return (
    <div className="absolute left-0 right-0 top-full z-40 border-b border-border bg-white shadow-lg">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">
              Entrega Rápida — En stock, entrega en 24hs
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          {products.map((p) => (
            <MiniProductFast key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ----- Category dropdown (API-powered) -----
function CategoryDropdown({
  category,
  onClose,
}: {
  category: string;
  onClose: () => void;
}) {
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(true);
  const slug = CATEGORY_SLUGS[category] || category;

  useEffect(() => {
    if (cache[category]) {
      setProducts(cache[category]);
      setLoading(false);
      return;
    }
    setProducts([]);
    setLoading(true);
    fetch(`/api/products?category=${encodeURIComponent(slug)}&limit=8`)
      .then((r) => r.json())
      .then((data) => {
        cache[category] = data.products || [];
        setProducts(cache[category]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, slug]);

  return (
    <div className="absolute left-0 right-0 top-full z-40 border-b border-border bg-white shadow-lg">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{category}</h3>
          <div className="flex items-center gap-3">
            <Link
              href={`/catalogo/${encodeURIComponent(slug)}`}
              onClick={onClose}
              className="flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Ver todos
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-4 lg:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-lg bg-surface" />
                <div className="mx-auto mt-2 h-3 w-3/4 rounded bg-surface" />
                <div className="mx-auto mt-1 h-3 w-1/2 rounded bg-surface" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 lg:grid-cols-8">
            {products.slice(0, 8).map((p) => (
              <MiniProduct key={p.product_id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ----- TopBar -----
export default function TopBar() {
  const isOpen = useTopBarStore((s) => s.isOpen);
  const [active, setActive] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleEnter = useCallback(
    (cat: string) => {
      clearTimer();
      setActive(cat);
    },
    [clearTimer]
  );

  const handleLeave = useCallback(() => {
    if (pinned) return;
    timeoutRef.current = setTimeout(() => setActive(null), 200);
  }, [pinned]);

  const handleClick = useCallback(
    (cat: string, e: React.MouseEvent) => {
      e.preventDefault();
      if (active === cat && pinned) {
        setPinned(false);
        setActive(null);
      } else {
        setActive(cat);
        setPinned(true);
      }
    },
    [active, pinned]
  );

  const handleClose = useCallback(() => {
    setPinned(false);
    setActive(null);
  }, []);

  const handleDropdownEnter = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const handleDropdownLeave = useCallback(() => {
    if (pinned) return;
    timeoutRef.current = setTimeout(() => setActive(null), 200);
  }, [pinned]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  if (!isOpen) {
    return <div className="pt-[72px]" />;
  }

  const isFastDelivery = active === FAST_DELIVERY_KEY;

  return (
    <>
      <div className="relative border-b border-border bg-white pt-[72px]">
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-center gap-1 px-6 lg:px-16 py-2">
          {CATEGORIES.map((cat) => {
            const isFast = cat === FAST_DELIVERY_KEY;
            return (
              <div
                key={cat}
                onMouseEnter={() => handleEnter(cat)}
                onMouseLeave={handleLeave}
              >
                <button
                  onClick={(e) => handleClick(cat, e)}
                  className={`group relative flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    active === cat
                      ? isFast
                        ? "text-amber-600"
                        : "text-accent"
                      : isFast
                        ? "text-amber-600 hover:text-amber-700"
                        : "text-foreground hover:text-accent"
                  }`}
                >
                  {isFast && <Zap className="h-3.5 w-3.5" />}
                  {cat}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      active === cat
                        ? isFast
                          ? "rotate-180 text-amber-600"
                          : "rotate-180 text-accent"
                        : "text-muted group-hover:text-accent"
                    }`}
                  />
                  <span
                    className={`absolute bottom-0 left-4 right-4 h-[2px] rounded-full transition-transform duration-200 origin-left ${
                      isFast ? "bg-amber-500" : "bg-accent"
                    } ${active === cat ? "scale-x-100" : "scale-x-0"}`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Dropdown */}
        {active && (
          <div
            onMouseEnter={handleDropdownEnter}
            onMouseLeave={handleDropdownLeave}
          >
            {isFastDelivery ? (
              <FastDeliveryDropdown onClose={handleClose} />
            ) : (
              <CategoryDropdown category={active} onClose={handleClose} />
            )}
          </div>
        )}

        {/* Mobile — horizontal scroll */}
        <div className="flex md:hidden items-center gap-1 overflow-x-auto scrollbar-hide px-4 py-2">
          {CATEGORIES.map((cat) => {
            const isFast = cat === FAST_DELIVERY_KEY;
            return (
              <Link
                key={cat}
                href={
                  isFast
                    ? "https://www.diezypunto.com.ar/categoria-producto/24-hs/"
                    : `/catalogo/${encodeURIComponent(CATEGORY_SLUGS[cat] || cat)}`
                }
                {...(isFast
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className={`flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                  isFast
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-border text-foreground active:bg-accent-light active:text-accent active:border-accent/40"
                }`}
              >
                {isFast && <Zap className="h-3 w-3" />}
                {cat}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Backdrop when pinned */}
      {active && pinned && (
        <div
          className="fixed inset-0 z-30 bg-black/10"
          onClick={handleClose}
        />
      )}
    </>
  );
}
