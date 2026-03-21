import { Package } from "@phosphor-icons/react";
import type { Order } from "./ActiveOrdersCard";

interface DeliveryHistoryTableProps {
  orders: Order[];
  className?: string;
}

export default function DeliveryHistoryTable({
  orders,
  className = "",
}: DeliveryHistoryTableProps) {
  return (
    <div className={`rounded-xl border border-border bg-white p-4 sm:p-6 ${className}`}>
      <h2 className="text-lg font-bold text-foreground">
        Historial de Entregas
      </h2>

      {orders.length === 0 ? (
        <div className="mt-6 text-center">
          <Package className="mx-auto h-8 w-8 text-muted/40" />
          <p className="mt-2 text-sm text-muted">
            Todavía no tenés entregas
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="mt-4 hidden overflow-x-auto sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Pedido
                  </th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Descripción
                  </th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Entregado
                  </th>
                  <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-3 text-sm font-medium text-foreground">
                      {order.id}
                    </td>
                    <td className="py-3 text-sm text-muted">
                      {order.description || `Pedido ${order.id}`}
                    </td>
                    <td className="py-3 text-sm text-muted">
                      {order.delivered_date
                        ? formatDate(order.delivered_date)
                        : "—"}
                    </td>
                    <td className="py-3 text-right text-sm font-medium text-foreground">
                      ${(order.total || 0).toLocaleString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="mt-4 space-y-2 sm:hidden">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div>
                  <p className="text-sm font-medium">{order.id}</p>
                  <p className="text-xs text-muted">
                    {order.description || `Pedido ${order.id}`} · {order.delivered_date ? formatDate(order.delivered_date) : "—"}
                  </p>
                </div>
                <span className="text-sm font-medium">${(order.total || 0).toLocaleString("es-AR")}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
