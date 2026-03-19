/** Category affinity map — which D&P categories complement each other for cross-sell */

const AFFINITY_MAP: Record<string, string[]> = {
  "Drinkware": ["Bolsos y Mochilas", "Escritura", "Indumentaria"],
  "Escritura": ["Drinkware", "Tecnología", "Oficina y Negocios"],
  "Bolsos y Mochilas": ["Drinkware", "Indumentaria", "Tecnología"],
  "Indumentaria": ["Bolsos y Mochilas", "Drinkware", "Gorros"],
  "Tecnología": ["Escritura", "Bolsos y Mochilas", "Oficina y Negocios"],
  "Oficina y Negocios": ["Escritura", "Tecnología", "Drinkware"],
  "Gorros": ["Indumentaria", "Bolsos y Mochilas", "Drinkware"],
  "Eco": ["Drinkware", "Escritura", "Bolsos y Mochilas"],
  "Hogar & Tiempo Libre": ["Drinkware", "Indumentaria", "Bolsos y Mochilas"],
  "Llaveros": ["Escritura", "Drinkware", "Tecnología"],
  "Paraguas": ["Bolsos y Mochilas", "Indumentaria", "Drinkware"],
};

export function getComplementaryCategories(category: string): string[] {
  return AFFINITY_MAP[category] ?? [];
}
