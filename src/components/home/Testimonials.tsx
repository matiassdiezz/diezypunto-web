"use client";

import { useRef, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { motion, useInView } from "framer-motion";
import ScrollReveal from "../shared/ScrollReveal";

const STATS = [
  { target: 500, prefix: "+", label: "Empresas atendidas" },
  { target: 50000, prefix: "+", label: "Productos entregados" },
  { target: 4.9, prefix: "", label: "Estrellas en Google", icon: true },
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

function AnimatedStat({
  target,
  prefix,
  label,
  icon,
}: {
  target: number;
  prefix: string;
  label: string;
  icon?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const isDecimal = target % 1 !== 0;

  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const start = Date.now();
    let frame: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(
        isDecimal
          ? Math.round(eased * target * 10) / 10
          : Math.round(eased * target),
      );
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isInView, target, isDecimal]);

  const formatted = isDecimal
    ? count.toFixed(1)
    : count.toLocaleString("es-AR");

  return (
    <div ref={ref} className="text-center">
      <p className="flex items-center justify-center gap-1 text-3xl font-bold text-accent">
        {prefix}
        {formatted}
        {icon && <Star className="h-6 w-6 fill-accent" />}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      {/* Stats */}
      <ScrollReveal>
        <div className="flex flex-wrap items-center justify-center gap-12">
          {STATS.map((stat) => (
            <AnimatedStat
              key={stat.label}
              target={stat.target}
              prefix={stat.prefix}
              label={stat.label}
              icon={stat.icon}
            />
          ))}
        </div>
      </ScrollReveal>

      {/* Testimonial cards */}
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <ScrollReveal key={t.name} delay={i * 0.1}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-3xl font-bold text-accent/30">
                &ldquo;
              </span>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground/80">
                {t.quote}
              </p>
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted">
                  {t.role} — {t.company}
                </p>
              </div>
            </motion.div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
