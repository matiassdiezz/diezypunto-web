/* GET /api/share-code/{code} — retrieve stored share context */

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
