"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { listProducts } from "@/lib/api";
import type { ProductResult } from "@/lib/types";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useDrawerStore } from "@/components/shared/AddToCartDrawer";
import { trackEvent } from "@/lib/analytics-client";
import { Tote, Leaf, PaperPlaneTilt, Minus, Plus, Check } from "@phosphor-icons/react";
import Link from "next/link";
import { openTelegramWithContext } from "@/lib/telegram";
import ScrollReveal from "@/components/shared/ScrollReveal";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import ProductCard from "@/components/catalog/ProductCard";
import QuantityNudge from "@/components/catalog/QuantityNudge";
import PersonalizationCard from "@/components/catalog/PersonalizationCard";
import SocialProofBadge from "@/components/catalog/SocialProofBadge";
import TierComparison from "@/components/catalog/TierComparison";
import ShareButton from "@/components/shared/ShareButtons";
import { buildProductShareUrl, buildProductWhatsAppMessage } from "@/lib/share";

export default function ProductDetail({ product }: { product: ProductResult }) {
  const searchParams = useSearchParams();
  const [related, setRelated] = useState<ProductResult[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const minQty = product.price_tiers?.[0]?.min ?? 1;
  const initialQty = (() => {
    const q = searchParams.get("qty");
    if (q) { const n = parseInt(q); if (!isNaN(n) && n >= minQty) return n; }
    return minQty;
  })();
  const [qty, setQty] = useState<number | "">(initialQty);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useQuoteStore((s) => s.addItem);
  const openDrawer = useDrawerStore((s) => s.open);

  // Sync qty to URL
  useEffect(() => {
    const url = new URL(window.location.href);
    if (typeof qty === "number" && qty > 1) {
      url.searchParams.set("qty", String(qty));
    } else {
      url.searchParams.delete("qty");
    }
    window.history.replaceState({}, "", url.toString());
  }, [qty]);

  useEffect(() => {
    setSelectedImage(0);
    const q = searchParams.get("qty");
    const parsed = q ? parseInt(q) : NaN;
    setQty(!isNaN(parsed) && parsed >= minQty ? parsed : minQty);

    // Track product view
    trackEvent("product_view", {
      product_id: product.product_id,
      title: product.title,
      category: product.category,
      price: product.price,
      referrer: document.referrer || "direct",
    });

    // Fetch related products from same category
    listProducts({ category: product.category, limit: 8 })
      .then((res) =>
        setRelated(
          res.products.filter((r) => r.product_id !== product.product_id),
        ),
      )
      .catch(console.error);

  }, [product]);

  function handleAdd() {
    const q = qty || 1;
    addItem(product, q);
    openDrawer(product, q);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  const handleTelegram = () => {
    openTelegramWithContext({
      type: "product",
      product_id: product.product_id,
      title: product.title,
      qty: qty || 1,
      message: product.price == null
        ? `Necesito precio para: ${product.title}, ${qty} unidades.`
        : `Me interesa el producto: ${product.title}, ${qty} unidades.`,
    });
  };

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
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border bg-surface p-4 sm:rounded-2xl sm:p-6">
              {product.image_urls[selectedImage] ? (
                <img
                  src={product.image_urls[selectedImage]}
                  alt={product.title}
                  className="h-auto w-auto max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center text-muted/30">
                  <Tote className="h-16 w-16 sm:h-20 sm:w-20" />
                </div>
              )}
            </div>
            {product.image_urls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.image_urls.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(i)}
                    className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-surface p-1 sm:h-16 sm:w-16 ${
                      i === selectedImage
                        ? "border-accent"
                        : "border-border"
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
                  getShareUrl={() => buildProductShareUrl(product.product_id, qty || 1)}
                  getWhatsAppMessage={(url) =>
                    buildProductWhatsAppMessage(product.title, qty || 1, product.price, url)
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
                        {product.price_tiers.map((tier) => {
                          const q = qty || 0;
                          const matchedTier = product.price_tiers!.find(
                            (t) => q >= t.min && (t.max === null || q <= t.max)
                          );
                          // If no tier matched (qty below all minimums), highlight first tier
                          const isActive = matchedTier
                            ? tier === matchedTier
                            : tier === product.price_tiers![0];
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
                              {isActive && (
                                <p className="mt-1 text-[10px] font-medium text-accent">Tu precio</p>
                              )}
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

              {/* Quantity stepper + Add */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex items-center rounded-xl border border-border">
                  <button
                    onClick={() => setQty(Math.max(minQty, (qty || minQty) - 1))}
                    className="rounded-l-xl px-3 py-2.5 text-muted hover:bg-surface"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min={minQty}
                    value={qty}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") { setQty(""); return; }
                      const v = parseInt(raw);
                      if (!isNaN(v) && v >= minQty) setQty(v);
                    }}
                    onBlur={() => { if (qty === "" || qty < minQty) setQty(minQty); }}
                    className="w-16 border-x border-border bg-white py-2.5 text-center text-sm font-medium tabular-nums outline-none"
                  />
                  <button
                    onClick={() => setQty((qty || 0) + 1)}
                    className="rounded-r-xl px-3 py-2.5 text-muted hover:bg-surface"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={handleAdd}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-white transition-all sm:text-base ${
                    justAdded
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

              {/* Quantity Nudge */}
              <QuantityNudge qty={qty} product={product} />

              <p className="mt-3 text-center text-xs text-muted">
                ¿Necesitás ayuda?{" "}
                <button
                  onClick={handleTelegram}
                  className="inline-flex items-center gap-1 text-accent underline underline-offset-2 hover:text-accent-hover"
                >
                  <PaperPlaneTilt className="inline h-3 w-3" />
                  Consultanos por Telegram
                </button>
              </p>

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
                  <p className="mt-1 text-sm">{product.colors.join(", ")}</p>
                </div>
              )}
              {/* Personalization Card — replaces plain pills */}
              <PersonalizationCard
                methods={product.personalization_methods}
                productTitle={product.title}
              />
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
            {related.slice(0, 4).map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
