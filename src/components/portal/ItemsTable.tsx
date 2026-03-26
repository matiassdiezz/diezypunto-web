interface ItemsTableProps {
  items: Array<{
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    category: string;
  }>;
}

function ItemsTable({ items }: ItemsTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                SKU
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted">
                Cant.
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted">
                Precio Unit.
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr
                key={i}
                className="border-b border-border/50 last:border-0 hover:bg-surface/30 transition-colors"
              >
                <td className="px-4 py-3 text-sm">{item.product_name}</td>
                <td className="px-4 py-3 text-sm text-muted">{item.sku}</td>
                <td className="px-4 py-3 text-sm text-right tabular-nums">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-sm text-right tabular-nums">
                  ${item.unit_price.toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-3 text-sm text-right tabular-nums font-medium">
                  ${(item.quantity * item.unit_price).toLocaleString("es-AR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-border p-4">
            <div className="text-sm font-medium">{item.product_name}</div>
            <div className="text-xs text-muted mt-0.5">{item.sku}</div>
            <span className="inline-block mt-1 rounded bg-surface px-2 py-0.5 text-[10px] text-muted uppercase">
              {item.category}
            </span>
            <div className="mt-3 flex justify-between items-center text-sm border-t border-border/50 pt-3">
              <span className="text-muted">
                {item.quantity} &times; ${item.unit_price.toLocaleString("es-AR")}
              </span>
              <span className="font-medium">
                ${(item.quantity * item.unit_price).toLocaleString("es-AR")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default ItemsTable;
