/* LLM — single-call AI search: extract needs + rerank + generate summary */

import Anthropic from "@anthropic-ai/sdk";
import type {
  ExtractedNeeds,
  ProductResult,
  AIPicksResponse,
  CartReviewResponse,
  AdvisorContext,
  AdvisorResponse,
} from "../types";

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

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  model: string;
}

/** Single Claude call: extract needs + rerank candidates + generate summary */
export async function searchWithAI(
  query: string,
  candidates: ProductResult[]
): Promise<{
  products: ProductResult[];
  needs: ExtractedNeeds;
  summary: string;
  usage: AIUsage;
}> {
  if (candidates.length === 0) {
    return { products: [], needs: fallbackExtraction(query), summary: "", usage: { inputTokens: 0, outputTokens: 0, model: "claude-haiku-4-5-20251001" } };
  }

  // Build compact product list for Claude
  const productLines = candidates.map((p) => {
    const parts = [`ID:${p.product_id}`, p.title, p.category];
    if (p.materials.length > 0) parts.push(`Mat:${p.materials.join(",")}`);
    if (p.personalization_methods.length > 0)
      parts.push(`Pers:${p.personalization_methods.join(",")}`);
    if (p.price != null) parts.push(`$${p.price}`);
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
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: SEARCH_PROMPT,
      messages: [{ role: "user", content: context }],
    });

    const aiUsage: AIUsage = {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      model: "claude-haiku-4-5-20251001",
    };

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { ...fallbackResult(query, candidates), usage: aiUsage };
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

    return { products: reranked, needs, summary, usage: aiUsage };
  } catch (error) {
    console.error("AI search failed:", error);
    return { ...fallbackResult(query, candidates), usage: { inputTokens: 0, outputTokens: 0, model: "claude-haiku-4-5-20251001" } };
  }
}

function fallbackResult(
  query: string,
  candidates: ProductResult[]
): { products: ProductResult[]; needs: ExtractedNeeds; summary: string; usage: AIUsage } {
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
    usage: { inputTokens: 0, outputTokens: 0, model: "claude-haiku-4-5-20251001" },
  };
}

/* --- AI Top Picks --- */

const TOP_PICKS_PROMPT = `Sos un curador experto de merchandising corporativo B2B argentino.

Tu tarea: seleccionar 6 productos destacados del catalogo para mostrar en la homepage.

Criterios de seleccion (NO es "mas vendidos" — es curaduria inteligente):
1. Variedad de categorias (no repetir la misma categoria)
2. Estacionalidad (considerar el mes y estacion actual en Argentina)
3. Tendencias B2B (sustentabilidad, personalizacion, tech)
4. Mix de precios (algunos accesibles, algunos premium)
5. Potencial de personalizacion (priorizar productos personalizables)
6. Atractivo visual (productos que se ven bien en una grilla)

IMPORTANTE:
- Exactamente 6 productos
- Cada reason debe ser corta (max 8 palabras), orientada al beneficio
- El collection_title debe ser creativo y estacional (ej: "Seleccion de Otono 2026")
- NO uses "Los mas vendidos" ni "Top X" — esto es curaduria, no ranking

Responde SOLO con un JSON:
{
  "picks": [
    { "id": "product_id", "reason": "Razon corta orientada al beneficio" }
  ],
  "collection_title": "Titulo creativo de la coleccion"
}`;

export async function generateTopPicks(
  catalogSample: ProductResult[]
): Promise<AIPicksResponse & { usage: AIUsage }> {
  const productLines = catalogSample.map((p) => {
    const parts = [`ID:${p.product_id}`, p.title, p.category];
    if (p.materials.length > 0) parts.push(`Mat:${p.materials.join(",")}`);
    if (p.eco_friendly) parts.push("ECO");
    if (p.price != null) parts.push(`$${p.price}`);
    if (p.personalization_methods.length > 0)
      parts.push(`Pers:${p.personalization_methods.join(",")}`);
    return parts.join(" | ");
  });

  const now = new Date();
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const month = months[now.getMonth()];
  const season =
    now.getMonth() >= 2 && now.getMonth() <= 4
      ? "Otono"
      : now.getMonth() >= 5 && now.getMonth() <= 7
        ? "Invierno"
        : now.getMonth() >= 8 && now.getMonth() <= 10
          ? "Primavera"
          : "Verano";

  const context = [
    `Mes actual: ${month} ${now.getFullYear()} (${season} en Argentina)`,
    "",
    `Catalogo (${catalogSample.length} productos):`,
    ...productLines,
  ].join("\n");

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: TOP_PICKS_PROMPT,
      messages: [{ role: "user", content: context }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      picks: (parsed.picks || []).slice(0, 6),
      collection_title: parsed.collection_title || `Seleccion de ${season}`,
      usage: {
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        model: "claude-haiku-4-5-20251001",
      },
    };
  } catch (error) {
    console.error("AI top picks failed:", error);
    throw error;
  }
}

