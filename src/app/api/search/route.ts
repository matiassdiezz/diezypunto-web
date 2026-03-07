import { NextRequest, NextResponse } from "next/server";
import { extractNeeds } from "@/lib/engine/llm";
import { searchProductsText } from "@/lib/engine/products";
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

  // Search + rank
  const searchTerms = [
    ...(mergedNeeds.desired_categories || []),
    ...(mergedNeeds.style_keywords || []),
    ...(mergedNeeds.must_have_constraints || []),
    ...(mergedNeeds.preferred_materials || []),
  ].join(" ");

  const candidates = searchTerms
    ? searchProductsText(searchTerms)
    : searchProductsText(query);

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
