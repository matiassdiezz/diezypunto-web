/* POST /api/cart-review — AI analysis of cart items */

import { NextRequest, NextResponse } from "next/server";
import { reviewCart } from "@/lib/engine/llm";
import { checkRateLimit } from "@/lib/engine/rate-limit";

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

    const result = await reviewCart(items);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Error al analizar el carrito." },
      { status: 500 }
    );
  }
}
