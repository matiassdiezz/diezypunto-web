import { getLocalProduct } from "@/lib/engine/local-catalog";
import {
  normalizePresetKey,
  PEDIDO_EVENTO_PRESET_MESSAGE,
} from "@/lib/chat/chat-preset-messages";

type PresetConfig = {
  intro: string;
  productIds: string[];
};

const PRESETS = new Map<string, PresetConfig>();

function registerPreset(userMessage: string, config: PresetConfig): void {
  PRESETS.set(normalizePresetKey(userMessage), config);
}

registerPreset(PEDIDO_EVENTO_PRESET_MESSAGE, {
  intro:
    "Para un evento suele funcionar combinar algo de escritorio o kit de bienvenida con drinkware. Te dejo cuatro ideas populares; si nos decís fecha, cantidad y presupuesto, afinamos más. También podés ver más variedad en el Catálogo del sitio.",
  productIds: ["5771", "4546", "5009", "3990"],
});

function escapeXmlAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function tryBuildPresetAssistantText(userMessage: string): string | null {
  const preset = PRESETS.get(normalizePresetKey(userMessage));
  if (!preset) return null;

  const tags: string[] = [];
  for (const id of preset.productIds) {
    const p = getLocalProduct(id);
    if (!p) continue;
    const unit =
      p.price != null && p.price > 0
        ? Math.round(p.price)
        : p.price_max != null && p.price_max > 0
          ? Math.round(p.price_max)
          : null;
    if (unit == null) continue;
    const img = p.image_urls[0] ?? "";
    tags.push(
      `<product id="${escapeXmlAttr(p.product_id)}" title="${escapeXmlAttr(p.title)}" price="${escapeXmlAttr(String(unit))}" image="${escapeXmlAttr(img)}" category="${escapeXmlAttr(p.category)}" />`,
    );
  }

  if (tags.length === 0) return null;

  return [preset.intro, ...tags].join("\n");
}
