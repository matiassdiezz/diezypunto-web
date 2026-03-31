"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { listProducts } from "@/lib/api";
import type { ProductResult } from "@/lib/types";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useRecentlyViewedStore } from "@/lib/stores/recently-viewed-store";
import { useDrawerStore } from "@/components/shared/AddToCartDrawer";
import { trackEvent } from "@/lib/analytics-client";
import { getMinQty, getUnitPrice, getColorStock } from "@/lib/product-utils";
import { AnimatePresence, motion } from "framer-motion";
import { Tote, Leaf, Check } from "@phosphor-icons/react";
import Link from "next/link";
import ScrollReveal from "@/components/shared/ScrollReveal";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import ProductCard from "@/components/catalog/ProductCard";
import QuantityNudge from "@/components/catalog/QuantityNudge";
import QuantityStepper from "@/components/shared/QuantityStepper";
import PersonalizationCard from "@/components/catalog/PersonalizationCard";
import SocialProofBadge from "@/components/catalog/SocialProofBadge";
import TierComparison from "@/components/catalog/TierComparison";
import ShareButton from "@/components/shared/ShareButtons";
import { buildProductShareUrl, buildProductWhatsAppMessage } from "@/lib/share";
import { inferColor, isLightColor } from "@/lib/color-map";

