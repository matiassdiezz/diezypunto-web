"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, ArrowRight, CaretDown } from "@phosphor-icons/react";
import ScrollReveal from "../shared/ScrollReveal";

const FAQS = [
  {
    q: "¿Cuál es la cantidad mínima de pedido?",
    a: "Podés pedir desde 1 unidad por producto. Para personalización con tu logo, consultanos las opciones según la cantidad.",
  },
  {
    q: "¿Cuánto demora la entrega?",
    a: "En promedio, entre 7 y 15 días hábiles una vez aprobado el diseño.",
  },
  {
    q: "¿Qué métodos de personalización ofrecen?",
    a: "Serigrafía, bordado, grabado láser, sublimación, impresión UV, tampografía y más.",
  },
  {
    q: "¿Hacen envíos a todo el país?",
    a: "Sí, realizamos envíos a todo el territorio argentino.",
  },
  {
    q: "¿Puedo ver una muestra antes de comprar?",
    a: "Sí, podemos enviar muestras físicas o mockups digitales con tu logo.",
  },
  {
    q: "¿Cómo funciona la compra?",
    a: "Agregá productos al carrito, indicá cantidades y pagá con Mercado Pago o consultá por Telegram.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border-b border-border transition-all ${open ? "border-l-2 border-l-accent pl-3" : ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <span className={`text-sm font-medium ${open ? "text-accent" : ""}`}>
          {q}
        </span>
        <CaretDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180 text-accent" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-3 text-xs leading-relaxed text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EcoFaq() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="px-6 lg:px-16">
        <div className="mx-auto max-w-6xl grid gap-10 md:grid-cols-2 md:gap-16">
          {/* Eco — full-bleed image with overlay text */}
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl shadow-lg" style={{ minHeight: 320 }}>
              <img
                src="/eco-forest.jpg"
                alt="Vista aérea de un bosque"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
              <div className="relative flex h-full min-h-[320px] flex-col justify-end p-8">
                <h2 className="text-2xl font-bold text-white">
                  Comprometidos con el medio ambiente
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/80">
                  Productos eco-friendly fabricados con materiales reciclados,
                  bambú, corcho y algodón orgánico.
                </p>
                <Link
                  href="/catalogo?eco_friendly=true"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white hover:gap-2 transition-all"
                >
                  Ver productos eco <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* FAQ */}
          <ScrollReveal delay={0.1}>
            <div className="md:border-l md:border-border md:pl-16">
              <h3 className="text-lg font-bold">Preguntas frecuentes</h3>
              <div className="mt-4">
                {FAQS.map((faq) => (
                  <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
