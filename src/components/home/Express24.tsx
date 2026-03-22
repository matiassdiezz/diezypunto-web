"use client";

import Link from "next/link";
import { Lightning, ArrowRight } from "@phosphor-icons/react";
import ScrollReveal from "../shared/ScrollReveal";

export default function Express24() {
  return (
    <section className="px-6 py-8 sm:py-12 lg:px-16">
      <ScrollReveal>
        <Link
          href="/catalogo?express=true"
          className="group block overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 p-6 transition-all hover:border-accent/40 hover:shadow-[0_8px_24px_rgba(89,198,242,0.15)] sm:p-8"
        >
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 sm:h-14 sm:w-14">
                <Lightning weight="fill" className="h-6 w-6 text-accent sm:h-7 sm:w-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold sm:text-xl">
                  ¿Lo necesitás YA?
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  Entrega en <span className="font-semibold text-accent">24 horas</span>
                  <span className="text-xs">*</span> — productos listos para personalizar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all group-hover:bg-accent-hover group-hover:shadow-[0_6px_18px_rgba(89,198,242,0.35)]">
              Ver productos express
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] text-muted sm:mt-3 sm:text-left">
            *Pago acreditado y diseño aprobado. Sujeto a disponibilidad de stock.
          </p>
        </Link>
      </ScrollReveal>
    </section>
  );
}
