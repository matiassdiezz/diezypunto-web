"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquaresFour, FileText, Package } from "@phosphor-icons/react";

const navItems = [
  { href: "/portal", label: "Dashboard", icon: SquaresFour },
  { href: "/portal/presupuestos", label: "Presupuestos", icon: FileText },
  { href: "/portal/pedidos", label: "Pedidos", icon: Package },
];

export default function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-card lg:block">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const active =
            item.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
