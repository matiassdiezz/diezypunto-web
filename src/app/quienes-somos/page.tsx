import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CATALOG_COUNT_LABEL } from "@/lib/catalog-count";

export const metadata: Metadata = {
  title: "Quiénes Somos | Diezypunto - 20+ Años en Merchandising Corporativo",
  description:
    "Somos una empresa con más de 20 años de experiencia en regalos corporativos. Soluciones creativas de merchandising para posicionar tu marca.",
};

export default function QuienesSomosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Quiénes Somos
      </h1>

      <p className="mt-6 text-lg leading-relaxed text-muted">
        Somos una empresa con más de 20 años de experiencia en el mercado de
        regalos corporativos.
      </p>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-foreground/80">
        <p>
          En <span className="font-semibold text-foreground">DIEZ y PUNTO</span>{" "}
          entendemos que una buena estrategia de merchandising tiene un alto
          índice de eficacia en el posicionamiento de tu marca. Contamos con un
          equipo de profesionales capaces de ofrecer soluciones inmediatas,
          creativas, y al mismo tiempo, acordes a los presupuestos de cada
          empresa.
        </p>

        <p>
          Gracias a nuestro compromiso y seriedad hacemos posible lo imposible.
        </p>

        <p>
          Nuestra misión es ayudarte a generar un vínculo positivo con tus
          clientes a través del regalo empresarial.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {[
          {
            title: "20+ años",
            desc: "De experiencia en merchandising corporativo",
          },
          {
            title: `${CATALOG_COUNT_LABEL.replace("+", "")}+`,
            desc: "Productos disponibles para personalizar",
          },
          {
            title: "Envíos",
            desc: "A todo el país. CABA y GBA en 24-72hs",
          },
        ].map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl border border-border bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-accent/20"
          >
            <p className="text-2xl font-bold text-accent">{stat.title}</p>
            <p className="mt-1 text-sm text-muted">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-border bg-surface/50 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-foreground">
          ¿Necesitás merchandising para tu empresa?
        </h2>
        <p className="mt-2 text-sm text-muted">
          Contanos qué necesitás y te armamos un presupuesto a medida.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/catalogo"
            className="inline-flex items-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Ver catálogo
          </Link>
          <a
            href="https://wa.me/541162345062"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
