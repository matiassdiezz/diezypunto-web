"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listCategories } from "@/lib/api";
import type { CategoryInfo } from "@/lib/types";
import ScrollReveal from "../shared/ScrollReveal";

const CATEGORY_ICONS: Record<string, string> = {
  drinkware: "🥤",
  bolsos: "👜",
  escritura: "✏️",
  tecnologia: "💻",
  textil: "👕",
  hogar: "🏠",
  outdoor: "⛺",
  oficina: "🏢",
};

export default function CategoryShowcase() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);

  useEffect(() => {
    listCategories()
      .then((res) => setCategories(res.categories.slice(0, 8)))
      .catch(() => {});
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <ScrollReveal>
        <h2 className="text-center text-2xl font-bold">
          Explora por categoria
        </h2>
      </ScrollReveal>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((cat, i) => (
          <ScrollReveal key={cat.name} delay={i * 0.05}>
            <Link
              href={`/catalogo/${encodeURIComponent(cat.name)}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-md"
            >
              <span className="text-3xl">
                {CATEGORY_ICONS[cat.name.toLowerCase()] || "📦"}
              </span>
              <span className="text-sm font-medium">{cat.name}</span>
              <span className="text-xs text-muted">
                {cat.count} productos
              </span>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