/* --- AI Cart Review --- */

const CART_REVIEW_PROMPT = `Sos un consultor experto en merchandising corporativo B2B argentino.

Tu tarea: analizar el carrito del cliente y dar insights accionables.

Tipos de insight (usa solo los relevantes, max 4):
- "gap": falta algo para completar el pedido (ej: "Agrega mochilas para completar el kit")
- "optimization": optimizacion de cantidad o precio (ej: "Con 50 gorras mas alcanzas precio bulk")
- "warning": problema concreto (ej: "Producto sin precio, consultar")
- "tip": sugerencia de valor (ej: "3 productos tienen alternativa eco")

Iconos por tipo: gap="🎯", optimization="💰", warning="⚠️", tip="🌱"

IMPORTANTE:
- Score de 1 a 5 (1=necesita mucho trabajo, 5=excelente)
- Si el pedido esta bien, decilo. No inventes problemas.
- Max 4 insights, priorizar los mas impactantes
- Summary en 1 oracion, habla en segunda persona (vos)
- Si un insight tiene una accion buscable, incluir "action" con el termino de busqueda
Responde SOLO con un JSON:
{
  "summary": "Resumen en 1 oracion",
  "score": 4,
  "insights": [
    { "type": "gap", "icon": "🎯", "message": "Mensaje", "action": "termino busqueda" }
  ]
}`;

export async function reviewCart(
  cartItems: {
    product_id: string;
    title: string;
    category: string;
    qty: number;
    price: number | null;
    eco_friendly: boolean;
    personalization_methods: string[];
    min_qty: number;
  }[]
): Promise<CartReviewResponse & { usage: AIUsage }> {
  const lines = cartItems.map((item) => {
    const parts = [
      `ID:${item.product_id}`,
      item.title,
      item.category,
      `Qty:${item.qty}`,
    ];
    if (item.price != null) parts.push(`$${item.price}`);
    if (item.eco_friendly) parts.push("ECO");
    if (item.personalization_methods.length > 0)
      parts.push(`Pers:${item.personalization_methods.join(",")}`);
    return parts.join(" | ");
  });

  const totalItems = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const context = [
    `Carrito del cliente (${cartItems.length} productos, ${totalItems} unidades total):`,
    ...lines,
  ].join("\n");

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: CART_REVIEW_PROMPT,
      messages: [{ role: "user", content: context }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: parsed.summary || "",
      score: Math.min(5, Math.max(1, parsed.score || 3)),
      insights: (parsed.insights || []).slice(0, 4),
      usage: {
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        model: "claude-haiku-4-5-20251001",
      },
    };
  } catch (error) {
    console.error("AI cart review failed:", error);
    throw error;
  }
}

/* --- AI Quote Advisor --- */

const ADVISOR_PROMPT = `Sos un consultor experto en merchandising corporativo B2B argentino.

Tu tarea: seleccionar los mejores productos para el brief del cliente. Vas a armar un COMBO por persona.

Criterios:
1. Fit con el tipo de evento y audiencia
2. Rango de presupuesto POR PERSONA (si lo indico)
3. Variedad de categorias
4. Personalizacion disponible
5. Disponibilidad y variedad

IMPORTANTE sobre presupuesto y cantidades:
- El presupuesto indicado es POR PERSONA — es lo que vale el COMBO completo por persona
- La suma de precios unitarios de los productos "core" debe estar DENTRO del rango indicado
- Opcionalmente, seleccionar 1-2 productos "upsell" que mejoren el combo (marcados con upsell: true)
- qty = cantidad de personas (todos reciben el mismo combo)
- Ejemplo: presupuesto $5,000-$10,000/persona → core: cuaderno $4,000 + lapicera $600 + llavero $2,000 = $6,600 ✓ | upsell: botella $3,500 → $10,100 total

IMPORTANTE:
- Seleccionar entre 4 y 8 productos (core + upsell)
- Cada reason debe ser corta, orientada al beneficio para su caso especifico
- El summary describe el pedido ideal en 1-2 oraciones
- follow_up_questions: 1-2 preguntas para refinar (o [] si el brief fue completo)
- Habla en segunda persona (vos), tono profesional pero cercano

Responde SOLO con un JSON:
{
  "selected": [
    { "id": "product_id", "qty": 50, "reason": "Razon corta", "upsell": false }
  ],
  "summary": "Resumen del pedido ideal",
  "follow_up_questions": ["Pregunta para refinar"]
}`;

