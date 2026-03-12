"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAdvisorStore } from "@/lib/stores/advisor-store";
import AdvisorChat from "./AdvisorChat";

export default function AdvisorDrawer() {
  const { isOpen, close } = useAdvisorStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-black/30"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl sm:w-[420px]"
          >
            {/* Close button */}
            <div className="flex items-center justify-end px-5 pt-5">
              <button
                onClick={close}
                className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat content */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <AdvisorChat />
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-3">
              <p className="text-center text-[10px] text-muted">
                Powered by Claude &middot; Las recomendaciones son orientativas
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
