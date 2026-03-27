/**
 * Infers a CSS-renderable color from a Spanish color name.
 * Returns null if the name can't be mapped (shows no dot).
 */

const EXACT: Record<string, string | null> = {
  negro: "#1a1a1a",
  blanco: "#ffffff",
  rojo: "#dc2626",
  azul: "#2563eb",
  "azul marino": "#1e3a5f",
  "azul francia": "#3b82f6",
  "azul royal": "#1d4ed8",
  "azul cielo": "#7dd3fc",
  verde: "#16a34a",
  "verde oscuro": "#166534",
  "verde claro": "#86efac",
  "verde militar": "#4b5320",
  amarillo: "#eab308",
  naranja: "#ea580c",
  rosa: "#ec4899",
  fucsia: "#d946ef",
  violeta: "#7c3aed",
  lila: "#a78bfa",
  gris: "#9ca3af",
  "gris claro": "#d1d5db",
  "gris oscuro": "#4b5563",
  plateado: "#c0c0c0",
  dorado: "#d4a017",
  "oro rosa": "#b76e79",
  marrón: "#78350f",
  "marron claro": "#a16207",
  "marrón claro": "#a16207",
  beige: "#d2b48c",
  kaki: "#bdb76b",
  crema: "#fffdd0",
  natural: "#ddd0b4",
  celeste: "#67c8f0",
  turquesa: "#06b6d4",
  coral: "#f87171",
  bordo: "#7f1d1d",
  burgundy: "#800020",
  cobre: "#b87333",
  bronce: "#cd7f32",
  titanio: "#878681",
  champagne: "#f7e7ce",
  transparente: "transparent",
  "translúcido": "transparent",
  madera: "#a0764a",
  "madera clara": "#c9a66b",
  "madera oscura": "#5c3317",
  bamboo: "#d4c48b",
  "full black": "#000000",
  surtido: null,
};

// Keywords for partial matching (order matters — first match wins)
const KEYWORDS: [string, string][] = [
  ["negro", "#1a1a1a"],
  ["blanco", "#ffffff"],
  ["rojo", "#dc2626"],
  ["azul marino", "#1e3a5f"],
  ["azul francia", "#3b82f6"],
  ["azul", "#2563eb"],
  ["verde oscur", "#166534"],
  ["verde clar", "#86efac"],
  ["verde", "#16a34a"],
  ["amarill", "#eab308"],
  ["naranja", "#ea580c"],
  ["rosa", "#ec4899"],
  ["fucsia", "#d946ef"],
  ["violeta", "#7c3aed"],
  ["lila", "#a78bfa"],
  ["gris oscur", "#4b5563"],
  ["gris clar", "#d1d5db"],
  ["gris", "#9ca3af"],
  ["platead", "#c0c0c0"],
  ["dorad", "#d4a017"],
  ["marrón", "#78350f"],
  ["marron", "#78350f"],
  ["beige", "#d2b48c"],
  ["kaki", "#bdb76b"],
  ["celeste", "#67c8f0"],
  ["turquesa", "#06b6d4"],
  ["coral", "#f87171"],
  ["bordo", "#7f1d1d"],
  ["cobre", "#b87333"],
  ["bronce", "#cd7f32"],
  ["natural", "#ddd0b4"],
  ["madera", "#a0764a"],
  ["champagne", "#f7e7ce"],
  ["crema", "#fffdd0"],
  ["titanio", "#878681"],
  ["camuflad", "#4b5320"],
  ["marmolad", "#d1d5db"],
];

const cache = new Map<string, string | null>();

export function inferColor(name: string): string | null {
  const cached = cache.get(name);
  if (cached !== undefined) return cached;

  const lower = name.toLowerCase().trim();

  // Exact match
  if (lower in EXACT) {
    cache.set(name, EXACT[lower]);
    return EXACT[lower];
  }

  // For multi-color names like "Blanco y Negro" or "Blanco + Negro",
  // return the first color
  const parts = lower.split(/\s+y\s+|\s*\+\s*/);
  if (parts.length > 1) {
    const first = inferColorFromKeywords(parts[0].trim());
    cache.set(name, first);
    return first;
  }

  const result = inferColorFromKeywords(lower);
  cache.set(name, result);
  return result;
}

function inferColorFromKeywords(s: string): string | null {
  for (const [keyword, hex] of KEYWORDS) {
    if (s.includes(keyword)) return hex;
  }
  return null;
}

/** Returns true if the inferred color is very light and needs a border */
export function isLightColor(hex: string | null): boolean {
  if (!hex || hex === "transparent") return true;
  // Parse hex
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Relative luminance approximation
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}
