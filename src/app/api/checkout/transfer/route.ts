import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { trackServerEvent } from "@/lib/engine/analytics";

const BANK_INFO = {
  titular: "Diez y Punto S.A.S.",
  cbu: "0000003100099812345678",
  alias: "DIEZYPUNTO.VENTAS",
  banco: "Banco Galicia",
  cuit: "30-71234567-8",
};

const NOTIFY_EMAIL = "martin@diezypunto.com.ar";

type TransferItem = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
};

type BillingPayload = {
  first_name: string;
  last_name: string;
  company?: string;
  document_type: string;
  document_number: string;
  street_address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
};

function formatPrice(n: number): string {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildCustomerEmail(items: TransferItem[], billing: BillingPayload, total: number): string {
  const itemRows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px">${i.title}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;text-align:center">${i.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;text-align:right">$${formatPrice(i.unit_price * i.quantity)}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <!-- Header -->
      <div style="background:#59C6F2;padding:28px 32px">
        <h1 style="margin:0;color:white;font-size:20px;font-weight:600">Pedido recibido</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:14px">Transferí el monto indicado para confirmar tu pedido.</p>
      </div>

      <!-- Bank details -->
      <div style="padding:28px 32px">
        <h2 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#0f172a">Datos para transferencia</h2>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;font-size:13px;color:#64748b;width:100px">Titular</td><td style="padding:6px 0;font-size:14px;font-weight:500">${BANK_INFO.titular}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#64748b">CBU</td><td style="padding:6px 0;font-size:14px;font-weight:600;font-family:monospace;letter-spacing:0.5px">${BANK_INFO.cbu}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#64748b">Alias</td><td style="padding:6px 0;font-size:14px;font-weight:600">${BANK_INFO.alias}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#64748b">Banco</td><td style="padding:6px 0;font-size:14px">${BANK_INFO.banco}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#64748b">CUIT</td><td style="padding:6px 0;font-size:14px">${BANK_INFO.cuit}</td></tr>
          </table>
        </div>

        <div style="margin-top:20px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px">
          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5">
            <strong>Monto a transferir: $${formatPrice(total)} + IVA</strong><br>
            Una vez realizada la transferencia, enviá el comprobante por WhatsApp o mail para confirmar tu pedido.
          </p>
        </div>
      </div>

      <!-- Order details -->
      <div style="padding:0 32px 28px">
        <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#0f172a">Detalle del pedido</h2>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase">Producto</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase">Cant.</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:14px 12px;font-size:15px;font-weight:600">Total estimado</td>
              <td style="padding:14px 12px;font-size:15px;font-weight:700;text-align:right">$${formatPrice(total)} + IVA</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Footer -->
      <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0">
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5">
          ${billing.first_name} ${billing.last_name}${billing.company ? ` · ${billing.company}` : ""}<br>
          ${billing.email} · ${billing.phone}<br>
          ${billing.street_address}, ${billing.city}, ${billing.province}
        </p>
      </div>
    </div>

    <p style="text-align:center;margin:20px 0 0;font-size:12px;color:#94a3b8">
      Diez y Punto · Merchandising Corporativo
    </p>
  </div>
</body></html>`;
}

function buildNotificationEmail(items: TransferItem[], billing: BillingPayload, total: number): string {
  const itemList = items.map((i) => `• ${i.title} × ${i.quantity} = $${formatPrice(i.unit_price * i.quantity)}`).join("\n");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="background:#0f172a;padding:24px 32px">
        <h1 style="margin:0;color:white;font-size:18px">Nuevo pedido por transferencia</h1>
      </div>
      <div style="padding:24px 32px">
        <h2 style="margin:0 0 8px;font-size:16px">Cliente</h2>
        <p style="margin:0;font-size:14px;color:#475569;line-height:1.6">
          <strong>${billing.first_name} ${billing.last_name}</strong>${billing.company ? ` — ${billing.company}` : ""}<br>
          ${billing.document_type}: ${billing.document_number}<br>
          ${billing.email} · ${billing.phone}<br>
          ${billing.street_address}, ${billing.city}, ${billing.province}
        </p>

        <h2 style="margin:24px 0 8px;font-size:16px">Productos</h2>
        <pre style="margin:0;font-size:13px;color:#475569;line-height:1.6;white-space:pre-wrap">${itemList}</pre>

        <div style="margin-top:20px;padding:16px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0">
          <p style="margin:0;font-size:18px;font-weight:700;color:#166534">Total: $${formatPrice(total)} + IVA</p>
        </div>
      </div>
    </div>
  </div>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "El envío de emails no está configurado" },
      { status: 503 },
    );
  }

  const { items, billing } = (await req.json()) as {
    items: TransferItem[];
    billing?: BillingPayload;
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

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  trackServerEvent("checkout_transfer", {
    items: items.map((i) => ({ id: i.id, title: i.title, quantity: i.quantity, unit_price: i.unit_price })),
    total_items: items.length,
    total_qty: items.reduce((s, i) => s + i.quantity, 0),
    total_value: total,
    billing_province: billing.province,
  }, { ip });

  const resend = new Resend(apiKey);

  const fromAddress = process.env.RESEND_FROM_EMAIL || "Diez y Punto <pedidos@diezypunto.com.ar>";

  try {
    // Send bank details to customer
    await resend.emails.send({
      from: fromAddress,
      to: billing.email,
      subject: `Datos para transferencia — Pedido Diez y Punto`,
      html: buildCustomerEmail(items, billing, total),
    });

    // Notify Martín
    await resend.emails.send({
      from: fromAddress,
      to: NOTIFY_EMAIL,
      subject: `Nuevo pedido por transferencia — ${billing.first_name} ${billing.last_name} — $${formatPrice(total)}`,
      html: buildNotificationEmail(items, billing, total),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json(
      { error: "Error al enviar el email" },
      { status: 500 },
    );
  }
}
