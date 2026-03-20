/* POST /api/share-code — store cart/product context for sharing */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/engine/rate-limit";
import { cartStore } from "./store";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta en un minuto." },
      { status: 429 }
    );
  }

  try {
    const payload = await request.json();

    if (!payload.type || (payload.type !== "cart" && payload.type !== "product")) {
      return NextResponse.json({ error: "Tipo invalido" }, { status: 400 });
    }

    const code = cartStore.set(payload);
    return NextResponse.json({ code });
  } catch {
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
