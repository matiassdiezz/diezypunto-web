"use client";

import { motion } from "framer-motion";
import SearchPrompt from "../search/SearchPrompt";

export default function Hero() {
  return (
    <section className="relative bg-white">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        {/* Dot grid pattern — barely visible texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(0,0,0,0.15) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.03,
          }}
        />
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
          <span className="inline-flex items-center gap-2.5 rounded-full border border-[#59C6F2]/20 bg-[#EBF7FE] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#59C6F2]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#59C6F2] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#59C6F2]" />
            </span>
            Busqueda inteligente
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl text-center text-[clamp(2.25rem,7vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-[#1a1a2e]"
        >
          Describi lo que necesitas,{" "}
          <span className="text-[#59C6F2]">
            nosotros lo encontramos
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-lg text-center text-base leading-relaxed text-gray-500 sm:text-lg"
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
          className="mt-16 flex items-center divide-x divide-gray-200 text-sm"
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
              <span className="font-mono font-medium text-[#1a1a2e]">
                {stat.value}
              </span>
              <span className="text-gray-400">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
