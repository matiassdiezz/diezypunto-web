"use client";

import { useState } from "react";
import { FloppyDisk, Check, SpinnerGap } from "@phosphor-icons/react";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useToastStore } from "@/components/shared/Toast";

export default function SaveQuoteButton() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const items = useQuoteStore((s) => s.items);

  const handleSave = async () => {
    if (items.length === 0 || saving) return;

    setSaving(true);
    try {
      const res = await fetch("/api/portal/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product.product_id,
            title: i.product.title,
            quantity: i.quantity,
            category: i.product.category,
            ...(i.color && { color: i.color }),
          })),
          status: "borrador",
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        useToastStore.getState().toastError("No se pudo guardar el presupuesto. Intentá de nuevo.");
      }
    } catch {
      useToastStore.getState().toastError("Error de conexión. Tus productos siguen en el carrito.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saving || items.length === 0}
      className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent-light px-5 py-3 text-sm font-medium text-accent transition-all hover:bg-accent/10 disabled:opacity-60"
    >
      {saving ? (
        <SpinnerGap className="h-4 w-4 animate-spin" />
      ) : saved ? (
        <Check className="h-4 w-4" />
      ) : (
        <FloppyDisk className="h-4 w-4" />
      )}
      {saving ? "Guardando..." : saved ? "Guardado" : "Guardar Presupuesto"}
    </button>
  );
}
