"use client";

import { Sparkles } from "lucide-react";
import SearchPrompt from "../search/SearchPrompt";
import ScrollReveal from "../shared/ScrollReveal";

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
  return (
    <section
      id="ai-search"
      className="relative scroll-mt-20 overflow-hidden bg-[#EBF7FE] py-16"
    >
      {/* ASCII background texture */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        aria-hidden="true"
      >
        <pre className="whitespace-pre font-mono text-[11px] leading-[2.2] text-foreground/[0.035]">
          {ASCII_BG}
        </pre>
      </div>

      <div className="relative z-10 px-6 lg:px-16">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-accent">
              <Sparkles className="h-4 w-4" />
              Busqueda inteligente
            </div>
            <h2 className="mt-3 text-center text-3xl font-bold sm:text-4xl">
              Pedi con <span className="text-accent">AI</span>
            </h2>
            <p className="mt-3 text-center text-muted">
              Escribi lo que necesitas como si le hablaras a una persona
              <br className="hidden sm:block" />
              y te mostramos las mejores opciones al instante
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mt-8">
            <SearchPrompt />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
