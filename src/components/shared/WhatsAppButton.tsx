"use client";

import { MessageCircle } from "lucide-react";
import { useQuoteStore } from "@/lib/stores/quote-store";

const WHATSAPP_NUMBER = "5491168385566"; // Martin's number

export default function WhatsAppButton() {
  const items = useQuoteStore((s) => s.items);

  const buildMessage = () => {
    if (items.length === 0) {
      return "Hola! Me interesa consultar por productos de merchandising.";
    }
    let msg = "Hola! Me interesa consultar por estos productos:\n\n";
    items.forEach((item, i) => {
      msg += `${i + 1}. ${item.product.title}`;
      if (item.quantity > 1) msg += ` (x${item.quantity})`;
      if (item.product.price) msg += ` - $${item.product.price.toLocaleString("es-AR")}`;
      msg += "\n";
    });
    return msg;
  };

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage())}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">Habla con Martin</span>
    </a>
  );
}
