"use client";

import ScrollReveal from "../shared/ScrollReveal";

const CLIENTS = [
  "Globant",
  "MercadoLibre",
  "Banco Galicia",
  "YPF",
  "Telecom",
  "Arcor",
  "Techint",
  "Cerveceria Quilmes",
];

export default function LogoBar() {
  return (
    <section className="bg-card py-12">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <p className="text-center text-sm font-medium uppercase tracking-wider text-muted">
            Empresas que confian en nosotros
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {CLIENTS.map((name) => (
              <span
                key={name}
                className="text-lg font-bold text-foreground/30 transition-colors hover:text-foreground/60"
              >
                {name}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
