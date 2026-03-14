/**
 * Generates public/llms-full.txt from catalog.json
 * Run: npx tsx scripts/generate-llms-full.ts
 * Also runs as prebuild step in package.json
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface CatalogProduct {
  product_id: string;
  title: string;
  description: string;
  category: string;
  materials: string[];
  colors: string[];
  personalization_methods: string[];
  eco_friendly: boolean;
  price: number | null;
  price_max: number | null;
  currency: string;
  min_qty: number;
  image_urls: string[];
  lead_time_days: number | null;
}

interface CatalogData {
  synced_at: string;
  total: number;
  products: CatalogProduct[];
}

const catalogPath = join(__dirname, "../src/data/catalog.json");
const outputPath = join(__dirname, "../public/llms-full.txt");

const catalog: CatalogData = JSON.parse(readFileSync(catalogPath, "utf-8"));

// Group products by category
const byCategory = new Map<string, CatalogProduct[]>();
for (const p of catalog.products) {
  const arr = byCategory.get(p.category) || [];
  arr.push(p);
  byCategory.set(p.category, arr);
}

const categories = [...byCategory.keys()].sort();

// Build markdown
const lines: string[] = [];

lines.push("# Diezypunto — Catálogo Completo");
lines.push("");
lines.push(`> ${catalog.total} productos | Última actualización: ${catalog.synced_at}`);
lines.push(`> Precios: consultar | Cantidades mínimas varían por producto`);
lines.push("");
lines.push("---");
lines.push("");

// Table of contents
lines.push("## Categorías");
lines.push("");
for (const cat of categories) {
  const count = byCategory.get(cat)!.length;
  const anchor = cat.toLowerCase().replace(/[^a-záéíóúñü0-9]+/g, "-").replace(/-+/g, "-");
  lines.push(`- [${cat}](#${anchor}) (${count} productos)`);
}
lines.push("");
lines.push("---");
lines.push("");

// Products by category
for (const cat of categories) {
  const products = byCategory.get(cat)!;
  lines.push(`## ${cat}`);
  lines.push("");

  for (const p of products) {
    lines.push(`### ${p.title}`);
    lines.push("");
    if (p.description) {
      lines.push(p.description.replace(/\n/g, " ").trim());
      lines.push("");
    }

    const details: string[] = [];
    details.push(`- **ID:** ${p.product_id}`);
    details.push(`- **Categoría:** ${p.category}`);

    // Prices not exposed publicly — markup pending
    details.push(`- **Precio:** Consultar`);

    if (p.min_qty > 1) {
      details.push(`- **Cantidad mínima:** ${p.min_qty} unidades`);
    }
    if (p.materials.length > 0) {
      details.push(`- **Materiales:** ${p.materials.join(", ")}`);
    }
    if (p.colors.length > 0) {
      details.push(`- **Colores:** ${p.colors.join(", ")}`);
    }
    if (p.personalization_methods.length > 0) {
      details.push(`- **Personalización:** ${p.personalization_methods.join(", ")}`);
    }
    if (p.eco_friendly) {
      details.push(`- **Eco-friendly:** Sí`);
    }
    if (p.lead_time_days != null) {
      details.push(`- **Entrega:** ~${p.lead_time_days} días`);
    }
    if (p.image_urls.length > 0) {
      details.push(`- **Imagen:** ${p.image_urls[0]}`);
    }

    lines.push(details.join("\n"));
    lines.push("");
  }

  lines.push("---");
  lines.push("");
}

writeFileSync(outputPath, lines.join("\n"), "utf-8");
console.log(`Generated ${outputPath} (${catalog.total} products, ${categories.length} categories)`);
