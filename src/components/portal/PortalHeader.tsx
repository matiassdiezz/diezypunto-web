"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOut, SquaresFour, FileText, Package } from "@phosphor-icons/react";
import { useAuth } from "@/lib/hooks/use-auth";

const mobileNav = [
  { href: "/portal", label: "Dashboard", icon: SquaresFour },
  { href: "/portal/presupuestos", label: "Presupuestos", icon: FileText },
  { href: "/portal/pedidos", label: "Pedidos", icon: Package },
];

export default function PortalHeader() {
  const { client, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {client?.name || "Portal"}
          </h2>
          <p className="text-xs text-muted">Portal de Clientes</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-red-300 hover:text-red-500"
        >
          <SignOut className="h-4 w-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
      {/* Mobile nav */}
      <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden">
        {mobileNav.map((item) => {
          const active =
            item.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
