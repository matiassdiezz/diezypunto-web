"use client";

import ScrollReveal from "../shared/ScrollReveal";
import SearchPrompt from "../search/SearchPrompt";
import TrustBar from "./TrustBar";

export default function Hero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-6 pt-24">
      <ScrollReveal>
        <h1 className="text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          El merchandising corporativo
          <br />
          <span className="text-accent">que tu marca merece</span>
        </h1>
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <p className="mx-auto mt-6 max-w-xl text-center text-lg text-muted">
          +1,400 productos listos para personalizar. Busca con tus palabras y
          encontra lo que necesitas en segundos.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.3} className="mt-10 w-full max-w-2xl">
        <SearchPrompt />
      </ScrollReveal>

      <ScrollReveal delay={0.45}>
        <TrustBar />
      </ScrollReveal>
    </section>
  );
}
