/** Mensaje del CTA compartido (hero, banners, quote builder). Debe coincidir exactamente con lo que envía `openWithMessage`. */
export const PEDIDO_EVENTO_PRESET_MESSAGE =
  "Quiero armar un pedido personalizado para mi evento" as const;

export function normalizePresetKey(msg: string): string {
  return msg
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}
