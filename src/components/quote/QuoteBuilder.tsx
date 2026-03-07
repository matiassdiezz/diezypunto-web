"use client";

import { useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  MessageCircle,
  CreditCard,
  Loader2,
} from "lucide-react";
import { useQuoteStore } from "@/lib/stores/quote-store";

const WHATSAPP_NUMBER = "5491168385566";

export default function QuoteBuilder() {
  const { items, updateQty, removeItem, clearCart } = useQuoteStore();
  const [mpLoading, setMpLoading] = useState(false);

  const total = items.reduce((sum, i) => {
    if (i.product.price) return sum + i.product.price * i.quantity;
    return sum;
  }, 0);

  const hasItemsWithoutPrice = items.some((i) => i.product.price == null);

  const buildWhatsAppMessage = () => {
    let msg = "Hola! Quiero consultar por estos productos:\n\n";
    items.forEach((item, i) => {
      msg += `${i + 1}. ${item.product.title} x${item.quantity}`;
      if (item.product.price)
        msg += ` ($${(item.product.price * item.quantity).toLocaleString("es-AR")})`;
      msg += "\n";
    });
    if (total > 0) msg += `\nTotal estimado: $${total.toLocaleString("es-AR")}`;
    return msg;
  };

  const handleMercadoPago = async () => {
    const payableItems = items.filter((i) => i.product.price != null);
    if (payableItems.length === 0) return;

    setMpLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: payableItems.map((i) => ({
            id: i.product.product_id,
            title: i.product.title,
            quantity: i.quantity,
            unit_price: i.product.price,
          })),
        }),
      });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert(data.error || "Error al crear el pago");
      }
    } catch {
      alert("Error de conexion. Intenta de nuevo.");
    } finally {
      setMpLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-muted">Tu carrito esta vacio</p>
        <p className="mt-1 text-sm text-muted">
          Busca productos y agregalos al carrito.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-6 py-3">Producto</th>
              <th className="px-6 py-3 text-center">Cantidad</th>
              <th className="px-6 py-3 text-right">Precio unit.</th>
              <th className="px-6 py-3 text-right">Subtotal</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const subtotal = item.product.price
                ? item.product.price * item.quantity
                : null;
              return (
                <tr
                  key={item.product.product_id}
                  className="border-t border-border"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.product.image_urls[0] && (
                        <img
                          src={item.product.image_urls[0]}
                          alt={item.product.title}
                          className="h-12 w-12 rounded-lg object-contain bg-surface"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.product.title}</p>
                        <p className="text-xs text-muted">
                          {item.product.category}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() =>
                          updateQty(
                            item.product.product_id,
                            item.quantity - 1,
                          )
                        }
                        className="rounded-lg border border-border p-1 hover:bg-surface"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQty(
                            item.product.product_id,
                            item.quantity + 1,
                          )
                        }
                        className="rounded-lg border border-border p-1 hover:bg-surface"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item.product.price != null
                      ? `$${item.product.price.toLocaleString("es-AR")}`
                      : "Consultar"}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {subtotal != null
                      ? `$${subtotal.toLocaleString("es-AR")}`
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => removeItem(item.product.product_id)}
                      className="text-muted hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={clearCart}
          className="text-sm text-muted underline hover:text-foreground"
        >
          Vaciar carrito
        </button>

        <div className="flex flex-col items-end gap-3">
          {total > 0 && (
            <p className="text-xl font-bold">
              Total: ${total.toLocaleString("es-AR")}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* Mercado Pago */}
            {total > 0 && !hasItemsWithoutPrice && (
              <button
                onClick={handleMercadoPago}
                disabled={mpLoading}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#009ee3] px-6 py-3 font-medium text-white transition-all hover:bg-[#007eb5] disabled:opacity-60"
              >
                {mpLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CreditCard className="h-5 w-5" />
                )}
                {mpLoading ? "Redirigiendo..." : "Pagar con Mercado Pago"}
              </button>
            )}

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 font-medium text-white transition-transform hover:scale-105"
            >
              <MessageCircle className="h-5 w-5" />
              Consultar por WhatsApp
            </a>
          </div>

          {hasItemsWithoutPrice && (
            <p className="text-xs text-muted">
              Algunos productos no tienen precio. Consulta por WhatsApp para un
              presupuesto completo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
