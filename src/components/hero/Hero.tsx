"use client";

import ScrollReveal from "../shared/ScrollReveal";
import SearchPrompt from "../search/SearchPrompt";
import TrustBar from "./TrustBar";

export default function Hero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-6 pt-24">
      <ScrollReveal>
        <p className="mb-3 text-center text-sm font-medium uppercase tracking-widest text-accent">
          Busqueda inteligente
        </p>
        <h1 className="text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Describi lo que necesitas,
          <br />
          <span className="text-accent">nosotros lo encontramos</span>
        </h1>
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <p className="mx-auto mt-6 max-w-xl text-center text-lg text-muted">
          No hace falta saber el nombre del producto. Contanos para que es,
          cuantos necesitas, o que estilo buscas — y nuestro asistente te
          muestra las mejores opciones.
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
