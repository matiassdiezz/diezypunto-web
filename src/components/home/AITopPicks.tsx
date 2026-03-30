"use client";

import { useEffect, useState } from "react";
import { Sparkle } from "@phosphor-icons/react";
import type { AIPicksResponse, ProductResult } from "@/lib/types";
import { getProduct } from "@/lib/api";
import ProductCard from "../catalog/ProductCard";
import ScrollReveal from "../shared/ScrollReveal";

interface PickWithProduct {
  product: ProductResult;
  reason: string;
}

export default function AITopPicks() {
  const [picks, setPicks] = useState<PickWithProduct[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai-picks")
      .then((r) => r.json())
      .then(async (data: AIPicksResponse) => {
        setTitle(data.collection_title);

        // Fetch full product data for each pick
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

        setPicks(results.filter(Boolean) as PickWithProduct[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && picks.length === 0) return null;

  return (
    <section className="bg-white py-20">
      <div className="px-6 lg:px-16">
        <ScrollReveal>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-accent">
              <Sparkle className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-widest">
                Powered by Claude
              </span>
            </div>
            <h2 className="text-center text-2xl font-bold">{title || "Productos destacados"}</h2>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-square rounded-2xl bg-gray-100" />
                <div className="h-4 w-3/4 rounded bg-gray-100" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
          {picks.map((pick, i) => (
            <ScrollReveal key={pick.product.product_id} delay={i * 0.05}>
              <div className="flex flex-col h-full">
                <ProductCard product={{ ...pick.product, reason: pick.reason }} showScore={false} />
                {pick.reason && (
                  <div className="mt-2 rounded-2xl border border-white/55 bg-white/58 px-3 py-2 text-center shadow-[0_6px_20px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                    <p className="text-xs font-medium text-accent">
                      {pick.reason}
                    </p>
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}
