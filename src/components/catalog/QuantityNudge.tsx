"use client";

import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import type { ProductResult } from "@/lib/types";

interface QuantityNudgeProps {
  qty: number;
  product: ProductResult;
}

export default function QuantityNudge({ qty, product }: QuantityNudgeProps) {
  if (qty >= 50) {
    const msg = encodeURIComponent(
      `Hola! Me interesa el producto: ${product.title}, ${qty} unidades. Quiero consultar por precio especial.`,
    );
    return (
      <div className="mt-2 rounded-lg bg-accent-light px-3 py-2 text-xs text-accent sm:text-sm">
        <span>Pedi 100+ y te hacemos precio especial</span>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 inline-flex items-center gap-1 font-medium underline"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Consultar
        </a>
      </div>
    );
  }

  if (qty >= 25 && product.price != null && product.price_max != null && product.price_max !== product.price) {
    return (
      <p className="mt-2 text-xs text-muted sm:text-sm">
        A mayor cantidad, mejor precio por unidad
      </p>
    );
  }

  if (qty < 25) {
    return (
      <p className="mt-2 text-xs text-muted sm:text-sm">
        Las empresas suelen pedir 50-100 unidades
      </p>
    );
  }

  return null;
}
