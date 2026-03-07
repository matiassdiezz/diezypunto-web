import { NextRequest, NextResponse } from "next/server";
import { getProducts, searchProductsText } from "@/lib/engine/products";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category = sp.get("category");
  const search = sp.get("search");
  const minPrice = sp.get("min_price");
  const maxPrice = sp.get("max_price");
  const ecoFriendly = sp.get("eco_friendly");
  const personalization = sp.get("personalization");
  const limit = parseInt(sp.get("limit") || "50");
  const offset = parseInt(sp.get("offset") || "0");

  let products = search
    ? searchProductsText(search, 100)
    : getProducts();

  if (category) {
    const catLower = category.toLowerCase();
    products = products.filter((p) => p.category.toLowerCase() === catLower);
  }
  if (minPrice) {
    const min = parseFloat(minPrice);
    products = products.filter((p) => p.price != null && p.price >= min);
  }
  if (maxPrice) {
    const max = parseFloat(maxPrice);
    products = products.filter((p) => p.price != null && p.price <= max);
  }
  if (ecoFriendly === "true") {
    products = products.filter((p) => p.eco_friendly);
  }
  if (personalization) {
    products = products.filter((p) =>
      p.personalization_methods.includes(personalization),
    );
  }

  const total = products.length;
  const page = products.slice(offset, offset + limit);

  return NextResponse.json({
    products: page,
    total,
    limit,
    offset,
    has_more: offset + limit < total,
  });
}
