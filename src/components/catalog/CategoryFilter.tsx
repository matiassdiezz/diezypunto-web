"use client";

import Link from "next/link";
import type { CategoryInfo } from "@/lib/types";

export default function CategoryFilter({
  categories,
  active,
}: {
  categories: CategoryInfo[];
  active?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/catalogo"
        className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
          !active
            ? "bg-accent text-white"
            : "bg-surface text-muted hover:bg-border"
        }`}
      >
        Todos
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.name}
          href={`/catalogo/${encodeURIComponent(cat.name)}`}
          className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
            active === cat.name
              ? "bg-accent text-white"
              : "bg-surface text-muted hover:bg-border"
          }`}
        >
          {cat.name} ({cat.count})
        </Link>
      ))}
    </div>
  );
}
