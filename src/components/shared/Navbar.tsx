"use client";

import { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  List,
  X,
  Tote,
  MagnifyingGlass,
  UserCircle,
  SquaresFour,
} from "@phosphor-icons/react";
import AiOrb from "@/components/chat/AiOrb";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { useAuth } from "@/lib/hooks/use-auth";
import { useHasMounted } from "@/lib/hooks/use-has-mounted";
import { useChatStore } from "@/lib/stores/chat-store";

const CATEGORIES = [
  { label: "Todos", slug: "" },
  { label: "Escritura", slug: "Escritura" },
  { label: "Bolsos y Mochilas", slug: "Bolsos y Mochilas" },
  { label: "Drinkware", slug: "Drinkware" },
  { label: "Hogar y Tiempo Libre", slug: "Hogar y Tiempo Libre" },
  { label: "Tecnología", slug: "Tecnología" },
  { label: "Oficina", slug: "Oficina" },
  { label: "Llaveros", slug: "Llaveros" },
  { label: "Cuadernos", slug: "Cuadernos" },
  { label: "Cocina", slug: "Cocina" },
  { label: "Sustentables", slug: "Sustentables" },
  { label: "Gorros", slug: "Gorros" },
  { label: "Indumentaria", slug: "Apparel" },
  { label: "Paraguas", slug: "Paraguas" },
  { label: "Mates y Termos", slug: "Mates, termos y materas" },
  { label: "Verano", slug: "Verano" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mounted = useHasMounted();
  const totalItems = useQuoteStore((s) => s.totalItems());
  const { client } = useAuth();
  const toggleChat = useChatStore((s) => s.toggle);
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isPortal = pathname.startsWith("/portal");
  const showCategories =
    pathname === "/" || pathname.startsWith("/catalogo");
  const hideCategories = !showCategories;

  const isActiveCategory = useCallback(
    (slug: string) => {
      const decoded = decodeURIComponent(pathname);
      if (slug === "") return decoded === "/catalogo";
      return decoded === `/catalogo/${slug}`;
    },
    [pathname]
  );

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchQuery("");
    setSearchFocused(false);
    setMobileSearchOpen(false);
    setMobileOpen(false);
    searchInputRef.current?.blur();
    router.push(`/catalogo?search=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Spacer — portal handles its own */}
      {!isPortal && (
        <div className={hideCategories ? "pt-16" : "pt-16 lg:pt-[96px]"} />
      )}

      {/* ── Desktop category chips ── below navbar, hides on scroll */}
      {!hideCategories && (
        <div
          className={`fixed left-0 right-0 z-40 hidden lg:block bg-white border-b border-border/40 transition-all duration-300 ${
            scrolled
              ? "top-0 -translate-y-full opacity-0 pointer-events-none"
              : "top-16 translate-y-0 opacity-100"
          }`}
        >
          <div className="flex items-center justify-between px-6 lg:px-10 py-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const active = isActiveCategory(cat.slug);
              const href =
                cat.slug === ""
                  ? "/catalogo"
                  : `/catalogo/${encodeURIComponent(cat.slug)}`;
              return (
                <Link
                  key={cat.slug}
                  href={href}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-all ${
                    active
                      ? "bg-foreground text-white"
                      : "bg-black/[0.05] text-foreground/70 hover:bg-black/[0.09]"
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main navbar ── always fixed at top */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "bg-white/95 shadow-[0_1px_3px_rgba(0,0,0,0.05)] backdrop-blur-xl"
            : "bg-white/80 backdrop-blur-md"
        }`}
      >
        <div className="flex h-16 items-center gap-4 px-4 lg:px-10">
          {/* Logo */}
          <Link href="/" className="shrink-0 transition-opacity hover:opacity-80">
            <Image
              src="/logo-diezypunto.webp"
              alt="diezypunto"
              width={130}
              height={40}
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop nav items */}
          <div className="hidden flex-1 items-center justify-end gap-1 md:flex">
              {/* Inline search — left of Pedir con AI */}
              <form
                onSubmit={handleSearch}
                className={`relative transition-all duration-300 ${
                  searchFocused ? "w-72" : "w-48"
                }`}
              >
                <MagnifyingGlass className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/50" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Buscar..."
                  className={`w-full rounded-full py-1.5 pl-8 pr-3 text-sm text-foreground outline-none transition-all placeholder:text-muted/40 ${
                    searchFocused
                      ? "bg-white ring-1 ring-accent/30 shadow-sm"
                      : "bg-surface/60 hover:bg-surface"
                  }`}
                />
              </form>
              {/* Pedir con AI — spinning neon border */}
              <button
                onClick={toggleChat}
                className="ai-glow-btn group relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground cursor-pointer"
              >
                <span className="pointer-events-none absolute inset-0 rounded-full ai-glow-border" />
                <AiOrb state="idle" size={20} className="shrink-0" />
                <span className="relative">Pedir con AI</span>
              </button>
              <Link
                href="/catalogo"
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                <SquaresFour className="h-4 w-4" />
                Catálogo
              </Link>
              {client && (
                <Link
                  href="/portal"
                  className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
                >
                  <UserCircle className="h-4 w-4" />
                  Portal
                </Link>
              )}
              <Link
                href="/carrito"
                className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                <Tote className="h-[18px] w-[18px]" />
                Carrito
                {mounted && totalItems > 0 && (
                  <span className="absolute -right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>

          {/* Mobile right actions */}
          <div className="flex items-center gap-1 md:hidden ml-auto">
            <button
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                setMobileOpen(false);
              }}
              aria-label="Buscar"
              className="rounded-full p-2 text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              <MagnifyingGlass className="h-5 w-5" />
            </button>
            <Link
              href="/carrito"
              className="relative rounded-full p-2 text-muted transition-colors hover:bg-surface hover:text-foreground"
              aria-label="Carrito"
            >
              <Tote className="h-5 w-5" />
              {mounted && totalItems > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-bold text-white">
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
              className="rounded-full p-2 text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <List className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile search ── */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border/50 md:hidden"
            >
              <form onSubmit={handleSearch} className="px-4 py-3">
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar productos..."
                    autoFocus
                    className="w-full rounded-full bg-surface py-2.5 pl-9 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted/40 focus:bg-white focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border/50 bg-white md:hidden"
            >
              <div className="px-5 py-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted/60">
                  Categorías
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.filter((c) => c.slug !== "").map((cat) => {
                    const active = isActiveCategory(cat.slug);
                    return (
                      <Link
                        key={cat.slug}
                        href={`/catalogo/${encodeURIComponent(cat.slug)}`}
                        onClick={() => setMobileOpen(false)}
                        className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          active
                            ? "bg-accent-light font-medium text-accent"
                            : "text-foreground hover:bg-surface"
                        }`}
                      >
                        {cat.label}
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-col gap-1 border-t border-border/50 pt-4">
                  <Link
                    href="/catalogo"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
                  >
                    Ver todo el catálogo
                  </Link>
                  <Link
                    href="/carrito"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
                  >
                    <Tote className="h-4 w-4" />
                    Carrito
                    {mounted && totalItems > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                  {client && (
                    <Link
                      href="/portal"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-accent transition-colors hover:bg-accent-light"
                    >
                      <UserCircle className="h-4 w-4" />
                      Mi Portal
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

    </>
  );
}
