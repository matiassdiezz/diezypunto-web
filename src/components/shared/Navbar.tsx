"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag, Search, LayoutGrid, UserCircle } from "lucide-react";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useTopBarStore } from "@/lib/stores/topbar-store";
import { useAuth } from "@/lib/hooks/use-auth";
import { useHasMounted } from "@/lib/hooks/use-has-mounted";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catalogo" },
  { href: "/carrito", label: "Carrito" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mounted = useHasMounted();
  const totalItems = useQuoteStore((s) => s.totalItems());
  const { isOpen: topBarOpen, toggle: toggleTopBar } = useTopBarStore();
  const { client } = useAuth();
  const router = useRouter();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchQuery("");
    router.push(`/catalogo?search=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "border-b border-border bg-white/90 shadow-sm backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-6 lg:px-16 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity duration-300 hover:opacity-80"
        >
          <Image
            src="/logo-diezypunto.webp"
            alt="diezypunto"
            width={160}
            height={48}
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop search + categories toggle */}
        <div className="hidden flex-1 items-center gap-2 max-w-md mx-8 md:flex">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground outline-none transition-all placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </form>
          <button
            onClick={toggleTopBar}
            title={topBarOpen ? "Ocultar categorías" : "Ver categorías"}
            className={`shrink-0 rounded-lg border p-2 transition-all ${
              topBarOpen
                ? "border-accent/40 bg-accent-light text-accent"
                : "border-border bg-surface text-muted hover:border-accent/40 hover:text-accent"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          {client && (
            <Link
              href="/portal"
              className="flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-accent-hover"
            >
              <UserCircle className="h-4 w-4" />
              Mi Portal
            </Link>
          )}
          <Link
            href="/carrito"
            className="relative flex items-center gap-1.5 rounded-full bg-[#59C6F2] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#3BB5E8]"
          >
            <ShoppingBag className="h-4 w-4" />
            Carrito
            {mounted && totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#3BB5E8] text-xs text-white">
                {totalItems}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-white md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-4">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm text-muted hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              {client && (
                <Link
                  href="/portal"
                  className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover"
                  onClick={() => setMobileOpen(false)}
                >
                  <UserCircle className="h-4 w-4" />
                  Mi Portal
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
