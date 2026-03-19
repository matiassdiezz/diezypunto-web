"use client";

import Link from "next/link";
import { Wand2 } from "lucide-react";
import { useChatStore } from "@/lib/stores/chat-store";
import ScrollReveal from "../shared/ScrollReveal";

export default function CtaFinal() {
  const openWithMessage = useChatStore((s) => s.openWithMessage);

  return (
    <section className="bg-[#EBF7FE] py-16">
      <div className="px-6 lg:px-16">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold">
              Listo para armar tu pedido?
            </h2>
            <p className="mt-3 text-muted">
              Explora el catalogo o deja que nuestra IA te ayude a encontrar lo que necesitas
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20"
              >
                Explorar catalogo
              </Link>
              <button
                onClick={() => openWithMessage("Quiero armar un pedido personalizado para mi evento")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-white px-6 py-3 font-semibold text-foreground transition-colors hover:border-accent/40 hover:text-accent"
              >
                <Wand2 className="h-4 w-4" />
                Arma tu pedido con AI
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
