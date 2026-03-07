"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listCategories } from "@/lib/api";
import type { CategoryInfo } from "@/lib/types";
import ScrollReveal from "../shared/ScrollReveal";

const CATEGORY_ICONS: Record<string, string> = {
  "Botellas y Termos": "🥤",
  "Mochilas y Bolsos": "🎒",
  "Escritura": "✏️",
  "Tecnología": "💻",
  "Tecnologia": "💻",
  "Indumentaria": "👕",
  "Textil": "👕",
  "Aire Libre": "⛺",
  "Oficina": "🏢",
  "Kits": "🎁",
  "Sustentables": "🌱",
  "Ecologico": "🌱",
  "Premium": "⭐",
  "Mates": "🧉",
  "Tazas": "☕",
  "Hogar": "🏠",
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
        <p className="mt-2 text-center text-muted">
          Mas de 1,400 productos organizados para que encuentres lo que buscas
        </p>
      </ScrollReveal>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {categories.map((cat, i) => (
          <ScrollReveal key={cat.name} delay={i * 0.05}>
            <Link
              href={`/catalogo/${encodeURIComponent(cat.name)}`}
              className="flex items-center gap-2 rounded-full bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent-light hover:text-accent"
            >
              <span>{CATEGORY_ICONS[cat.name] || "📦"}</span>
              {cat.name}
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
