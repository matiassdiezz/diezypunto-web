import { NextRequest, NextResponse } from "next/server";

const VAULT_API_URL = process.env.VAULT_API_URL || "http://localhost:8001";

export const MOCK_QUOTES = [
  {
    id: "QUO-001",
    date: "2026-03-15",
    status: "borrador",
    total: 45000,
    items: [
      { product_name: "Remera algodón premium", sku: "REM-001", quantity: 50, unit_price: 500, category: "Remeras" },
      { product_name: "Gorra bordada", sku: "GOR-001", quantity: 30, unit_price: 350, category: "Gorras" },
      { product_name: "Tote bag personalizado", sku: "TOT-001", quantity: 20, unit_price: 400, category: "Bolsas" },
    ],
    description: "Merchandising evento corporativo",
    notes: "Entrega antes del 15 de abril",
  },
  {
    id: "QUO-002",
    date: "2026-03-10",
    status: "enviado",
    total: 120000,
    items: [
      { product_name: "Campera softshell", sku: "CAM-001", quantity: 25, unit_price: 2800, category: "Camperas" },
      { product_name: "Remera dry-fit", sku: "REM-002", quantity: 100, unit_price: 450, category: "Remeras" },
      { product_name: "Gorra trucker", sku: "GOR-002", quantity: 50, unit_price: 300, category: "Gorras" },
      { product_name: "Botella térmica", sku: "BOT-001", quantity: 25, unit_price: 600, category: "Accesorios" },
      { product_name: "Set de cuadernos", sku: "CUA-001", quantity: 50, unit_price: 200, category: "Papelería" },
      { product_name: "Lapicera metálica", sku: "LAP-001", quantity: 100, unit_price: 150, category: "Papelería" },
      { product_name: "Mousepad personalizado", sku: "MOU-001", quantity: 50, unit_price: 180, category: "Tech" },
      { product_name: "Pendrive 16GB", sku: "PEN-001", quantity: 25, unit_price: 500, category: "Tech" },
    ],
    description: "Kit onboarding empleados nuevos",
    notes: "Logo en serigrafía a 2 colores",
  },
  {
    id: "QUO-003",
    date: "2026-03-05",
    status: "aceptado",
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
  },
  {
    id: "QUO-004",
    date: "2026-02-28",
    status: "vencido",
    total: 32000,
    items: [
      { product_name: "Taza cerámica", sku: "TAZ-001", quantity: 100, unit_price: 200, category: "Accesorios" },
      { product_name: "Llavero acrílico", sku: "LLA-001", quantity: 200, unit_price: 60, category: "Accesorios" },
    ],
    description: "Regalos fin de año",
    notes: "",
  },
];

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Dev bypass: return mock quotes
  if (process.env.DEV_PORTAL_BYPASS === "true" && session === "dev") {
    return NextResponse.json(MOCK_QUOTES);
  }

  const res = await fetch(`${VAULT_API_URL}/api/v1/quotes/`, {
    headers: { Cookie: `session=${session}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  // Map frontend fields to vault-api schema and strip unit_price (server-side pricing)
  const mappedBody = {
    description: body.description || "",
    notes: body.notes || "",
    items: (body.items || []).map((i: Record<string, unknown>) => ({
      product_name: i.title || i.product_name || "",
      sku: i.product_id || i.sku || "",
      quantity: i.quantity,
      category: i.category || "",
    })),
  };

  const res = await fetch(`${VAULT_API_URL}/api/v1/quotes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `session=${session}`,
    },
    body: JSON.stringify(mappedBody),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Failed to create quote");
    return NextResponse.json({ error: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
