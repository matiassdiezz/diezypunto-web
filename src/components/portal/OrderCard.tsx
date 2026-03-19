import Link from "next/link";
import { Package } from "lucide-react";

interface OrderCardProps {
  id: string;
  date: string;
  status: string;
}

const statusColors: Record<string, string> = {
  cotizado: "bg-gray-100 text-gray-600",
  confirmado: "bg-blue-50 text-blue-600",
  comprado: "bg-indigo-50 text-indigo-600",
  recibido: "bg-purple-50 text-purple-600",
  "en-produccion": "bg-amber-50 text-amber-700",
  terminado: "bg-emerald-50 text-emerald-600",
  entregado: "bg-green-50 text-green-600",
  cancelado: "bg-red-50 text-red-600",
};

const statusLabels: Record<string, string> = {
  cotizado: "Cotizado",
  confirmado: "Confirmado",
  comprado: "Comprado",
  recibido: "Recibido",
  "en-produccion": "En producción",
  terminado: "Terminado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function OrderCard({ id, date, status }: OrderCardProps) {
  const colorClass = statusColors[status] || "bg-gray-100 text-gray-600";
  const label = statusLabels[status] || status;

  return (
    <Link
      href={`/portal/pedidos/${id}`}
      className="flex items-center justify-between rounded-xl border border-border bg-white p-4 transition-colors hover:border-accent/40 hover:bg-accent-light/30"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-surface p-2">
          <Package className="h-5 w-5 text-muted" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{id}</p>
          <p className="text-xs text-muted">{date}</p>
        </div>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}
      >
        {label}
      </span>
    </Link>
  );
}
