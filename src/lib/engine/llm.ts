/* LLM — single-call AI search: extract needs + rerank + generate summary */

import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedNeeds } from "./ranking";
import type { ProductResult } from "../types";

const SEARCH_PROMPT = `Sos un experto en merchandising corporativo B2B argentino.

Tu tarea tiene 2 partes:

PARTE 1: Extraer las necesidades del cliente del pedido.
PARTE 2: Seleccionar los MEJORES productos de la lista de candidatos y ordenarlos por relevancia.

Criterios de seleccion (en orden de importancia):
1. Relevancia directa al pedido (tipo de producto, uso, audiencia)
2. Fit con la ocasion/evento mencionado
3. Calidad percibida vs expectativa del cliente
4. Variedad (no repetir productos casi iguales — elegir el mejor de cada tipo)
5. Relacion precio-valor (si hay budget mencionado)

IMPORTANTE:
- Maximo 12 productos en la seleccion final
- Si el pedido es vago ("algo para regalar"), priorizar bestsellers variados
- Si el pedido es especifico ("200 botellas eco"), priorizar exactitud
- Eliminar productos claramente irrelevantes aunque hayan matcheado por keyword

Responde SOLO con un JSON:
{
  "needs": {
    "event_type": "",
    "audience": "",
    "quantity": null,
    "budget_min": null,
    "budget_max": null,
    "desired_categories": [],
    "style_keywords": [],
    "urgency": "low" | "normal" | "high" | "urgent",
    "must_have_constraints": [],
    "preferred_materials": [],
    "personalization_needed": null
  },
  "selected_ids": ["id1", "id2", ...],
  "summary": "Resumen en 1-2 oraciones de lo que encontraste. Habla en segunda persona (vos). Tono profesional pero cercano. No uses comillas."
}

Para needs: omit fields que no puedas determinar.
Valid categories: drinkware, bags, tech, writing, apparel, outdoor, office, eco, premium, kits.
Interpret colloquial Argentine Spanish naturally.`;

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

/** Single Claude call: extract needs + rerank candidates + generate summary */
export async function searchWithAI(
  query: string,
  candidates: ProductResult[]
): Promise<{
  products: ProductResult[];
  needs: ExtractedNeeds;
  summary: string;
}> {
  if (candidates.length === 0) {
    return { products: [], needs: fallbackExtraction(query), summary: "" };
  }

  // Build compact product list for Claude
  const productLines = candidates.map((p) => {
    const parts = [`ID:${p.product_id}`, p.title, p.category];
    if (p.materials.length > 0) parts.push(`Mat:${p.materials.join(",")}`);
    if (p.personalization_methods.length > 0)
      parts.push(`Pers:${p.personalization_methods.join(",")}`);
    if (p.price != null) parts.push(`$${p.price}`);
    if (p.min_qty > 1) parts.push(`Min:${p.min_qty}`);
    if (p.eco_friendly) parts.push("ECO");
    if (p.colors.length > 0)
      parts.push(`Col:${p.colors.slice(0, 5).join(",")}`);
    return parts.join(" | ");
  });

  const context = [
    `Pedido del cliente: "${query}"`,
    "",
    `Productos candidatos (${candidates.length}):`,
    ...productLines,
  ].join("\n");

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SEARCH_PROMPT,
      messages: [{ role: "user", content: context }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return fallbackResult(query, candidates);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const needs: ExtractedNeeds = parsed.needs || {};
    const selectedIds: string[] = parsed.selected_ids || [];
    const summary: string = parsed.summary || "";

    // Reorder candidates by selected_ids order
    const idToProduct = new Map(candidates.map((p) => [p.product_id, p]));
    const reranked: ProductResult[] = [];
    for (const id of selectedIds) {
      const product = idToProduct.get(id);
      if (product) {
        reranked.push({
          ...product,
          score:
            Math.round(
              (1 - reranked.length / Math.max(selectedIds.length, 1)) * 1000
            ) / 1000,
        });
      }
    }

    // If Claude returned fewer than expected, pad with remaining candidates
    if (reranked.length < 5 && candidates.length > reranked.length) {
      const selectedSet = new Set(selectedIds);
      for (const p of candidates) {
        if (!selectedSet.has(p.product_id) && reranked.length < 12) {
          reranked.push({ ...p, score: 0.1 });
        }
      }
    }

    return { products: reranked, needs, summary };
  } catch (error) {
    console.error("AI search failed:", error);
    return fallbackResult(query, candidates);
  }
}

function fallbackResult(
  query: string,
  candidates: ProductResult[]
): { products: ProductResult[]; needs: ExtractedNeeds; summary: string } {
  const top = candidates.slice(0, 12).map((p, i) => ({
    ...p,
    score: Math.round((1 - i / 12) * 1000) / 1000,
  }));
  return {
    products: top,
    needs: fallbackExtraction(query),
    summary:
      top.length > 0
        ? `Encontre ${top.length} productos que pueden servirte.`
        : "",
  };
}

function fallbackExtraction(query: string): ExtractedNeeds {
  const q = query.toLowerCase();
  const needs: ExtractedNeeds = {
    style_keywords: q.split(/\s+/).filter((w) => w.length > 3),
  };

  const qtyMatch = q.match(
    /(\d+)\s*(unidades|u\b|pcs|botellas|remeras|gorras|mochilas|kits)/
  );
  if (qtyMatch) needs.quantity = parseInt(qtyMatch[1]);

  const catMap: Record<string, string[]> = {
    drinkware: ["botella", "termo", "mate", "taza", "vaso"],
    bags: ["mochila", "bolso", "totebag", "rinonera"],
    apparel: ["remera", "gorra", "campera", "chomba", "buzo"],
    tech: ["pendrive", "cargador", "parlante", "auricular", "powerbank"],
    writing: ["lapicera", "cuaderno", "boligrafo"],
    outdoor: ["reposera", "cooler", "paraguas"],
    kits: ["kit", "combo", "set"],
    eco: ["ecologico", "sustentable", "reciclado", "bambu"],
  };

  const cats: string[] = [];
  for (const [cat, words] of Object.entries(catMap)) {
    if (words.some((w) => q.includes(w))) cats.push(cat);
  }
  if (cats.length > 0) needs.desired_categories = cats;

  if (
    q.includes("eco") ||
    q.includes("sustentable") ||
    q.includes("reciclad")
  ) {
    needs.must_have_constraints = [
      ...(needs.must_have_constraints || []),
      "eco",
    ];
  }

  return needs;
}
