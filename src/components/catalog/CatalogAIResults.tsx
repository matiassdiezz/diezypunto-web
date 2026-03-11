"use client";

import { motion } from "framer-motion";
import { Sparkles, AlertCircle, RotateCcw } from "lucide-react";
import { useSearchStore } from "@/lib/stores/search-store";
import LoadingDots from "@/components/shared/LoadingDots";
import SearchResults from "@/components/search/SearchResults";
import SearchRefinement from "@/components/search/SearchRefinement";

export default function CatalogAIResults() {
  const { results, summary, isLoading, error, searchTime, query, search, clear } =
    useSearchStore();

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-3 py-20"
      >
        <LoadingDots />
        <span className="text-sm text-muted">Buscando con AI...</span>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-20 text-center"
      >
        <div className="flex items-center justify-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={() => query && search(query)}
          className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-600 transition-all hover:bg-red-50"
        >
          Reintentar
        </button>
      </motion.div>
    );
  }

  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-20 text-center"
      >
        <p className="text-muted">No encontramos productos para esa búsqueda.</p>
        <p className="mt-1 text-sm text-muted">
          Probá describiéndolo de otra forma o con menos detalles.
        </p>
        <button
          onClick={clear}
          className="mt-4 flex mx-auto items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm text-muted transition-all hover:border-accent/40 hover:text-accent"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Volver al catálogo
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* AI summary + metadata */}
      <div>
        {summary && (
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-light">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
            </span>
            <p className="text-sm leading-relaxed text-muted">{summary}</p>
          </div>
        )}
        <p className="mt-2 text-center text-xs text-muted">
          {results.length} producto{results.length !== 1 ? "s" : ""}
          {searchTime !== null && ` · ${(searchTime / 1000).toFixed(1)}s`}
        </p>
      </div>

      <SearchResults products={results} />

      <div>
        <SearchRefinement />

        <div className="mt-4 flex justify-center">
          <button
            onClick={clear}
            className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm text-muted transition-all hover:border-accent/40 hover:text-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Volver al catálogo
          </button>
        </div>
      </div>
    </motion.div>
  );
}
