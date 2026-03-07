"use client";

import { motion } from "framer-motion";
import { Package, Paintbrush, Truck, Award } from "lucide-react";
import ScrollReveal from "../shared/ScrollReveal";

const PROPS = [
  {
    icon: Package,
    title: "+1,400 productos",
    description: "El catalogo mas completo de Argentina",
  },
  {
    icon: Paintbrush,
    title: "Personalizacion total",
    description: "Serigrafia, bordado, laser, sublimacion y mas",
  },
  {
    icon: Truck,
    title: "Envio a todo el pais",
    description: "Logistica a cualquier punto de Argentina",
  },
  {
    icon: Award,
    title: "+10 anos de experiencia",
    description: "Miles de empresas confian en nosotros",
  },
];

export default function ValueProps() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
        {PROPS.map((prop, i) => (
          <ScrollReveal key={prop.title} delay={i * 0.08}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-light shadow-sm">
                <prop.icon className="h-8 w-8 text-accent" />
              </div>
              <h3 className="mt-4 text-base font-bold">{prop.title}</h3>
              <p className="mt-1 text-sm text-muted">{prop.description}</p>
            </motion.div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
