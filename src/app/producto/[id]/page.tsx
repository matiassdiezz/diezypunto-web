"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProduct } from "@/lib/api";
import type { ProductResult } from "@/lib/types";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { ShoppingBag, Leaf, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ScrollReveal from "@/components/shared/ScrollReveal";

export default function ProductoPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useQuoteStore((s) => s.addItem);

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

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

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-28">
      <Link
        href="/catalogo"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al catalogo
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
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
            <p className="text-sm text-muted">{product.category}</p>
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
                onClick={() => addItem(product)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-medium text-white transition-colors hover:bg-accent-hover"
              >
                <ShoppingBag className="h-5 w-5" />
                Agregar al presupuesto
              </button>
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
    </div>
  );
}
