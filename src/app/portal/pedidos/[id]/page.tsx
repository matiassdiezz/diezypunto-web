"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, SpinnerGap, ArrowsClockwise } from "@phosphor-icons/react";

interface OrderItem {
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  category: string;
}

interface OrderDetail {
  // vault-api format
  filename?: string;
  frontmatter?: Record<string, unknown>;
  body?: string;
  // mock / flat format
  id?: string;
  quote_id?: string;
  date?: string;
  status?: string;
  total?: number;
  items?: OrderItem[];
  description?: string;
  notes?: string;
  estimated_delivery?: string;
  delivered_date?: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [repeating, setRepeating] = useState(false);

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

  async function handleRepeatOrder() {
    if (!order || repeating) return;
    const orderItems = order.items || [];
    if (orderItems.length === 0) return;

    setRepeating(true);
    try {
      const fm = order.frontmatter;
      const desc = String(fm?.description || order.description || "");
      const res = await fetch("/api/portal/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc ? `Repetición: ${desc}` : `Repetición pedido ${id}`,
          notes: `Basado en pedido ${id}`,
          items: orderItems.map((i) => ({
            product_name: i.product_name,
            sku: i.sku,
            quantity: i.quantity,
            category: i.category,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to create quote");
      const data = await res.json();
      const newId = data.id || data.filename?.replace(".md", "");
      if (newId) {
        router.push(`/portal/presupuestos/${newId}`);
      } else {
        router.push("/portal/presupuestos");
      }
    } catch {
      setError("No se pudo crear el presupuesto");
      setRepeating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerGap className="h-6 w-6 animate-spin text-accent" />
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

  // Support both vault-api format (frontmatter) and mock/flat format
  const fm = order.frontmatter;
  const status = String(fm?.status || fm?.estado || order.status || "cotizado");
  const date = String(fm?.date || order.date || "");
  const total = Number(fm?.total ?? order.total ?? 0);
  const description = String(fm?.description || order.description || "");
  const notes = String(fm?.notes || order.notes || "");
  const items = order.items || [];
  const estimatedDelivery = String(fm?.estimated_delivery || order.estimated_delivery || "");
  const deliveredDate = String(fm?.delivered_date || order.delivered_date || "");

  const statusColors: Record<string, string> = {
    cotizado: "bg-gray-100 text-gray-600",
    confirmado: "bg-blue-50 text-blue-600",
    comprado: "bg-indigo-50 text-indigo-600",
    recibido: "bg-purple-50 text-purple-600",
    en_produccion: "bg-amber-50 text-amber-700",
    terminado: "bg-emerald-50 text-emerald-600",
    entregado: "bg-green-50 text-green-600",
    cancelado: "bg-red-50 text-red-600",
  };
  const statusLabels: Record<string, string> = {
    cotizado: "Cotizado",
    confirmado: "Confirmado",
    comprado: "Comprado",
    recibido: "Recibido",
    en_produccion: "En producción",
    terminado: "Terminado",
    entregado: "Entregado",
    cancelado: "Cancelado",
  };

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
            {description && (
              <p className="mt-0.5 text-sm text-foreground">{description}</p>
            )}
            <p className="mt-1 text-sm text-muted">{date}</p>
          </div>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button
                onClick={handleRepeatOrder}
                disabled={repeating}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
              >
                {repeating ? (
                  <SpinnerGap className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowsClockwise className="h-4 w-4" />
                )}
                Repetir pedido
              </button>
            )}
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-600"}`}
            >
              {statusLabels[status] || status}
            </span>
          </div>
        </div>

        {total > 0 && (
          <p className="mt-4 text-lg font-bold">
            Total: ${total.toLocaleString("es-AR")}
            <span className="ml-1 text-sm font-normal text-muted">+ IVA</span>
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
          {estimatedDelivery && (
            <span>Entrega estimada: {estimatedDelivery}</span>
          )}
          {deliveredDate && (
            <span>Entregado: {deliveredDate}</span>
          )}
        </div>

        {notes && (
          <p className="mt-2 text-sm text-muted">Notas: {notes}</p>
        )}

        {items.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase text-muted">
              Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-border bg-surface px-3 py-2 text-left text-xs font-medium uppercase text-muted">Producto</th>
                    <th className="border border-border bg-surface px-3 py-2 text-left text-xs font-medium uppercase text-muted">SKU</th>
                    <th className="border border-border bg-surface px-3 py-2 text-right text-xs font-medium uppercase text-muted">Cant.</th>
                    <th className="border border-border bg-surface px-3 py-2 text-right text-xs font-medium uppercase text-muted">Precio Unit.</th>
                    <th className="border border-border bg-surface px-3 py-2 text-right text-xs font-medium uppercase text-muted">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.sku}>
                      <td className="border border-border px-3 py-2 text-sm">{item.product_name}</td>
                      <td className="border border-border px-3 py-2 text-sm text-muted">{item.sku}</td>
                      <td className="border border-border px-3 py-2 text-right text-sm">{item.quantity}</td>
                      <td className="border border-border px-3 py-2 text-right text-sm">${item.unit_price.toLocaleString("es-AR")}</td>
                      <td className="border border-border px-3 py-2 text-right text-sm font-medium">${(item.quantity * item.unit_price).toLocaleString("es-AR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : order.body ? (
          <div className="mt-6 whitespace-pre-wrap text-sm text-foreground">
            {order.body}
          </div>
        ) : null}
      </div>
    </div>
  );
}
