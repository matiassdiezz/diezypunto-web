/* Product loader — reads CSV at build/startup time and provides search */

import fs from "fs";
import path from "path";
import type { ProductResult } from "../types";

let _products: ProductResult[] | null = null;

function parseCSV(csv: string): ProductResult[] {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    // Handle commas within fields (basic CSV parse)
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });

    const personalizationMethods = row.personalization
      ? row.personalization.split(";").filter(Boolean)
      : [];

    // Map CSV categories to internal categories
    const categoryMap: Record<string, string> = {
      "Botellas y Termos": "drinkware",
      Mates: "drinkware",
      Tazas: "drinkware",
      "Mochilas y Bolsos": "bags",
      Indumentaria: "apparel",
      Tecnologia: "tech",
      Escritura: "writing",
      "Aire Libre": "outdoor",
      Kits: "kits",
      Ecologico: "eco",
      Oficina: "office",
      Premium: "premium",
    };

    return {
      product_id: row.id,
      external_id: row.id,
      title: row.name,
      description: row.short_description,
      category: row.category,
      subcategory: categoryMap[row.category] || row.category.toLowerCase(),
      price: row.price ? parseFloat(row.price) : null,
      price_max: null,
      currency: "ARS",
      min_qty: 1,
      materials: row.materials ? row.materials.split(";").filter(Boolean) : [],
      colors: row.colors ? row.colors.split(";").filter(Boolean) : [],
      personalization_methods: personalizationMethods,
      eco_friendly:
        row.category === "Ecologico" ||
        (row.tags || "").includes("ecologico") ||
        (row.tags || "").includes("sustentable"),
      premium_tier:
        row.category === "Premium" || (row.tags || "").includes("premium"),
      image_urls: row.image_url ? [row.image_url] : [],
      lead_time_days: row.lead_time_days
        ? parseInt(row.lead_time_days)
        : null,
      score: 0,
      reason: "",
    };
  });
}

export function getProducts(): ProductResult[] {
  if (_products) return _products;

  const csvPath = path.join(process.cwd(), "src/lib/data/products.csv");
  const csv = fs.readFileSync(csvPath, "utf-8");
  _products = parseCSV(csv);
  return _products;
}

export function getProductById(id: string): ProductResult | null {
  return getProducts().find((p) => p.product_id === id) || null;
}

export function searchProductsText(
  query: string,
  limit = 30,
): ProductResult[] {
  const products = getProducts();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return products.slice(0, limit);

  // Generate simple Spanish plural/singular variants
  const variants = new Set<string>();
  for (const t of terms) {
    variants.add(t);
    if (t.endsWith("s")) variants.add(t.slice(0, -1));
    else variants.add(t + "s");
    if (t.endsWith("es")) variants.add(t.slice(0, -2));
    if (t.endsWith("as")) variants.add(t.slice(0, -2) + "o");
    if (t.endsWith("os")) variants.add(t.slice(0, -2) + "a");
  }

  const matches = products.filter((p) => {
    const corpus =
      `${p.title} ${p.description} ${p.category} ${p.materials.join(" ")} ${p.personalization_methods.join(" ")} ${p.colors.join(" ")}`.toLowerCase();
    return Array.from(variants).some((v) => corpus.includes(v));
  });

  return matches.slice(0, limit);
}

export function getCategories() {
  const products = getProducts();
  const catMap = new Map<string, { count: number; subcategories: Set<string> }>();

  for (const p of products) {
    if (!catMap.has(p.category)) {
      catMap.set(p.category, { count: 0, subcategories: new Set() });
    }
    const entry = catMap.get(p.category)!;
    entry.count++;
    if (p.subcategory) entry.subcategories.add(p.subcategory);
  }

  return {
    categories: Array.from(catMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => ({
        name,
        count: data.count,
        subcategories: Array.from(data.subcategories).sort(),
      })),
    total_products: products.length,
  };
}
