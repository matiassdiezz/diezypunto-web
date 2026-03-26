import jsPDF from "jspdf";

export interface ClientInfo {
  name: string;
  empresa?: string;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function fmtCurrency(n: number): string {
  return `$${n.toLocaleString("es-AR")}`;
}

export async function getLogoDataUrl(): Promise<string | null> {
  try {
    const img = await loadImage("/logo-diezypunto.webp");
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export function drawHeader(
  doc: jsPDF,
  opts: {
    title: string;
    id: string;
    date: string;
    status: string;
    logoDataUrl: string | null;
  }
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Logo on the left, title block on the right — side by side
  const logoW = 35;
  let logoH = 12;

  if (opts.logoDataUrl) {
    // Calculate logo aspect ratio from dataUrl
    const tempImg = new Image();
    tempImg.src = opts.logoDataUrl;
    if (tempImg.naturalWidth > 0) {
      logoH = (tempImg.naturalHeight / tempImg.naturalWidth) * logoW;
    }
    doc.addImage(opts.logoDataUrl, "PNG", margin, y, logoW, logoH);
  }

  // Title block — right aligned
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(opts.title, pageWidth - margin, y + 5, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`${opts.id} · ${opts.date}`, pageWidth - margin, y + 12, { align: "right" });

  // Status — right aligned below id
  const statusLabel = opts.status.charAt(0).toUpperCase() + opts.status.slice(1).replace(/_/g, " ");
  doc.text(statusLabel.toUpperCase(), pageWidth - margin, y + 18, { align: "right" });

  doc.setTextColor(0, 0, 0);
  y += Math.max(logoH, 20) + 10;

  return y;
}

export function drawClientInfo(
  doc: jsPDF,
  client: ClientInfo | undefined,
  y: number
): number {
  if (!client) return y;

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Light gray background box
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, y, pageWidth - margin * 2, client.empresa ? 16 : 12, 2, 2, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text(`Cliente: ${client.name}`, margin + 4, y + 5.5);

  if (client.empresa) {
    doc.setFont("helvetica", "normal");
    doc.text(client.empresa, margin + 4, y + 11);
  }

  doc.setTextColor(0, 0, 0);
  return y + (client.empresa ? 20 : 16);
}

export function drawTotalsWithIva(
  doc: jsPDF,
  total: number,
  y: number
): number {
  if (total <= 0) return y;

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const rightX = pageWidth - margin;
  const labelX = rightX - 50;

  const iva = Math.round(total * 0.21);
  const totalFinal = Math.round(total * 1.21);

  // Subtotal
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Subtotal", labelX, y, { align: "right" });
  doc.setTextColor(0, 0, 0);
  doc.text(fmtCurrency(total), rightX, y, { align: "right" });

  // IVA
  y += 5;
  doc.setTextColor(100, 100, 100);
  doc.text("IVA (21%)", labelX, y, { align: "right" });
  doc.setTextColor(0, 0, 0);
  doc.text(fmtCurrency(iva), rightX, y, { align: "right" });

  // Separator line
  y += 3;
  doc.setDrawColor(200, 200, 200);
  doc.line(labelX - 5, y, rightX, y);

  // Total final
  y += 6;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Total", labelX, y, { align: "right" });
  doc.text(fmtCurrency(totalFinal), rightX, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  return y + 10;
}

export function drawFooter(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const footerY = doc.internal.pageSize.getHeight() - 15;

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(
    "Diezypunto — Merchandising corporativo personalizado",
    pageWidth / 2,
    footerY + 5,
    { align: "center" }
  );
}
