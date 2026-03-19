"use client";

import { useRef, useEffect, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, ShoppingBag, Sparkles } from "lucide-react";
import { useChatStore } from "@/lib/stores/chat-store";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { getLocalProduct } from "@/lib/engine/local-catalog";

const QUICK_PROMPTS = [
  "Evento corporativo",
  "Regalos fin de año",
  "Bienvenida nuevos empleados",
  "Merchandising de marca",
  "Productos eco",
];

const transport = new DefaultChatTransport({ api: "/api/chat" });

export default function ChatDrawer() {
  const { isOpen } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");

  const { messages, sendMessage, status } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  function handleSend(text: string) {
    if (!text.trim() || isLoading) return;
    sendMessage({ text: text.trim() });
    setInputValue("");
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSend(inputValue);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (mobile) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 lg:hidden"
            onClick={useChatStore.getState().close}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="text-sm font-semibold">Asistente Diezypunto</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Sparkles className="mb-3 h-8 w-8 text-accent/50" />
                  <p className="text-sm font-medium text-foreground">
                    ¡Hola! ¿Qué necesitás?
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Contame sobre tu evento o buscá productos
                  </p>

                  {/* Quick prompts */}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSend(prompt)}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Pensando...
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleFormSubmit}
              className="border-t border-border px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribí lo que necesitás..."
                  disabled={isLoading}
                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted/60 focus:border-accent disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="rounded-xl bg-accent p-2.5 text-white transition-all hover:bg-accent-hover disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  // Extract text from message parts (v6 API)
  const textContent = message.parts
    .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("");

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm text-white">
          {textContent}
        </div>
      </div>
    );
  }

  // Parse <product> tags from assistant text and render inline cards
  const parsed = parseProductTags(textContent);

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-2">
        {parsed.map((part, i) => {
          if (part.type === "text" && part.text.trim()) {
            return (
              <div
                key={i}
                className="rounded-2xl rounded-bl-md bg-surface px-4 py-2.5 text-sm text-foreground whitespace-pre-wrap"
              >
                {part.text.trim()}
              </div>
            );
          }
          if (part.type === "product") {
            return <InlineProductCard key={i} {...part.props} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

interface ProductProps {
  id: string;
  title: string;
  price: string;
  image: string;
  category: string;
}

function InlineProductCard({ id, title, price, image, category }: ProductProps) {
  const addItem = useQuoteStore((s) => s.addItem);

  function handleAdd() {
    const product = getLocalProduct(id);
    if (product) {
      addItem(product, 10);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-2.5">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-contain p-1" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted/30">
            <ShoppingBag className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{title}</p>
        <p className="text-[10px] text-muted">{category}</p>
        {price && price !== "null" && (
          <p className="text-xs font-bold text-accent">
            ${Number(price).toLocaleString("es-AR")}{" "}
            <span className="font-normal text-muted">+ IVA</span>
          </p>
        )}
      </div>
      <button
        onClick={handleAdd}
        className="shrink-0 rounded-lg bg-accent p-1.5 text-white transition-all hover:bg-accent-hover"
        title="Agregar al carrito"
      >
        <ShoppingBag className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

type ParsedPart =
  | { type: "text"; text: string }
  | { type: "product"; props: ProductProps };

function parseProductTags(content: string): ParsedPart[] {
  const parts: ParsedPart[] = [];
  const regex = /<product\s+([^/]*?)\/>/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", text: content.slice(lastIndex, match.index) });
    }

    const attrs = match[1];
    const id = attrs.match(/id="([^"]*)"/)?.[1] || "";
    const title = attrs.match(/title="([^"]*)"/)?.[1] || "";
    const price = attrs.match(/price="([^"]*)"/)?.[1] || "";
    const image = attrs.match(/image="([^"]*)"/)?.[1] || "";
    const category = attrs.match(/category="([^"]*)"/)?.[1] || "";

    parts.push({ type: "product", props: { id, title, price, image, category } });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", text: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", text: content }];
}
