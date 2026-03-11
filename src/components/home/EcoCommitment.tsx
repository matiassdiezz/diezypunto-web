"use client";

import Link from "next/link";
import { Leaf, ArrowRight } from "lucide-react";
import ScrollReveal from "../shared/ScrollReveal";

export default function EcoCommitment() {
  return (
    <section className="bg-card py-20">
      <div className="px-6 lg:px-16">
        <ScrollReveal>
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-12">
            {/* Icon */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-eco/10">
              <Leaf className="h-12 w-12 text-eco" />
            </div>

            {/* Content */}
            <div>
              <h2 className="text-2xl font-bold">
                Comprometidos con el medio ambiente
              </h2>
              <p className="mt-3 max-w-xl text-muted">
                Contamos con una linea de productos eco-friendly fabricados con
                materiales reciclados, bambu, corcho y algodon organico.
                Personaliza tu marca con responsabilidad.
              </p>
              <Link
                href="/catalogo?eco_friendly=true"
                className="mt-4 inline-flex items-center gap-1 font-medium text-eco hover:gap-2 transition-all"
              >
                Ver productos eco <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
