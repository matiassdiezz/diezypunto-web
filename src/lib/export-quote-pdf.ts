import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface QuoteItem {
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  category: string;
}

interface QuoteData {
  id: string;
  date: string;
  status: string;
  total: number;
  description: string;
  notes: string;
  items: QuoteItem[];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fmtCurrency(n: number): string {
  return `$${n.toLocaleString("es-AR")}`;
}

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  enviado: "Enviado",
  aceptado: "Aceptado",
  rechazado: "Rechazado",
  vencido: "Vencido",
};

export async function exportQuotePdf(quote: QuoteData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // -- Logo --
  try {
    const img = await loadImage("/logo-diezypunto.webp");
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    // Logo: ~40mm wide, maintain aspect ratio
    const logoW = 40;
    const logoH = (img.naturalHeight / img.naturalWidth) * logoW;
    doc.addImage(dataUrl, "PNG", margin, y, logoW, logoH);
    y += logoH + 8;
  } catch {
    // If logo fails to load, just skip it
    y += 5;
  }

  // -- Header --
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Presupuesto", margin, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`${quote.id} · ${quote.date}`, margin, y + 7);

  // Status badge (right-aligned)
  const statusLabel = statusLabels[quote.status] || quote.status;
  doc.text(statusLabel.toUpperCase(), pageWidth - margin, y, {
    align: "right",
  });

  doc.setTextColor(0, 0, 0);
  y += 16;

  // -- Description --
  if (quote.description) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(quote.description, margin, y);
    y += 7;
  }

  // -- Notes --
  if (quote.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Notas: ${quote.notes}`, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 8;
  }

  // -- Items table --
  if (quote.items.length > 0) {
    y += 2;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Producto", "SKU", "Cant.", "Precio Unit.", "Subtotal"]],
      body: quote.items.map((item) => [
        item.product_name,
        item.sku,
        String(item.quantity),
        fmtCurrency(item.unit_price),
        fmtCurrency(item.quantity * item.unit_price),
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [80, 80, 80],
        fontStyle: "bold",
        fontSize: 8,
      },
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
      theme: "grid",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // -- Total --
  if (quote.total > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ${fmtCurrency(quote.total)}`, pageWidth - margin, y, {
      align: "right",
    });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("+ IVA", pageWidth - margin, y + 5, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y += 14;
  }

  // -- Footer line --
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

  // -- Save --
  doc.save(`${quote.id}-presupuesto.pdf`);
}
