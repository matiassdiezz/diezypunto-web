"use client";

import { useState, useEffect } from "react";
import {
  Minus,
  Plus,
  Trash,
  PaperPlaneTilt,
  CreditCard,
  SpinnerGap,
  X,
  ShoppingCart,
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
import ProductCard from "@/components/catalog/ProductCard";
import SaveQuoteButton from "@/components/portal/SaveQuoteButton";
import { useAuth } from "@/lib/hooks/use-auth";
import ShareButton from "@/components/shared/ShareButtons";
import { buildCartShareUrl, buildCartWhatsAppMessage } from "@/lib/share";

export default function QuoteBuilder() {
  const { items, updateQty, removeItem, clearCart } = useQuoteStore();
  const { client } = useAuth();
  const [mpLoading, setMpLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
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

      {/* Items */}
      <div className="space-y-3">
        {items.map((item) => {
          const unitPrice = getItemUnitPrice(item);
          const subtotal = unitPrice ? unitPrice * item.quantity : null;
          const atMin = item.quantity <= 1;
          return (
            <div
              key={item.product.product_id}
              className="rounded-2xl border border-white/55 bg-white/58 p-4 shadow-[0_4px_16px_rgba(15,23,42,0.06)] backdrop-blur-md transition-colors hover:bg-white/65"
            >
              <div className="flex items-start gap-3">
                {item.product.image_urls[0] && (
                  <img
                    src={item.product.image_urls[0]}
                    alt={item.product.title}
                    className="h-16 w-16 shrink-0 rounded-xl border border-white/55 bg-white/70 object-contain"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.product.title}</p>
                      <p className="text-xs text-muted">{item.product.category}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.product_id)}
                      className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    {/* Qty controls */}
                    <div className="flex items-center gap-2">
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
                        className="rounded-lg border border-white/65 bg-white/75 p-1.5 transition-colors hover:bg-white"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQty(item.product.product_id, item.quantity + 1)
                        }
                        className="rounded-lg border border-white/65 bg-white/75 p-1.5 transition-colors hover:bg-white"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      {subtotal != null ? (
                        <>
                          <p className="text-sm font-semibold">
                            ${subtotal.toLocaleString("es-AR")}
                            <span className="ml-0.5 text-xs font-normal text-muted">+ IVA</span>
                          </p>
                          <p className="text-[11px] text-muted">
                            ${unitPrice!.toLocaleString("es-AR")} c/u
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted">Consultar</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {minQtyWarn === item.product.product_id && item.product.min_qty && (
                <p className="mt-2 text-xs text-amber-600">
                  Pedido mínimo: {item.product.min_qty} unidades
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 space-y-4">
        {/* Total */}
        {total > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/60 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm">
            <p className="text-sm font-medium text-muted">Total estimado</p>
            <p className="text-2xl font-bold">
              ${total.toLocaleString("es-AR")}
              <span className="ml-1 text-sm font-normal text-muted">+ IVA</span>
            </p>
          </div>
        )}

        {/* Single CTA */}
        <button
          onClick={() => setCheckoutOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/40 bg-accent py-3.5 text-base font-medium text-white transition-all hover:bg-accent-hover hover:shadow-[0_8px_20px_rgba(89,198,242,0.35)]"
        >
          <ShoppingCart className="h-5 w-5" />
          Confirmar pedido
        </button>

        <div className="flex items-center justify-center gap-2">
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
          <span className="text-muted/30">|</span>
          <ShareButton
            getShareUrl={() => buildCartShareUrl(items)}
            getWhatsAppMessage={(url) =>
              buildCartWhatsAppMessage(items.length, url)
            }
            context="cart"
            trackingData={{ item_count: items.length }}
          />
        </div>
      </div>

      {/* Checkout modal */}
      {checkoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          onClick={(e) => { if (e.target === e.currentTarget) setCheckoutOpen(false); }}
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">¿Cómo querés continuar?</h2>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Mercado Pago */}
              {total > 0 && !hasItemsWithoutPrice && (
                <button
                  onClick={() => { setCheckoutOpen(false); handleMercadoPago(); }}
                  disabled={mpLoading}
                  className="flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left transition-all hover:border-accent hover:bg-accent/5 disabled:opacity-60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    {mpLoading ? (
                      <SpinnerGap className="h-5 w-5 animate-spin text-accent" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-accent" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Pagar con Mercado Pago</p>
                    <p className="text-xs text-muted">Tarjeta, transferencia o efectivo</p>
                  </div>
                </button>
              )}

              {/* Telegram */}
              <button
                onClick={() => { setCheckoutOpen(false); handleTelegram(); }}
                className="flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left transition-all hover:border-[#229ED9] hover:bg-[#229ED9]/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#229ED9]/10">
                  <PaperPlaneTilt className="h-5 w-5 text-[#229ED9]" />
                </div>
                <div>
                  <p className="font-medium">
                    {hasItemsWithoutPrice ? "Solicitar presupuesto" : "Consultar por Telegram"}
                  </p>
                  <p className="text-xs text-muted">
                    {hasItemsWithoutPrice
                      ? "Algunos productos requieren cotización"
                      : "Hablá con nosotros antes de pagar"}
                  </p>
                </div>
              </button>

              {/* Guardar presupuesto */}
              {client && (
                <div className="rounded-xl border border-border p-4 transition-all hover:border-accent hover:bg-accent/5">
                  <div className="flex items-center gap-3">
                    <SaveQuoteButton />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
