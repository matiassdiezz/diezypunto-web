"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Package, PaintBrush, Truck, Trophy } from "@phosphor-icons/react";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { PEDIDO_EVENTO_PRESET_MESSAGE } from "@/lib/chat/chat-preset-messages";
import { useChatStore } from "@/lib/stores/chat-store";
import { CATALOG_COUNT_LABEL } from "@/lib/catalog-count";

const VALUE_POINTS = [
  { icon: Package, text: `${CATALOG_COUNT_LABEL} productos` },
  { icon: PaintBrush, text: "Serigrafía, bordado, láser y más" },
  { icon: Truck, text: "Envío a todo el país" },
  { icon: Trophy, text: "+20 años de experiencia" },
];

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };
const ease = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  const openWithMessage = useChatStore((s) => s.openWithMessage);
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 500], [0, -60]);

  return (
    <section
      ref={sectionRef}
      id="ai-search"
      className="relative min-h-[85vh] scroll-mt-20 overflow-hidden bg-white lg:min-h-[90vh]"
    >
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>

      {/* Atmospheric image — desktop: right-aligned with gradient fade */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [...ease] }}
        style={{ y: imageY }}
        className="absolute inset-y-0 right-0 hidden w-[55%] lg:block"
      >
        <Image
          src="/hero-products.jpg"
          alt="Productos de merchandising corporativo: mochila, remera, taza, botella termica, bolsa y cuaderno"
          fill
          priority
          className="object-contain object-right"
          sizes="55vw"
        />
        {/* Gradient fade left edge */}
        <div className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-white via-white/50 to-transparent" />
        {/* Gradient fade bottom */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </motion.div>

      {/* Atmospheric image — mobile: subtle background */}
      <div className="absolute inset-0 lg:hidden">
        <Image
          src="/hero-products.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-[0.06]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/80 to-white" />
      </div>

      {/* Content grid */}
      <div className="relative z-10 grid min-h-[85vh] grid-cols-1 items-center px-6 pb-16 pt-12 md:pt-16 lg:min-h-[90vh] lg:grid-cols-[1.1fr_0.8fr] lg:px-16">
        {/* Left — Double-Bezel copy container */}
        <div className="max-w-2xl">
          {/* Outer bezel */}
          <div className="rounded-2xl border border-black/[0.04] bg-white/60 p-1 backdrop-blur-sm">
            {/* Inner bezel */}
            <div className="rounded-xl bg-white/80 px-6 py-8 backdrop-blur-xl lg:px-10 lg:py-12">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0 }}
              >
                <span className="badge-shimmer inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-light px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-accent">
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
                transition={{ ...spring, delay: 0.08 }}
                className="mt-6 text-[clamp(2.25rem,6vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-foreground"
              >
                Merchandising corporativo{" "}
                <span className="gradient-text-accent">personalizado</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.14 }}
                className="mt-4 text-lg text-muted"
              >
                El catálogo más completo de Argentina para tu marca
              </motion.p>

              {/* Value points — 2x2 grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.22 }}
                className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                {VALUE_POINTS.map((vp) => (
                  <motion.div
                    key={vp.text}
                    whileHover={{ scale: 1.02 }}
                    transition={spring}
                    className="flex items-center gap-3 rounded-lg p-2.5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                      <vp.icon
                        className="h-[18px] w-[18px] text-accent"
                        weight="duotone"
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground/80">
                      {vp.text}
                    </span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.32 }}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                {/* Mobile: AI button first, catalog second. Desktop: catalog first via order */}
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={spring}
                  className="order-2 sm:order-1"
                >
                  <Link
                    href="/catalogo"
                    className="hero-cta-catalog inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 font-semibold transition-all sm:w-auto"
                  >
                    Explorar catálogo
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={spring}
                  className="order-1 sm:order-2"
                >
                  <OpenChatButton
                    className="w-full sm:w-auto"
                    onClick={() => openWithMessage(PEDIDO_EVENTO_PRESET_MESSAGE)}
                  >
                    Arma tu pedido con AI
                  </OpenChatButton>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right column — empty spacer for grid (image is absolute) */}
        <div className="hidden lg:block" />
      </div>
    </section>
  );
}
