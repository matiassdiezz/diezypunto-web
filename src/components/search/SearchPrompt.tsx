"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Sparkles, RotateCcw, AlertCircle, Clock } from "lucide-react";
import { useSearchStore } from "@/lib/stores/search-store";
import LoadingDots from "../shared/LoadingDots";
import SearchResults from "./SearchResults";
import SearchRefinement from "./SearchRefinement";

const EXAMPLES = [
  "100 botellas termicas eco para un evento corporativo",
  "kits de bienvenida premium para nuevos empleados",
  "algo barato y en cantidad para una feria, menos de $2000",
  "mochilas con bordado para el equipo de ventas",
  "regalos ejecutivos para fin de ano, presupuesto alto",
  "remeras deportivas para una maraton de 200 personas",
];

const LOADING_MESSAGES = [
  "Entendiendo tu pedido...",
  "Buscando en el catalogo...",
  "Rankeando las mejores opciones...",
];

function RotatingPlaceholder() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let fadeTimeout: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      setVisible(false);
      fadeTimeout = setTimeout(() => {
        setIndex((i) => (i + 1) % 4);
        setVisible(true);
      }, 300);
    }, 3500);
    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimeout);
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 0.3, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none absolute left-5 top-5 right-14 text-base leading-relaxed text-gray-400 sm:text-lg"
        >
          {EXAMPLES[index]}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function LoadingState() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (msgIndex >= LOADING_MESSAGES.length - 1) return;
    const timer = setTimeout(
      () => setMsgIndex((i) => i + 1),
      800 + Math.random() * 400,
    );
    return () => clearTimeout(timer);
  }, [msgIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 flex items-center justify-center gap-3"
    >
      <LoadingDots />
      <AnimatePresence mode="wait">
        <motion.span
          key={msgIndex}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2 }}
          className="text-sm text-gray-500"
        >
          {LOADING_MESSAGES[msgIndex]}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

export default function SearchPrompt() {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const prevLoadingRef = useRef(false);
  const {
    search,
    results,
    isLoading,
    summary,
    query,
    error,
    searchTime,
    clear,
    getHistory,
  } = useSearchStore();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || isLoading) return;
    search(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExample = (example: string) => {
    setInput(example);
    search(example);
  };

  const handleNewSearch = () => {
    clear();
    setInput("");
    textareaRef.current?.focus();
  };

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    requestAnimationFrame(() => {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    });
  }, [input]);

  // Auto-scroll to results when search completes
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading && results.length > 0) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, results.length]);

  const hasResults = !isLoading && results.length > 0;
  const noResults = !isLoading && query && results.length === 0 && !error;
  const history = getHistory();
  const showHistory = !query && !isLoading && history.length > 0;

  return (
    <div className="w-full">
      {/* Search input with animated glow border */}
      <div className="mx-auto max-w-2xl">
        <form onSubmit={handleSubmit} className="relative">
          <motion.div
            className="search-glow-wrapper"
            animate={{
              scale: focused ? 1.02 : 1,
              boxShadow: focused
                ? "0 8px 40px rgba(89,198,242,0.2)"
                : "0 4px 24px rgba(89,198,242,0.08)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="relative z-10 rounded-2xl border border-foreground/30 bg-white">
              {/* Rotating placeholder (only when input is empty and no results) */}
              {!input && !hasResults && <RotatingPlaceholder />}

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                rows={3}
                className="w-full resize-none bg-transparent px-5 py-5 pr-14 text-base text-foreground outline-none placeholder:text-gray-300 sm:text-lg"
                style={{ minHeight: "100px" }}
              />

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white transition-all hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(89,198,242,0.4)] disabled:opacity-20"
                animate={{
                  scale: focused && input.trim() ? 1.1 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <ArrowUp className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>
        </form>

        {/* Search history chips — when no active query and history exists */}
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-8"
          >
            <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-gray-400">
              Busquedas recientes
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {history.map((q) => (
                <button
                  key={q}
                  onClick={() => handleExample(q)}
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs text-gray-500 transition-all hover:border-accent hover:bg-accent-light hover:text-accent hover:shadow-sm"
                >
                  <Clock className="h-3 w-3" />
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Example chips — only before first search and no history */}
        {!query && !isLoading && history.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-8"
          >
            <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-gray-400">
              Proba con algo como
            </p>
            <div className="grid grid-cols-2 gap-2">
              {EXAMPLES.slice(0, 4).map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleExample(ex)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs leading-relaxed text-gray-500 text-left transition-all hover:border-accent hover:bg-accent-light hover:text-accent hover:shadow-sm"
                >
                  {ex}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {isLoading && <LoadingState />}
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-8 max-w-2xl text-center"
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
      )}

      {/* Results (full width for 3-col grid) */}
      {hasResults && (
        <motion.div
          ref={resultsRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* AI summary + metadata */}
          <div className="mx-auto max-w-2xl">
            {summary && (
              <div className="mt-8 flex items-start gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-light">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                </span>
                <p className="text-sm leading-relaxed text-gray-600">
                  {summary}
                </p>
              </div>
            )}
            {/* Result count + timing */}
            <p className="mt-2 text-center text-xs text-gray-400">
              {results.length} producto{results.length !== 1 ? "s" : ""}
              {searchTime !== null && ` · ${(searchTime / 1000).toFixed(1)}s`}
            </p>
          </div>

          <SearchResults products={results} />

          <div className="mx-auto max-w-2xl">
            <SearchRefinement />

            {/* Nueva busqueda button */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleNewSearch}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 transition-all hover:border-accent/40 hover:text-accent"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Nueva busqueda
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* No results */}
      {noResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto mt-8 max-w-2xl text-center"
        >
          <p className="text-gray-500">
            No encontramos productos para esa busqueda.
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Proba describiendolo de otra forma o con menos detalles.
          </p>
        </motion.div>
      )}
    </div>
  );
}
