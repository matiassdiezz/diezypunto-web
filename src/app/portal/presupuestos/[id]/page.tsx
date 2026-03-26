"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, SpinnerGap, FilePdf, CopySimple } from "@phosphor-icons/react";
import { exportQuotePdf } from "@/lib/export-quote-pdf";
import ItemsTable from "@/components/portal/ItemsTable";
import StatusBadge from "@/components/portal/StatusBadge";
import { useAuth } from "@/lib/hooks/use-auth";

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
  const { client } = useAuth();
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
                exportQuotePdf(
                  { id, date, status, total, description, notes, items },
                  client ? { name: client.name || "" } : undefined
                )
              }
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-surface sm:min-h-0 sm:py-1.5"
            >
              <FilePdf className="h-4 w-4" />
              Exportar PDF
            </button>
            <StatusBadge status={status} />
          </div>
        </div>

        {total > 0 && (
          <div className="mt-4 flex justify-end">
            <div className="text-sm">
              <div className="flex justify-between gap-8">
                <span className="text-muted">Subtotal</span>
                <span>${total.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between gap-8 mt-1">
                <span className="text-muted">IVA (21%)</span>
                <span>${Math.round(total * 0.21).toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between gap-8 mt-2 border-t border-border pt-2 text-base font-bold">
                <span>Total</span>
                <span>${Math.round(total * 1.21).toLocaleString("es-AR")}</span>
              </div>
            </div>
          </div>
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
            <ItemsTable items={items} />
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
            <p className="text-sm text-muted sm:hidden">Gir\u00e1 el dispositivo para ver la tabla completa</p>
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
