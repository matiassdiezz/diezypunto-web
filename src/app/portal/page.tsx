"use client";

import { useEffect, useState } from "react";
import { FileText, Package, SpinnerGap } from "@phosphor-icons/react";
import QuoteCard from "@/components/portal/QuoteCard";
import OrderCard from "@/components/portal/OrderCard";
import { useAuth } from "@/lib/hooks/use-auth";

interface Quote {
  filename: string;
  frontmatter: Record<string, unknown>;
}

interface Order {
  filename: string;
  frontmatter: Record<string, unknown>;
}

export default function PortalDashboard() {
  const { client } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/portal/quotes").then((r) => (r.ok ? r.json() : { quotes: [] })),
      fetch("/api/portal/orders").then((r) => (r.ok ? r.json() : { orders: [] })),
    ])
      .then(([q, o]) => {
        setQuotes(q.quotes?.slice(0, 5) || []);
        setOrders(o.orders?.slice(0, 5) || []);
      })
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
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenido{client?.name ? `, ${client.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Administra tus presupuestos y pedidos desde aca.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{quotes.length}</p>
              <p className="text-xs text-muted">Presupuestos</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2">
              <Package className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-xs text-muted">Pedidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Quotes */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">
          Presupuestos recientes
        </h2>
        {quotes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted/40" />
            <p className="mt-2 text-sm text-muted">
              Todavia no tenes presupuestos. Arma tu carrito y guarda un
              presupuesto.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {quotes.map((q) => (
              <QuoteCard
                key={q.filename}
                id={q.filename.replace(".md", "")}
                date={String(q.frontmatter.date || "")}
                status={String(q.frontmatter.status || "borrador")}
                total={q.frontmatter.total as number | undefined}
                itemCount={q.frontmatter.item_count as number | undefined}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent Orders */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">
          Pedidos recientes
        </h2>
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <Package className="mx-auto h-8 w-8 text-muted/40" />
            <p className="mt-2 text-sm text-muted">
              Todavia no tenes pedidos.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <OrderCard
                key={o.filename}
                id={o.filename.replace(".md", "")}
                date={String(o.frontmatter.date || "")}
                status={String(o.frontmatter.status || "pendiente")}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
