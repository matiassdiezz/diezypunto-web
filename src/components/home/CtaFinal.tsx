"use client";

import Link from "next/link";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { PEDIDO_EVENTO_PRESET_MESSAGE } from "@/lib/chat/chat-preset-messages";
import { useChatStore } from "@/lib/stores/chat-store";
import ScrollReveal from "../shared/ScrollReveal";

export default function CtaFinal() {
  const openWithMessage = useChatStore((s) => s.openWithMessage);

  return (
    <section className="relative overflow-hidden bg-white py-20 md:py-24">

      <div className="relative z-10 px-6 lg:px-16">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl md:text-3xl tracking-tight font-bold">
              Listo para armar tu pedido?
            </h2>
            <p className="mt-3 text-muted">
              Explora el catalogo o deja que nuestra IA te ayude a encontrar lo que necesitas
            </p>
            <p className="mt-1.5 text-sm text-muted/70">
              Respuesta en menos de 24hs. Sin compromiso.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold text-white shadow-lg shadow-accent/15 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/25"
                style={{ background: "var(--accent-gradient)" }}
              >
                Explorar catalogo
              </Link>
              <OpenChatButton
                onClick={() => openWithMessage(PEDIDO_EVENTO_PRESET_MESSAGE)}
              >
                Arma tu pedido con AI
              </OpenChatButton>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
