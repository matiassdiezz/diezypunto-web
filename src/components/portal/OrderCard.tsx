import Link from "next/link";
import { Package } from "@phosphor-icons/react";
import { getStatusStyle } from "./StatusBadge";

interface OrderCardProps {
  id: string;
  date: string;
  status: string;
  total?: number;
  itemCount?: number;
  estimatedDelivery?: string;
  description?: string;
}

export default function OrderCard({
  id,
  date,
  status,
  total,
  itemCount,
  estimatedDelivery,
  description,
}: OrderCardProps) {
  const { className: colorClass, label } = getStatusStyle(status);

  return (
    <Link
      href={`/portal/pedidos/${id}`}
      className="flex flex-col rounded-xl border border-border bg-white p-4 transition-colors hover:border-accent/40 hover:bg-accent-light/30"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 rounded-lg bg-surface p-2">
            <Package className="h-5 w-5 text-muted" />
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

      {(itemCount != null || estimatedDelivery) && (
        <div className="mt-2 flex gap-3 text-xs text-muted">
          {itemCount != null && (
            <span>
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </span>
          )}
          {estimatedDelivery && <span>Entrega: {estimatedDelivery}</span>}
        </div>
      )}
    </Link>
  );
}
