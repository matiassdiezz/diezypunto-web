"use client";

import { useState, FormEvent } from "react";
import { Search } from "lucide-react";
import { useSearchStore } from "@/lib/stores/search-store";
import SearchResults from "./SearchResults";
import SearchRefinement from "./SearchRefinement";
import LoadingDots from "../shared/LoadingDots";

export default function SearchPrompt() {
  const [input, setInput] = useState("");
  const { search, results, isLoading, summary, query } = useSearchStore();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    search(q);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Contanos que estas buscando..."
          className="w-full rounded-2xl border border-border bg-white px-6 py-4 pr-14 text-lg shadow-sm transition-shadow placeholder:text-muted/60 focus:border-accent focus:shadow-md focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-accent p-2.5 text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>

      {isLoading && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <LoadingDots />
          <span className="text-sm text-muted">Buscando productos...</span>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <>
          {summary && (
            <p className="mt-6 text-center text-sm text-muted">{summary}</p>
          )}
          <SearchResults products={results} />
          {query && <SearchRefinement />}
        </>
      )}

      {!isLoading && query && results.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted">
          No encontramos productos para &quot;{query}&quot;. Proba con otros
          terminos.
        </p>
      )}
    </div>
  );
}
