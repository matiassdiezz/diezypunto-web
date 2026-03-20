"use client";

import { useState, useEffect } from "react";
import {
  Minus,
  Plus,
  Trash,
  PaperPlaneTilt,
  CreditCard,
  SpinnerGap,
} from "@phosphor-icons/react";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { PEDIDO_EVENTO_PRESET_MESSAGE } from "@/lib/chat/chat-preset-messages";
import { useChatStore } from "@/lib/stores/chat-store";
import { openTelegramWithContext } from "@/lib/telegram";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { listProducts } from "@/lib/api";
import { getComplementaryCategories } from "@/lib/engine/affinity";
import type { ProductResult, QuoteItem } from "@/lib/types";
import CartMilestone from "@/components/quote/CartMilestone";
import CartReview from "@/components/quote/CartReview";
import ProductCard from "@/components/catalog/ProductCard";
import SaveQuoteButton from "@/components/portal/SaveQuoteButton";
import { useAuth } from "@/lib/hooks/use-auth";

export default function QuoteBuilder() {
  const { items, updateQty, removeItem, clearCart } = useQuoteStore();
  const { client } = useAuth();
  const [mpLoading, setMpLoading] = useState(false);
  const [crossSell, setCrossSell] = useState<ProductResult[]>([]);
  const [minQtyWarn, setMinQtyWarn] = useState<string | null>(null);
  const openWithMessage = useChatStore((s) => s.openWithMessage);

  /** Get the unit price for a cart item based on its quantity and price tiers */
  function getItemUnitPrice(item: { product: ProductResult; quantity: number }): number | null {
    if (item.product.price_tiers && item.product.price_tiers.length > 0) {
      const tier = item.product.price_tiers.find(
        (t) => item.quantity >= t.min && (t.max === null || item.quantity <= t.max)
      ) ?? item.product.price_tiers[0];
      return tier.finalPrice;
    }
    return item.product.price;
  }

  const total = items.reduce((sum, i) => {
    const unitPrice = getItemUnitPrice(i);
    if (unitPrice) return sum + unitPrice * i.quantity;
    return sum;
  }, 0);

  const hasItemsWithoutPrice = items.some((i) => i.product.price == null);

  // Fetch cross-sell products based on cart categories
  useEffect(() => {
    if (items.length === 0) {
      setCrossSell([]);
      return;
    }
    const cartCategories = new Set(items.map((i) => i.product.category));
    const complementary = new Set<string>();
    cartCategories.forEach((cat) => {
      getComplementaryCategories(cat).forEach((c) => {
        if (!cartCategories.has(c)) complementary.add(c);
      });
    });
    const cats = Array.from(complementary).slice(0, 3);
    if (cats.length === 0) {
      setCrossSell([]);
      return;
    }
    Promise.all(
      cats.map((cat) =>
        listProducts({ category: cat, limit: 2 })
          .then((r) => r.products)
          .catch(() => []),
      ),
    ).then((results) => setCrossSell(results.flat().slice(0, 6)));
  }, [items.length]);

  const handleTelegram = () => {
    openTelegramWithContext({
      type: "cart",
      items: items.map((i) => ({
        product_id: i.product.product_id,
        title: i.product.title,
        qty: i.quantity,
        price: i.product.price,
      })),
    });
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
            unit_price: getItemUnitPrice(i) ?? i.product.price,
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
        <OpenChatButton
          className="mt-6"
          onClick={() => openWithMessage(PEDIDO_EVENTO_PRESET_MESSAGE)}
        >
          Arma tu pedido con AI
        </OpenChatButton>
      </div>
    );
  }

  return (
    <div>
      {/* Cart Milestone */}
      <CartMilestone total={total} />

      {/* AI Cart Review */}
      <CartReview />

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
              const unitPrice = getItemUnitPrice(item);
              const subtotal = unitPrice
                ? unitPrice * item.quantity
                : null;
              const atMin = item.quantity <= 1;
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
                        onClick={() => {
                          if (!atMin) {
                            const newQty = item.quantity - 1;
                            updateQty(item.product.product_id, newQty);
                            if (item.product.min_qty && newQty < item.product.min_qty) {
                              setMinQtyWarn(item.product.product_id);
                            } else {
                              setMinQtyWarn(null);
                            }
                          }
                        }}
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
                    {unitPrice != null
                      ? <><span>${unitPrice.toLocaleString("es-AR")}</span><span className="ml-0.5 text-xs text-muted">+ IVA</span></>
                      : "Consultar"}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {subtotal != null
                      ? <><span>${subtotal.toLocaleString("es-AR")}</span><span className="ml-0.5 text-xs font-normal text-muted">+ IVA</span></>
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => removeItem(item.product.product_id)}
                      className="text-muted hover:text-red-500"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-6 space-y-4">
        {/* Total */}
        {total > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-muted">Total estimado</p>
            <p className="text-2xl font-bold">
              ${total.toLocaleString("es-AR")}
              <span className="ml-1 text-sm font-normal text-muted">+ IVA</span>
            </p>
          </div>
        )}

        {/* Primary CTAs */}
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* Mercado Pago — primary if all items have price */}
          {total > 0 && !hasItemsWithoutPrice && (
            <button
              onClick={handleMercadoPago}
              disabled={mpLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-base font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-60"
            >
              {mpLoading ? (
                <SpinnerGap className="h-5 w-5 animate-spin" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
              {mpLoading ? "Redirigiendo..." : "Pagar con Mercado Pago"}
            </button>
          )}

          {/* Telegram — primary if items lack price, secondary otherwise */}
          <button
            onClick={handleTelegram}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-base font-medium transition-all ${
              hasItemsWithoutPrice
                ? "bg-accent text-white hover:bg-accent-hover"
                : "border border-border bg-white text-foreground hover:bg-surface"
            }`}
          >
            <PaperPlaneTilt className="h-5 w-5" />
            {hasItemsWithoutPrice ? "Solicitar presupuesto por Telegram" : "Consultar por Telegram"}
          </button>

          {/* Guardar en vault (solo autenticados) */}
          {client && <SaveQuoteButton />}
        </div>

        {hasItemsWithoutPrice && (
          <p className="text-center text-xs text-muted">
            Algunos productos requieren cotización. Contactanos por Telegram para un presupuesto completo.
          </p>
        )}

        <div className="text-center">
          <button
            onClick={() => {
              if (window.confirm("¿Seguro que querés vaciar el carrito?")) {
                clearCart();
              }
            }}
            className="text-sm text-muted underline hover:text-foreground"
          >
            Vaciar carrito
          </button>
        </div>
      </div>

      {/* Cart Cross-Sell */}
      {crossSell.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold">Completa tu pedido</h2>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {crossSell.map((p) => (
              <div key={p.product_id} className="w-48 shrink-0 sm:w-56">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
