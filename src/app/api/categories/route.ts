import { NextResponse } from "next/server";
import { getCatalogInfo } from "@/lib/engine/local-catalog";

export async function GET() {
  try {
    const info = getCatalogInfo();
    return NextResponse.json({
      categories: info.categories.map((name) => ({
        name,
        count: 0,
        subcategories: [],
      })),
      total_products: info.total,
    });
  } catch (err) {
    console.error("Categories error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Error fetching categories", detail: message },
      { status: 500 }
    );
  }
}
