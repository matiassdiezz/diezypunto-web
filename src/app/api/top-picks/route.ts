import { NextRequest, NextResponse } from "next/server";
import { getTopPickProducts } from "@/lib/top-picks";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") || undefined;
  const products = getTopPickProducts(category);
  return NextResponse.json({ products });
}
