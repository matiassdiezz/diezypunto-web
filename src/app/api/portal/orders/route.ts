import { NextRequest, NextResponse } from "next/server";

const VAULT_API_URL = process.env.VAULT_API_URL || "http://localhost:8001";

export const MOCK_ORDERS = [
  {
    id: "ORD-001",
    quote_id: "QUO-003",
    date: "2026-03-06",
    status: "confirmado",
    total: 78500,
    items: [
      { product_name: "Chomba piqué", sku: "CHO-001", quantity: 40, unit_price: 1200, category: "Remeras" },
      { product_name: "Polar corporativo", sku: "POL-001", quantity: 15, unit_price: 2500, category: "Abrigos" },
      { product_name: "Bolso deportivo", sku: "BOL-001", quantity: 20, unit_price: 800, category: "Bolsas" },
      { product_name: "Visera bordada", sku: "VIS-001", quantity: 30, unit_price: 250, category: "Gorras" },
      { product_name: "Paraguas automático", sku: "PAR-001", quantity: 10, unit_price: 650, category: "Accesorios" },
    ],
    description: "Uniforme equipo ventas",
    notes: "Bordado logo en pecho izquierdo",
    estimated_delivery: "2026-04-10",
  },
  {
    id: "ORD-002",
    quote_id: "QUO-005",
    date: "2026-02-20",
    status: "en_produccion",
    total: 95000,
    items: [
      { product_name: "Remera algodón orgánico", sku: "REM-003", quantity: 80, unit_price: 650, category: "Remeras" },
      { product_name: "Hoodie oversize", sku: "HOO-001", quantity: 30, unit_price: 1500, category: "Abrigos" },
    ],
    description: "Colección invierno staff",
    notes: "Sublimación full print",
    estimated_delivery: "2026-03-25",
  },
  {
    id: "ORD-003",
    quote_id: "QUO-006",
    date: "2026-01-15",
    status: "entregado",
    total: 42000,
    items: [
      { product_name: "Set de libretas A5", sku: "LIB-001", quantity: 100, unit_price: 250, category: "Papelería" },
      { product_name: "Bolígrafo ejecutivo", sku: "BOL-002", quantity: 100, unit_price: 170, category: "Papelería" },
    ],
    description: "Welcome kit nuevos clientes",
    notes: "Packaging individual con tarjeta",
    estimated_delivery: "2026-02-10",
    delivered_date: "2026-02-08",
  },
];

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Dev bypass: return mock orders
  if (process.env.DEV_PORTAL_BYPASS === "true" && session === "dev") {
    return NextResponse.json(MOCK_ORDERS);
  }

  const res = await fetch(`${VAULT_API_URL}/api/v1/orders/`, {
    headers: { Cookie: `session=${session}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
