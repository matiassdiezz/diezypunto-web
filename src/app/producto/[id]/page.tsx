"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProduct, listProducts } from "@/lib/api";
import { getComplementaryCategories } from "@/lib/engine/affinity";
import type { ProductResult } from "@/lib/types";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useDrawerStore } from "@/components/shared/AddToCartDrawer";
import { ShoppingBag, Leaf, MessageCircle, Minus, Plus } from "lucide-react";
import Link from "next/link";
import ScrollReveal from "@/components/shared/ScrollReveal";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import ProductCard from "@/components/catalog/ProductCard";
import QuantityNudge from "@/components/catalog/QuantityNudge";
import PersonalizationCard from "@/components/catalog/PersonalizationCard";
import SocialProofBadge from "@/components/catalog/SocialProofBadge";
import AlternativeBadge from "@/components/catalog/AlternativeBadge";
import KitSuggestion from "@/components/catalog/KitSuggestion";
import TierComparison from "@/components/catalog/TierComparison";

export default function ProductoPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [related, setRelated] = useState<ProductResult[]>([]);
  const [kitProducts, setKitProducts] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const addItem = useQuoteStore((s) => s.addItem);
  const openDrawer = useDrawerStore((s) => s.open);

  useEffect(() => {
    setSelectedImage(0);
    getProduct(id)
      .then((p) => {
        setProduct(p);
        setQty(p.min_qty > 1 ? p.min_qty : 1);
        // Fetch related products from same category
        listProducts({ category: p.category, limit: 8 })
          .then((res) =>
            setRelated(
              res.products.filter((r) => r.product_id !== p.product_id),
            ),
          )
          .catch(console.error);
        // Fetch complementary products for "Arma tu kit"
        const complementary = getComplementaryCategories(p.category);
        if (complementary.length > 0) {
          Promise.all(
            complementary.slice(0, 3).map((cat) =>
              listProducts({ category: cat, limit: 1 })
                .then((r) => r.products[0])
                .catch(() => null),
            ),
          ).then((results) =>
            setKitProducts(results.filter(Boolean) as ProductResult[]),
          );
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  function handleAdd() {
    if (!product) return;
    addItem(product, qty);
    openDrawer(product, qty);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Producto no encontrado</p>
      </div>
    );
  }

  const whatsappMessage = encodeURIComponent(
    product.price == null
      ? `Hola! Necesito precio para: ${product.title}, ${qty} unidades.`
      : `Hola! Me interesa el producto: ${product.title}, ${qty} unidades. ¿Podrian darme mas info?`,
  );
  const whatsappUrl = `https://wa.me/5491168530845?text=${whatsappMessage}`;

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Catalogo", href: "/catalogo" },
    {
      label: product.category,
      href: `/catalogo/${encodeURIComponent(product.category)}`,
    },
    { label: product.title },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 sm:pt-28">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mt-4 grid gap-6 sm:mt-6 sm:gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <ScrollReveal direction="left">
          <div className="space-y-3 sm:space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl border border-border bg-surface sm:rounded-2xl">
              {product.image_urls[selectedImage] ? (
                <img
                  src={product.image_urls[selectedImage]}
                  alt={product.title}
                  className="h-full w-full object-contain p-4 sm:p-6"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted/30">
                  <ShoppingBag className="h-16 w-16 sm:h-20 sm:w-20" />
                </div>
              )}
            </div>
            {product.image_urls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.image_urls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-surface sm:h-16 sm:w-16 ${
                      i === selectedImage
                        ? "border-accent"
                        : "border-border"
                    }`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-contain p-1"
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

            {/* Alternative badge (eco/premium) */}
            <AlternativeBadge product={product} />

            {/* Price */}
            <div className="mt-4 rounded-xl border border-border bg-card p-4 sm:mt-6 sm:rounded-2xl sm:p-6">
              {product.price != null ? (
                <div>
                  {product.price_max != null &&
                    product.price_max !== product.price && product.min_qty > 1 ? (
                    <>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs text-muted">
                            <th className="pb-2 text-left font-medium">Cantidad</th>
                            <th className="pb-2 text-right font-medium">Precio unitario</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border/50">
                            <td className="py-2 text-muted">1 – {product.min_qty - 1} u.</td>
                            <td className="py-2 text-right font-semibold">
                              ${product.price_max.toLocaleString("es-AR")}
                              <span className="ml-1 text-xs font-normal text-muted">+ IVA</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-muted">{product.min_qty}+ u.</td>
                            <td className="py-2 text-right font-bold text-accent">
                              ${product.price.toLocaleString("es-AR")}
                              <span className="ml-1 text-xs font-normal text-muted">+ IVA</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="mt-2 text-xs text-muted">
                        Ahorra {Math.round((1 - product.price / product.price_max) * 100)}% comprando {product.min_qty}+ unidades
                      </p>
                    </>
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
              {product.min_qty > 1 && (
                <p className="mt-2 text-xs text-muted sm:text-sm">
                  Cantidad minima: {product.min_qty} unidades
                </p>
              )}
              {product.lead_time_days != null && (
                <p className="mt-1 text-xs text-muted sm:text-sm">
                  Tiempo de entrega: ~{product.lead_time_days} dias
                </p>
              )}

              {/* Quantity stepper + Add */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex items-center rounded-xl border border-border">
                  <button
                    onClick={() => setQty(Math.max(product.min_qty > 1 ? product.min_qty : 1, qty - 1))}
                    className="rounded-l-xl px-3 py-2.5 text-muted hover:bg-surface"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      const min = product.min_qty > 1 ? product.min_qty : 1;
                      if (!isNaN(v) && v >= min) setQty(v);
                    }}
                    className="w-16 border-x border-border bg-white py-2.5 text-center text-sm font-medium tabular-nums outline-none"
                  />
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="rounded-r-xl px-3 py-2.5 text-muted hover:bg-surface"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={handleAdd}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:text-base"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Agregar al carrito
                </button>
              </div>

              {/* Quantity Nudge */}
              <QuantityNudge qty={qty} product={product} />

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface sm:mt-3 sm:text-base"
              >
                <MessageCircle className="h-5 w-5" />
                Consultar por WhatsApp
              </a>
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

      {/* Kit Suggestion — cross-sell from complementary categories */}
      {kitProducts.length > 0 && (
        <KitSuggestion products={kitProducts} currentProductId={product.product_id} />
      )}

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
