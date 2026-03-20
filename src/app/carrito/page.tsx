"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SpinnerGap } from "@phosphor-icons/react";
import QuoteBuilder from "@/components/quote/QuoteBuilder";
import ScrollReveal from "@/components/shared/ScrollReveal";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { getProduct } from "@/lib/api";

function CartLoader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const addItem = useQuoteStore((s) => s.addItem);
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code || loaded.current) return;
    loaded.current = true;

    setLoading(true);
    fetch(`/api/telegram-cart/${code}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(async (payload) => {
        if (!payload?.items) return;
        const settled = await Promise.allSettled(
          payload.items.map((item: { product_id: string; qty: number }) =>
            getProduct(item.product_id).then((product) => ({
              product,
              qty: item.qty,
            })),
          ),
        );
        for (const result of settled) {
          if (result.status === "fulfilled") {
            addItem(result.value.product, result.value.qty);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        router.replace("/carrito");
        setLoading(false);
      });
  }, [searchParams, router, addItem]);

  if (loading) {
    return (
      <div className="mt-8 flex items-center justify-center gap-2 py-20 text-muted">
        <SpinnerGap className="h-5 w-5 animate-spin" />
        <span>Cargando carrito...</span>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <QuoteBuilder />
    </div>
  );
}

export default function CarritoPage() {
  return (
    <div className="px-4 pb-20 pt-6 sm:px-6 lg:px-16 sm:pt-8">
      <ScrollReveal>
        <h1 className="text-3xl font-bold">Carrito</h1>
        <p className="mt-2 text-muted">
          Revisa los productos seleccionados, ajusta cantidades y completa tu
          compra.
        </p>
      </ScrollReveal>

      <Suspense>
        <CartLoader />
      </Suspense>
    </div>
  );
}
