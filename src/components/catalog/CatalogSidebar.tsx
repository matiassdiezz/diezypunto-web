"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { listCategories } from "@/lib/api";
import type { CategoryInfo } from "@/lib/types";
import type { CatalogFilters } from "@/lib/hooks/use-catalog-filters";

const PERSONALIZATION_OPTIONS = [
  "Serigrafia",
  "Bordado",
  "Laser",
  "Sublimacion",
  "Tampografia",
];

interface CatalogSidebarProps {
  filters: CatalogFilters;
  setFilter: (key: string, value: string | boolean | number | undefined) => void;
  open: boolean;
  onClose: () => void;
}

export default function CatalogSidebar({
  filters,
  setFilter,
  open,
  onClose,
}: CatalogSidebarProps) {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);

  useEffect(() => {
    listCategories()
      .then((res) => setCategories(res.categories))
      .catch(console.error);
  }, []);

  const [minPrice, setMinPrice] = useState(filters.min_price?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(filters.max_price?.toString() ?? "");

  useEffect(() => {
    setMinPrice(filters.min_price?.toString() ?? "");
    setMaxPrice(filters.max_price?.toString() ?? "");
  }, [filters.min_price, filters.max_price]);

  function applyPrice() {
    setFilter("min_price", minPrice ? Number(minPrice) : undefined);
    setFilter("max_price", maxPrice ? Number(maxPrice) : undefined);
  }

  const content = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Categorias
        </h3>
        <div className="mt-3 space-y-1">
          <button
            onClick={() => setFilter("category", undefined)}
            className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
              !filters.category
                ? "bg-accent-light font-medium text-accent"
                : "text-foreground hover:bg-surface"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setFilter("category", cat.name)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                filters.category === cat.name
                  ? "bg-accent-light font-medium text-accent"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              <span>{cat.name}</span>
              {cat.count > 0 && (
                <span className="text-xs text-muted">{cat.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Precio
        </h3>
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <button
          onClick={applyPrice}
          className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface"
        >
          Aplicar
        </button>
      </div>

      {/* Type */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Tipo
        </h3>
        <div className="mt-3 space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!filters.eco_friendly}
              onChange={(e) =>
                setFilter("eco_friendly", e.target.checked || undefined)
              }
              className="h-4 w-4 rounded border-border accent-accent"
            />
            Eco-friendly
          </label>
        </div>
      </div>

      {/* Personalization */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Personalizacion
        </h3>
        <div className="mt-3 space-y-2">
          {PERSONALIZATION_OPTIONS.map((method) => (
            <label
              key={method}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={filters.personalization === method}
                onChange={(e) =>
                  setFilter(
                    "personalization",
                    e.target.checked ? method : undefined,
                  )
                }
                className="h-4 w-4 rounded border-border accent-accent"
              />
              {method}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-[250px] shrink-0 lg:block">
        {content}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-[300px] flex-col bg-white p-5 shadow-xl sm:p-6 lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filtros</h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 hover:bg-surface"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{content}</div>
              <button
                onClick={onClose}
                className="mt-4 w-full rounded-xl bg-accent py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Aplicar filtros
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
