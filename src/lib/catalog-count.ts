import catalog from "@/data/catalog.json";

const raw = catalog.products.length;
// Round down to nearest 50 for marketing copy (e.g. 1751 → "+1,750")
const rounded = Math.floor(raw / 50) * 50;

export const CATALOG_COUNT = raw;
export const CATALOG_COUNT_LABEL = `+${rounded.toLocaleString("es-AR")}`;
