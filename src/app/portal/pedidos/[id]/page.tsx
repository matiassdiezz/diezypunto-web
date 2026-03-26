"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, SpinnerGap, ArrowsClockwise, FilePdf } from "@phosphor-icons/react";
import ItemsTable from "@/components/portal/ItemsTable";
import StatusBadge from "@/components/portal/StatusBadge";
import { useAuth } from "@/lib/hooks/use-auth";

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
  const { client } = useAuth();
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

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/portal/pedidos"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Pedidos
      </Link>

      <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{id}</h1>
            {description && (
              <p className="mt-0.5 text-sm text-foreground">{description}</p>
            )}
            <p className="mt-1 text-sm text-muted">{date}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {items.length > 0 && (
              <button
                onClick={handleRepeatOrder}
                disabled={repeating}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50 sm:min-h-0 sm:py-1.5"
              >
                {repeating ? (
                  <SpinnerGap className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowsClockwise className="h-4 w-4" />
                )}
                Repetir pedido
              </button>
            )}
            <button
              onClick={() =>
                import("@/lib/export-order-pdf").then(({ exportOrderPdf }) =>
                  exportOrderPdf(
                    { id, date, status, total, description, notes, items, quote_id: order.quote_id, estimated_delivery: estimatedDelivery, delivered_date: deliveredDate },
                    client ? { name: client.name || "" } : undefined
                  )
                )
              }
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50 sm:min-h-0 sm:py-1.5"
            >
              <FilePdf className="h-4 w-4" />
              Exportar PDF
            </button>
            <StatusBadge status={status} />
          </div>
        </div>

        {total > 0 && (
          <div className="mt-4 flex justify-end">
            <div className="text-sm">
              <div className="flex justify-between gap-8">
                <span className="text-muted">Subtotal</span>
                <span>${total.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between gap-8 mt-1">
                <span className="text-muted">IVA (21%)</span>
                <span>${Math.round(total * 0.21).toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between gap-8 mt-2 border-t border-border pt-2 text-base font-bold">
                <span>Total</span>
                <span>${Math.round(total * 1.21).toLocaleString("es-AR")}</span>
              </div>
            </div>
          </div>
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
            <ItemsTable items={items} />
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
