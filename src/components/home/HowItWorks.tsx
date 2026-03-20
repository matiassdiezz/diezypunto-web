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
    <section className="section-blend bg-[#EBF7FE] py-16 md:py-20">
      <div className="px-6 lg:px-16">
        <ScrollReveal>
          <h2 className="text-center text-xl md:text-2xl tracking-tight font-bold">Como funciona</h2>
          <p className="mt-1.5 text-center text-sm text-muted">Del pedido a tu oficina en 4 pasos</p>
        </ScrollReveal>

        <div className="relative mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute top-6 left-[calc(12.5%+12px)] right-[calc(12.5%+12px)] hidden h-[2px] bg-gradient-to-r from-transparent via-accent/30 to-transparent lg:block" />

          {STEPS.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 0.08}>
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-sm font-bold text-white shadow-md shadow-accent/20 ring-4 ring-accent/10">
                  {step.number}
                </div>
                <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
                <p className="mt-0.5 text-sm text-muted">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
