/* LLM needs extraction — uses Claude API directly */

import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedNeeds } from "./ranking";

const EXTRACTION_PROMPT = `Extract structured commercial needs from the user's message.
Return ONLY a JSON object with these fields (omit fields you can't determine):
{
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
  "personalization_needed": null,
  "brand_profile": "",
  "unknown_required_fields": []
}

Valid categories: drinkware, bags, tech, writing, apparel, outdoor, office, eco, premium, kits.

Product-to-category mapping (use this to fill desired_categories from colloquial words):
- gorras, remeras, camperas, buzos, chalecos, medias → apparel
- botellas, termos, mates, tazas, vasos → drinkware
- mochilas, bolsos, neceseres, rinoneras, totebags → bags
- pendrives, cargadores, parlantes, auriculares → tech
- lapiceras, boligrafos, cuadernos, anotadores → writing
- reposeras, conservadoras, mantas → outdoor
- organizadores, portanotas, mousepad → office
- kits, combos, sets, cajas → kits

Only add to unknown_required_fields if the request is genuinely vague (e.g. "algo para regalar", "necesito merch") — NOT for missing quantity or budget.
Interpret colloquial Argentine Spanish naturally.`;

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export async function extractNeeds(query: string): Promise<ExtractedNeeds> {
  try {
    const client = getClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: EXTRACTION_PROMPT,
      messages: [{ role: "user", content: query }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    const parsed = JSON.parse(jsonMatch[0]);

    // Sanitize: ensure lists are arrays, quantity is number
    if (parsed.quantity && typeof parsed.quantity !== "number") {
      const n = parseInt(parsed.quantity);
      parsed.quantity = isNaN(n) ? null : n;
    }
    for (const field of [
      "desired_categories",
      "style_keywords",
      "must_have_constraints",
      "preferred_materials",
    ]) {
      if (parsed[field] && typeof parsed[field] === "string") {
        parsed[field] = [parsed[field]];
      }
    }

    return parsed;
  } catch (error) {
    console.error("LLM extraction failed:", error);
    // Fallback: extract what we can from the raw query
    return fallbackExtraction(query);
  }
}

function fallbackExtraction(query: string): ExtractedNeeds {
  const q = query.toLowerCase();
  const needs: ExtractedNeeds = {
    style_keywords: q.split(/\s+/).filter((w) => w.length > 3),
  };

  // Simple quantity extraction
  const qtyMatch = q.match(/(\d+)\s*(unidades|u\b|pcs|botellas|remeras|gorras|mochilas|kits)/);
  if (qtyMatch) needs.quantity = parseInt(qtyMatch[1]);

  // Category detection
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

  // Eco detection
  if (q.includes("eco") || q.includes("sustentable") || q.includes("reciclad")) {
    needs.must_have_constraints = [...(needs.must_have_constraints || []), "eco"];
  }

  return needs;
}
