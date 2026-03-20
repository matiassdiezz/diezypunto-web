"use client";

import { SlidersHorizontal, X } from "@phosphor-icons/react";
import type { CatalogFilters, SortOption } from "@/lib/hooks/use-catalog-filters";

interface CatalogToolbarProps {
  total: number;
  filters: CatalogFilters;
  setFilter: (key: string, value: string | boolean | number | undefined) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  onOpenFilters: () => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevancia", label: "Relevancia" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "name_asc", label: "Nombre A-Z" },
];

function filterLabel(key: string, value: unknown): string {
  switch (key) {
    case "category":
      return String(value);
    case "search":
      return `"${value}"`;
    case "min_price":
      return `Desde $${value}`;
    case "max_price":
      return `Hasta $${value}`;
    case "eco_friendly":
      return "Eco-friendly";
    case "personalization":
      return String(value);
    default:
      return String(value);
  }
}

export default function CatalogToolbar({
  total,
  filters,
  setFilter,
  clearFilters,
  activeFilterCount,
  onOpenFilters,
}: CatalogToolbarProps) {
  const activeFilters = (
    ["category", "search", "min_price", "max_price", "eco_friendly", "personalization"] as const
  ).filter((k) => {
    const v = filters[k as keyof CatalogFilters];
    return v !== undefined && v !== false;
  });

  return (
    <div className="space-y-3">
      {/* Top row: filter toggle + count + sort */}
      <div className="flex items-center gap-3">
        {/* Mobile filter toggle */}
        <button
          onClick={onOpenFilters}
          className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm transition-colors hover:bg-surface lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Results count */}
        <p className="text-sm text-muted">
          {total} producto{total !== 1 ? "s" : ""}
          {filters.category ? ` en ${filters.category}` : ""}
        </p>

        {/* Sort — push right */}
        <div className="ml-auto">
          <select
            value={filters.sort ?? "relevancia"}
            onChange={(e) =>
              setFilter(
                "sort",
                e.target.value === "relevancia" ? undefined : e.target.value,
              )
            }
            className="rounded-lg border border-border bg-white px-2 py-2 text-sm outline-none focus:border-accent sm:px-3"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filter pills — second row */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key, undefined)}
              className="flex items-center gap-1 rounded-full bg-accent-light px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
            >
              {filterLabel(key, filters[key as keyof CatalogFilters])}
              <X className="h-3 w-3" />
            </button>
          ))}
          {activeFilters.length > 1 && (
            <button
              onClick={clearFilters}
              className="px-2 py-1 text-xs text-muted hover:text-foreground"
            >
              Limpiar todo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
