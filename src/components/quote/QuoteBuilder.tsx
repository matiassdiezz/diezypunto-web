"use client";

import { useState, useEffect } from "react";
import {
  Minus,
  Plus,
  Trash,
  CreditCard,
  SpinnerGap,
  X,
  ShoppingCart,
  ShieldCheck,
  MapPinLine,
  User,
  Bank,
  Check,
  EnvelopeSimple,
} from "@phosphor-icons/react";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { PEDIDO_EVENTO_PRESET_MESSAGE } from "@/lib/chat/chat-preset-messages";
import { useChatStore } from "@/lib/stores/chat-store";
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

const DOCUMENT_TYPES = ["DNI", "CUIT", "CUIL", "Pasaporte"] as const;
const PROVINCES = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

type BillingFormState = {
  firstName: string;
  lastName: string;
  company: string;
  documentType: (typeof DOCUMENT_TYPES)[number];
  documentNumber: string;
  streetAddress: string;
  city: string;
  province: string;
  phone: string;
  email: string;
};

const DEFAULT_BILLING_FORM: BillingFormState = {
  firstName: "",
  lastName: "",
  company: "",
  documentType: "DNI",
  documentNumber: "",
  streetAddress: "",
  city: "",
  province: "Buenos Aires",
  phone: "",
  email: "",
};

const FIELD_CLASSNAME =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20";

const LABEL_CLASSNAME = "text-xs font-medium text-slate-600";

