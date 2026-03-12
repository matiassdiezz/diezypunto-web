/* GET /api/ai-picks — AI-curated top picks with 1hr in-memory cache */

import { NextResponse } from "next/server";
import { generateTopPicks } from "@/lib/engine/llm";
import { getCatalogSample } from "@/lib/engine/local-catalog";
import type { AIPicksResponse } from "@/lib/types";

interface CacheEntry {
  data: AIPicksResponse;
  expiresAt: number;
}

let cache: CacheEntry | null = null;
const TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const now = Date.now();

  // Return cached if valid
  if (cache && now < cache.expiresAt) {
    return NextResponse.json(cache.data);
  }

  try {
    const sample = getCatalogSample(60);
    const result = await generateTopPicks(sample);

    cache = { data: result, expiresAt: now + TTL_MS };
    return NextResponse.json(result);
  } catch {
    // Fallback: random picks without reasoning
    const sample = getCatalogSample(6);
    const fallback: AIPicksResponse = {
      picks: sample.map((p) => ({ id: p.product_id, reason: "" })),
      collection_title: "Productos destacados",
    };
    return NextResponse.json(fallback);
  }
}
