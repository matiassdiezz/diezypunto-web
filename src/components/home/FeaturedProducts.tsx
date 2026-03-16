"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { listProducts, getProduct } from "@/lib/api";
import type { AIPicksResponse, ProductResult } from "@/lib/types";
import ProductCard from "../catalog/ProductCard";
import ScrollReveal from "../shared/ScrollReveal";

type Tab = "destacados" | "ai";

interface PickWithProduct {
  product: ProductResult;
  reason: string;
}

export default function FeaturedProducts() {
  const [tab, setTab] = useState<Tab>("destacados");
  const [featured, setFeatured] = useState<ProductResult[]>([]);
  const [aiPicks, setAiPicks] = useState<PickWithProduct[]>([]);
  const [aiTitle, setAiTitle] = useState("");

  useEffect(() => {
    listProducts({ limit: 8 })
      .then((res) => setFeatured(res.products))
      .catch(() => {});

    fetch("/api/ai-picks")
      .then((r) => r.json())
      .then(async (data: AIPicksResponse) => {
        setAiTitle(data.collection_title);
        const results = await Promise.all(
          data.picks.map(async (pick) => {
            try {
              const product = await getProduct(pick.id);
              return { product, reason: pick.reason };
            } catch {
              return null;
            }
          })
        );
        setAiPicks(results.filter(Boolean) as PickWithProduct[]);
      })
      .catch(() => {});
  }, []);

  if (featured.length === 0 && aiPicks.length === 0) return null;

  return (
    <section className="bg-white py-20">
      <div className="px-6 lg:px-16">
        <ScrollReveal>
          <h2 className="text-center text-2xl font-bold">
            Nuestros productos
          </h2>
          <p className="mt-2 text-center text-muted">
            Los mas pedidos y las recomendaciones de nuestra IA
          </p>
        </ScrollReveal>

        {/* Tabs */}
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => setTab("destacados")}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              tab === "destacados"
                ? "bg-accent text-white shadow-sm"
                : "bg-white text-muted hover:text-foreground"
            }`}
          >
            Destacados
          </button>
          {aiPicks.length > 0 && (
            <button
              onClick={() => setTab("ai")}
              className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium transition-all ${
                tab === "ai"
                  ? "bg-accent text-white shadow-sm"
                  : "bg-white text-muted hover:text-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Picks de IA
            </button>
          )}
        </div>

        {/* Destacados */}
        {tab === "destacados" && (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((product, i) => (
              <ScrollReveal key={product.product_id} delay={i * 0.05}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* AI Picks */}
        {tab === "ai" && (
          <div>
            {aiTitle && (
              <p className="mt-4 text-center text-sm text-accent font-medium">
                {aiTitle}
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
              {aiPicks.map((pick, i) => (
                <ScrollReveal key={pick.product.product_id} delay={i * 0.05}>
                  <div className="flex flex-col h-full">
                    <ProductCard product={{ ...pick.product, reason: pick.reason }} showScore={false} />
                    {pick.reason && (
                      <div className="mt-1.5 rounded-lg bg-accent-light px-3 py-1.5">
                        <p className="text-xs text-accent font-medium text-center">
                          {pick.reason}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
