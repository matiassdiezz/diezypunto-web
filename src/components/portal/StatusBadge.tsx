const statusConfig: Record<string, { label: string; className: string }> = {
  // Quotes
  borrador: { label: "Borrador", className: "bg-gray-100 text-gray-600" },
  enviado: { label: "Enviado", className: "bg-blue-50 text-blue-600" },
  aceptado: { label: "Aceptado", className: "bg-green-50 text-green-600" },
  vencido: { label: "Vencido", className: "bg-amber-50 text-amber-700" },
  rechazado: { label: "Rechazado", className: "bg-red-50 text-red-600" },
  // Orders
  confirmado: { label: "Confirmado", className: "bg-blue-50 text-blue-600" },
  en_produccion: { label: "En Producción", className: "bg-amber-50 text-amber-700" },
  entregado: { label: "Entregado", className: "bg-emerald-50 text-emerald-600" },
  cancelado: { label: "Cancelado", className: "bg-red-50 text-red-600" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${config.className}`}
    >
      {config.label}
    </span>
  );
}
