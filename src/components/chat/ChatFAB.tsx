"use client";

import { motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useChatStore } from "@/lib/stores/chat-store";

export default function ChatFAB() {
  const { isOpen, toggle } = useChatStore();

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-[#3BB5E8] px-4 py-3.5 text-white shadow-lg shadow-accent/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-accent/40 active:scale-95"
      aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
    >
      {isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <>
          <MessageCircle className="h-5 w-5" />
          <span className="hidden text-sm font-medium sm:inline">
            Hablar con AI
          </span>
        </>
      )}
    </motion.button>
  );
}
