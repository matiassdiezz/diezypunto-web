import { NextRequest, NextResponse } from "next/server";
import { searchWithAI } from "@/lib/engine/llm";
import { searchLocalCatalog } from "@/lib/engine/local-catalog";
import { checkRateLimit } from "@/lib/engine/rate-limit";
import { randomUUID } from "crypto";
import type { ExtractedNeeds } from "@/lib/engine/ranking";

// In-memory session store (survives across requests in the same serverless instance)
const sessions = new Map<string, { needs: ExtractedNeeds; ts: number }>();

function cleanup() {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, s] of sessions) {
    if (s.ts < cutoff) sessions.delete(id);
  }
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas busquedas. Espera un momento." },
      { status: 429 }
    );
  }

  cleanup();

  const { query, session_id } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  // Step 1: Text search on local catalog (instant, ~0ms)
  const candidates = searchLocalCatalog(query, { maxResults: 50 });

  // Step 2: Single Claude call — extract needs + rerank + summary (~3s)
  const { products, needs, summary } = await searchWithAI(query, candidates);

  // Session management
  let sessionId = session_id;
  if (sessionId && sessions.has(sessionId)) {
    const existing = sessions.get(sessionId)!.needs;
    const merged = mergeNeeds(existing, needs);
    sessions.set(sessionId, { needs: merged, ts: Date.now() });
  } else {
    sessionId = randomUUID();
    sessions.set(sessionId, { needs, ts: Date.now() });
  }

  return NextResponse.json({
    session_id: sessionId,
    products,
    extracted_needs: needs,
    summary,
    total_matches: products.length,
    has_more: false,
  });
}

function mergeNeeds(
  existing: ExtractedNeeds,
  incoming: ExtractedNeeds
): ExtractedNeeds {
  const merged: Record<string, unknown> = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    )
      continue;
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
