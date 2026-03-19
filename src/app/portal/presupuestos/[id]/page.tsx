"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

interface QuoteDetail {
  filename: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export default function QuoteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
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

  const fm = quote.frontmatter;
  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    borrador: "bg-gray-100 text-gray-600",
    enviado: "bg-blue-50 text-blue-600",
    aprobado: "bg-green-50 text-green-600",
  };
  const status = String(fm.status || "borrador");

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/portal/presupuestos"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Presupuestos
      </Link>

      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{id}</h1>
            <p className="mt-1 text-sm text-muted">
              {String(fm.date || "")}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-600"}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        {fm.total != null && (
          <p className="mt-4 text-lg font-bold">
            Total: ${Number(fm.total).toLocaleString("es-AR")}
            <span className="ml-1 text-sm font-normal text-muted">+ IVA</span>
          </p>
        )}

        {/* Render body as items table (body is markdown) */}
        {quote.body && (
          <div className="mt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase text-muted">
              Items
            </h2>
            <div
              className="prose prose-sm max-w-none text-foreground [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-surface [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:text-muted [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm"
              dangerouslySetInnerHTML={{ __html: markdownTableToHtml(quote.body) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function markdownTableToHtml(md: string): string {
  const lines = md.trim().split("\n").filter((l) => l.includes("|"));
  if (lines.length < 2) return `<p>${md}</p>`;

  const parseRow = (line: string) =>
    line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

  const headers = parseRow(lines[0]);
  const dataLines = lines.slice(2); // skip header + separator

  let html = "<table><thead><tr>";
  headers.forEach((h) => (html += `<th>${h}</th>`));
  html += "</tr></thead><tbody>";
  dataLines.forEach((line) => {
    const cells = parseRow(line);
    html += "<tr>";
    cells.forEach((c) => (html += `<td>${c}</td>`));
    html += "</tr>";
  });
  html += "</tbody></table>";
  return html;
}
