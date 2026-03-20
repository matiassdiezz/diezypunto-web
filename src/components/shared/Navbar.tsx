"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { List, X, Tote, MagnifyingGlass, SquaresFour, UserCircle } from "@phosphor-icons/react";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useTopBarStore } from "@/lib/stores/topbar-store";
import { useAuth } from "@/lib/hooks/use-auth";
import { useHasMounted } from "@/lib/hooks/use-has-mounted";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catalogo" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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
    setMobileSearchOpen(false);
    setMobileOpen(false);
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
              <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
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
            <SquaresFour className="h-4 w-4" />
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
            className="relative flex items-center gap-2 rounded-full border border-black/10 bg-white/55 px-4 py-2 text-sm font-semibold text-foreground shadow-md shadow-black/5 backdrop-blur-xl transition-all hover:bg-white/75 hover:shadow-lg md:gap-2.5 md:px-6 md:py-3 md:text-base"
          >
            <Tote className="h-4 w-4 shrink-0 text-accent md:h-5 md:w-5" />
            Carrito
            {mounted && totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white shadow-sm md:-right-2 md:-top-2 md:h-6 md:w-6 md:text-xs">
                {totalItems}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => {
              setMobileSearchOpen(!mobileSearchOpen);
              setMobileOpen(false);
            }}
            aria-label="Buscar"
            className="rounded-lg p-2 text-foreground transition-colors hover:bg-surface"
          >
            <MagnifyingGlass className="h-5 w-5" />
          </button>
          <Link
            href="/carrito"
            className="relative rounded-lg p-2 text-foreground transition-colors hover:bg-surface"
            aria-label="Carrito"
          >
            <Tote className="h-5 w-5" />
            {mounted && totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>
          <button
            onClick={() => {
              setMobileOpen(!mobileOpen);
              setMobileSearchOpen(false);
            }}
            aria-label="Menu"
            className="rounded-lg p-2 text-foreground"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <List className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-white md:hidden"
          >
            <form onSubmit={handleSearch} className="px-4 py-3">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  autoFocus
                  className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-all placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

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
              <Link
                href="/carrito"
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <Tote className="h-4 w-4" />
                Carrito
                {mounted && totalItems > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                    {totalItems}
                  </span>
                )}
              </Link>
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
