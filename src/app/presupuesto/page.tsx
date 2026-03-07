"use client";

import QuoteBuilder from "@/components/quote/QuoteBuilder";
import ScrollReveal from "@/components/shared/ScrollReveal";

export default function PresupuestoPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 pt-28">
      <ScrollReveal>
        <h1 className="text-3xl font-bold">Presupuesto</h1>
        <p className="mt-2 text-muted">
          Revisa los productos seleccionados, ajusta cantidades y envia tu
          pedido por WhatsApp.
        </p>
      </ScrollReveal>

      <div className="mt-8">
        <QuoteBuilder />
      </div>
    </div>
  );
}
