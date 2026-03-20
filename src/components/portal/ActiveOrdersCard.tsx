import Link from "next/link";
import { Truck, Package } from "@phosphor-icons/react";
import StatusBadge from "./StatusBadge";

interface OrderItem {
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  category: string;
}

export interface Order {
  id: string;
  quote_id?: string;
  date: string;
  status: string;
  total: number;
  items: OrderItem[];
  description: string;
  notes?: string;
  estimated_delivery?: string;
  delivered_date?: string;
}

interface ActiveOrdersCardProps {
  orders: Order[];
  className?: string;
}

export default function ActiveOrdersCard({
  orders,
  className = "",
}: ActiveOrdersCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-white p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-accent">Pedidos Activos</h2>
        {orders.length > 0 && (
          <span className="text-sm text-muted">{orders.length} en curso</span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 text-center">
          <Package className="mx-auto h-8 w-8 text-muted/40" />
          <p className="mt-2 text-sm text-muted">No tenés pedidos activos</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/portal/pedidos/${order.id}`}
              className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-surface/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface">
                <Truck className="h-5 w-5 text-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {order.description}
                </p>
                <p className="text-sm text-muted">
                  Pedido #{order.id}
                  {order.estimated_delivery && (
                    <> · Est. {formatDate(order.estimated_delivery)}</>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold text-foreground">
                  ${order.total.toLocaleString("es-AR")}
                </span>
                <StatusBadge status={order.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}
