import { NextRequest, NextResponse } from "next/server";
import { searchWithAI } from "@/lib/engine/llm";
import { searchLocalCatalog, getDiversifiedSample } from "@/lib/engine/local-catalog";
import { checkRateLimit } from "@/lib/engine/rate-limit";
import { trackServerEvent, trackAICost } from "@/lib/engine/analytics";

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

  const { session_id, query } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }
  if (!session_id) {
    return NextResponse.json(
      { error: "session_id is required" },
      { status: 400 }
    );
  }

  // Text search + fallback + single Claude call
  let candidates = searchLocalCatalog(query, { maxResults: 50 });
  if (candidates.length < 3) {
    const sample = getDiversifiedSample(3, 50);
    const seen = new Set(candidates.map((p) => p.product_id));
    for (const p of sample) {
      if (!seen.has(p.product_id)) candidates.push(p);
    }
  }
  const t0 = Date.now();
  const { products, needs, summary, usage } = await searchWithAI(query, candidates);
  const latency = Date.now() - t0;

  trackServerEvent("search_refine", {
    query,
    results_count: products.length,
    session_id,
  }, { ip, session_id });

  if (usage.inputTokens > 0) {
    trackAICost("search", usage, { model: usage.model, latency_ms: latency, ip, session_id });
  }

  return NextResponse.json({
    session_id,
    products,
    extracted_needs: needs,
    summary,
    total_matches: products.length,
    has_more: false,
  });
}
