"use client";

import { useEffect, useState } from "react";
import { FileText, SpinnerGap } from "@phosphor-icons/react";
import QuoteCard from "@/components/portal/QuoteCard";

interface Quote {
  filename: string;
  frontmatter: Record<string, unknown>;
}

export default function PresupuestosPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/quotes")
      .then((r) => (r.ok ? r.json() : { quotes: [] }))
      .then((data) => setQuotes(data.quotes || []))
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

      <div className="mt-6 space-y-2">
        {quotes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted/40" />
            <p className="mt-3 text-muted">
              Todavia no tenes presupuestos.
            </p>
            <p className="mt-1 text-sm text-muted">
              Arma tu carrito desde el catalogo y guarda un presupuesto.
            </p>
          </div>
        ) : (
          quotes.map((q) => (
            <QuoteCard
              key={q.filename}
              id={q.filename.replace(".md", "")}
              date={String(q.frontmatter.date || "")}
              status={String(q.frontmatter.status || "borrador")}
              total={q.frontmatter.total as number | undefined}
              itemCount={q.frontmatter.item_count as number | undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
