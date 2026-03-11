"use client";

import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/constants";

interface PersonalizationCardProps {
  methods: string[];
  productTitle: string;
}

const METHOD_INFO: Record<string, { tier: string; description: string }> = {
  "Serigrafía": { tier: "Economico", description: "Ideal para pedidos grandes, tintas solidas" },
  "Tampografía": { tier: "Economico", description: "Ideal para superficies curvas y objetos pequeños" },
  "Tampo Metal": { tier: "Economico", description: "Tampografia sobre superficies metalicas" },
  "Transfer monocolor": { tier: "Standard", description: "Transferencia termica de un color" },
  "Transfer full color": { tier: "Standard", description: "Full color, ideal para disenos complejos y fotos" },
  "Sublimación": { tier: "Standard", description: "Full color permanente sobre superficies claras" },
  "Hot Stamping": { tier: "Standard", description: "Acabado metalizado, ideal para logos elegantes" },
  "Bordado": { tier: "Premium", description: "Duradero, premium para textiles" },
  "Bordado 3D": { tier: "Premium", description: "Bordado con relieve, maxima presencia" },
  "Patch Bordado": { tier: "Premium", description: "Parche bordado aplicable, versatil" },
  "Laser": { tier: "Premium+", description: "Grabado permanente, acabado premium" },
  "Laser CO2": { tier: "Premium+", description: "Grabado laser para materiales organicos" },
  "Speed Laser": { tier: "Premium+", description: "Grabado laser de alta velocidad" },
  "UV": { tier: "Premium+", description: "Impresion directa full color sobre cualquier superficie" },
  "UV Rotativa": { tier: "Premium+", description: "Impresion UV sobre objetos cilindricos" },
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
      <div className="rounded-lg border border-accent/20 bg-accent-light px-3 py-2.5">
        <p className="text-sm font-medium text-accent">
          Tu logo incluido en el precio
        </p>
        <p className="mt-0.5 text-xs text-accent/70">
          Todos los productos se cotizan con personalizacion. Tiempo estimado: 1 semana.
        </p>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Metodos disponibles
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