/** Parse budget_range string to { min, max, midpoint } or null for "Flexible" */
function parseBudgetRange(
  range: string
): { min: number | null; max: number | null; midpoint: number | null } | null {
  if (!range || range === "Flexible") return null;
  const cleaned = range.replace(/\./g, "").replace(/,/g, "");
  // "< $2,000" or "< $2.000"
  const ltMatch = cleaned.match(/^<\s*\$?\s*(\d+)/);
  if (ltMatch) {
    const max = parseInt(ltMatch[1]);
    return { min: null, max, midpoint: max };
  }
  // "$2,000 - $5,000"
  const rangeMatch = cleaned.match(/\$?\s*(\d+)\s*-\s*\$?\s*(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    return { min, max, midpoint: Math.round((min + max) / 2) };
  }
  // "+ $10,000" or "> $10,000"
  const gtMatch = cleaned.match(/[+>]\s*\$?\s*(\d+)/);
  if (gtMatch) {
    const min = parseInt(gtMatch[1]);
    return { min, max: null, midpoint: min };
  }
  return null;
}

/** Parse audience_size string to a number or null */
function parseAudienceSize(size: string): number | null {
  if (!size || size === "No se") return null;
  const cleaned = size.replace(/\./g, "").replace(/,/g, "");
  // "+500"
  const gtMatch = cleaned.match(/^\+\s*(\d+)/);
  if (gtMatch) return parseInt(gtMatch[1]);
  // "10-50", "50-200", "200-500"
  const rangeMatch = cleaned.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    return Math.round((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2);
  }
  // Plain number
  const numMatch = cleaned.match(/(\d+)/);
  if (numMatch) return parseInt(numMatch[1]);
  return null;
}

export async function advisorSearch(
  context: AdvisorContext,
  candidates: ProductResult[]
): Promise<AdvisorResponse> {
  // Parse budget and audience for explicit constraints
  const budget = parseBudgetRange(context.budget_range);
  const audienceNum = parseAudienceSize(context.audience_size);
  const budgetMax = budget?.max ?? budget?.midpoint ?? null;

  // Filter candidates that cost more than the per-person budget
  if (budgetMax != null) {
    candidates = candidates.filter(
      (p) => p.price == null || p.price <= budgetMax
    );
  }

  const productLines = candidates.map((p) => {
    const parts = [`ID:${p.product_id}`, p.title, p.category];
    if (p.materials.length > 0) parts.push(`Mat:${p.materials.join(",")}`);
    if (p.price != null) parts.push(`$${p.price}`);
    if (p.eco_friendly) parts.push("ECO");
    if (p.personalization_methods.length > 0)
      parts.push(`Pers:${p.personalization_methods.join(",")}`);
    return parts.join(" | ");
  });

  // Build budget constraint lines
  const budgetLines: string[] = [
    `- Presupuesto por persona: ${context.budget_range || "Flexible"}`,
  ];
  if (budget && audienceNum) {
    const totalEstimate = budget.midpoint! * audienceNum;
    budgetLines.push(
      `- → Presupuesto TOTAL estimado: $${totalEstimate.toLocaleString("es-AR")} (= ~$${budget.midpoint!.toLocaleString("es-AR")}/persona × ${audienceNum})`
    );
    budgetLines.push(
      `- → Cada producto recomendado debe costar MENOS de $${(budgetMax ?? budget.midpoint!).toLocaleString("es-AR")} (presupuesto por persona)`
    );
  } else if (budget) {
    budgetLines.push(
      `- → Cada producto recomendado debe costar MENOS de $${(budgetMax ?? budget.midpoint!).toLocaleString("es-AR")} (presupuesto por persona)`
    );
  }

  const brief = [
    `Brief del cliente:`,
    `- Tipo de evento: ${context.event_type || "No especificado"}`,
    `- Cantidad de personas: ${context.audience_size || "No especificado"}`,
    ...budgetLines,
    context.extra ? `- Detalles adicionales: ${context.extra}` : "",
    "",
    `Productos candidatos (${candidates.length}):`,
    ...productLines,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system: ADVISOR_PROMPT,
      messages: [{ role: "user", content: brief }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      selected: (parsed.selected || []).slice(0, 8).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        reason: (s.reason || "") as string,
        qty: typeof s.qty === "number" && s.qty > 0 ? s.qty : 1,
        upsell: s.upsell === true,
      })),
      summary: parsed.summary || "",
      follow_up_questions: (parsed.follow_up_questions || []).slice(0, 2),
    };
  } catch (error) {
    console.error("AI advisor search failed:", error);
    throw error;
  }
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