export default function ProductDetail({ product }: { product: ProductResult }) {
  const searchParams = useSearchParams();
  const qtyParam = searchParams.get("qty");
  const [related, setRelated] = useState<ProductResult[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const minQty = getMinQty(product);
  const initialQty = (() => {
    if (qtyParam) {
      const n = parseInt(qtyParam);
      if (!isNaN(n) && n >= minQty) return n;
    }
    return minQty;
  })();
  const [qty, setQty] = useState<number | "">(initialQty);
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.colors.length === 1 ? product.colors[0] : null,
  );
  const [selectedMethod, setSelectedMethod] = useState<string | null>(
    product.personalization_methods.length === 1 ? product.personalization_methods[0] : null,
  );
  const [justAdded, setJustAdded] = useState(false);
  const [colorWarn, setColorWarn] = useState(false);
  const [stockWarn, setStockWarn] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const zoomRef = useRef<HTMLDivElement>(null);
  const addTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const colorWarnRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stockWarnRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const addItem = useQuoteStore((s) => s.addItem);
  const openDrawer = useDrawerStore((s) => s.open);
  const addToRecentlyViewed = useRecentlyViewedStore((s) => s.addProduct);
  const requiresPersonalizationMethod =
    product.personalization_methods.length > 1;
  const canAddToCart =
    !requiresPersonalizationMethod || !!selectedMethod;

  // Sync qty + method to URL
  useEffect(() => {
    const url = new URL(window.location.href);
    if (typeof qty === "number" && qty > 1) {
      url.searchParams.set("qty", String(qty));
    } else {
      url.searchParams.delete("qty");
    }
    if (selectedMethod) {
      url.searchParams.set("method", selectedMethod);
    } else {
      url.searchParams.delete("method");
    }
    window.history.replaceState({}, "", url.toString());
  }, [qty, selectedMethod]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSelectedImage(0);
      const parsed = qtyParam ? parseInt(qtyParam) : NaN;
      setQty(!isNaN(parsed) && parsed >= minQty ? parsed : minQty);
      setSelectedColor(product.colors.length === 1 ? product.colors[0] : null);
      setSelectedMethod(
        product.personalization_methods.length === 1
          ? product.personalization_methods[0]
          : null,
      );
    });

    // Track product view
    trackEvent("product_view", {
      product_id: product.product_id,
      title: product.title,
      category: product.category,
      price: product.price,
      referrer: document.referrer || "direct",
    });
    addToRecentlyViewed(product);

    // Fetch related products from same category
    let cancelled = false;
    listProducts({ category: product.category, limit: 8 })
      .then((res) => {
        if (!cancelled) setRelated(res.products.filter((r) => r.product_id !== product.product_id));
      })
      .catch((err) => { if (!cancelled) console.error(err); });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [product, qtyParam, minQty, addToRecentlyViewed]);

  function handleZoomMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!zoomRef.current) return;
    const rect = zoomRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  }

  const effectiveQty = qty || minQty;
  const stockLimit = getColorStock(product, selectedColor);
  const activePrice = getUnitPrice(product, effectiveQty);

  function handleAdd() {
    if (product.colors.length > 0 && !selectedColor) {
      setColorWarn(true);
      clearTimeout(colorWarnRef.current);
      colorWarnRef.current = setTimeout(() => setColorWarn(false), 2000);
      return;
    }
    if (stockLimit !== undefined && effectiveQty > stockLimit) {
      setStockWarn(true);
      clearTimeout(stockWarnRef.current);
      stockWarnRef.current = setTimeout(() => setStockWarn(false), 2000);
      return;
    }
    const q = qty || minQty;
    addItem(product, q, {
      color: selectedColor ?? undefined,
      personalizationMethod: selectedMethod ?? undefined,
    });
    openDrawer(product, q);
    setJustAdded(true);
    clearTimeout(addTimerRef.current);
    addTimerRef.current = setTimeout(() => setJustAdded(false), 1500);
  }

  useEffect(() => () => {
    clearTimeout(addTimerRef.current);
    clearTimeout(colorWarnRef.current);
    clearTimeout(stockWarnRef.current);
  }, []);

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Catálogo", href: "/catalogo" },
    {
      label: product.category,
      href: `/catalogo/${encodeURIComponent(product.category)}`,
    },
    { label: product.title },
  ];

  return (
    <div className="px-4 pb-20 pt-6 sm:px-6 lg:px-16 sm:pt-8">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mt-4 grid gap-6 sm:mt-6 sm:gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <ScrollReveal direction="up">
          <div className="space-y-3 sm:space-y-4">
            <div
              ref={zoomRef}
              className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border bg-surface p-4 sm:rounded-2xl sm:p-6 cursor-zoom-in"
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={handleZoomMove}
            >
              <AnimatePresence mode="wait">
                {product.image_urls[selectedImage] ? (
                  <motion.img
                    key={selectedImage}
                    src={product.image_urls[selectedImage]}
                    alt={product.title}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    style={{ transformOrigin: zoomOrigin }}
                    className={`h-auto w-auto max-h-full max-w-full object-contain transition-transform duration-300 ${
                      isZooming ? "scale-[2]" : "scale-100"
                    }`}
                  />
                ) : (
                  <div className="flex items-center justify-center text-muted/30">
                    <Tote className="h-16 w-16 sm:h-20 sm:w-20" />
                  </div>
                )}
              </AnimatePresence>
            </div>
            {product.image_urls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.image_urls.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(i)}
                    className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-surface p-1 transition-all duration-200 sm:h-16 sm:w-16 ${
                      i === selectedImage
                        ? "border-accent ring-2 ring-accent/20 scale-[1.05]"
                        : "border-border hover:border-accent/40"
                    }`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-auto w-auto max-h-full max-w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Info */}
        <ScrollReveal direction="right">
          <div>
            <Link
              href={`/catalogo/${encodeURIComponent(product.category)}`}
              className="text-xs text-muted hover:text-accent sm:text-sm"
            >
              {product.category}
            </Link>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl lg:text-3xl">
              {product.title}
            </h1>

            {/* Social Proof + Eco/Premium badges */}
            <div className="mt-2 flex flex-wrap gap-2">
              {product.eco_friendly && (
                <span className="flex items-center gap-1 rounded-full bg-eco/10 px-2.5 py-1 text-xs font-medium text-eco sm:px-3 sm:text-sm">
                  <Leaf className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Eco-friendly
                </span>
              )}
              {product.premium_tier && (
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent sm:px-3 sm:text-sm">
                  Premium
                </span>
              )}
              <SocialProofBadge product={product} size="md" />
            </div>

            {product.description && (
              <p className="mt-3 text-sm leading-relaxed text-muted sm:mt-4 sm:text-base">
                {product.description}
              </p>
            )}

            {/* Price */}
            <div className="relative mt-4 rounded-xl border border-border bg-card p-4 sm:mt-6 sm:rounded-2xl sm:p-6">
              <div className="absolute right-3 top-3">
                <ShareButton
                  getShareUrl={() => buildProductShareUrl(product.product_id, effectiveQty)}
                  getWhatsAppMessage={(url) =>
                    buildProductWhatsAppMessage(product.title, effectiveQty, activePrice, url)
                  }
                  context="product"
                  trackingData={{ product_id: product.product_id }}
                />
              </div>
              {product.price != null ? (
                <div>
                  {product.price_tiers && product.price_tiers.length > 0 ? (
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                        Precio por cantidad
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {product.price_tiers.map((tier, idx) => {
                          const q = qty || 0;
                          const matchedTier = product.price_tiers!.find(
                            (t) => q >= t.min && (t.max === null || q <= t.max)
                          );
                          const isActive = matchedTier
                            ? tier === matchedTier
                            : tier === product.price_tiers![0];
                          const basePrice = product.price_tiers![0].finalPrice;
                          const savingsPct = idx > 0
                            ? Math.round((1 - tier.finalPrice / basePrice) * 100)
                            : 0;
                          return (
                            <div
                              key={tier.label}
                              onClick={() => setQty(tier.min)}
                              className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                                isActive
                                  ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                                  : "border-border hover:border-accent/30"
                              }`}
                            >
                              <p className="text-[10px] font-medium text-muted sm:text-xs">
                                {tier.label} u.
                              </p>
                              <p className={`mt-1 text-base font-bold sm:text-lg ${
                                isActive ? "text-accent" : "text-foreground"
                              }`}>
                                ${tier.finalPrice.toLocaleString("es-AR")}
                              </p>
                              <p className="text-[10px] text-muted">+ IVA</p>
                              {savingsPct > 0 ? (
                                <p className="mt-1 text-[10px] font-semibold text-eco">Ahorrás {savingsPct}%</p>
                              ) : isActive ? (
                                <p className="mt-1 text-[10px] font-medium text-accent">Tu precio</p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                      {product.personalization_price != null && product.personalization_price > 0 && (
                        <p className="mt-2 text-[11px] text-muted">
                          Incluye personalización (${product.personalization_price.toLocaleString("es-AR")}/u.)
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-2xl font-bold sm:text-3xl">
                      ${product.price.toLocaleString("es-AR")}
                      <span className="ml-1.5 text-sm font-normal text-muted">+ IVA</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-base text-muted sm:text-lg">Consultar precio</p>
              )}
              {product.lead_time_days != null && (
                <p className="mt-1 text-xs text-muted sm:text-sm">
                  Tiempo de entrega: ~{product.lead_time_days} días
                </p>
              )}

              {/* Color selector — before add to cart */}
              {product.colors.length > 0 && (
                <div className="mt-4 border-t border-border/50 pt-4">
                  <p className={`text-xs font-semibold uppercase tracking-wider transition-colors ${colorWarn ? "text-red-500" : "text-muted"}`}>
                    Color{colorWarn ? " — Elegí un color" : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.colors.map((color) => {
                      const hex = inferColor(color);
                      const light = isLightColor(hex);
                      const stock = product.stock_by_color?.[color];
                      const outOfStock = stock !== undefined && stock <= 0;
                      return (
                        <button
                          key={color}
                          onClick={() => {
                            if (outOfStock) return;
                            const next = selectedColor === color && product.colors.length > 1 ? null : color;
                            setSelectedColor(next);
                            if (next) setColorWarn(false);
                          }}
                          disabled={outOfStock}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                            outOfStock
                              ? "border-border/50 text-muted/40 line-through cursor-not-allowed opacity-60"
                              : selectedColor === color
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-foreground hover:border-accent/30"
                          }`}
                        >
                          <span
                            className={`h-3 w-3 shrink-0 rounded-full ${light ? "border border-border/60" : ""} ${
                              !hex ? (selectedColor === color ? "bg-accent" : "bg-muted/40") : ""
                            }`}
                            style={hex && hex !== "transparent" ? { backgroundColor: hex } : hex === "transparent" ? { background: "linear-gradient(135deg, #fff 40%, #e5e7eb 40%, #e5e7eb 60%, #fff 60%)" } : undefined}
                          />
                          {color}
                          {stock !== undefined && (
                            <span className={`text-[10px] ${outOfStock ? "text-red-400" : "text-muted"}`}>
                              {outOfStock ? "Sin stock" : `${stock}`}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Personalization method — before add to cart */}
              {product.personalization_methods.length > 0 && (
                <div className={product.colors.length > 0 ? "mt-3" : "mt-4 border-t border-border/50 pt-4"}>
                  <PersonalizationCard
                    methods={product.personalization_methods}
                    selected={selectedMethod}
                    onSelect={setSelectedMethod}
                  />
                </div>
              )}
              {requiresPersonalizationMethod && !selectedMethod && (
                <p className="mt-2 text-xs text-muted">
                  Elegí un método para agregar este producto al carrito.
                </p>
              )}

              {/* Quantity stepper + Add */}
              <div className="mt-4 border-t border-border/50 pt-4">
                {/* Quick-fill pills */}
                {product.price_tiers && product.price_tiers.length > 1 && (
                  <div className="mb-2.5 flex flex-wrap gap-1.5">
                    {product.price_tiers.map((tier) => {
                      const active = effectiveQty >= tier.min && (tier.max === null || effectiveQty <= tier.max);
                      return (
                        <button
                          key={tier.min}
                          onClick={() => setQty(tier.min)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                            active
                              ? "bg-accent text-white shadow-sm"
                              : "bg-surface text-muted hover:bg-accent/10 hover:text-accent"
                          }`}
                        >
                          {tier.min}+ u.
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <QuantityStepper
                    value={qty}
                    onChange={setQty}
                    min={minQty}
                    max={stockLimit !== undefined ? stockLimit : undefined}
                    size="md"
                  />
                  <button
                    onClick={handleAdd}
                    disabled={!canAddToCart}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-white transition-all sm:text-base ${
                      !canAddToCart
                        ? "cursor-not-allowed bg-muted"
                        : justAdded
                          ? "bg-success"
                          : "bg-accent hover:bg-accent-hover"
                    }`}
                  >
                    {justAdded ? (
                      <>
                        <Check className="h-5 w-5" />
                        Agregado
                      </>
                    ) : (
                      <>
                        <Tote className="h-5 w-5" />
                        Agregar al carrito
                      </>
                    )}
                  </button>
                </div>

                {/* Subtotal + savings */}
                {activePrice != null && effectiveQty > 0 && (
                  <div className="mt-3 flex items-baseline justify-between rounded-lg bg-surface/60 px-3 py-2">
                    <span className="text-xs text-muted">Subtotal estimado</span>
                    <span className="text-sm font-bold">
                      ${(activePrice * effectiveQty).toLocaleString("es-AR")}
                      <span className="ml-0.5 text-xs font-normal text-muted">+ IVA</span>
                    </span>
                  </div>
                )}
                {(() => {
                  if (!product.price_tiers?.length || product.price_tiers.length < 2) return null;
                  const base = product.price_tiers[0].finalPrice;
                  const current = activePrice ?? base;
                  const saved = (base - current) * effectiveQty;
                  if (saved <= 0) return null;
                  return (
                    <p className="mt-1.5 text-center text-xs font-medium text-eco">
                      Ahorrás ${saved.toLocaleString("es-AR")} vs. precio base
                    </p>
                  );
                })()}
              </div>

              {/* Quantity Nudge */}
              <QuantityNudge qty={qty} product={product} />

              {stockWarn && stockLimit !== undefined && (
                <p className="mt-2 text-xs text-red-500">
                  Stock disponible: {stockLimit} unidades
                </p>
              )}

            </div>

            {/* Specs */}
            <div className="mt-4 space-y-3 sm:mt-6">
              {product.materials.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Materiales
                  </p>
                  <p className="mt-1 text-sm">{product.materials.join(", ")}</p>
                </div>
              )}
              {product.colors.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Colores disponibles
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(selectedColor === color ? null : color)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                          selectedColor === color
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-foreground hover:border-accent/30"
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          selectedColor === color ? "bg-accent" : "bg-muted/40"
                        }`} />
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Tier Comparison — Good/Better/Best from same category */}
      {related.length >= 2 && (
        <TierComparison products={related} currentProduct={product} />
      )}

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-12 sm:mt-16">
          <ScrollReveal>
            <h2 className="text-lg font-bold sm:text-xl">Productos relacionados</h2>
          </ScrollReveal>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-6 lg:grid-cols-4">
            {related.slice(0, 4).map((p, i) => (
              <motion.div
                key={p.product_id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="h-full"
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
