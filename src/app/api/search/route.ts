import { NextRequest, NextResponse } from "next/server";
import { searchWithAI } from "@/lib/engine/llm";
import { searchLocalCatalog, getDiversifiedSample } from "@/lib/engine/local-catalog";
import { checkRateLimit } from "@/lib/engine/rate-limit";
import { trackServerEvent, trackAICost } from "@/lib/engine/analytics";
import { randomUUID } from "crypto";
import type { ExtractedNeeds } from "@/lib/types";

// In-memory session store (survives across requests in the same serverless instance)
const sessions = new Map<string, { needs: ExtractedNeeds; ts: number }>();

// In-memory search cache — avoids repeated Claude calls for identical queries
const searchCache = new Map<string, { data: object; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

function cleanup() {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, s] of sessions) {
    if (s.ts < cutoff) sessions.delete(id);
  }
  const cacheCutoff = Date.now() - CACHE_TTL;
  for (const [key, entry] of searchCache) {
    if (entry.ts < cacheCutoff) searchCache.delete(key);
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

  // Check cache — keyed on normalized query only (does not include filters/session context).
  // This is fine for now since AI search doesn't receive filter params, but if filters
  // are ever passed to searchWithAI, the cache key must include them.
  const cacheKey = query.toLowerCase().trim().replace(/\s+/g, " ");
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    const sessionId = session_id || randomUUID();
    trackServerEvent("search", { query, results_count: (cached.data as { products: unknown[] }).products?.length ?? 0, cache_hit: true }, { ip, session_id: sessionId });
    return NextResponse.json({ ...cached.data, session_id: sessionId });
  }

  // Step 1: Text search on local catalog (instant, ~0ms)
  let candidates = searchLocalCatalog(query, { maxResults: 50 });

  // Fallback: if too few text matches, pad with diversified sample
  if (candidates.length < 3) {
    const sample = getDiversifiedSample(3, 50);
    const seen = new Set(candidates.map((p) => p.product_id));
    for (const p of sample) {
      if (!seen.has(p.product_id)) candidates.push(p);
    }
  }

  // Step 2: Single Claude call — extract needs + rerank + summary
  const t0 = Date.now();
  const { products, needs, summary, usage } = await searchWithAI(query, candidates);
  const latency = Date.now() - t0;

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

  // Analytics
  trackServerEvent("search", {
    query,
    results_count: products.length,
    cache_hit: false,
    top_product_ids: products.slice(0, 5).map((p) => p.product_id),
    search_time_ms: latency,
  }, { ip, session_id: sessionId });

  if (usage.inputTokens > 0) {
    trackAICost("search", usage, { model: usage.model, latency_ms: latency, ip, session_id: sessionId });
  }

  const responsePayload = {
    products,
    extracted_needs: needs,
    summary,
    total_matches: products.length,
    has_more: false,
  };

  // Cache the result (without session_id — that's added per-request)
  searchCache.set(cacheKey, { data: responsePayload, ts: Date.now() });

  return NextResponse.json({ ...responsePayload, session_id: sessionId });
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
