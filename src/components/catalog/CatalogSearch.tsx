"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

interface CatalogSearchProps {
  value?: string;
  onChange: (value: string | undefined) => void;
}

export default function CatalogSearch({ value, onChange }: CatalogSearchProps) {
  const [local, setLocal] = useState(value ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync external value changes
  useEffect(() => {
    setLocal(value ?? "");
  }, [value]);

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
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar productos..."
        className="w-full rounded-xl border border-border bg-white py-3 pl-11 pr-10 text-sm outline-none transition-colors focus:border-accent"
      />
      {local && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