export default function QuoteBuilder() {
  const { items, updateQty, removeItem, clearCart } = useQuoteStore();
  const { client } = useAuth();
  const [mpLoading, setMpLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSent, setTransferSent] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [crossSell, setCrossSell] = useState<ProductResult[]>([]);
  const [minQtyWarn, setMinQtyWarn] = useState<string | null>(null);
  const [billingForm, setBillingForm] = useState<BillingFormState>(DEFAULT_BILLING_FORM);
  const [billingError, setBillingError] = useState<string | null>(null);
  const openWithMessage = useChatStore((s) => s.openWithMessage);

  function getItemLabel(item: QuoteItem): string {
    const details = [item.color, item.personalization_method].filter(Boolean);
    if (details.length === 0) return item.product.title;
    return `${item.product.title} · ${details.join(" · ")}`;
  }

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
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

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

  const updateBillingField = <K extends keyof BillingFormState>(
    field: K,
    value: BillingFormState[K],
  ) => {
    setBillingForm((current) => ({ ...current, [field]: value }));
    setBillingError(null);
  };

  const validateBillingForm = (): string | null => {
    if (!billingForm.firstName.trim()) return "Completá el nombre.";
    if (!billingForm.lastName.trim()) return "Completá el apellido.";
    if (!billingForm.documentNumber.trim()) return "Completá el número de documento.";
    if (!billingForm.streetAddress.trim()) return "Completá la dirección.";
    if (!billingForm.city.trim()) return "Completá la ciudad.";
    if (!billingForm.province.trim()) return "Seleccioná una provincia.";
    if (!billingForm.phone.trim()) return "Completá el teléfono.";
    if (!billingForm.email.trim()) return "Completá el mail.";
    const email = billingForm.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Ingresá un mail válido.";
    return null;
  };

  const handleMercadoPago = async () => {
    const payableItems = items.filter((i) => i.product.price != null);
    if (payableItems.length === 0) return;

    const validationError = validateBillingForm();
    if (validationError) {
      setBillingError(validationError);
      return;
    }

    setMpLoading(true);
    setBillingError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: payableItems.map((i) => ({
            id: i.id,
            title: getItemLabel(i),
            quantity: i.quantity,
            unit_price: getItemUnitPrice(i) ?? i.product.price,
            image_url: i.product.image_urls[0] || undefined,
            color: i.color || undefined,
          })),
          billing: {
            first_name: billingForm.firstName.trim(),
            last_name: billingForm.lastName.trim(),
            company: billingForm.company.trim(),
            document_type: billingForm.documentType,
            document_number: billingForm.documentNumber.trim(),
            street_address: billingForm.streetAddress.trim(),
            city: billingForm.city.trim(),
            province: billingForm.province.trim(),
            phone: billingForm.phone.trim(),
            email: billingForm.email.trim(),
          },
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

  const handleTransfer = async () => {
    const payableItems = items.filter((i) => i.product.price != null);
    if (payableItems.length === 0) return;

    const validationError = validateBillingForm();
    if (validationError) {
      setBillingError(validationError);
      return;
    }

    setTransferLoading(true);
    setBillingError(null);
    try {
      const res = await fetch("/api/checkout/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: payableItems.map((i) => ({
            id: i.id,
            title: getItemLabel(i),
            quantity: i.quantity,
            unit_price: getItemUnitPrice(i) ?? i.product.price,
            image_url: i.product.image_urls[0] || undefined,
            color: i.color || undefined,
          })),
          billing: {
            first_name: billingForm.firstName.trim(),
            last_name: billingForm.lastName.trim(),
            company: billingForm.company.trim(),
            document_type: billingForm.documentType,
            document_number: billingForm.documentNumber.trim(),
            street_address: billingForm.streetAddress.trim(),
            city: billingForm.city.trim(),
            province: billingForm.province.trim(),
            phone: billingForm.phone.trim(),
            email: billingForm.email.trim(),
          },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTransferSent(true);
      } else {
        alert(data.error || "Error al enviar los datos");
      }
    } catch {
      alert("Error de conexión. Intentá de nuevo.");
    } finally {
      setTransferLoading(false);
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
              key={item.id}
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
                      <p className="text-xs text-muted">
                        {item.product.category}
                      </p>
                      {(item.color || item.personalization_method) && (
                        <p className="mt-1 text-xs text-muted">
                          {[item.color, item.personalization_method]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
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
                            updateQty(item.id, newQty);
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
                        onClick={() => updateQty(item.id, item.quantity + 1)}
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
          <div className="relative max-h-[96vh] w-full max-w-4xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Finalizar pedido</h2>
                <p className="text-sm text-muted">Completá tus datos para continuar al pago.</p>
              </div>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="rounded-xl p-2 text-muted transition-colors hover:bg-slate-100 hover:text-foreground"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              {/* Left: Form */}
              <div className="space-y-6">
                {/* Datos del comprador */}
                <section>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <User className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold">Datos del comprador</h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className={LABEL_CLASSNAME}>Nombre <span className="text-red-400">*</span></span>
                      <input
                        value={billingForm.firstName}
                        onChange={(e) => updateBillingField("firstName", e.target.value)}
                        className={FIELD_CLASSNAME}
                        placeholder="Juan"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className={LABEL_CLASSNAME}>Apellido <span className="text-red-400">*</span></span>
                      <input
                        value={billingForm.lastName}
                        onChange={(e) => updateBillingField("lastName", e.target.value)}
                        className={FIELD_CLASSNAME}
                        placeholder="Pérez"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className={LABEL_CLASSNAME}>Empresa <span className="text-muted/50">(opcional)</span></span>
                      <input
                        value={billingForm.company}
                        onChange={(e) => updateBillingField("company", e.target.value)}
                        className={FIELD_CLASSNAME}
                        placeholder="Nombre de la empresa"
                      />
                    </label>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <label className="space-y-1.5">
                        <span className={LABEL_CLASSNAME}>Documento <span className="text-red-400">*</span></span>
                        <select
                          value={billingForm.documentType}
                          onChange={(e) =>
                            updateBillingField(
                              "documentType",
                              e.target.value as BillingFormState["documentType"],
                            )
                          }
                          className={FIELD_CLASSNAME}
                        >
                          {DOCUMENT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1.5">
                        <span className={LABEL_CLASSNAME}>&nbsp;</span>
                        <input
                          value={billingForm.documentNumber}
                          onChange={(e) => updateBillingField("documentNumber", e.target.value)}
                          className={FIELD_CLASSNAME}
                          placeholder="Ej: 20-12345678-9"
                        />
                      </label>
                    </div>
                    <label className="space-y-1.5">
                      <span className={LABEL_CLASSNAME}>Teléfono <span className="text-red-400">*</span></span>
                      <input
                        value={billingForm.phone}
                        onChange={(e) => updateBillingField("phone", e.target.value)}
                        className={FIELD_CLASSNAME}
                        placeholder="11 1234-5678"
                        type="tel"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className={LABEL_CLASSNAME}>Email <span className="text-red-400">*</span></span>
                      <input
                        value={billingForm.email}
                        onChange={(e) => updateBillingField("email", e.target.value)}
                        className={FIELD_CLASSNAME}
                        placeholder="mail@empresa.com"
                        type="email"
                      />
                    </label>
                  </div>
                </section>

                <hr className="border-slate-100" />

                {/* Dirección de facturación */}
                <section>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <MapPinLine className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold">Dirección de facturación</h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5 sm:col-span-2">
                      <span className={LABEL_CLASSNAME}>Dirección <span className="text-red-400">*</span></span>
                      <input
                        value={billingForm.streetAddress}
                        onChange={(e) => updateBillingField("streetAddress", e.target.value)}
                        className={FIELD_CLASSNAME}
                        placeholder="Calle y número"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className={LABEL_CLASSNAME}>Ciudad <span className="text-red-400">*</span></span>
                      <input
                        value={billingForm.city}
                        onChange={(e) => updateBillingField("city", e.target.value)}
                        className={FIELD_CLASSNAME}
                        placeholder="Ciudad"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className={LABEL_CLASSNAME}>Provincia <span className="text-red-400">*</span></span>
                      <select
                        value={billingForm.province}
                        onChange={(e) => updateBillingField("province", e.target.value)}
                        className={FIELD_CLASSNAME}
                      >
                        {PROVINCES.map((province) => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>

                {billingError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <span className="shrink-0">!</span>
                    {billingError}
                  </div>
                )}
              </div>

              {/* Right: Summary + CTA */}
              <div className="lg:sticky lg:top-0">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <h3 className="text-sm font-semibold text-foreground">Resumen del pedido</h3>

                  {/* Items */}
                  <div className="mt-4 space-y-2.5">
                    {items.map((item) => {
                      const unitPrice = getItemUnitPrice(item);
                      const subtotal = unitPrice ? unitPrice * item.quantity : null;
                      return (
                        <div key={item.id} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm">{item.product.title}</p>
                            <p className="text-xs text-muted">
                              {item.quantity} u. × ${unitPrice?.toLocaleString("es-AR") ?? "—"}
                              {item.color && ` · ${item.color}`}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-medium">
                            {subtotal != null ? `$${subtotal.toLocaleString("es-AR")}` : "Consultar"}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <hr className="my-4 border-slate-200" />

                  {/* Totals */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">{items.length} {items.length === 1 ? "producto" : "productos"} · {totalQuantity} unidades</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium">Total estimado</span>
                      <div className="text-right">
                        <span className="text-xl font-bold">${total.toLocaleString("es-AR")}</span>
                        <span className="ml-1 text-xs text-muted">+ IVA</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment options */}
                  {total > 0 && !hasItemsWithoutPrice && !transferSent && (
                    <div className="mt-5 space-y-2.5">
                      <p className="text-xs font-medium text-slate-500">Elegí cómo pagar</p>
                      <button
                        onClick={handleMercadoPago}
                        disabled={mpLoading || transferLoading}
                        className="flex w-full items-center gap-3 rounded-xl bg-accent px-4 py-3 text-left text-white transition-all hover:bg-accent-hover hover:shadow-lg disabled:opacity-60"
                      >
                        {mpLoading ? (
                          <SpinnerGap className="h-5 w-5 shrink-0 animate-spin" />
                        ) : (
                          <CreditCard className="h-5 w-5 shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-semibold">Mercado Pago</p>
                          <p className="text-xs text-white/70">Tarjeta, transferencia o efectivo</p>
                        </div>
                      </button>
                      <button
                        onClick={handleTransfer}
                        disabled={mpLoading || transferLoading}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {transferLoading ? (
                          <SpinnerGap className="h-5 w-5 shrink-0 animate-spin text-slate-600" />
                        ) : (
                          <Bank className="h-5 w-5 shrink-0 text-slate-600" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-foreground">Transferencia bancaria</p>
                          <p className="text-xs text-muted">Te enviamos los datos por mail</p>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Transfer success */}
                  {transferSent && (
                    <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                          <Check className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">Datos enviados</p>
                          <p className="text-xs text-emerald-700">
                            Revisá tu mail con los datos para transferir.
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600">
                        <EnvelopeSimple className="h-3.5 w-3.5" />
                        <span>{billingForm.email}</span>
                      </div>
                    </div>
                  )}

                  {client && (
                    <div className="mt-2.5">
                      <SaveQuoteButton />
                    </div>
                  )}

                  {/* Trust signal */}
                  <div className="mt-4 flex items-start gap-2 text-xs text-muted">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <p>Todas las transacciones son seguras y tus datos están protegidos.</p>
                  </div>
                </div>
              </div>
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
