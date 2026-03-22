"use client";

import { PaperPlaneTilt } from "@phosphor-icons/react";
import { openTelegramWithContext } from "@/lib/telegram";

interface PersonalizationCardProps {
  methods: string[];
  productTitle: string;
}

const METHOD_INFO: Record<string, { tier: string; description: string }> = {
  "Serigrafía": { tier: "Económico", description: "Ideal para pedidos grandes, tintas sólidas" },
  "Tampografía": { tier: "Económico", description: "Ideal para superficies curvas y objetos pequeños" },
  "Tampo Metal": { tier: "Económico", description: "Tampografía sobre superficies metálicas" },
  "Transfer monocolor": { tier: "Standard", description: "Transferencia térmica de un color" },
  "Transfer full color": { tier: "Standard", description: "Full color, ideal para diseños complejos y fotos" },
  "Sublimación": { tier: "Standard", description: "Full color permanente sobre superficies claras" },
  "Hot Stamping": { tier: "Standard", description: "Acabado metalizado, ideal para logos elegantes" },
  "Bordado": { tier: "Premium", description: "Duradero, premium para textiles" },
  "Bordado 3D": { tier: "Premium", description: "Bordado con relieve, máxima presencia" },
  "Patch Bordado": { tier: "Premium", description: "Parche bordado aplicable, versátil" },
  "Laser": { tier: "Premium+", description: "Grabado permanente, acabado premium" },
  "Laser CO2": { tier: "Premium+", description: "Grabado láser para materiales orgánicos" },
  "Speed Laser": { tier: "Premium+", description: "Grabado láser de alta velocidad" },
  "UV": { tier: "Premium+", description: "Impresión directa full color sobre cualquier superficie" },
  "UV Rotativa": { tier: "Premium+", description: "Impresión UV sobre objetos cilíndricos" },
};

const TIER_COLORS: Record<string, string> = {
  Económico: "bg-surface text-muted",
  Standard: "bg-accent-light text-accent",
  Premium: "bg-amber-50 text-amber-700",
  "Premium+": "bg-amber-100 text-amber-800",
};

export default function PersonalizationCard({ methods, productTitle }: PersonalizationCardProps) {
  if (methods.length === 0) return null;

  const handleTelegram = () => {
    openTelegramWithContext({
      type: "product",
      product_id: "",
      title: productTitle,
      qty: 1,
      message: `Quiero personalizar: ${productTitle}. Me interesa saber las opciones de personalización.`,
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Métodos disponibles
      </p>
      <div className="space-y-2">
        {methods.map((method) => {
          const info = METHOD_INFO[method];
          return (
            <div
              key={method}
              className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{method}</p>
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
      <button
        onClick={handleTelegram}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
      >
        <PaperPlaneTilt className="h-4 w-4" />
        Habla con nosotros para personalizar
      </button>
    </div>
  );
}
