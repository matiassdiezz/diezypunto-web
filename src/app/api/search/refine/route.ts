import { NextRequest, NextResponse } from "next/server";
import { extractNeeds } from "@/lib/engine/llm";
import { searchProductsText } from "@/lib/engine/products";
import { rankProducts } from "@/lib/engine/ranking";

// Re-use the session store from the search route by importing inline
// (serverless functions share memory within the same invocation)
// For a proper implementation we'd use a shared store, but for MVP
// we just re-extract + merge from the new query alone.

export async function POST(req: NextRequest) {
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

  const candidates = searchTerms
    ? searchProductsText(searchTerms)
    : searchProductsText(query);

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
