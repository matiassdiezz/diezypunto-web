import Link from "next/link";
import { FileText } from "@phosphor-icons/react";
import { getStatusStyle } from "./StatusBadge";

interface QuoteCardProps {
  id: string;
  date: string;
  status: string;
  total?: number;
  itemCount?: number;
  description?: string;
}

export default function QuoteCard({
  id,
  date,
  status,
  total,
  itemCount,
  description,
}: QuoteCardProps) {
  const { className: colorClass, label } = getStatusStyle(status);

  return (
    <Link
      href={`/portal/presupuestos/${id}`}
      className="flex flex-col rounded-xl border border-border bg-white p-4 transition-colors hover:border-accent/40 hover:bg-accent-light/30"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 rounded-lg bg-surface p-2">
            <FileText className="h-5 w-5 text-muted" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-1">
              {description || id}
            </p>
            <p className="text-xs text-muted">
              {id} · {date}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 ml-3">
          {total != null && (
            <span className="text-sm font-medium">
              ${total.toLocaleString("es-AR")}
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}
          >
            {label}
          </span>
        </div>
      </div>

      {itemCount != null && (
        <div className="mt-2 text-xs text-muted">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </div>
      )}
    </Link>
  );
}
