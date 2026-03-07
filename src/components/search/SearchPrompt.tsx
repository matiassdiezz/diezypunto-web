"use client";

import { useState, useEffect, useRef, FormEvent, useCallback } from "react";
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
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-1.5 w-1.5 rounded-full bg-[#59C6F2]"
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
          <div className="relative z-10 rounded-2xl bg-white">
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
              className="w-full resize-none bg-transparent px-5 py-5 pr-14 text-base text-[#1a1a2e] outline-none placeholder:text-gray-300 sm:text-lg"
              style={{ minHeight: "100px" }}
            />

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#59C6F2] text-white transition-all hover:bg-[#3BB5E8] hover:shadow-[0_0_20px_rgba(89,198,242,0.4)] disabled:opacity-20"
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

      {/* Example chips — only before first search */}
      {!query && !isLoading && (
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
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EBF7FE]">
                <Sparkles className="h-3.5 w-3.5 text-[#59C6F2]" />
              </span>
              <p className="text-sm leading-relaxed text-gray-600">
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
