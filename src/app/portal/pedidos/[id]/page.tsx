"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

interface OrderDetail {
  filename: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/portal/orders/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setOrder)
      .catch(() => setError("Pedido no encontrado"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-4xl py-10 text-center">
        <p className="text-muted">{error}</p>
        <Link
          href="/portal/pedidos"
          className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a pedidos
        </Link>
      </div>
    );
  }

  const fm = order.frontmatter;
  const statusColors: Record<string, string> = {
    pendiente: "bg-yellow-50 text-yellow-700",
    en_proceso: "bg-blue-50 text-blue-600",
    entregado: "bg-green-50 text-green-600",
    cancelado: "bg-red-50 text-red-600",
  };
  const status = String(fm.status || "pendiente");

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/portal/pedidos"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Pedidos
      </Link>

      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{id}</h1>
            <p className="mt-1 text-sm text-muted">
              {String(fm.date || "")}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-600"}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        {order.body && (
          <div className="mt-6 whitespace-pre-wrap text-sm text-foreground">
            {order.body}
          </div>
        )}
      </div>
    </div>
  );
}
