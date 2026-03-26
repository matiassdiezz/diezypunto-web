"use client";

import { useEffect, useState } from "react";
import { Package, SpinnerGap } from "@phosphor-icons/react";
import OrderCard from "@/components/portal/OrderCard";

interface Order {
  id?: string;
  filename?: string;
  status?: string;
  date?: string;
  total?: number;
  items_count?: number;
  items?: unknown[];
  estimated_delivery?: string;
  description?: string;
  frontmatter?: {
    total?: number;
    items_count?: number;
    estimated_delivery?: string;
    description?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/orders")
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((data) => setOrders(Array.isArray(data) ? data : data.orders || []))
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
      <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
      <p className="mt-1 text-sm text-muted">
        Historial de todos tus pedidos.
      </p>

      <div className="mt-6 space-y-3">
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center sm:p-12">
            <Package className="mx-auto h-10 w-10 text-muted/40" />
            <p className="mt-3 text-muted">
              Todavia no tenes pedidos.
            </p>
          </div>
        ) : (
          orders.map((o) => {
            const oid = o.id || o.filename || "";
            return (
              <OrderCard
                key={oid}
                id={oid}
                date={String(o.date || "")}
                status={String(o.status || "pendiente")}
                total={Number(o.total ?? o.frontmatter?.total ?? 0) || undefined}
                itemCount={o.items_count ?? o.items?.length ?? o.frontmatter?.items_count}
                estimatedDelivery={o.estimated_delivery || o.frontmatter?.estimated_delivery}
                description={o.description || o.frontmatter?.description}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
