"use client";

import { motion } from "framer-motion";
import { X } from "@phosphor-icons/react";
import { useChatStore } from "@/lib/stores/chat-store";
import { FLOATING_GLASS_BTN } from "@/components/chat/OpenChatButton";
import AiOrb from "./AiOrb";

export default function ChatFAB() {
  const { isOpen, toggle } = useChatStore();

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
      onClick={toggle}
      className={`fixed bottom-6 right-6 md:hidden ${FLOATING_GLASS_BTN}`}
      aria-label={isOpen ? "Cerrar chat" : "Pedir con AI"}
    >
      {isOpen ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center md:h-6 md:w-6">
          <X className="h-5 w-5 text-foreground md:h-6 md:w-6" strokeWidth={2.25} />
        </span>
      ) : (
        <>
          <AiOrb state="idle" size={24} className="shrink-0" />
          <span className="tracking-tight">Pedir con AI</span>
        </>
      )}
    </motion.button>
  );
}
