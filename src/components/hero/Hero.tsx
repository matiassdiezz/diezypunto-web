"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Package, Sparkles, Truck, Wand2 } from "lucide-react";
import { useAdvisorStore } from "@/lib/stores/advisor-store";

function scrollToSearch() {
  const el = document.getElementById("ai-search");
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

const VALUE_POINTS = [
  { icon: Package, text: "+1,400 productos" },
  { icon: Sparkles, text: "Busqueda con AI" },
  { icon: Truck, text: "Envio a todo el pais" },
];

export default function Hero() {
  const openAdvisor = useAdvisorStore((s) => s.open);

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Background orbs — kept subtle */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-12 px-6 lg:px-16 pb-12 pt-32 md:flex-row md:items-center md:gap-8 md:pb-20 md:pt-36 lg:gap-16">
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
            <span className="text-accent">personalizado</span> para tu empresa
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
                className="flex items-center gap-2 text-sm text-muted justify-center md:justify-start"
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
              onClick={openAdvisor}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border px-6 py-3 font-semibold text-foreground transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Wand2 className="h-4 w-4" />
              Arma tu pedido con AI
            </button>
          </motion.div>
        </div>

        {/* Right — Product image (hidden on mobile) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="hidden flex-1 md:block"
        >
          <Image
            src="/hero-products.jpg"
            alt="Productos de merchandising corporativo: mochila, remera, taza, botella termica, bolsa y cuaderno"
            width={600}
            height={600}
            priority
            className="w-full max-w-lg mx-auto"
          />
        </motion.div>
      </div>
    </section>
  );
}
