"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, SpinnerGap, FilePdf, CopySimple } from "@phosphor-icons/react";
import { exportQuotePdf } from "@/lib/export-quote-pdf";

interface QuoteItem {
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  category: string;
}

interface QuoteDetail {
  // vault-api format
  filename?: string;
  frontmatter?: Record<string, unknown>;
  body?: string;
  // mock / flat format
  id?: string;
  date?: string;
  status?: string;
  total?: number;
  items?: QuoteItem[];
  description?: string;
  notes?: string;
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    fetch(`/api/portal/quotes/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setQuote)
      .catch(() => setError("Presupuesto no encontrado"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDuplicate() {
    if (!quote || duplicating) return;
    const quoteItems = quote.items || [];
    if (quoteItems.length === 0) return;

    setDuplicating(true);
    try {
      const fm = quote.frontmatter;
      const desc = String(fm?.description || quote.description || "");
      const qNotes = String(fm?.notes || quote.notes || "");
      const res = await fetch("/api/portal/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc ? `Copia: ${desc}` : `Copia presupuesto ${id}`,
          notes: qNotes,
          items: quoteItems.map((i) => ({
            product_name: i.product_name,
            sku: i.sku,
            quantity: i.quantity,
            category: i.category,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to create quote");
      const data = await res.json();
      const newId = data.id || data.filename?.replace(".md", "");
      if (newId) {
        router.push(`/portal/presupuestos/${newId}`);
      } else {
        router.push("/portal/presupuestos");
      }
    } catch {
      setError("No se pudo duplicar el presupuesto");
      setDuplicating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerGap className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="mx-auto max-w-4xl py-10 text-center">
        <p className="text-muted">{error}</p>
        <Link
          href="/portal/presupuestos"
          className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a presupuestos
        </Link>
      </div>
    );
  }

  // Support both vault-api format (frontmatter) and mock/flat format
  const fm = quote.frontmatter;
  const status = String(fm?.status || quote.status || "borrador");
  const date = String(fm?.date || quote.date || "");
  const total = Number(fm?.total ?? quote.total ?? 0);
  const items = quote.items || [];
  const description = String(fm?.description || quote.description || "");
  const notes = String(fm?.notes || quote.notes || "");

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    borrador: "bg-gray-100 text-gray-600",
    enviado: "bg-blue-50 text-blue-600",
    aceptado: "bg-green-50 text-green-600",
    rechazado: "bg-red-50 text-red-600",
    vencido: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/portal/presupuestos"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Presupuestos
      </Link>

      <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{id}</h1>
            {description && (
              <p className="mt-0.5 text-sm text-foreground">{description}</p>
            )}
            <p className="mt-1 text-sm text-muted">{date}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {items.length > 0 && (
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50 sm:min-h-0 sm:py-1.5"
              >
                {duplicating ? (
                  <SpinnerGap className="h-4 w-4 animate-spin" />
                ) : (
                  <CopySimple className="h-4 w-4" />
                )}
                Duplicar
              </button>
            )}
            <button
              onClick={() =>
                exportQuotePdf({ id, date, status, total, description, notes, items })
              }
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-surface sm:min-h-0 sm:py-1.5"
            >
              <FilePdf className="h-4 w-4" />
              Exportar PDF
            </button>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-600"}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>

        {total > 0 && (
          <p className="mt-4 text-lg font-bold">
            Total: ${total.toLocaleString("es-AR")}
            <span className="ml-1 text-sm font-normal text-muted">+ IVA</span>
          </p>
        )}

        {notes && (
          <p className="mt-2 text-sm text-muted">Notas: {notes}</p>
        )}

        {/* Render items as table — from flat array or markdown body */}
        {items.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase text-muted">
              Items
            </h2>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-border bg-surface px-3 py-2 text-left text-xs font-medium uppercase text-muted">Producto</th>
                    <th className="border border-border bg-surface px-3 py-2 text-left text-xs font-medium uppercase text-muted">SKU</th>
                    <th className="border border-border bg-surface px-3 py-2 text-right text-xs font-medium uppercase text-muted">Cant.</th>
                    <th className="border border-border bg-surface px-3 py-2 text-right text-xs font-medium uppercase text-muted">Precio Unit.</th>
                    <th className="border border-border bg-surface px-3 py-2 text-right text-xs font-medium uppercase text-muted">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.sku}>
                      <td className="border border-border px-3 py-2 text-sm">{item.product_name}</td>
                      <td className="border border-border px-3 py-2 text-sm text-muted">{item.sku}</td>
                      <td className="border border-border px-3 py-2 text-right text-sm">{item.quantity}</td>
                      <td className="border border-border px-3 py-2 text-right text-sm">${(item.unit_price || 0).toLocaleString("es-AR")}</td>
                      <td className="border border-border px-3 py-2 text-right text-sm font-medium">${((item.quantity || 0) * (item.unit_price || 0)).toLocaleString("es-AR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {items.map((item) => (
                <div key={item.sku} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{item.product_name}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.sku}</p>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-muted">{item.quantity} × ${(item.unit_price || 0).toLocaleString("es-AR")}</span>
                    <span className="font-medium">${((item.quantity || 0) * (item.unit_price || 0)).toLocaleString("es-AR")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : quote.body ? (
          <div className="mt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase text-muted">
              Items
            </h2>
            <div
              className="prose prose-sm hidden max-w-none text-foreground sm:block [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-surface [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:text-muted [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm"
              dangerouslySetInnerHTML={{ __html: markdownTableToHtml(quote.body) }}
            />
            <p className="text-sm text-muted sm:hidden">Girá el dispositivo para ver la tabla completa</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownTableToHtml(md: string): string {
  const lines = md.trim().split("\n").filter((l) => l.includes("|"));
  if (lines.length < 2) return `<p>${escapeHtml(md)}</p>`;

  const parseRow = (line: string) =>
    line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

  const headers = parseRow(lines[0]);
  const dataLines = lines.slice(2); // skip header + separator

  let html = "<table><thead><tr>";
  headers.forEach((h) => (html += `<th>${escapeHtml(h)}</th>`));
  html += "</tr></thead><tbody>";
  dataLines.forEach((line) => {
    const cells = parseRow(line);
    html += "<tr>";
    cells.forEach((c) => (html += `<td>${escapeHtml(c)}</td>`));
    html += "</tr>";
  });
  html += "</tbody></table>";
  return html;
}
