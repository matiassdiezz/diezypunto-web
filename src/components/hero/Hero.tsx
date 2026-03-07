"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Package,
  Sparkles,
  Truck,
  Coffee,
  Shirt,
  PenLine,
  Laptop,
  Gift,
  type LucideIcon,
} from "lucide-react";

function scrollToSearch() {
  const el = document.getElementById("ai-search");
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

const VALUE_POINTS = [
  { icon: Package, text: "+1,400 productos" },
  { icon: Sparkles, text: "Busqueda con AI" },
  { icon: Truck, text: "Envio a todo el pais" },
];

interface FloatCard {
  icon: LucideIcon;
  label: string;
  count: string;
  top: string;
  left: string;
  bg: string;
  iconColor: string;
  delay: number;
}

const FLOAT_CARDS: FloatCard[] = [
  { icon: Coffee, label: "Botellas y Termos", count: "+200", top: "6%", left: "6%", bg: "bg-blue-50", iconColor: "text-blue-500", delay: 0 },
  { icon: Shirt, label: "Indumentaria", count: "+180", top: "2%", left: "56%", bg: "bg-rose-50", iconColor: "text-rose-500", delay: 0.3 },
  { icon: PenLine, label: "Escritura", count: "+300", top: "42%", left: "0%", bg: "bg-amber-50", iconColor: "text-amber-500", delay: 0.6 },
  { icon: Laptop, label: "Tecnologia", count: "+120", top: "50%", left: "54%", bg: "bg-cyan-50", iconColor: "text-cyan-500", delay: 0.9 },
  { icon: Gift, label: "Kits Premium", count: "+80", top: "78%", left: "26%", bg: "bg-emerald-50", iconColor: "text-emerald-500", delay: 1.2 },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 pb-12 pt-32 md:flex-row md:items-center md:gap-8 md:pb-20 md:pt-36 lg:gap-16">
        {/* Left — Copy */}
        <div className="flex-1 text-center md:text-left">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-light px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-accent">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              Merch corporativo AI
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-tight text-foreground"
          >
            Merchandising corporativo{" "}
            <span className="text-gradient-accent">personalizado</span> para tu
            empresa
          </motion.h1>

          {/* Value points */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:gap-5 md:flex-col md:gap-2.5 lg:flex-row lg:gap-5"
          >
            {VALUE_POINTS.map((vp) => (
              <div
                key={vp.text}
                className="flex items-center justify-center gap-2 text-sm text-muted md:justify-start"
              >
                <vp.icon className="h-4 w-4 text-accent" />
                {vp.text}
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start"
          >
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20"
            >
              Explorar catalogo
            </Link>
            <button
              onClick={scrollToSearch}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border px-6 py-3 font-semibold text-foreground transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Sparkles className="h-4 w-4" />
              Buscar con AI
            </button>
          </motion.div>
        </div>

        {/* Right — Floating Product Cards */}
        <div className="hidden flex-1 md:block">
          <div className="relative h-[420px] w-full">
            {/* Central glow */}
            <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />

            {FLOAT_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  className="absolute"
                  style={{ top: card.top, left: card.left }}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 + card.delay }}
                >
                  <motion.div
                    animate={{ y: [-6, 6, -6] }}
                    transition={{
                      duration: 4 + i * 0.7,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-lg shadow-black/5 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}
                      >
                        <Icon className={`h-4 w-4 ${card.iconColor}`} />
                      </div>
                      <div>
                        <p className="whitespace-nowrap text-xs font-semibold text-foreground">
                          {card.label}
                        </p>
                        <p className="text-[10px] text-muted">
                          {card.count} productos
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
