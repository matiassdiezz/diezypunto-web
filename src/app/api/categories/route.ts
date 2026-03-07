import { NextResponse } from "next/server";
import { getCategories } from "@/lib/engine/products";

export async function GET() {
  return NextResponse.json(getCategories());
}
