import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { trackServerEvent } from "@/lib/engine/analytics";

export async function POST(req: NextRequest) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Mercado Pago no esta configurado" },
      { status: 503 },
    );
  }

  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  const { items } = (await req.json()) as {
    items: {
      title: string;
      quantity: number;
      unit_price: number;
      id: string;
    }[];
  };

  if (!items?.length) {
    return NextResponse.json({ error: "Carrito vacio" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  trackServerEvent("checkout_start", {
    items: items.map((i) => ({ id: i.id, title: i.title, quantity: i.quantity, unit_price: i.unit_price })),
    total_items: items.length,
    total_qty: items.reduce((s, i) => s + i.quantity, 0),
    total_value: items.reduce((s, i) => s + i.quantity * i.unit_price, 0),
  }, { ip });

  const origin = req.nextUrl.origin;

  const result = await preference.create({
    body: {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: "ARS",
      })),
      back_urls: {
        success: `${origin}/carrito?status=success`,
        failure: `${origin}/carrito?status=failure`,
        pending: `${origin}/carrito?status=pending`,
      },
      auto_return: "approved",
    },
  });

  return NextResponse.json({ init_point: result.init_point });
}
