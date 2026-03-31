declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

type GAItem = {
  item_id: string;
  item_name?: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
};

function isGAReady() {
  return (
    typeof window !== "undefined" &&
    GA_MEASUREMENT_ID &&
    typeof window.gtag === "function"
  );
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getItems(value: unknown): GAItem[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const items = value
    .map<GAItem | null>((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Record<string, unknown>;

      const itemId = asString(candidate.id) || asString(candidate.product_id);
      if (!itemId) return null;

      const color = asString(candidate.color);
      const personalizationMethod =
        asString(candidate.personalization_method) ||
        asString(candidate.personalizationMethod);
      const variant = [color, personalizationMethod].filter(Boolean).join(" / ");

      return {
        item_id: itemId,
        item_name: asString(candidate.title),
        item_category: asString(candidate.category),
        item_variant: variant || undefined,
        price: asNumber(candidate.unit_price) ?? asNumber(candidate.price),
        quantity: asNumber(candidate.quantity),
      } satisfies GAItem;
    })
    .filter((item): item is GAItem => item !== null);

  return items.length > 0 ? items : undefined;
}

function gtag(eventType: "config" | "event", name: string, params: Record<string, unknown>) {
  if (!isGAReady()) return;
  window.gtag?.(eventType, name, params);
}

export function trackPageView(path: string) {
  if (!isGAReady()) return;

  const pagePath = path.startsWith("/") ? path : `/${path}`;
  gtag("event", "page_view", {
    page_title: document.title,
    page_location: `${window.location.origin}${pagePath}`,
    page_path: pagePath,
  });
}

export function trackGoogleAnalyticsEvent(
  type: string,
  data: Record<string, unknown> = {},
) {
  if (!isGAReady()) return;

  const items = getItems(data.items);
  const singleItem =
    asString(data.product_id) &&
    ([
      {
        item_id: asString(data.product_id)!,
        item_name: asString(data.title),
        item_category: asString(data.category),
        item_variant: [asString(data.color), asString(data.personalization_method)]
          .filter(Boolean)
          .join(" / ") || undefined,
        price: asNumber(data.price),
        quantity: asNumber(data.quantity),
      },
    ] satisfies GAItem[]);

  switch (type) {
    case "product_view":
      gtag("event", "view_item", {
        currency: "ARS",
        value: asNumber(data.price),
        items: singleItem,
      });
      return;
    case "cart_add":
      gtag("event", "add_to_cart", {
        currency: "ARS",
        value:
          asNumber(data.price) && asNumber(data.quantity)
            ? asNumber(data.price)! * asNumber(data.quantity)!
            : undefined,
        items: singleItem,
      });
      return;
    case "cart_remove":
      gtag("event", "remove_from_cart", {
        currency: "ARS",
        items: singleItem,
      });
      return;
    case "begin_checkout":
      gtag("event", "begin_checkout", {
        currency: "ARS",
        value: asNumber(data.total_value) ?? asNumber(data.value),
        items,
      });
      return;
    case "checkout_start":
      gtag("event", "add_payment_info", {
        currency: "ARS",
        value: asNumber(data.total_value) ?? asNumber(data.value),
        payment_type: asString(data.payment_method),
        items,
      });
      return;
    case "checkout_transfer":
    case "quote_request_whatsapp":
      gtag("event", "generate_lead", {
        currency: "ARS",
        value: asNumber(data.total_value) ?? asNumber(data.value),
        method: asString(data.payment_method) || asString(data.method) || type,
        items,
      });
      return;
    case "share_whatsapp":
      gtag("event", "share", {
        method: "whatsapp",
        content_type: asString(data.context),
        item_id: asString(data.product_id),
      });
      return;
    case "share_copy_link":
      gtag("event", "share", {
        method: "copy_link",
        content_type: asString(data.context),
        item_id: asString(data.product_id),
      });
      return;
    default:
      gtag("event", type, data);
  }
}
