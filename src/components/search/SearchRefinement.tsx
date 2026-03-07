"use client";

import { useState, FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { useSearchStore } from "@/lib/stores/search-store";

export default function SearchRefinement() {
  const [input, setInput] = useState("");
  const { refine, isLoading } = useSearchStore();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    refine(q);
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
      <div className="relative flex-1">
        <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/50" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Refina tu busqueda: &quot;algo mas barato&quot;, &quot;en color azul&quot;..."
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm transition-shadow placeholder:text-muted/50 focus:border-accent focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        Refinar
      </button>
    </form>
  );
}
