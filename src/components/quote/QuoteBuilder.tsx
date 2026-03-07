"use client";

import { Minus, Plus, Trash2, Download, MessageCircle } from "lucide-react";
import { useQuoteStore } from "@/lib/stores/quote-store";

const WHATSAPP_NUMBER = "5491168385566";

export default function QuoteBuilder() {
  const { items, updateQty, removeItem, clearCart } = useQuoteStore();

  const total = items.reduce((sum, i) => {
    if (i.product.price) return sum + i.product.price * i.quantity;
    return sum;
  }, 0);

  const buildWhatsAppMessage = () => {
    let msg = "Hola! Quiero solicitar presupuesto por:\n\n";
    items.forEach((item, i) => {
      msg += `${i + 1}. ${item.product.title} x${item.quantity}`;
      if (item.product.price)
        msg += ` ($${(item.product.price * item.quantity).toLocaleString("es-AR")})`;
      msg += "\n";
    });
    if (total > 0) msg += `\nTotal estimado: $${total.toLocaleString("es-AR")}`;
    return msg;
  };

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-muted">Tu presupuesto esta vacio</p>
        <p className="mt-1 text-sm text-muted">
          Busca productos y agregalos para armar tu presupuesto.
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
      <div className="mt-6 flex flex-col items-end gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={clearCart}
          className="text-sm text-muted underline hover:text-foreground"
        >
          Vaciar presupuesto
        </button>

        <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
          {total > 0 && (
            <p className="text-xl font-bold">
              Total estimado: ${total.toLocaleString("es-AR")}
            </p>
          )}

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage())}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 font-medium text-white transition-transform hover:scale-105"
          >
            <MessageCircle className="h-5 w-5" />
            Enviar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
