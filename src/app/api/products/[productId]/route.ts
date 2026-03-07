import { NextResponse } from "next/server";
import { getZecatProduct } from "@/lib/engine/zecat";
import { getProductById } from "@/lib/engine/products";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;

  // Try Zecat first, fall back to local CSV (for AI search results)
  const product =
    (await getZecatProduct(productId)) ?? getProductById(productId);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}
