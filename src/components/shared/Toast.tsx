"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type ToastVariant = "default" | "error";

interface ToastState {
  message: string | null;
  variant: ToastVariant;
  link?: { label: string; href: string };
  show: () => void;
  hide: () => void;
  toast: (message: string, link?: { label: string; href: string }) => void;
  toastError: (message: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  variant: "default",
  link: undefined,
  show: () => {},
  hide: () => set({ message: null, variant: "default", link: undefined }),
  toast: (message, link) => set({ message, variant: "default", link }),
  toastError: (message) => set({ message, variant: "error", link: undefined }),
}));

export default function Toast() {
  const { message, variant, link, hide } = useToastStore();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, 2500);
    return () => clearTimeout(timer);
  }, [message, hide]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className={`flex items-center gap-3 rounded-xl px-5 py-3 text-sm text-white shadow-lg ${variant === "error" ? "bg-red-600" : "bg-foreground"}`}>
            <span>{message}</span>
            {link && (
              <Link
                href={link.href}
                onClick={hide}
                className="whitespace-nowrap font-medium text-accent hover:underline"
              >
                {link.label}
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
