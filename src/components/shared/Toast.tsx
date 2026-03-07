"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface ToastState {
  message: string | null;
  link?: { label: string; href: string };
  show: () => void;
  hide: () => void;
  toast: (message: string, link?: { label: string; href: string }) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  link: undefined,
  show: () => {},
  hide: () => set({ message: null, link: undefined }),
  toast: (message, link) => set({ message, link }),
}));

export default function Toast() {
  const { message, link, hide } = useToastStore();

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
          <div className="flex items-center gap-3 rounded-xl bg-foreground px-5 py-3 text-sm text-white shadow-lg">
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
