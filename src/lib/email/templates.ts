/**
 * Email templates for Diez y Punto
 *
 * Two templates:
 *   buildQuoteEmail()   → Professional quote sent to the customer
 *   buildOrderNotify()  → Internal notification sent to Martín
 */

// ─── Brand constants ────────────────────────────────────────────────

const ACCENT = "#59C6F2";
const ACCENT_DARK = "#3BA8D4";
const LOGO_URL = "https://diezypunto.vercel.app/logo-diezypunto.webp";
const SITE_URL = "https://diezypunto.vercel.app";
const PORTAL_URL = "https://diezypunto.vercel.app/portal";
const WSP_NUMBER = "541162345062";
const GOOGLE_REVIEW_URL = "https://reviewthis.biz/shy-wind-6626";

const BANK_INFO = {
  titular: "DIEZ Y DIEZ COMUNICACION S A",
  cbu: "0720109320000012972​36",
  alias: "diezypunto",
  banco: "Santander",
  cuit: "33-69894396-9",
};

// ─── Types ──────────────────────────────────────────────────────────

export type EmailItem = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  image_url?: string;
  color?: string;
};

export type EmailBilling = {
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

type PaymentMethod = "mercadopago" | "transfer";

// ─── Helpers ────────────────────────────────────────────────────────

function fmtPrice(n: number): string {
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function wspLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// ─── Shared fragments ───────────────────────────────────────────────

function emailHead(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;-webkit-font-smoothing:antialiased">
<div style="max-width:640px;margin:0 auto;padding:24px 12px">`;
}

function emailEnd(): string {
  return `
  <table width="100%" style="margin-top:24px"><tr><td align="center">
    <p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:0">
      <a href="${SITE_URL}" style="color:${ACCENT};text-decoration:none;font-weight:600">diezypunto.com.ar</a><br>
      Merchandising Corporativo · Buenos Aires, Argentina
    </p>
  </td></tr></table>
</div></body></html>`;
}

function header(title: string, subtitle: string): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px 16px 0 0;overflow:hidden">
  <tr><td style="padding:32px 32px 0">
    <img src="${LOGO_URL}" alt="Diez y Punto" width="140" style="display:block;margin-bottom:20px" />
  </td></tr>
  <tr><td style="padding:0 32px 24px">
    <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a">${title}</h1>
    <p style="margin:6px 0 0;font-size:14px;color:#64748b">${subtitle}</p>
  </td></tr>
</table>`;
}

function productGrid(items: EmailItem[]): string {
  const rows = items.map((item) => {
    const subtotal = item.unit_price * item.quantity;
    const img = item.image_url
      ? `<img src="${item.image_url}" alt="${item.title}" width="64" height="64" style="display:block;border-radius:10px;object-fit:contain;background:#f8fafc" />`
      : `<div style="width:64px;height:64px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center">
           <span style="font-size:24px;color:#cbd5e1">📦</span>
         </div>`;

    return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;vertical-align:top">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:14px;vertical-align:top">${img}</td>
          <td style="vertical-align:top">
            <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a">${item.title}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#64748b">
              ${item.quantity} u. × $${fmtPrice(item.unit_price)}
              ${item.color ? ` · ${item.color}` : ""}
            </p>
          </td>
        </tr></table>
      </td>
      <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;text-align:right;vertical-align:top;white-space:nowrap">
        <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a">$${fmtPrice(subtotal)}</p>
      </td>
    </tr>`;
  });

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px">
    <thead><tr>
      <th style="padding:10px 0;text-align:left;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #f1f5f9">Productos</th>
      <th style="padding:10px 0;text-align:right;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #f1f5f9">Subtotal</th>
    </tr></thead>
    <tbody>${rows.join("")}</tbody>
  </table>`;
}

function totalBlock(total: number, itemCount: number, totalQty: number): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#f8fafc;border-radius:12px">
    <tr>
      <td style="padding:16px 20px">
        <p style="margin:0;font-size:13px;color:#64748b">${itemCount} ${itemCount === 1 ? "producto" : "productos"} · ${totalQty} unidades</p>
      </td>
      <td style="padding:16px 20px;text-align:right">
        <p style="margin:0;font-size:11px;color:#64748b">Total estimado</p>
        <p style="margin:2px 0 0;font-size:22px;font-weight:700;color:#0f172a">$${fmtPrice(total)} <span style="font-size:12px;font-weight:400;color:#94a3b8">IVA incluido</span></p>
      </td>
    </tr>
  </table>`;
}

function bankBlock(): string {
  return `
  <div style="margin-top:24px;border:2px solid ${ACCENT}40;border-radius:14px;overflow:hidden">
    <div style="background:${ACCENT}10;padding:14px 20px;border-bottom:1px solid ${ACCENT}25">
      <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a">🏦 Datos para transferencia</p>
    </div>
    <div style="padding:16px 20px">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
        <tr><td style="padding:5px 0;color:#64748b;width:80px">Titular</td><td style="padding:5px 0;font-weight:600">${BANK_INFO.titular}</td></tr>
        <tr><td style="padding:5px 0;color:#64748b">CBU</td><td style="padding:5px 0;font-weight:700;font-family:monospace;letter-spacing:0.5px;font-size:13px">${BANK_INFO.cbu}</td></tr>
        <tr><td style="padding:5px 0;color:#64748b">Alias</td><td style="padding:5px 0;font-weight:700">${BANK_INFO.alias}</td></tr>
        <tr><td style="padding:5px 0;color:#64748b">Banco</td><td style="padding:5px 0">${BANK_INFO.banco}</td></tr>
        <tr><td style="padding:5px 0;color:#64748b">CUIT</td><td style="padding:5px 0">${BANK_INFO.cuit}</td></tr>
      </table>
    </div>
    <div style="background:#fffbeb;padding:12px 20px;border-top:1px solid #fde68a">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5">
        Una vez realizada la transferencia, enviá el comprobante por WhatsApp para confirmar tu pedido.
      </p>
    </div>
  </div>`;
}

function ctaButton(text: string, url: string, bg: string = ACCENT): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
    <tr><td align="center">
      <a href="${url}" style="display:inline-block;background:${bg};color:white;font-size:15px;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.01em">${text}</a>
    </td></tr>
  </table>`;
}

function wspButton(clientName: string): string {
  const msg = `Hola, soy ${clientName}. Quiero consultar sobre mi pedido.`;
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">
    <tr><td align="center">
      <a href="${wspLink(WSP_NUMBER, msg)}" style="display:inline-block;background:#25D366;color:white;font-size:14px;font-weight:600;padding:12px 28px;border-radius:12px;text-decoration:none">Consultar por WhatsApp</a>
    </td></tr>
  </table>`;
}

function validityBanner(): string {
  const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const formatted = validUntil.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `
  <div style="margin-top:20px;text-align:center;padding:10px;background:#f8fafc;border-radius:10px">
    <p style="margin:0;font-size:12px;color:#94a3b8">Precios válidos hasta el <strong style="color:#64748b">${formatted}</strong></p>
  </div>`;
}

function portalNudge(): string {
  return `
  <div style="margin-top:24px;background:#f0f9ff;border:1px solid ${ACCENT}30;border-radius:14px;padding:20px;text-align:center">
    <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a">¿Querés hacer seguimiento de tus pedidos?</p>
    <p style="margin:6px 0 0;font-size:13px;color:#64748b">Ingresá al portal para ver historial, repetir pedidos y descargar presupuestos.</p>
    <a href="${PORTAL_URL}" style="display:inline-block;margin-top:12px;background:white;color:${ACCENT_DARK};font-size:13px;font-weight:600;padding:10px 24px;border-radius:10px;text-decoration:none;border:1px solid ${ACCENT}40">Acceder al portal →</a>
  </div>`;
}

function billingFooter(b: EmailBilling): string {
  return `
  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
      <strong style="color:#64748b">Datos de facturación</strong><br>
      ${b.first_name} ${b.last_name}${b.company ? ` · ${b.company}` : ""}<br>
      ${b.document_type}: ${b.document_number}<br>
      ${b.street_address}, ${b.city}, ${b.province}<br>
      ${b.email} · ${b.phone}
    </p>
  </div>`;
}

// ─── Public builders ────────────────────────────────────────────────

/**
 * Professional quote email sent to the customer.
 * Includes product images, prices, optional bank details, and CTAs.
 */
export function buildQuoteEmail(
  items: EmailItem[],
  billing: EmailBilling,
  total: number,
  paymentMethod: PaymentMethod,
  cartUrl?: string,
): string {
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const isTransfer = paymentMethod === "transfer";
  const clientName = `${billing.first_name} ${billing.last_name}`;

  const subtitle = isTransfer
    ? "Transferí el monto indicado para confirmar tu pedido."
    : "Acá tenés el resumen de tu pedido.";

  let body = "";
  body += emailHead();
  body += `<div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">`;
  body += header("Tu presupuesto", subtitle);
  body += `<div style="padding:0 32px 32px">`;
  body += productGrid(items);
  body += totalBlock(total, items.length, totalQty);

  if (isTransfer) {
    body += bankBlock();
    const wspMsg = `Hola, soy ${clientName}. Te envío el comprobante de transferencia de mi pedido por $${fmtPrice(total)}.`;
    body += ctaButton("Enviar comprobante por WhatsApp", wspLink(WSP_NUMBER, wspMsg), "#25D366");
  }

  if (cartUrl) {
    body += ctaButton(
      isTransfer ? "Ver pedido online" : "Completar pedido",
      cartUrl,
    );
  }

  if (!isTransfer) {
    body += wspButton(clientName);
  }

  body += validityBanner();
  body += billingFooter(billing);
  body += `</div>`;
  body += `</div>`;
  body += portalNudge();
  body += emailEnd();

  return body;
}

/**
 * Internal notification email sent to Martín.
 */
export function buildOrderNotifyEmail(
  items: EmailItem[],
  billing: EmailBilling,
  total: number,
  paymentMethod: PaymentMethod,
): string {
  const clientName = `${billing.first_name} ${billing.last_name}`;
  const wspMsg = `Hola ${billing.first_name}, soy Martín de Diez y Punto. Recibí tu pedido.`;
  const wspUrl = wspLink(billing.phone.replace(/\D/g, "").replace(/^(?!54)/, "54"), wspMsg);

  const methodLabel = paymentMethod === "transfer" ? "🏦 Transferencia bancaria" : "💳 Mercado Pago";

  const itemRows = items
    .map((i) => {
      const img = i.image_url
        ? `<img src="${i.image_url}" width="48" height="48" style="border-radius:8px;object-fit:contain;background:#f8fafc" />`
        : "";
      return `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;vertical-align:middle">${img}</td>
        <td style="padding:8px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;vertical-align:middle">
          <strong>${i.title}</strong>${i.color ? ` · ${i.color}` : ""}<br>
          <span style="color:#64748b">${i.quantity} u. × $${fmtPrice(i.unit_price)}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;font-weight:600;vertical-align:middle">$${fmtPrice(i.unit_price * i.quantity)}</td>
      </tr>`;
    })
    .join("");

  return `${emailHead()}
<div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
  <div style="background:#0f172a;padding:24px 32px">
    <h1 style="margin:0;color:white;font-size:18px;font-weight:600">Nuevo pedido — $${fmtPrice(total)} IVA inc.</h1>
    <p style="margin:6px 0 0;color:#94a3b8;font-size:13px">${methodLabel} · ${clientName}${billing.company ? ` · ${billing.company}` : ""}</p>
  </div>

  <div style="padding:24px 32px">
    <h2 style="margin:0 0 4px;font-size:15px;color:#0f172a">Cliente</h2>
    <p style="margin:0;font-size:14px;color:#475569;line-height:1.7">
      <strong>${clientName}</strong>${billing.company ? ` — ${billing.company}` : ""}<br>
      ${billing.document_type}: ${billing.document_number}<br>
      ${billing.email} · ${billing.phone}<br>
      ${billing.street_address}, ${billing.city}, ${billing.province}
    </p>

    ${ctaButton("Contactar por WhatsApp", wspUrl, "#25D366")}

    <h2 style="margin:28px 0 12px;font-size:15px;color:#0f172a">Productos</h2>
    <table width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>

    <div style="margin-top:16px;background:#f0fdf4;border-radius:12px;padding:16px;text-align:right">
      <p style="margin:0;font-size:20px;font-weight:700;color:#166534">$${fmtPrice(total)} <span style="font-size:12px;color:#64748b">IVA incluido</span></p>
    </div>
  </div>
</div>
${emailEnd()}`;
}
