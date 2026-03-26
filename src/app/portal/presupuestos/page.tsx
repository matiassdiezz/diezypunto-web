"use client";

import { useEffect, useState } from "react";
import { FileText, SpinnerGap } from "@phosphor-icons/react";
import QuoteCard from "@/components/portal/QuoteCard";

interface Quote {
  id?: string;
  filename?: string;
  status?: string;
  date?: string;
  total?: number;
  items_count?: number;
  items?: unknown[];
  description?: string;
  frontmatter?: {
    description?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export default function PresupuestosPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/quotes")
      .then((r) => (r.ok ? r.json() : { quotes: [] }))
      .then((data) => setQuotes(Array.isArray(data) ? data : data.quotes || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerGap className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground">Presupuestos</h1>
      <p className="mt-1 text-sm text-muted">
        Todos tus presupuestos en un solo lugar.
      </p>

      <div className="mt-6 space-y-3">
        {quotes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center sm:p-12">
            <FileText className="mx-auto h-10 w-10 text-muted/40" />
            <p className="mt-3 text-muted">
              Todavia no tenes presupuestos.
            </p>
            <p className="mt-1 text-sm text-muted">
              Arma tu carrito desde el catalogo y guarda un presupuesto.
            </p>
          </div>
        ) : (
          quotes.map((q) => {
            const qid = q.id || q.filename || "";
            return (
              <QuoteCard
                key={qid}
                id={qid}
                date={String(q.date || "")}
                status={String(q.status || "borrador")}
                total={q.total}
                itemCount={q.items_count ?? q.items?.length}
                description={q.description || q.frontmatter?.description}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
