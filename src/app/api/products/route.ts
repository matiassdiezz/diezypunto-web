import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/engine/catalog-provider";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  try {
    const result = getAllProducts({
      category: sp.get("category") || undefined,
      search: sp.get("search") || undefined,
      min_price: sp.has("min_price")
        ? parseFloat(sp.get("min_price")!)
        : undefined,
      max_price: sp.has("max_price")
        ? parseFloat(sp.get("max_price")!)
        : undefined,
      eco_friendly: sp.get("eco_friendly") === "true" || undefined,
      personalization: sp.get("personalization") || undefined,
      sort: sp.get("sort") || undefined,
      limit: parseInt(sp.get("limit") || "24"),
      offset: parseInt(sp.get("offset") || "0"),
    });

    const limit = parseInt(sp.get("limit") || "24");
    const offset = parseInt(sp.get("offset") || "0");

    return NextResponse.json({
      products: result.products,
      total: result.total,
      limit,
      offset,
      has_more: offset + limit < result.total,
    });
  } catch (err) {
    console.error("Products error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Error fetching products", detail: message },
      { status: 500 }
    );
  }
}
