"use client";

import QuoteBuilder from "@/components/quote/QuoteBuilder";
import ScrollReveal from "@/components/shared/ScrollReveal";

export default function CarritoPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 pt-28">
      <ScrollReveal>
        <h1 className="text-3xl font-bold">Carrito</h1>
        <p className="mt-2 text-muted">
          Revisa los productos seleccionados, ajusta cantidades y completa tu
          compra.
        </p>
      </ScrollReveal>

      <div className="mt-8">
        <QuoteBuilder />
      </div>
    </div>
  );
}
