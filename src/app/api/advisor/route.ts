/* POST /api/advisor — AI quote advisor */

import { NextRequest, NextResponse } from "next/server";
import { advisorSearch } from "@/lib/engine/llm";
import { searchLocalCatalog, getDiversifiedSample } from "@/lib/engine/local-catalog";
import { checkRateLimit } from "@/lib/engine/rate-limit";
import type { AdvisorContext } from "@/lib/types";

export async function POST(request: NextRequest) {
  // Rate limit (shared with search)
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta en un minuto." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const context: AdvisorContext = body.context;

    if (!context) {
      return NextResponse.json(
        { error: "Falta el contexto del pedido." },
        { status: 400 }
      );
    }

    // Build search query from context
    const searchTerms: string[] = [];
    if (context.event_type && context.event_type !== "Otro") {
      searchTerms.push(context.event_type);
    }
    if (context.extra) {
      searchTerms.push(context.extra);
    }

    // Find candidates via text search or diversified sample
    let candidates = searchTerms.length > 0
      ? searchLocalCatalog(searchTerms.join(" "), { maxResults: 50 })
      : [];

    if (candidates.length < 10) {
      const sample = getDiversifiedSample(5, 50);
      const existingIds = new Set(candidates.map((c) => c.product_id));
      const additional = sample.filter((p) => !existingIds.has(p.product_id));
      candidates = [...candidates, ...additional].slice(0, 50);
    }

    const result = await advisorSearch(context, candidates);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Error al generar recomendaciones." },
      { status: 500 }
    );
  }
}
