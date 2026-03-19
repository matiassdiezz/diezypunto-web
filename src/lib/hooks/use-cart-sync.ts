"use client";

import { useEffect, useRef } from "react";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useAuth } from "@/lib/hooks/use-auth";

export function useCartSync() {
  const { client } = useAuth();
  const items = useQuoteStore((s) => s.items);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncRef = useRef<string>("");

  useEffect(() => {
    if (!client || items.length === 0) return;

    const itemsKey = JSON.stringify(
      items.map((i) => ({ id: i.product.product_id, qty: i.quantity })),
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
            unit_price: i.product.price,
            category: i.product.category,
          })),
          status: "draft",
        }),
      })
        .then(() => {
          lastSyncRef.current = itemsKey;
        })
        .catch(() => {
          // Silent fail — localStorage is the primary store
        });
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [client, items]);
}
