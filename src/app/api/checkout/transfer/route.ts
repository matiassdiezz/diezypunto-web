import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { trackServerEvent } from "@/lib/engine/analytics";
import {
  buildQuoteEmail,
  buildOrderNotifyEmail,
  type EmailItem,
  type EmailBilling,
} from "@/lib/email/templates";
import { saveClientToVault } from "@/lib/save-client";

const NOTIFY_EMAIL = "martin@diezypunto.com.ar";

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "El envío de emails no está configurado" },
      { status: 503 },
    );
  }

  const { items, billing, logo_url, instructions } = (await req.json()) as {
    items: EmailItem[];
    billing?: EmailBilling;
    logo_url?: string;
    instructions?: string;
  };

  if (!items?.length) {
    return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
  }

  if (
    !billing?.first_name?.trim() ||
    !billing.last_name?.trim() ||
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

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  trackServerEvent(
    "checkout_transfer",
    {
      items: items.map((i) => ({
        id: i.id,
        title: i.title,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
      total_items: items.length,
      total_qty: items.reduce((s, i) => s + i.quantity, 0),
      total_value: total,
      billing_province: billing.province,
    },
    { ip },
  );

  const resend = new Resend(apiKey);
  const fromAddress =
    process.env.RESEND_FROM_EMAIL || "Diez y Punto <onboarding@resend.dev>";

  const origin = req.nextUrl.origin;
  const cartUrl = `${origin}/carrito`;

  try {
    await Promise.all([
      // Quote email to customer
      resend.emails.send({
        from: fromAddress,
        to: billing.email,
        subject: `Tu presupuesto — Diez y Punto`,
        html: buildQuoteEmail(items, billing, total, "transfer", cartUrl),
      }),
      // Notification to Martín
      resend.emails.send({
        from: fromAddress,
        to: NOTIFY_EMAIL,
        subject: `Nuevo pedido por transferencia — ${billing.first_name} ${billing.last_name} — $${total.toLocaleString("es-AR")}`,
        html: buildOrderNotifyEmail(items, billing, total, "transfer", { logo_url: logo_url || undefined, instructions: instructions || undefined }),
      }),
    ]);

    // Save client data to vault (fire-and-forget)
    if (billing) {
      saveClientToVault({
        first_name: billing.first_name,
        last_name: billing.last_name,
        company: billing.company?.trim() || undefined,
        email: billing.email,
        phone: billing.phone,
        document_type: billing.document_type,
        document_number: billing.document_number,
        street_address: billing.street_address,
        city: billing.city,
        province: billing.province,
        logo_url: logo_url || undefined,
        instructions: instructions || undefined,
        payment_method: "transfer",
        order_total: total,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json(
      { error: "Error al enviar el email" },
      { status: 500 },
    );
  }
}
