"use client";

import { MessageCircle, X } from "lucide-react";
import { useChatStore } from "@/lib/stores/chat-store";

export default function ChatFAB() {
  const { isOpen, toggle } = useChatStore();

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-accent/40 active:scale-95"
      aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
    >
      {isOpen ? (
        <X className="h-6 w-6" />
      ) : (
        <MessageCircle className="h-6 w-6" />
      )}
    </button>
  );
}
