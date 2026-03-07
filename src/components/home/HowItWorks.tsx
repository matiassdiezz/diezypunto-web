"use client";

import ScrollReveal from "../shared/ScrollReveal";

const STEPS = [
  { number: "1", title: "Busca", description: "Describi lo que necesitas o explora el catalogo" },
  { number: "2", title: "Elegi", description: "Compara opciones y arma tu presupuesto" },
  { number: "3", title: "Consulta", description: "Envianos tu pedido por WhatsApp" },
  { number: "4", title: "Recibi", description: "Coordinamos produccion y entrega" },
];

export default function HowItWorks() {
  return (
    <section className="bg-card py-20">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <h2 className="text-center text-2xl font-bold">Como funciona</h2>
          <p className="mt-2 text-center text-muted">
            En 4 simples pasos tenes tu merchandising listo
          </p>
        </ScrollReveal>

        <div className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connecting line — hidden on mobile */}
          <div className="absolute top-7 left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] hidden h-0.5 bg-accent/20 lg:block" />

          {STEPS.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 0.1}>
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mt-4 text-base font-bold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
