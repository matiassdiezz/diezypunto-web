"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import ScrollReveal from "../shared/ScrollReveal";

const CASES = [
  {
    emoji: "🎪",
    title: "Eventos corporativos",
    description: "Ferias, conferencias, lanzamientos",
    search: "productos para eventos corporativos",
  },
  {
    emoji: "🎁",
    title: "Kits de bienvenida",
    description: "Onboarding de empleados",
    search: "kit bienvenida empleados",
  },
  {
    emoji: "🏆",
    title: "Regalos empresariales",
    description: "Fin de ano, aniversarios, clientes VIP",
    search: "regalos empresariales premium",
  },
  {
    emoji: "👕",
    title: "Merchandising de marca",
    description: "Dia a dia, uniformes, identidad",
    search: "merchandising marca identidad",
  },
];

export default function UseCases() {
  return (
    <section className="bg-white px-6 lg:px-16 py-20">
      <ScrollReveal>
        <h2 className="text-center text-2xl font-bold">Para cada ocasion</h2>
        <p className="mt-2 text-center text-muted">
          Encontra el producto ideal para cada necesidad de tu empresa
        </p>
      </ScrollReveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {CASES.map((c, i) => (
          <ScrollReveal key={c.title} delay={i * 0.08}>
            <Link
              href={`/catalogo?search=${encodeURIComponent(c.search)}`}
              className="group flex items-start gap-4 rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-md"
            >
              <span className="border-l-4 border-accent pl-3 text-3xl">
                {c.emoji}
              </span>
              <div className="flex-1">
                <h3 className="font-semibold">{c.title}</h3>
                <p className="mt-1 text-sm text-muted">{c.description}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent group-hover:gap-2 transition-all">
                  Ver productos <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
