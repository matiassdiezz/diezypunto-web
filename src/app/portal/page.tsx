"use client";

import { useEffect, useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";
import { useAuth } from "@/lib/hooks/use-auth";
import ActiveOrdersCard from "@/components/portal/ActiveOrdersCard";
import DashboardSummary from "@/components/portal/DashboardSummary";
import RecentQuotesCard from "@/components/portal/RecentQuotesCard";
import DeliveryHistoryTable from "@/components/portal/DeliveryHistoryTable";
import type { Order } from "@/components/portal/ActiveOrdersCard";
import type { Quote } from "@/components/portal/RecentQuotesCard";

// Normalize vault-api responses: map filename→id, default missing fields
function normalize<T extends Record<string, unknown>>(item: T): T {
  return {
    ...item,
    id: item.id || item.filename || "",
    total: Number(item.total ?? 0),
    description: item.description || "",
    items: item.items || [],
  } as T;
}

export default function PortalDashboard() {
  const { client } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/portal/quotes").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/portal/orders").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([q, o]) => {
        const qList = (Array.isArray(q) ? q : q.quotes || []).map(normalize);
        const oList = (Array.isArray(o) ? o : o.orders || []).map(normalize);
        setQuotes(qList);
        setOrders(oList);
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

  const activeOrders = orders.filter(
    (o) => o.status === "confirmado" || o.status === "en_produccion"
  );
  const deliveredOrders = orders.filter((o) => o.status === "entregado");
  const activeTotal = activeOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Portal Corporativo
        </h1>
        <p className="mt-1 text-sm text-muted">
          Gestiona tus presupuestos y pedidos de merchandising.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <ActiveOrdersCard
          orders={activeOrders}
          className="lg:col-span-2"
        />
        <DashboardSummary
          totalQuotes={quotes.length}
          activeOrders={activeOrders.length}
          deliveredOrders={deliveredOrders.length}
          activeTotal={activeTotal}
        />
        <RecentQuotesCard
          quotes={quotes.slice(0, 5)}
          className="lg:col-span-2"
        />
        <DeliveryHistoryTable
          orders={deliveredOrders}
          className="lg:col-span-3"
        />
      </div>
    </div>
  );
}
