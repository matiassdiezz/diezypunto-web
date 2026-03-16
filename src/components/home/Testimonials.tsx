"use client";

import { Star } from "lucide-react";
import ScrollReveal from "../shared/ScrollReveal";

const STATS = [
  { value: "+500", label: "Empresas atendidas" },
  { value: "+50,000", label: "Productos entregados" },
  { value: "4.9", label: "Estrellas en Google", icon: true },
];

const TESTIMONIALS = [
  {
    quote:
      "Excelente calidad y atencion. Nos armaron los kits de bienvenida en tiempo record para el onboarding de 200 personas.",
    name: "Carolina M.",
    role: "HR Manager",
    company: "Empresa de tecnologia",
  },
  {
    quote:
      "Llevamos 3 anos trabajando con ellos para todos nuestros eventos. Siempre cumplen con los plazos y la personalizacion es impecable.",
    name: "Martin R.",
    role: "Director de Marketing",
    company: "Consultora financiera",
  },
  {
    quote:
      "Nos ayudaron a encontrar opciones eco-friendly para nuestra campana de sustentabilidad. El catalogo es enorme.",
    name: "Lucia G.",
    role: "Brand Manager",
    company: "Empresa de consumo masivo",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-[#EBF7FE] px-6 lg:px-16 py-20">
      {/* Stats */}
      <ScrollReveal>
        <div className="flex flex-wrap items-center justify-center gap-12">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="flex items-center justify-center gap-1 text-3xl font-bold text-accent">
                {stat.value}
                {stat.icon && <Star className="h-6 w-6 fill-accent" />}
              </p>
              <p className="mt-1 text-sm text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Testimonial cards */}
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <ScrollReveal key={t.name} delay={i * 0.1}>
            <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-6">
              <span className="text-3xl font-bold text-accent/30">&ldquo;</span>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground/80">
                {t.quote}
              </p>
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted">
                  {t.role} — {t.company}
                </p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
