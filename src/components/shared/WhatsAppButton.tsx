"use client";

import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { usePathname } from "next/navigation";

export default function WhatsAppButton() {
  const items = useQuoteStore((s) => s.items);
  const pathname = usePathname();

  const buildMessage = () => {
    // With items in cart: include product list and total
    if (items.length > 0) {
      const total = items.reduce((sum, i) => {
        if (i.product.price) return sum + i.product.price * i.quantity;
        return sum;
      }, 0);
      let msg = `Hola! Tengo ${items.length} productos por $${total.toLocaleString("es-AR")}. Necesito cotizacion:\n\n`;
      items.forEach((item, i) => {
        msg += `${i + 1}. ${item.product.title}`;
        if (item.quantity > 1) msg += ` (x${item.quantity})`;
        if (item.product.price) msg += ` - $${item.product.price.toLocaleString("es-AR")}`;
        msg += "\n";
      });
      return msg;
    }

    // Browsing a category page
    const categoryMatch = pathname.match(/^\/catalogo\/(.+)$/);
    if (categoryMatch) {
      const category = decodeURIComponent(categoryMatch[1]);
      return `Hola! Estoy buscando ${category} para un evento. ¿Podrian ayudarme?`;
    }

    // Default
    return "Hola! Me interesa consultar por productos de merchandising.";
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
