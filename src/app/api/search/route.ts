import { NextRequest, NextResponse } from "next/server";
import { extractNeeds } from "@/lib/engine/llm";
import { listZecatProducts } from "@/lib/engine/zecat";
import { rankProducts, type ExtractedNeeds } from "@/lib/engine/ranking";
import { checkRateLimit } from "@/lib/engine/rate-limit";
import { randomUUID } from "crypto";

// In-memory session store (survives across requests in the same serverless instance)
const sessions = new Map<
  string,
  { needs: ExtractedNeeds; ts: number }
>();

// Cleanup old sessions (> 30 min)
function cleanup() {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, s] of sessions) {
    if (s.ts < cutoff) sessions.delete(id);
  }
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas busquedas. Espera un momento." },
      { status: 429 },
    );
  }

  cleanup();

  const { query, session_id } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  // Extract needs from query via LLM
  const needs = await extractNeeds(query);

  // Merge with existing session needs if available
  let mergedNeeds: ExtractedNeeds = { ...needs };
  let sessionId = session_id;
  if (sessionId && sessions.has(sessionId)) {
    const existing = sessions.get(sessionId)!.needs;
    mergedNeeds = mergeNeeds(existing, needs);
  } else {
    sessionId = randomUUID();
  }

  // Map internal category codes to Zecat family names
  const CATEGORY_TO_FAMILY: Record<string, string> = {
    drinkware: "Drinkware",
    bags: "Bolsos y Mochilas",
    apparel: "Apparel",
    tech: "Tecnología",
    writing: "Escritura",
    outdoor: "Hogar y Tiempo Libre",
    office: "Escritorio",
    eco: "Sustentables",
    kits: "", // no direct family match
    premium: "",
  };

  // Use style_keywords + constraints + materials as search text (NOT category codes)
  const searchTerms = [
    ...(mergedNeeds.style_keywords || []),
    ...(mergedNeeds.must_have_constraints || []),
    ...(mergedNeeds.preferred_materials || []),
  ].join(" ");

  const searchQuery = searchTerms || query;

  // Resolve category filter from extracted needs
  const cats = mergedNeeds.desired_categories || [];
  const zecatFamily = cats.length > 0 ? CATEGORY_TO_FAMILY[cats[0]] : undefined;

  const zecatRes = await listZecatProducts({
    search: searchQuery,
    category: zecatFamily || undefined,
    limit: 50,
  });
  let candidates = zecatRes.products;

  // If category-filtered search returned few results, retry without category filter
  if (candidates.length < 5 && zecatFamily) {
    const fallbackRes = await listZecatProducts({ search: searchQuery, limit: 50 });
    // Merge: category results first, then fallback (deduplicated)
    const seen = new Set(candidates.map((p) => p.product_id));
    for (const p of fallbackRes.products) {
      if (!seen.has(p.product_id)) {
        candidates.push(p);
        seen.add(p.product_id);
      }
    }
  }

  // If still no results, search with the original user query as-is
  if (candidates.length === 0) {
    const rawRes = await listZecatProducts({ search: query, limit: 50 });
    candidates = rawRes.products;
  }

  const ranked = rankProducts(candidates, mergedNeeds, 15);

  // Build summary
  let summary = "";
  if (ranked.length > 0) {
    summary = `Encontre ${ranked.length} productos que coinciden con tu busqueda`;
    const cats = mergedNeeds.desired_categories;
    if (cats && cats.length > 0) {
      summary += ` en ${cats.slice(0, 3).join(", ")}`;
    }
    summary += ".";
  }

  // Save session
  sessions.set(sessionId, { needs: mergedNeeds, ts: Date.now() });

  return NextResponse.json({
    session_id: sessionId,
    products: ranked,
    extracted_needs: mergedNeeds,
    summary,
    total_matches: ranked.length,
    has_more: false,
  });
}

function mergeNeeds(
  existing: ExtractedNeeds,
  incoming: ExtractedNeeds,
): ExtractedNeeds {
  const merged: Record<string, unknown> = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    if (Array.isArray(value) && Array.isArray(merged[key])) {
      const arr = merged[key] as unknown[];
      for (const item of value) {
        if (!arr.includes(item)) arr.push(item);
      }
    } else {
      merged[key] = value;
    }
  }
  return merged as ExtractedNeeds;
}
