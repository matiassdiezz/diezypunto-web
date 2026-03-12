/* GET /api/telegram-cart/{code} — retrieve stored cart context (consumed by Telegram bot) */

import { NextRequest, NextResponse } from "next/server";
import { cartStore } from "../store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const payload = cartStore.get(code);

  if (!payload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(payload);
}
