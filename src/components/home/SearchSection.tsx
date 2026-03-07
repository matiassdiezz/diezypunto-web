"use client";

import { Sparkles } from "lucide-react";
import SearchPrompt from "../search/SearchPrompt";
import ScrollReveal from "../shared/ScrollReveal";

export default function SearchSection() {
  return (
    <section id="ai-search" className="bg-card py-12 scroll-mt-20">
      <div className="mx-auto max-w-2xl px-6">
        <ScrollReveal>
          <h2 className="text-center text-2xl font-bold">
            Describi lo que necesitas
          </h2>
          <p className="mt-1.5 text-center text-sm text-muted">
            Escribi en lenguaje natural — como si le hablaras a una persona
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mt-5">
            <SearchPrompt />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
