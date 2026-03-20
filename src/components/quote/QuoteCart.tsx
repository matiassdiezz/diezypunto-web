"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useHasMounted } from "@/lib/hooks/use-has-mounted";

export default function QuoteCart() {
  const mounted = useHasMounted();
  const totalItems = useQuoteStore((s) => s.totalItems());

  if (!mounted || totalItems === 0) return null;

  return (
    <Link
      href="/carrito"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
    >
      <ShoppingBag className="h-5 w-5" />
      <span>{totalItems}</span>
    </Link>
  );
}
