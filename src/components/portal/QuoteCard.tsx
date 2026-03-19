import Link from "next/link";
import { FileText } from "lucide-react";

interface QuoteCardProps {
  id: string;
  date: string;
  status: string;
  total?: number;
  itemCount?: number;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  borrador: "bg-gray-100 text-gray-600",
  enviado: "bg-blue-50 text-blue-600",
  aprobado: "bg-green-50 text-green-600",
  rechazado: "bg-red-50 text-red-600",
};

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  borrador: "Borrador",
  enviado: "Enviado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export default function QuoteCard({
  id,
  date,
  status,
  total,
  itemCount,
}: QuoteCardProps) {
  const colorClass = statusColors[status] || "bg-gray-100 text-gray-600";
  const label = statusLabels[status] || status;

  return (
    <Link
      href={`/portal/presupuestos/${id}`}
      className="flex items-center justify-between rounded-xl border border-border bg-white p-4 transition-colors hover:border-accent/40 hover:bg-accent-light/30"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-surface p-2">
          <FileText className="h-5 w-5 text-muted" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{id}</p>
          <p className="text-xs text-muted">{date}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {itemCount != null && (
          <span className="text-xs text-muted">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
        )}
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
    </Link>
  );
}
