import { NextResponse } from "next/server";
import { getLocalProduct } from "@/lib/engine/catalog-provider";
import { getZecatProduct } from "@/lib/engine/zecat";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  // Try local catalog first (instant)
  const product = getLocalProduct(productId);
  if (product) {
    return NextResponse.json(product);
  }

  // Fallback to Zecat for products not in local cache
  const zecatProduct = await getZecatProduct(productId);
  if (zecatProduct) {
    return NextResponse.json(zecatProduct);
  }

  return NextResponse.json({ error: "Product not found" }, { status: 404 });
}
