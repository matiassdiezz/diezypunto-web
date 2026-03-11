"use client";

import Link from "next/link";
import {
  PenLine,
  GlassWater,
  Backpack,
  Laptop,
  Building2,
  TreePine,
  Leaf,
  Key,
  Umbrella,
  Shirt,
  Heart,
  type LucideIcon,
} from "lucide-react";
import ScrollReveal from "../shared/ScrollReveal";

// Curated subset of catalog categories — intentionally excludes low-volume or
// niche categories (Cocina, Coolers, Cuadernos, General, Gorros, Packaging, Uniformes, Verano, Viajes).
// Names must match catalog.json categories exactly (including accents).
const CATEGORIES: { name: string; icon: LucideIcon }[] = [
  { name: "Escritura", icon: PenLine },
  { name: "Drinkware", icon: GlassWater },
  { name: "Bolsos y Mochilas", icon: Backpack },
  { name: "Tecnología", icon: Laptop },
  { name: "Escritorio", icon: Building2 },
  { name: "Hogar y Tiempo Libre", icon: TreePine },
  { name: "Sustentables", icon: Leaf },
  { name: "Llaveros", icon: Key },
  { name: "Paraguas", icon: Umbrella },
  { name: "Apparel", icon: Shirt },
  { name: "Mates, termos y materas", icon: Heart },
];

export default function CategoryShowcase() {
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
        {CATEGORIES.map((cat, i) => (
          <ScrollReveal key={cat.name} delay={i * 0.05}>
            <Link
              href={`/catalogo/${encodeURIComponent(cat.name)}`}
              className="flex items-center gap-2 rounded-full bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent-light hover:text-accent"
            >
              <cat.icon className="h-4 w-4" />
              {cat.name}
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
