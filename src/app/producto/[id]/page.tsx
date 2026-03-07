"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProduct, listProducts } from "@/lib/api";
import type { ProductResult } from "@/lib/types";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useToastStore } from "@/components/shared/Toast";
import { ShoppingBag, Leaf, MessageCircle } from "lucide-react";
import Link from "next/link";
import ScrollReveal from "@/components/shared/ScrollReveal";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import ProductCard from "@/components/catalog/ProductCard";

export default function ProductoPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [related, setRelated] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useQuoteStore((s) => s.addItem);
  const toast = useToastStore((s) => s.toast);

  useEffect(() => {
    setSelectedImage(0);
    getProduct(id)
      .then((p) => {
        setProduct(p);
        // Fetch related products from same category
        listProducts({ category: p.category, limit: 5 })
          .then((res) =>
            setRelated(
              res.products
                .filter((r) => r.product_id !== p.product_id)
                .slice(0, 4),
            ),
          )
          .catch(console.error);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  function handleAdd() {
    if (!product) return;
    addItem(product);
    toast("Agregado al presupuesto", {
      label: "Ver presupuesto →",
      href: "/presupuesto",
    });
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
    `Hola! Me interesa el producto: ${product.title}. ¿Podrian darme mas info?`,
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
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-28">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <ScrollReveal direction="left">
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-surface">
              {product.image_urls[selectedImage] ? (
                <img
                  src={product.image_urls[selectedImage]}
                  alt={product.title}
                  className="h-full w-full object-contain p-6"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted/30">
                  <ShoppingBag className="h-20 w-20" />
                </div>
              )}
            </div>
            {product.image_urls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.image_urls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-surface ${
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
              className="text-sm text-muted hover:text-accent"
            >
              {product.category}
            </Link>
            <h1 className="mt-1 text-2xl font-bold lg:text-3xl">
              {product.title}
            </h1>

            {product.description && (
              <p className="mt-4 leading-relaxed text-muted">
                {product.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {product.eco_friendly && (
                <span className="flex items-center gap-1 rounded-full bg-eco/10 px-3 py-1 text-sm font-medium text-eco">
                  <Leaf className="h-4 w-4" /> Eco-friendly
                </span>
              )}
              {product.premium_tier && (
                <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
                  Premium
                </span>
              )}
            </div>

            {/* Price */}
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              {product.price != null ? (
                <div>
                  <p className="text-3xl font-bold">
                    ${product.price.toLocaleString("es-AR")}
                  </p>
                  {product.price_max != null &&
                    product.price_max !== product.price && (
                      <p className="mt-1 text-sm text-muted">
                        hasta $
                        {product.price_max.toLocaleString("es-AR")}{" "}
                        segun cantidad
                      </p>
                    )}
                </div>
              ) : (
                <p className="text-lg text-muted">Consultar precio</p>
              )}
              {product.min_qty > 1 && (
                <p className="mt-2 text-sm text-muted">
                  Cantidad minima: {product.min_qty} unidades
                </p>
              )}
              {product.lead_time_days != null && (
                <p className="mt-1 text-sm text-muted">
                  Tiempo de entrega: ~{product.lead_time_days} dias
                </p>
              )}

              <button
                onClick={handleAdd}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-medium text-white transition-colors hover:bg-accent-hover"
              >
                <ShoppingBag className="h-5 w-5" />
                Agregar al presupuesto
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white py-3 font-medium text-foreground transition-colors hover:bg-surface"
              >
                <MessageCircle className="h-5 w-5" />
                Consultar por WhatsApp
              </a>
            </div>

            {/* Specs */}
            <div className="mt-6 space-y-3">
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
              {product.personalization_methods.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Metodos de personalizacion
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {product.personalization_methods.map((m) => (
                      <span
                        key={m}
                        className="rounded-lg bg-surface px-2.5 py-1 text-xs"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16">
          <ScrollReveal>
            <h2 className="text-xl font-bold">Productos relacionados</h2>
          </ScrollReveal>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
