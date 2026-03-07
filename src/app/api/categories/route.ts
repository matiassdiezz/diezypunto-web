import { NextResponse } from "next/server";
import { getZecatCategories } from "@/lib/engine/zecat";

export async function GET() {
  try {
    const categories = await getZecatCategories();
    return NextResponse.json(categories);
  } catch (err) {
    console.error("Zecat categories error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Error fetching categories", detail: message },
      { status: 502 },
    );
  }
}
