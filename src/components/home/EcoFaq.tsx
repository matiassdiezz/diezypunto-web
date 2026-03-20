"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, ArrowRight, CaretDown } from "@phosphor-icons/react";
import ScrollReveal from "../shared/ScrollReveal";

const FAQS = [
  {
    q: "Cual es la cantidad minima de pedido?",
    a: "Podes pedir desde 1 unidad por producto. Para personalización con tu logo, consultanos las opciones segun la cantidad.",
  },
  {
    q: "Cuanto demora la entrega?",
    a: "En promedio, entre 7 y 15 dias habiles una vez aprobado el diseno.",
  },
  {
    q: "Que metodos de personalizacion ofrecen?",
    a: "Serigrafia, bordado, grabado laser, sublimacion, impresion UV, tampografia y mas.",
  },
  {
    q: "Hacen envios a todo el pais?",
    a: "Si, realizamos envios a todo el territorio argentino.",
  },
  {
    q: "Puedo ver una muestra antes de comprar?",
    a: "Si, podemos enviar muestras fisicas o mockups digitales con tu logo.",
  },
  {
    q: "Como funciona la compra?",
    a: "Agrega productos al carrito, indica cantidades y paga con Mercado Pago o consulta por Telegram.",
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
          {/* Eco */}
          <ScrollReveal>
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-eco/15 to-eco/5 shadow-sm shadow-eco/10">
                <Leaf className="h-7 w-7 text-eco" />
              </div>
              <h3 className="mt-4 text-lg font-bold">
                Comprometidos con el medio ambiente
              </h3>
              <p className="mt-2 text-sm text-muted">
                Contamos con una linea de productos eco-friendly fabricados con
                materiales reciclados, bambu, corcho y algodon organico.
                Personaliza tu marca con responsabilidad.
              </p>
              <Link
                href="/catalogo?eco_friendly=true"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-eco hover:gap-2 transition-all"
              >
                Ver productos eco <ArrowRight className="h-4 w-4" />
              </Link>
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
