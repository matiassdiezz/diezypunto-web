"use client";

import { useEffect, useRef } from "react";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useAuth } from "@/lib/hooks/use-auth";
import { useToastStore } from "@/components/shared/Toast";

export function useCartSync() {
  const { client } = useAuth();
  const items = useQuoteStore((s) => s.items);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncRef = useRef<string>("");

  useEffect(() => {
    if (!client || items.length === 0) return;

    const itemsKey = JSON.stringify(
      items.map((i) => ({
        id: i.id,
        qty: i.quantity,
        color: i.color,
        personalization_method: i.personalization_method,
      })),
    );

    // Skip if nothing changed
    if (itemsKey === lastSyncRef.current) return;

    // Debounce 2s
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetch("/api/portal/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product.product_id,
            title: i.product.title,
            quantity: i.quantity,
            category: i.product.category,
            color: i.color,
            personalization_method: i.personalization_method,
          })),
          status: "borrador",
        }),
      })
        .then((res) => {
          if (res.ok) {
            lastSyncRef.current = itemsKey;
          } else {
            useToastStore.getState().toastError(
              "No se pudo sincronizar. Tus productos siguen guardados localmente.",
            );
          }
        })
        .catch(() => {
          useToastStore.getState().toastError(
            "No se pudo sincronizar. Tus productos siguen guardados localmente.",
          );
        });
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [client, items]);
}
