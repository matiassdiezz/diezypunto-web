import { NextRequest, NextResponse } from "next/server";
import { extractNeeds } from "@/lib/engine/llm";
import { listZecatProducts } from "@/lib/engine/zecat";
import { rankProducts } from "@/lib/engine/ranking";
import { checkRateLimit } from "@/lib/engine/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas busquedas. Espera un momento." },
      { status: 429 },
    );
  }

  const { session_id, query } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }
  if (!session_id) {
    return NextResponse.json(
      { error: "session_id is required" },
      { status: 400 },
    );
  }

  // Extract needs from the refinement query
  const needs = await extractNeeds(query);

  const searchTerms = [
    ...(needs.desired_categories || []),
    ...(needs.style_keywords || []),
    ...(needs.must_have_constraints || []),
    ...(needs.preferred_materials || []),
  ].join(" ");

  const searchQuery = searchTerms || query;
  const zecatRes = await listZecatProducts({ search: searchQuery, limit: 50 });
  const candidates = zecatRes.products;

  const ranked = rankProducts(candidates, needs, 15);

  let summary = "";
  if (ranked.length > 0) {
    summary = `Encontre ${ranked.length} productos con los nuevos criterios.`;
  }

  return NextResponse.json({
    session_id,
    products: ranked,
    extracted_needs: needs,
    summary,
    total_matches: ranked.length,
    has_more: false,
  });
}
