"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Coffee,
  Briefcase,
  PenLine,
  Laptop,
  Shirt,
  Gift,
  Palette,
  Package,
  type LucideIcon,
} from "lucide-react";
import { listCategories } from "@/lib/api";
import type { CategoryInfo } from "@/lib/types";
import ScrollReveal from "../shared/ScrollReveal";

interface CategoryStyle {
  icon: LucideIcon;
  bg: string;
  iconColor: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "Botellas y Termos": { icon: Coffee, bg: "bg-blue-50", iconColor: "text-blue-500" },
  "Mochilas y Bolsos": { icon: Briefcase, bg: "bg-violet-50", iconColor: "text-violet-500" },
  Escritura: { icon: PenLine, bg: "bg-amber-50", iconColor: "text-amber-500" },
  Tecnologia: { icon: Laptop, bg: "bg-cyan-50", iconColor: "text-cyan-500" },
  Indumentaria: { icon: Shirt, bg: "bg-rose-50", iconColor: "text-rose-500" },
  Kits: { icon: Gift, bg: "bg-emerald-50", iconColor: "text-emerald-500" },
  Escritorio: { icon: Palette, bg: "bg-orange-50", iconColor: "text-orange-500" },
};

const DEFAULT_STYLE: CategoryStyle = {
  icon: Package,
  bg: "bg-gray-50",
  iconColor: "text-gray-500",
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

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((cat, i) => {
          const style = CATEGORY_STYLES[cat.name] ?? DEFAULT_STYLE;
          const Icon = style.icon;
          return (
            <ScrollReveal key={cat.name} delay={i * 0.05}>
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Link
                  href={`/catalogo/${encodeURIComponent(cat.name)}`}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${style.bg}`}
                  >
                    <Icon className={`h-7 w-7 ${style.iconColor}`} />
                  </div>
                  <span className="text-sm font-medium">{cat.name}</span>
                  <span className="text-xs text-muted">
                    {cat.count} productos
                  </span>
                </Link>
              </motion.div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
