"use client";

import { useEffect, useState } from "react";
import { Sparkle } from "@phosphor-icons/react";
import { motion } from "framer-motion";
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
    <section className="section-blend bg-[#EBF7FE] py-20">
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
        <div className="mt-8 flex justify-center gap-6">
          <button
            onClick={() => setTab("destacados")}
            className={`relative px-1 pb-2 text-sm font-medium transition-colors ${
              tab === "destacados"
                ? "text-accent font-semibold"
                : "text-muted hover:text-foreground"
            }`}
          >
            Destacados
            {tab === "destacados" && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          {aiPicks.length > 0 && (
            <button
              onClick={() => setTab("ai")}
              className={`relative flex items-center gap-1.5 px-1 pb-2 text-sm font-medium transition-colors ${
                tab === "ai"
                  ? "text-accent font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Sparkle className="h-3.5 w-3.5" />
              Picks de IA
              {tab === "ai" && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
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
