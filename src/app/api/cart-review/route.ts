/* POST /api/cart-review — AI analysis of cart items */

import { NextRequest, NextResponse } from "next/server";
import { reviewCart } from "@/lib/engine/llm";
import { checkRateLimit } from "@/lib/engine/rate-limit";
import { trackServerEvent, trackAICost } from "@/lib/engine/analytics";

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
    const items = body.items;

    if (!Array.isArray(items) || items.length < 2) {
      return NextResponse.json(
        { error: "Se necesitan al menos 2 productos para analizar." },
        { status: 400 }
      );
    }
    if (items.length > 30) {
      return NextResponse.json(
        { error: "Máximo 30 productos por análisis." },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const t0 = Date.now();
    const result = await reviewCart(items);
    const latency = Date.now() - t0;

    trackServerEvent("cart_review", {
      items_count: items.length,
      total_qty: items.reduce((s: number, i: { qty: number }) => s + i.qty, 0),
      score: result.score,
    }, { ip });

    if (result.usage.inputTokens > 0) {
      trackAICost("cart_review", result.usage, { model: result.usage.model, latency_ms: latency, ip });
    }

    const { usage: _usage, ...data } = result;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Error al analizar el carrito." },
      { status: 500 }
    );
  }
}
