"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useHasMounted } from "@/lib/hooks/use-has-mounted";
import { FLOATING_GLASS_BTN } from "@/components/chat/OpenChatButton";

export default function QuoteCart() {
  const mounted = useHasMounted();
  const totalItems = useQuoteStore((s) => s.totalItems());

  if (!mounted || totalItems === 0) return null;

  return (
    <Link
      href="/carrito"
      className={`fixed bottom-6 left-6 ${FLOATING_GLASS_BTN}`}
      aria-label={`Ir al carrito (${totalItems} items)`}
    >
      <ShoppingBag
        className="h-5 w-5 shrink-0 text-foreground md:h-6 md:w-6"
        strokeWidth={2.25}
      />
      <span className="tabular-nums">{totalItems}</span>
    </Link>
  );
}
