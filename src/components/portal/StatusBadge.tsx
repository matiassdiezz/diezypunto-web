export const statusConfig: Record<string, { label: string; className: string }> = {
  // Quotes
  draft: { label: "Borrador", className: "bg-gray-100 text-gray-600" },
  borrador: { label: "Borrador", className: "bg-gray-100 text-gray-600" },
  enviado: { label: "Enviado", className: "bg-blue-50 text-blue-600" },
  aceptado: { label: "Aceptado", className: "bg-green-50 text-green-600" },
  vencido: { label: "Vencido", className: "bg-amber-50 text-amber-700" },
  rechazado: { label: "Rechazado", className: "bg-red-50 text-red-600" },
  // Orders
  cotizado: { label: "Cotizado", className: "bg-gray-100 text-gray-600" },
  confirmado: { label: "Confirmado", className: "bg-blue-50 text-blue-600" },
  comprado: { label: "Comprado", className: "bg-indigo-50 text-indigo-600" },
  recibido: { label: "Recibido", className: "bg-purple-50 text-purple-600" },
  en_produccion: { label: "En Producción", className: "bg-amber-50 text-amber-700" },
  "en-produccion": { label: "En Producción", className: "bg-amber-50 text-amber-700" },
  terminado: { label: "Terminado", className: "bg-emerald-50 text-emerald-600" },
  entregado: { label: "Entregado", className: "bg-emerald-50 text-emerald-600" },
  cancelado: { label: "Cancelado", className: "bg-red-50 text-red-600" },
};

const defaultStyle = { label: "", className: "bg-gray-100 text-gray-600" };

export function getStatusStyle(status: string): { label: string; className: string } {
  const config = statusConfig[status];
  if (config) return config;
  return { ...defaultStyle, label: status };
}

export default function StatusBadge({ status }: { status: string }) {
  const config = getStatusStyle(status);

  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}
