"use client";

import ScrollReveal from "../shared/ScrollReveal";

const STEPS = [
  { number: "1", title: "Busca", description: "Describi lo que necesitas o explora el catalogo" },
  { number: "2", title: "Elegi", description: "Compara opciones y armalas en tu carrito" },
  { number: "3", title: "Compra", description: "Paga con Mercado Pago o consulta por Telegram" },
  { number: "4", title: "Recibi", description: "Coordinamos produccion y entrega" },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#EBF7FE] py-10">
      <div className="px-6 lg:px-16">
        <ScrollReveal>
          <h2 className="text-center text-lg font-bold">Como funciona</h2>
        </ScrollReveal>

        <div className="relative mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute top-5 left-[calc(12.5%+12px)] right-[calc(12.5%+12px)] hidden h-0.5 bg-accent/20 lg:block" />

          {STEPS.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 0.08}>
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mt-2 text-sm font-bold">{step.title}</h3>
                <p className="mt-0.5 text-xs text-muted">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
