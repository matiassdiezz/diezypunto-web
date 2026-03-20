"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkle, ArrowUp, ArrowRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import {
  OPEN_CHAT_SUBMIT_BTN_CLASS,
  OpenChatSubmitOrb,
} from "@/components/chat/OpenChatButton";
import ScrollReveal from "../shared/ScrollReveal";

const EXAMPLES = [
  "100 botellas termicas eco para un evento corporativo",
  "kits de bienvenida premium para nuevos empleados",
  "mochilas con bordado para el equipo de ventas",
  "regalos ejecutivos para fin de ano, presupuesto alto",
];

// Offset dot-grid — looks like a neural network / constellation
function buildAsciiGrid(): string {
  const rows: string[] = [];
  for (let i = 0; i < 18; i++) {
    const offset = i % 2 === 0 ? "" : "      ";
    rows.push(offset + "·           ".repeat(10));
  }
  return rows.join("\n");
}
const ASCII_BG = buildAsciiGrid();

export default function SearchSection() {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  function navigateToSearch(query: string) {
    router.push(`/catalogo?search=${encodeURIComponent(query)}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    navigateToSearch(q);
    setInput("");
  }

  function handleExample(example: string) {
    navigateToSearch(example);
  }

  return (
    <section
      id="ai-search"
      className="relative scroll-mt-20 overflow-hidden bg-white py-16"
    >
      {/* ASCII background texture */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        aria-hidden="true"
      >
        <pre className="whitespace-pre font-mono text-[11px] leading-[2.2] text-foreground/[0.05]">
          {ASCII_BG}
        </pre>
      </div>

      <div className="relative z-10 px-6 lg:px-16">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-accent">
              <Sparkle className="h-4 w-4" />
              Busqueda inteligente
            </div>
            <h2 className="mt-3 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Pedi con <span className="gradient-text-accent">AI</span>
            </h2>
            <p className="mt-3 text-center text-muted">
              Escribi lo que necesitas como si le hablaras a una persona
              <br className="hidden sm:block" />y te mostramos las mejores
              opciones al instante
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mx-auto mt-8 max-w-2xl">
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
                <div className="relative z-10 rounded-2xl border border-border bg-white">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    rows={3}
                    placeholder="Describe lo que necesitas..."
                    className="w-full resize-none bg-transparent px-5 py-5 pr-14 text-base text-foreground outline-none placeholder:text-gray-300 sm:text-lg"
                    style={{ minHeight: "100px" }}
                  />
                  <motion.button
                    type="submit"
                    disabled={!input.trim()}
                    className={`absolute bottom-3 right-3 ${OPEN_CHAT_SUBMIT_BTN_CLASS}`}
                    animate={{ scale: focused && input.trim() ? 1.06 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <OpenChatSubmitOrb />
                    <ArrowUp className="h-5 w-5 shrink-0" strokeWidth={2.25} />
                  </motion.button>
                </div>
              </motion.div>
            </form>

            {/* Example chips */}
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
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => handleExample(ex)}
                    className="group flex items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2.5 text-left text-xs leading-relaxed text-foreground/80 shadow-sm transition-all hover:border-accent/40 hover:bg-accent-light hover:text-accent hover:shadow-md md:px-4 md:py-3 md:text-sm"
                  >
                    <span className="flex-1">{ex}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:opacity-60" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
