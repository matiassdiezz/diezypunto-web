/* Share utilities — WhatsApp + clipboard for products and carts */

import type { QuoteItem } from "@/lib/types";

/** Build a product URL with qty encoded in the query string */
export function buildProductShareUrl(productId: string, qty: number): string {
  const base = `${window.location.origin}/producto/${productId}`;
  if (qty > 1) return `${base}?qty=${qty}`;
  return base;
}

/** Store cart server-side and return a shareable URL with ?code= */
export async function buildCartShareUrl(
  items: QuoteItem[],
): Promise<string> {
  const res = await fetch("/api/share-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "cart",
      items: items.map((i) => ({
        product_id: i.product.product_id,
        title: i.product.title,
        qty: i.quantity,
        price: i.product.price,
      })),
    }),
  });

  if (!res.ok) throw new Error("Failed to generate share code");

  const { code } = await res.json();
  return `${window.location.origin}/carrito?code=${code}`;
}

/** Open WhatsApp universal link (no number — user picks recipient) */
export function openWhatsApp(message: string): void {
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}

/** Copy text to clipboard with fallback */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  }
}

/** Build WhatsApp message for a product */
export function buildProductWhatsAppMessage(
  title: string,
  qty: number,
  price: number | null,
  url: string,
): string {
  const priceLine = price != null
    ? `$${price.toLocaleString("es-AR")} + IVA c/u`
    : "Consultar precio";
  return `Mirá este producto en diezypunto:\n*${title}* — ${qty} unidades\n${priceLine}\n${url}`;
}

/** Build WhatsApp message for a cart */
export function buildCartWhatsAppMessage(
  itemCount: number,
  url: string,
): string {
  return `Te comparto mi carrito de diezypunto (${itemCount} productos):\n${url}`;
}
