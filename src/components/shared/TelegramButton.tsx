"use client";

import { Send } from "lucide-react";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { telegramUrl, openTelegramWithContext } from "@/lib/telegram";

export default function TelegramButton() {
  const items = useQuoteStore((s) => s.items);

  function handleClick() {
    if (items.length > 0) {
      openTelegramWithContext({
        type: "cart",
        items: items.map((i) => ({
          product_id: i.product.product_id,
          title: i.product.title,
          qty: i.quantity,
          price: i.product.price,
        })),
      });
    } else {
      window.open(telegramUrl(), "_blank");
    }
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#0088cc] px-5 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
    >
      <Send className="h-5 w-5" />
      <span className="hidden sm:inline">Habla con nosotros</span>
    </button>
  );
}
