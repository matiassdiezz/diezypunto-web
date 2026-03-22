"use client";

import Link from "next/link";
import Image from "next/image";
import { Lightning, ArrowRight } from "@phosphor-icons/react";
import ScrollReveal from "../shared/ScrollReveal";

export default function Express24() {
  return (
    <section className="px-6 py-8 sm:py-12 lg:px-16">
      <ScrollReveal>
        <Link
          href="/catalogo?express=true"
          className="group relative block overflow-hidden rounded-2xl border border-accent/20 transition-all hover:border-accent/40 hover:shadow-[0_8px_24px_rgba(89,198,242,0.15)]"
        >
          {/* Banner image */}
          <div className="relative h-40 sm:h-52 lg:h-64">
            <Image
              src="/express-24h-banner.png"
              alt="Productos de merchandising con entrega express"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 90vw"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent" />
          </div>

          {/* Content overlay */}
          <div className="absolute inset-0 flex items-center px-6 sm:px-8">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 backdrop-blur-sm sm:h-12 sm:w-12">
                  <Lightning weight="fill" className="h-5 w-5 text-accent sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold sm:text-xl lg:text-2xl">
                    ¿Lo necesitás YA?
                  </h2>
                  <p className="text-xs text-muted sm:text-sm">
                    Entrega en <span className="font-semibold text-accent">24 horas</span>
                    <span className="text-[10px]">*</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-medium text-white shadow-lg shadow-accent/20 transition-all group-hover:bg-accent-hover group-hover:shadow-accent/35 sm:text-sm">
                Ver productos express
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-2 text-[9px] text-muted/70 sm:text-[10px]">
                *Pago acreditado y diseño aprobado. Sujeto a stock.
              </p>
            </div>
          </div>
        </Link>
      </ScrollReveal>
    </section>
  );
}
