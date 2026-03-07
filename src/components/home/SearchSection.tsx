"use client";

import { Sparkles } from "lucide-react";
import SearchPrompt from "../search/SearchPrompt";
import ScrollReveal from "../shared/ScrollReveal";

export default function SearchSection() {
  return (
    <section
      id="ai-search"
      className="relative bg-gradient-to-b from-card to-white py-16 scroll-mt-20"
    >
      {/* Decorative top accent line */}
      <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-lg bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="mx-auto max-w-2xl px-6">
        <ScrollReveal>
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-accent">
            <Sparkles className="h-4 w-4" />
            Busqueda inteligente
          </div>
          <h2 className="mt-2 text-center text-2xl font-bold">
            Describi lo que necesitas
          </h2>
          <p className="mt-2 text-center text-muted">
            Escribi en lenguaje natural — como si le hablaras a una persona
          </p>
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
