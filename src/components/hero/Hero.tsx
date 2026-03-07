"use client";

import { motion } from "framer-motion";
import SearchPrompt from "../search/SearchPrompt";

export default function Hero() {
  return (
    <section className="relative bg-[#050510]">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.04,
          }}
        />

        {/* Film grain */}
        <div className="grain-overlay absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-16 pt-32">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-blue-400/90 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-400" />
            </span>
            Busqueda inteligente
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl text-center text-[clamp(2.25rem,7vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-white"
        >
          Describi lo que necesitas,{" "}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            nosotros lo encontramos
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-lg text-center text-base leading-relaxed text-zinc-400 sm:text-lg"
        >
          Contanos para que es, cuantos necesitas, o que estilo buscas — y
          nuestro asistente te arma las mejores opciones.
        </motion.p>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-12 w-full max-w-2xl"
        >
          <SearchPrompt />
        </motion.div>

        {/* Trust stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-16 flex items-center divide-x divide-white/[0.08] text-sm"
        >
          {[
            { value: "1,400+", label: "productos" },
            { value: "10+", label: "anos" },
            { value: "100%", label: "personalizable" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 px-5 first:pl-0 last:pr-0 sm:px-8"
            >
              <span className="font-mono font-medium text-zinc-300">
                {stat.value}
              </span>
              <span className="text-zinc-600">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom transition to white */}
      <div className="relative z-10 h-32 bg-gradient-to-b from-transparent to-white" />
    </section>
  );
}
