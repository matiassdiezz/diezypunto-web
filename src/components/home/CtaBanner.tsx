"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import ScrollReveal from "../shared/ScrollReveal";

export default function CtaBanner() {
  return (
    <section className="py-20 px-6">
      <ScrollReveal>
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-accent to-[#3BB5E8] px-8 py-16 text-center text-white">
          <h2 className="text-2xl font-bold md:text-3xl">
            Tenes un proyecto en mente?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-white/80">
            Contanos que necesitas y te armamos una propuesta personalizada
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, quiero consultar por merchandising")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-accent transition-shadow hover:shadow-lg"
            >
              <MessageCircle className="h-5 w-5" />
              Hablar por WhatsApp
            </a>
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Explorar catalogo
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
