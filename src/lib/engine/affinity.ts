/** Category affinity map — which categories complement each other */

const AFFINITY_MAP: Record<string, string[]> = {
  "Botellas y Termos": ["Mochilas y Bolsos", "Escritura", "Indumentaria"],
  Indumentaria: ["Mochilas y Bolsos", "Botellas y Termos", "Escritura"],
  Tecnologia: ["Escritura", "Mochilas y Bolsos"],
  "Mochilas y Bolsos": ["Botellas y Termos", "Indumentaria", "Tecnologia"],
  Escritura: ["Botellas y Termos", "Tecnologia", "Mochilas y Bolsos"],
  // Kits are already bundles — no cross-sell
};

export function getComplementaryCategories(category: string): string[] {
  return AFFINITY_MAP[category] ?? [];
}
