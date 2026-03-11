"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import { useSearchStore } from "@/lib/stores/search-store";

interface CatalogAISearchProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  categoryContext?: string;
}

export default function CatalogAISearch({
  value,
  onChange,
  categoryContext,
}: CatalogAISearchProps) {
  const [local, setLocal] = useState(value ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { search, isLoading, query: aiQuery, clear } = useSearchStore();

  // Clear AI state on mount so catalog always starts in browse mode
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      clear();
    }
  }, [clear]);

  // Sync external value changes
  useEffect(() => {
    if (!aiQuery) {
      setLocal(value ?? "");
    }
  }, [value, aiQuery]);

  function handleChange(v: string) {
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(v || undefined);
    }, 300);
  }

  function handleClear() {
    setLocal("");
    clearTimeout(timerRef.current);
    onChange(undefined);
    clear();
  }

  function triggerAI() {
    const q = local.trim();
    if (!q || isLoading) return;
    const fullQuery = categoryContext
      ? `En la categoría ${categoryContext}: ${q}`
      : q;
    search(fullQuery);
    // Clear text filter since AI is taking over
    clearTimeout(timerRef.current);
    onChange(undefined);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      triggerAI();
    }
  }

  const hasText = local.length > 0;
  const aiActive = !!aiQuery;

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          aiActive
            ? "Búsqueda AI activa — escribí para buscar de nuevo"
            : "Buscar productos... (Enter para buscar con AI)"
        }
        className={`w-full rounded-xl border bg-white py-3 pl-11 pr-24 text-sm outline-none transition-colors ${
          aiActive
            ? "border-accent"
            : "border-border focus:border-accent"
        }`}
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {hasText && (
          <button
            onClick={triggerAI}
            disabled={isLoading}
            className={`rounded-lg p-1.5 text-accent transition-all hover:bg-accent-light ${
              isLoading ? "animate-pulse" : ""
            }`}
            title="Buscar con AI"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        )}
        {(hasText || aiActive) && (
          <button
            onClick={handleClear}
            className="rounded-full p-1 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
