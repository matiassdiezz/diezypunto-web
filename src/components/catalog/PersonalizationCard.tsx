interface PersonalizationCardProps {
  methods: string[];
  productTitle: string;
  selected?: string | null;
  onSelect?: (method: string | null) => void;
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

const TIER_COLORS: Record<string, { base: string; active: string }> = {
  Económico: { base: "bg-surface text-muted", active: "bg-emerald-50 text-emerald-700" },
  Standard: { base: "bg-accent-light text-accent", active: "bg-accent text-white" },
  Premium: { base: "bg-amber-50 text-amber-700", active: "bg-amber-500 text-white" },
  "Premium+": { base: "bg-amber-100 text-amber-800", active: "bg-amber-600 text-white" },
};

export default function PersonalizationCard({ methods, productTitle, selected, onSelect }: PersonalizationCardProps) {
  if (methods.length === 0) return null;

  const isInteractive = !!onSelect;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Método de personalización{isInteractive && methods.length > 1 ? <span className="normal-case tracking-normal font-normal"> — Elegí uno</span> : ""}
      </p>
      <div className="space-y-1.5">
        {methods.map((method) => {
          const info = METHOD_INFO[method];
          const isSelected = selected === method;
          const tierStyle = info ? TIER_COLORS[info.tier] : null;

          return isInteractive ? (
            <button
              key={method}
              type="button"
              onClick={() => onSelect(isSelected ? null : method)}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                isSelected
                  ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                  : "border-border hover:border-accent/30"
              }`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                isSelected ? "border-accent bg-accent" : "border-muted/40"
              }`}>
                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${isSelected ? "text-accent" : ""}`}>{method}</p>
                {info && (
                  <p className="text-xs text-muted">{info.description}</p>
                )}
              </div>
              {tierStyle && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    isSelected ? tierStyle.active : tierStyle.base
                  }`}
                >
                  {info!.tier}
                </span>
              )}
            </button>
          ) : (
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
              {tierStyle && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tierStyle.base}`}>
                  {info!.tier}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
