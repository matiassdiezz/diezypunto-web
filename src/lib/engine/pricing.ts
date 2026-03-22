/* Pricing engine — applies D&P markup rules to provider prices.

   Formula:
     Precio producto = Precio lista proveedor × Factor descuento × Markup
     Precio final    = Precio producto + Precio personalización

   Source: Excel "Diez & Punto - Categorías Página Web - Mar 26.xlsx"
*/

// --- Provider discount factors ---

const PROVIDER_FACTORS: Record<string, number> = {
  zecat: 0.325,
  cdo: 1.0, // net_price already has provider discount applied
  promoproductos: 0.72,
};

const PROVIDER_UPLIFTS: Record<string, number> = {
  zecat: 1.08,
};

// --- Volume classification per category ---

export type VolumeClass = "masivo" | "intermedio" | "premium";

const CATEGORY_CLASSIFICATION: Record<string, VolumeClass> = {
  // Escritura subcategories
  "Escritura: Plástica y otras": "masivo",
  "Escritura: Metálica": "intermedio",
  "Escritura: Fina": "premium",
  "Escritura Plástico": "masivo",
  "Escritura Cartón": "masivo",
  "Escritura Metálica": "intermedio",
  "Escritura Fina": "premium",
  // Drinkware subcategories
  "Drinkware: Botellas, Jarros y Otros": "intermedio",
  "Drinkware: Termos": "premium",
  "Botellas y Termos": "intermedio",
  "Termos": "premium",
  // Bolsos y Mochilas subcategories
  "Bolsos y Mochilas: Accesorios": "intermedio",
  "Bolsos y Mochilas: Bolsos, Maletines y Mochilas": "premium",
  "Bolsos Accesorios": "intermedio",
  "Bolsos y Mochilas": "premium",
  "Mochilas y Bolsos": "premium",
  // Tecnología subcategories
  "Tecnología: Básicos": "intermedio",
  "Tecnología: Pro": "premium",
  "Tecnología Básicos": "intermedio",
  "Tecnología Pro": "premium",
  // Oficina y Negocios
  "Oficina y Negocios: Cuadernos": "intermedio",
  "Oficina y Negocios: Varios": "intermedio",
  "Oficina y Negocios": "intermedio",
  // Indumentaria subcategories
  "Indumentaria: Remeras": "intermedio",
  "Indumentaria: Chombas y Abrigo": "premium",
  "Indumentaria": "intermedio",
  // Flat categories
  "Eco": "intermedio",
  "Hogar & Tiempo Libre": "intermedio",
  "Bienestar": "intermedio",
  "Paraguas": "intermedio",
  "Gorros": "intermedio",
  "Llaveros": "intermedio",
  "Kids": "intermedio",
};

// Fallback: map Zecat family names to classification
const FAMILY_CLASSIFICATION: Record<string, VolumeClass> = {
  "Escritura": "masivo",
  "Botellas y Termos": "intermedio",
  "Mochilas y Bolsos": "premium",
  "Tecnología": "intermedio",
  "Tecnologia": "intermedio",
  "Aire Libre": "intermedio",
  "Sustentable": "intermedio",
  "Ecológico": "intermedio",
  "Premium": "premium",
  "Kits": "intermedio",
  "Indumentaria": "intermedio",
  "Oficina": "intermedio",
  "Hogar": "intermedio",
  "Herramientas": "intermedio",
};

export function getVolumeClass(category: string): VolumeClass {
  // Try exact match first
  if (CATEGORY_CLASSIFICATION[category]) {
    return CATEGORY_CLASSIFICATION[category];
  }
  // Try family-level match
  if (FAMILY_CLASSIFICATION[category]) {
    return FAMILY_CLASSIFICATION[category];
  }
  // Try partial match
  const normalized = category.toLowerCase();
  if (normalized.includes("escritura") && (normalized.includes("plástic") || normalized.includes("plastic") || normalized.includes("cartón") || normalized.includes("carton"))) return "masivo";
  if (normalized.includes("escritura") && normalized.includes("metálic")) return "intermedio";
  if (normalized.includes("escritura") && normalized.includes("fina")) return "premium";
  if (normalized.includes("termo")) return "premium";
  if (normalized.includes("botella") || normalized.includes("drinkware") || normalized.includes("jarro") || normalized.includes("taza") || normalized.includes("mate")) return "intermedio";
  if (normalized.includes("mochila") || normalized.includes("bolso") || normalized.includes("maletín")) return "premium";
  if (normalized.includes("premium")) return "premium";
  // Default
  return "intermedio";
}

// --- Quantity tiers by classification ---

export interface QuantityTier {
  label: string;
  min: number;
  max: number | null; // null = unlimited
  markup: number;
}

const TIERS: Record<VolumeClass, QuantityTier[]> = {
  masivo: [
    { label: "50–299", min: 50, max: 299, markup: 1.60 },
    { label: "300–499", min: 300, max: 499, markup: 1.55 },
    { label: "500+", min: 500, max: null, markup: 1.50 },
  ],
  intermedio: [
    { label: "20–99", min: 20, max: 99, markup: 1.60 },
    { label: "100–299", min: 100, max: 299, markup: 1.55 },
    { label: "300+", min: 300, max: null, markup: 1.50 },
  ],
  premium: [
    { label: "10–49", min: 10, max: 49, markup: 1.60 },
    { label: "50–99", min: 50, max: 99, markup: 1.55 },
    { label: "100+", min: 100, max: null, markup: 1.50 },
  ],
};

