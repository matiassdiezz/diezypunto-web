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
    <div className={`rounded-xl border border-border bg-white p-6 ${className}`}>
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
        <div className="mt-4 overflow-x-auto">
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
                    {order.description}
                  </td>
                  <td className="py-3 text-sm text-muted">
                    {order.delivered_date
                      ? formatDate(order.delivered_date)
                      : "—"}
                  </td>
                  <td className="py-3 text-right text-sm font-medium text-foreground">
                    ${order.total.toLocaleString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
