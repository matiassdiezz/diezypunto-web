"use client";

import { useEffect, useState } from "react";
import { Package, Loader2 } from "lucide-react";
import OrderCard from "@/components/portal/OrderCard";

interface Order {
  filename: string;
  frontmatter: Record<string, unknown>;
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/orders")
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
      <p className="mt-1 text-sm text-muted">
        Historial de todos tus pedidos.
      </p>

      <div className="mt-6 space-y-2">
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted/40" />
            <p className="mt-3 text-muted">
              Todavia no tenes pedidos.
            </p>
          </div>
        ) : (
          orders.map((o) => (
            <OrderCard
              key={o.filename}
              id={o.filename.replace(".md", "")}
              date={String(o.frontmatter.date || "")}
              status={String(o.frontmatter.status || "pendiente")}
            />
          ))
        )}
      </div>
    </div>
  );
}
