"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretDown } from "@phosphor-icons/react";
import ScrollReveal from "../shared/ScrollReveal";

const FAQS = [
  {
    q: "Cual es la cantidad minima de pedido?",
    a: "La cantidad mínima varía según el producto (generalmente entre 10 y 50 unidades). Cada producto indica su mínimo en el catálogo. Para cantidades menores, consultanos y vemos opciones.",
  },
  {
    q: "Cuanto demora la entrega?",
    a: "Los tiempos varian segun el producto y la personalizacion. En promedio, entre 7 y 15 dias habiles una vez aprobado el diseno. Para pedidos urgentes, consulta disponibilidad.",
  },
  {
    q: "Que metodos de personalizacion ofrecen?",
    a: "Serigrafia, bordado, grabado laser, sublimacion, impresion UV, tampografia y mas. Cada producto indica los metodos disponibles.",
  },
  {
    q: "Hacen envios a todo el pais?",
    a: "Si, realizamos envios a todo el territorio argentino. Los costos de envio se calculan segun destino y volumen del pedido.",
  },
  {
    q: "Puedo ver una muestra antes de comprar?",
    a: "Si, podemos enviar muestras fisicas o virtuales (mockups digitales con tu logo) antes de confirmar el pedido.",
  },
  {
    q: "Como funciona la compra?",
    a: "Agrega productos al carrito desde el catalogo, indica las cantidades y paga con Mercado Pago o consulta por Telegram. Te respondemos en menos de 24 horas.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className={`font-medium ${open ? "text-accent" : ""}`}>{q}</span>
        <CaretDown
          className={`h-5 w-5 shrink-0 text-muted transition-transform ${open ? "rotate-180 text-accent" : ""}`}
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
            <p className="pb-5 text-sm leading-relaxed text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Faq() {
  return (
    <section className="bg-white mx-auto max-w-3xl px-6 lg:px-16 py-20">
      <ScrollReveal>
        <h2 className="text-center text-2xl font-bold">
          Preguntas frecuentes
        </h2>
        <p className="mt-2 text-center text-muted">
          Todo lo que necesitas saber antes de hacer tu pedido
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="mt-10">
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
