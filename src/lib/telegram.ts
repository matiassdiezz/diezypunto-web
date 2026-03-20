/* Telegram bot deep link helper */

const TELEGRAM_BOT = "diezypunto_bot";

/** Simple link to the bot (no context) */
export function telegramUrl(): string {
  return `https://t.me/${TELEGRAM_BOT}`;
}

interface CartPayload {
  type: "cart";
  items: { product_id: string; title: string; qty: number; price: number | null }[];
}

interface ProductPayload {
  type: "product";
  product_id: string;
  title: string;
  qty: number;
  message: string;
}

type TelegramPayload = CartPayload | ProductPayload;

/**
 * Store context server-side and open Telegram bot with ?start={code}.
 * Falls back to plain bot link if server call fails.
 */
export async function openTelegramWithContext(payload: TelegramPayload): Promise<void> {
  try {
    const res = await fetch("/api/share-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const { code } = await res.json();
      window.open(`https://t.me/${TELEGRAM_BOT}?start=${code}`, "_blank");
      return;
    }
  } catch {
    // Fall through to plain link
  }

  // Fallback: open bot without context
  window.open(`https://t.me/${TELEGRAM_BOT}`, "_blank");
}
