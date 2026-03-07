"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import SearchPrompt from "../search/SearchPrompt";
import ScrollReveal from "../shared/ScrollReveal";

export default function SearchSection() {
  return (
    <section className="bg-card py-16">
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
