"use client";

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
    <section className="px-6 lg:px-16 py-20">
      <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
        {PROPS.map((prop, i) => (
          <ScrollReveal key={prop.title} delay={i * 0.08}>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light">
                <prop.icon className="h-7 w-7 text-accent" />
              </div>
              <h3 className="mt-4 text-base font-bold">{prop.title}</h3>
              <p className="mt-1 text-sm text-muted">{prop.description}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
