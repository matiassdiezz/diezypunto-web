"use client";

import { useState, FormEvent } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { useSearchStore } from "@/lib/stores/search-store";

const REFINE_SUGGESTIONS = [
  "algo mas barato",
  "en color azul",
  "que sea eco-friendly",
  "con bordado",
];

export default function SearchRefinement() {
  const [input, setInput] = useState("");
  const { refine, isLoading } = useSearchStore();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || isLoading) return;
    refine(q);
    setInput("");
  };

  const handleSuggestion = (suggestion: string) => {
    refine(suggestion);
  };

  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pedile que ajuste los resultados..."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-foreground transition-all placeholder:text-gray-400 focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-all hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(89,198,242,0.4)] disabled:opacity-20"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {REFINE_SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSuggestion(s)}
            disabled={isLoading}
            className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 transition-all hover:border-accent/40 hover:text-accent-hover disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
