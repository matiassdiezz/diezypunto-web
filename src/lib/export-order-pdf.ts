import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ClientInfo,
  fmtCurrency,
  getLogoDataUrl,
  drawHeader,
  drawClientInfo,
  drawTotalsWithIva,
  drawFooter,
} from "./pdf-helpers";

interface OrderItem {
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  category: string;
}

interface OrderData {
  id: string;
  date: string;
  status: string;
  total: number;
  description: string;
  notes: string;
  items: OrderItem[];
  quote_id?: string;
  estimated_delivery?: string;
  delivered_date?: string;
}

export async function exportOrderPdf(order: OrderData, client?: ClientInfo) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 20;

  const logoDataUrl = await getLogoDataUrl();

  let y = drawHeader(doc, {
    title: "PEDIDO",
    id: order.id,
    date: order.date,
    status: order.status,
    logoDataUrl,
  });

  y = drawClientInfo(doc, client, y);

  // Description
  if (order.description) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(order.description, margin, y);
    y += 7;
  }

  // Order-specific metadata line
  const metaParts: string[] = [];
  if (order.quote_id) metaParts.push(`Presupuesto: ${order.quote_id}`);
  if (order.estimated_delivery) metaParts.push(`Entrega estimada: ${order.estimated_delivery}`);
  if (order.delivered_date) metaParts.push(`Entregado: ${order.delivered_date}`);

  if (metaParts.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(metaParts.join("  ·  "), margin, y);
    doc.setTextColor(0, 0, 0);
    y += 7;
  }

  // Notes
  if (order.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Notas: ${order.notes}`, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 8;
  }

  // Items table
  if (order.items.length > 0) {
    y += 2;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Producto", "SKU", "Cant.", "Precio Unit.", "Subtotal"]],
      body: order.items.map((item) => [
        item.product_name,
        item.sku,
        String(item.quantity),
        fmtCurrency(item.unit_price),
        fmtCurrency(item.quantity * item.unit_price),
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [235, 240, 245],
        textColor: [60, 60, 60],
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [250, 251, 252],
      },
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
      theme: "striped",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Totals with IVA
  y = drawTotalsWithIva(doc, order.total, y);

  drawFooter(doc);

  doc.save(`${order.id}-pedido.pdf`);
}
