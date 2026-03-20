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
      .catch(() => {});
  }, []);

  if (picks.length === 0) return null;

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
            <h2 className="text-center text-2xl font-bold">{title}</h2>
          </div>
        </ScrollReveal>

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
      </div>
    </section>
  );
}
