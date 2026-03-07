"use client";

import { motion } from "framer-motion";
import ScrollReveal from "../shared/ScrollReveal";

const STEPS = [
  {
    number: "1",
    title: "Busca",
    description: "Describi lo que necesitas o explora el catalogo",
  },
  {
    number: "2",
    title: "Elegi",
    description: "Compara opciones y armalas en tu carrito",
  },
  {
    number: "3",
    title: "Compra",
    description: "Paga con Mercado Pago o consulta por WhatsApp",
  },
  {
    number: "4",
    title: "Recibi",
    description: "Coordinamos produccion y entrega",
  },
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
          {/* Connecting line — animated on scroll */}
          <motion.div
            className="absolute top-7 left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] hidden h-0.5 origin-left bg-accent/20 lg:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          />

          {STEPS.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative flex flex-col items-center text-center"
              >
                <motion.div
                  className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-bold text-white shadow-md shadow-accent/20"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  {step.number}
                </motion.div>
                <h3 className="mt-4 text-base font-bold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted">{step.description}</p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
