"use client";

import Link from "next/link";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { PEDIDO_EVENTO_PRESET_MESSAGE } from "@/lib/chat/chat-preset-messages";
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
