"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Star } from "@phosphor-icons/react";
import ScrollReveal from "../shared/ScrollReveal";

function AnimatedCounter({ value, duration = 1500 }: { value: string; duration?: number }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  // Parse prefix (+), numeric part, suffix (decimal, comma portions)
  const prefix = value.startsWith("+") ? "+" : "";
  const numericStr = value.replace(/[^0-9.]/g, "");
  const target = parseFloat(numericStr);
  const hasDecimal = numericStr.includes(".");
  const hasComma = value.includes(",");

  const formatNumber = useCallback(
    (n: number) => {
      if (hasDecimal) return n.toFixed(1);
      if (hasComma) {
        const str = Math.round(n).toString();
        return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
      return Math.round(n).toString();
    },
    [hasDecimal, hasComma]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();

          function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(formatNumber(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, formatNumber]);

  return (
    <span ref={ref}>
      {prefix}{display}
    </span>
  );
}

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
    <section className="bg-white px-6 lg:px-16 py-14">
      <ScrollReveal>
        <h2 className="text-center text-xl md:text-2xl tracking-tight font-bold">Reseñas</h2>
        <p className="mt-1.5 text-center text-sm text-muted">Lo que dicen nuestros clientes</p>
      </ScrollReveal>

      {/* Stats */}
      <ScrollReveal>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-12 md:gap-16">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="flex items-center justify-center gap-1 text-3xl md:text-4xl font-bold text-accent">
                <AnimatedCounter value={stat.value} />
                {stat.icon && <Star className="h-6 w-6 fill-accent" />}
              </p>
              <p className="mt-0.5 text-xs text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Testimonial cards */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <ScrollReveal key={t.name} delay={i * 0.1}>
            <div className="flex h-full flex-col rounded-xl border border-border bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5 hover:border-accent/20">
              <span className="text-4xl text-accent/20 font-serif">&ldquo;</span>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-foreground/80">
                {t.quote}
              </p>
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-xs font-semibold">{t.name}</p>
                <p className="text-[10px] text-muted">
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
