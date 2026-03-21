import Link from "next/link";
import { FileText, Package, CheckCircle } from "@phosphor-icons/react";

interface DashboardSummaryProps {
  totalQuotes: number;
  activeOrders: number;
  deliveredOrders: number;
  activeTotal: number;
  className?: string;
}

export default function DashboardSummary({
  totalQuotes,
  activeOrders,
  deliveredOrders,
  activeTotal,
  className = "",
}: DashboardSummaryProps) {
  return (
    <div className={`rounded-xl border border-border bg-white p-4 sm:p-6 ${className}`}>
      <h2 className="text-lg font-bold text-foreground">Resumen</h2>

      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
            <FileText className="h-5 w-5 text-muted" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{totalQuotes}</p>
            <p className="text-sm text-muted">presupuestos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
            <Package className="h-5 w-5 text-muted" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{activeOrders}</p>
            <p className="text-sm text-muted">pedidos activos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
            <CheckCircle className="h-5 w-5 text-muted" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{deliveredOrders}</p>
            <p className="text-sm text-muted">entregados</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-surface p-4">
        <p className="text-sm text-muted">Total en curso</p>
        <p className="text-xl font-bold text-foreground sm:text-2xl">
          ${(activeTotal || 0).toLocaleString("es-AR")}
        </p>
      </div>

      <Link
        href="/portal/pedidos"
        className="mt-4 block text-center text-sm font-medium text-accent hover:underline"
      >
        Ver todos los pedidos →
      </Link>
    </div>
  );
}
