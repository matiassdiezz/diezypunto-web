import { NextResponse } from "next/server";
import { getAllProducts, getCatalogInfo } from "@/lib/engine/local-catalog";

export async function GET() {
  try {
    const info = getCatalogInfo();
    const { products } = getAllProducts({ limit: 9999 });

    return NextResponse.json({
      business: {
        name: "Diezypunto",
        description:
          "Proveedor B2B de merchandising y regalos corporativos en Argentina.",
        country: "Argentina",
        currency: "ARS",
        min_order_note:
          "Las cantidades mínimas varían por producto (desde 25 unidades).",
        personalization_methods: [
          "Serigrafía",
          "Bordado",
          "Grabado láser",
          "Sublimación",
          "UV",
          "Tampografía",
        ],
        shipping: "Todo Argentina",
        lead_time: "7-15 días hábiles promedio",
      },
      catalog: {
        total: info.total,
        synced_at: info.synced_at,
        categories: info.categories,
      },
      products: products.map((p) => ({
        id: p.product_id,
        title: p.title,
        description: p.description,
        category: p.category,
        // Prices not exposed — markup pending
        price: "Consultar",
        min_qty: p.min_qty,
        materials: p.materials,
        colors: p.colors,
        personalization_methods: p.personalization_methods,
        eco_friendly: p.eco_friendly,
        image: p.image_urls[0] || null,
      })),
      capabilities: {
        ai_search: "POST /api/search — búsqueda AI con lenguaje natural",
        browse: "GET /api/products?category=X&search=Y&limit=N&offset=N",
        categories: "GET /api/categories",
        checkout: "POST /api/checkout — generar link de pago Mercado Pago",
        cart_review: "POST /api/cart-review — análisis AI del carrito",
      },
    });
  } catch (err) {
    console.error("Catalog feed error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Error generating catalog feed", detail: message },
      { status: 500 },
    );
  }
}
