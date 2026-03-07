"use client";

import { Sparkles } from "lucide-react";
import SearchPrompt from "../search/SearchPrompt";
import ScrollReveal from "../shared/ScrollReveal";

export default function SearchSection() {
  return (
    <section
      id="ai-search"
      className="scroll-mt-20 bg-gradient-to-b from-[#f1f5f9] via-[#f5f7fa] to-white py-16"
    >
      <div className="mx-auto max-w-2xl px-6">
        <ScrollReveal>
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