export function getQuantityTiers(category: string): QuantityTier[] {
  return TIERS[getVolumeClass(category)];
}

// --- Personalization price by category ---

const PERSONALIZATION_PRICES: Record<string, number> = {
  // $0 categories
  "Escritura": 0,
  "Escritura: Plástica y otras": 0,
  "Escritura: Metálica": 0,
  "Escritura: Fina": 0,
  "Drinkware": 0,
  "Drinkware: Botellas, Jarros y Otros": 0,
  "Drinkware: Termos": 0,
  "Botellas y Termos": 0,
  "Tecnología": 0,
  "Tecnología: Básicos": 0,
  "Tecnología: Pro": 0,
  "Tecnologia": 0,
  "Llaveros": 0,
  "Oficina y Negocios": 0,
  "Oficina y Negocios: Cuadernos": 0,
  "Oficina y Negocios: Varios": 0,
  "Oficina": 0,
  "Eco": 0,
  // $3400 categories
  "Gorros": 3400,
  "Bolsos y Mochilas: Accesorios": 3400,
  "Bolsos Accesorios": 3400,
  // $4800 categories
  "Bolsos y Mochilas": 4800,
  "Bolsos y Mochilas: Bolsos, Maletines y Mochilas": 4800,
  "Mochilas y Bolsos": 4800,
  "Hogar & Tiempo Libre": 4800,
  "Hogar": 4800,
  "Aire Libre": 4800,
  "Bienestar": 4800,
  "Paraguas": 4800,
  "Indumentaria": 4800,
  "Indumentaria: Remeras": 4800,
  "Indumentaria: Chombas y Abrigo": 4800,
  // $7500 categories
  "Kids": 7500,
  "Kits": 7500,
};

export function getPersonalizationPrice(category: string): number {
  if (PERSONALIZATION_PRICES[category] !== undefined) {
    return PERSONALIZATION_PRICES[category];
  }
  // Partial match
  const normalized = category.toLowerCase();
  if (normalized.includes("escritura") || normalized.includes("drinkware") || normalized.includes("botella") || normalized.includes("termo") || normalized.includes("tecnolog") || normalized.includes("llavero") || normalized.includes("oficina")) return 0;
  if (normalized.includes("gorro")) return 3400;
  if (normalized.includes("mochila") || normalized.includes("bolso") || normalized.includes("indumentaria") || normalized.includes("paragua") || normalized.includes("hogar") || normalized.includes("bienestar")) return 4800;
  if (normalized.includes("kid")) return 7500;
  // Default: no personalization cost
  return 0;
}

// --- Main pricing function ---

export interface PricedTier {
  label: string;
  min: number;
  max: number | null;
  unitPrice: number; // precio producto (sin personalización)
  finalPrice: number; // precio final (con personalización)
}

export interface PricingResult {
  tiers: PricedTier[];
  personalizationPrice: number;
  volumeClass: VolumeClass;
  provider: string;
  factorDescuento: number;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate D&P pricing for a product.
 * @param listPrice - Provider list price (pre-discount)
 * @param category - Product category (for classification + personalization)
 * @param provider - Provider name (default: "zecat")
 */
export function calculatePricing(
  listPrice: number,
  category: string,
  provider = "zecat",
): PricingResult {
  const providerKey = provider.toLowerCase();
  const factorDescuento = PROVIDER_FACTORS[providerKey] ?? PROVIDER_FACTORS.zecat;
  const volumeClass = getVolumeClass(category);
  const tiers = TIERS[volumeClass];
  const personalizationPrice = getPersonalizationPrice(category);
  const uplift = PROVIDER_UPLIFTS[providerKey] ?? 1;

  const pricedTiers: PricedTier[] = providerKey === "zecat"
    ? tiers.map((tier) => {
      const firstTierMarkup = tiers[0]?.markup || 1;
      const unitPrice = roundCurrency(listPrice * (tier.markup / firstTierMarkup));
      return {
        label: tier.label,
        min: tier.min,
        max: tier.max,
        unitPrice,
        finalPrice: roundCurrency((unitPrice * uplift) + personalizationPrice),
      };
    })
    : tiers.map((tier) => {
      const unitPrice = roundCurrency(listPrice * factorDescuento * tier.markup);
      return {
        label: tier.label,
        min: tier.min,
        max: tier.max,
        unitPrice,
        finalPrice: roundCurrency(unitPrice + personalizationPrice),
      };
    });

  return {
    tiers: pricedTiers,
    personalizationPrice,
    volumeClass,
    provider,
    factorDescuento: providerKey === "zecat" ? 1 : factorDescuento,
  };
}

/**
 * Get the price for a specific quantity.
 * Returns the final price (product + personalization) for the matching tier.
 * Falls back to first tier if quantity doesn't match any.
 */
export function getPriceForQuantity(
  listPrice: number,
  quantity: number,
  category: string,
  provider = "zecat",
): { unitPrice: number; finalPrice: number; tier: PricedTier } {
  const result = calculatePricing(listPrice, category, provider);
  const tier = result.tiers.find((t) =>
    quantity >= t.min && (t.max === null || quantity <= t.max)
  ) ?? result.tiers[0];
  return { unitPrice: tier.unitPrice, finalPrice: tier.finalPrice, tier };
}
