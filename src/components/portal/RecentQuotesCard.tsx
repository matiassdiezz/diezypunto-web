import Link from "next/link";
import { FileText, CaretRight } from "@phosphor-icons/react";
import StatusBadge from "./StatusBadge";

export interface Quote {
  id: string;
  filename?: string;
  date: string;
  status: string;
  total: number;
  items?: { product_name: string; sku: string; quantity: number; unit_price: number; category: string }[];
  description?: string;
  notes?: string;
}

interface RecentQuotesCardProps {
  quotes: Quote[];
  className?: string;
}

export default function RecentQuotesCard({
  quotes,
  className = "",
}: RecentQuotesCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-white p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Presupuestos</h2>
        <Link
          href="/portal/presupuestos"
          className="text-sm font-medium text-accent hover:underline"
        >
          Ver todos →
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="mt-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted/40" />
          <p className="mt-2 text-sm text-muted">
            Todavía no tenés presupuestos
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-1">
          {quotes.map((quote) => (
            <Link
              key={quote.id}
              href={`/portal/presupuestos/${quote.id}`}
              className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-surface/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface">
                <FileText className="h-5 w-5 text-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {quote.description || `Presupuesto ${quote.id}`}
                </p>
                <p className="text-xs text-muted">
                  {quote.id} · {formatDate(quote.date)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium text-foreground">
                ${(quote.total || 0).toLocaleString("es-AR")}
              </span>
              <StatusBadge status={quote.status} />
              <CaretRight className="h-4 w-4 shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
