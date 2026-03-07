"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";
import { useSearchStore } from "@/lib/stores/search-store";
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
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % EXAMPLES.length);
        setVisible(true);
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
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
          className="pointer-events-none absolute left-5 top-5 text-base text-zinc-500 sm:text-lg"
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
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-1.5 w-1.5 rounded-full bg-blue-400"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={msgIndex}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2 }}
          className="text-sm text-zinc-400"
        >
          {LOADING_MESSAGES[msgIndex]}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

export default function SearchPrompt() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { search, results, isLoading, summary, query } = useSearchStore();

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

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  const hasResults = !isLoading && results.length > 0;
  const noResults = !isLoading && query && results.length === 0;

  return (
    <div className="w-full">
      {/* Search input with animated glow border */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="search-glow-wrapper">
          <div className="relative z-10 rounded-2xl bg-[#0a0a1a]/80 backdrop-blur-xl">
            {/* Rotating placeholder (only when input is empty and no results) */}
            {!input && !hasResults && <RotatingPlaceholder />}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="w-full resize-none bg-transparent px-5 py-5 pr-14 text-base text-white outline-none placeholder:text-zinc-600 sm:text-lg"
              style={{ minHeight: "60px" }}
            />

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] disabled:opacity-20"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Hint */}
        {!hasResults && !isLoading && (
          <p className="mt-3 text-center text-xs text-zinc-600">
            Escribi en lenguaje natural — como si le hablaras a una persona
          </p>
        )}
      </form>

      {/* Example chips — only before first search */}
      {!query && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8"
        >
          <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-zinc-600">
            Proba con algo como
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLES.slice(0, 4).map((ex) => (
              <button
                key={ex}
                onClick={() => handleExample(ex)}
                className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5 text-xs text-zinc-400 backdrop-blur-sm transition-all hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300"
              >
                {ex.length > 45 ? ex.slice(0, 45) + "..." : ex}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && <LoadingState />}

      {/* Results */}
      {hasResults && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* AI summary */}
          {summary && (
            <div className="mt-8 flex items-start gap-2.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              </span>
              <p className="text-sm leading-relaxed text-zinc-300">
                {summary}
              </p>
            </div>
          )}

          <SearchResults products={results} />
          <SearchRefinement />
        </motion.div>
      )}

      {/* No results */}
      {noResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-zinc-400">
            No encontramos productos para esa busqueda.
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Proba describiendolo de otra forma o con menos detalles.
          </p>
        </motion.div>
      )}
    </div>
  );
}
