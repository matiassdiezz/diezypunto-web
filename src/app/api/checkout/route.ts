import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { Resend } from "resend";
import { trackServerEvent } from "@/lib/engine/analytics";
import {
  buildQuoteEmail,
  buildOrderNotifyEmail,
  type EmailBilling,
} from "@/lib/email/templates";

type BillingPayload = EmailBilling;

function splitStreetAddress(streetAddress: string) {
  const trimmed = streetAddress.trim();
  const match = trimmed.match(/^(.*?)(?:\s+(\d+))?$/);
  return {
    street_name: match?.[1]?.trim() || trimmed,
    street_number: match?.[2],
  };
}

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

  const { items, billing } = (await req.json()) as {
    items: {
      title: string;
      quantity: number;
      unit_price: number;
      id: string;
      image_url?: string;
      color?: string;
    }[];
    billing?: BillingPayload;
  };

  if (!items?.length) {
    return NextResponse.json({ error: "Carrito vacio" }, { status: 400 });
  }

  if (
    !billing?.first_name?.trim() ||
    !billing.last_name?.trim() ||
    !billing.document_type?.trim() ||
    !billing.document_number?.trim() ||
    !billing.street_address?.trim() ||
    !billing.city?.trim() ||
    !billing.province?.trim() ||
    !billing.phone?.trim() ||
    !billing.email?.trim()
  ) {
    return NextResponse.json(
      { error: "Faltan datos de facturación" },
      { status: 400 },
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  trackServerEvent("checkout_start", {
    items: items.map((i) => ({ id: i.id, title: i.title, quantity: i.quantity, unit_price: i.unit_price })),
    total_items: items.length,
    total_qty: items.reduce((s, i) => s + i.quantity, 0),
    total_value: items.reduce((s, i) => s + i.quantity * i.unit_price, 0),
    has_company: Boolean(billing.company?.trim()),
    billing_province: billing.province,
  }, { ip });

  const origin = req.nextUrl.origin;
  const { street_name, street_number } = splitStreetAddress(billing.street_address);

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
      payer: {
        name: billing.first_name,
        surname: billing.last_name,
        email: billing.email,
        phone: { number: billing.phone },
        identification: {
          type: billing.document_type,
          number: billing.document_number,
        },
        address: {
          street_name,
          street_number,
        },
      },
      metadata: {
        billing: {
          company: billing.company?.trim() || null,
          city: billing.city,
          province: billing.province,
        },
      },
      additional_info: [
        billing.company?.trim() ? `Empresa: ${billing.company.trim()}` : null,
        `Ciudad: ${billing.city}`,
        `Provincia: ${billing.province}`,
      ]
        .filter(Boolean)
        .join(" | "),
    },
  });

  // Send quote email to customer + notify Martín (non-blocking)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && billing.email) {
    const resend = new Resend(resendKey);
    const fromAddress =
      process.env.RESEND_FROM_EMAIL || "Diez y Punto <onboarding@resend.dev>";
    const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const emailItems = items.map((i) => ({
      id: i.id,
      title: i.title,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }));

    Promise.all([
      resend.emails.send({
        from: fromAddress,
        to: billing.email,
        subject: "Tu presupuesto — Diez y Punto",
        html: buildQuoteEmail(emailItems, billing, total, "mercadopago", `${origin}/carrito`),
      }),
      resend.emails.send({
        from: fromAddress,
        to: "martin@diezypunto.com.ar",
        subject: `Nuevo pedido MP — ${billing.first_name} ${billing.last_name} — $${total.toLocaleString("es-AR")}`,
        html: buildOrderNotifyEmail(emailItems, billing, total, "mercadopago"),
      }),
    ]).catch((err) => console.error("Quote email error:", err));
  }

  return NextResponse.json({ init_point: result.init_point });
}
