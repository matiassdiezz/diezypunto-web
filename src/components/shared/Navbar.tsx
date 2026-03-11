"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag } from "lucide-react";
import { useQuoteStore } from "@/lib/stores/quote-store";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catalogo" },
  { href: "/carrito", label: "Carrito" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const totalItems = useQuoteStore((s) => s.totalItems());

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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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
          <Link
            href="/carrito"
            className="relative flex items-center gap-1.5 rounded-full bg-[#59C6F2] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#3BB5E8]"
          >
            <ShoppingBag className="h-4 w-4" />
            Carrito
            {totalItems > 0 && (
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
