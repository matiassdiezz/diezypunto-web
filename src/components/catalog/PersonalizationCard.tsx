"use client";

import { MessageCircle } from "lucide-react";

interface PersonalizationCardProps {
  methods: string[];
  productTitle: string;
}

const WHATSAPP_NUMBER = "5491168385566";

const METHOD_INFO: Record<string, { tier: string; description: string }> = {
  Serigrafia: { tier: "Economico", description: "Ideal para pedidos grandes" },
  Sublimacion: { tier: "Standard", description: "Full color, ideal para disenos complejos" },
  Bordado: { tier: "Premium", description: "Duradero, premium para textiles" },
  "Grabado Laser": { tier: "Premium+", description: "Permanente, el acabado mas premium" },
  "Grabado laser": { tier: "Premium+", description: "Permanente, el acabado mas premium" },
};

const TIER_COLORS: Record<string, string> = {
  Economico: "bg-surface text-muted",
  Standard: "bg-accent-light text-accent",
  Premium: "bg-amber-50 text-amber-700",
  "Premium+": "bg-amber-100 text-amber-800",
};

export default function PersonalizationCard({ methods, productTitle }: PersonalizationCardProps) {
  if (methods.length === 0) return null;

  const whatsappMsg = encodeURIComponent(
    `Hola! Quiero personalizar: ${productTitle}. Me interesa saber las opciones de personalizacion.`,
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Metodos de personalizacion
      </p>
      <div className="space-y-2">
        {methods.map((method) => {
          const info = METHOD_INFO[method];
          return (
            <div
              key={method}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{method}</p>
                {info && (
                  <p className="text-xs text-muted">{info.description}</p>
                )}
              </div>
              {info && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TIER_COLORS[info.tier] ?? "bg-surface text-muted"}`}
                >
                  {info.tier}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
      >
        <MessageCircle className="h-4 w-4" />
        Habla con Martin para personalizar
      </a>
    </div>
  );
}
