"use client";

import {
  useRef,
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  SpinnerGap,
  Tote,
  Sparkle,
  X,
  Gift,
  Leaf,
  Target,
  Briefcase,
  ImageSquare,
  Minus,
  Plus,
  Microphone,
} from "@phosphor-icons/react";
import { useChatStore } from "@/lib/stores/chat-store";
import { useQuoteStore } from "@/lib/stores/quote-store";
import { getLocalProduct } from "@/lib/engine/local-catalog";
import { getPriceForQuantity } from "@/lib/engine/pricing";
import { telegramUrl } from "@/lib/telegram";
import { AuthContext } from "@/lib/auth-context";
import { compressImageFile } from "@/lib/chat-image";
import {
  getSpeechRecognitionCtor,
  type SpeechRecognitionLike,
} from "@/lib/speech-recognition";
import AiOrb from "./AiOrb";
import type { OrbState } from "./AiOrb";

const SUGGESTIONS = [
  { icon: Target, label: "Armar un combo para mi evento" },
  { icon: Leaf, label: "Buscar productos eco" },
  { icon: Gift, label: "Regalos para fin de ano" },
  { icon: Briefcase, label: "Kits de bienvenida" },
];

const IMG_PLACEHOLDER =
  "Qué productos del catálogo se parecen a esta foto? Necesito armar un pedido.";

const ROTATING_STATUS = [
  "Analizando tu pedido...",
  "Viendo cantidades y mínimos...",
  "Buscando el mejor fit...",
  "Revisando precios por volumen...",
];

function getLastUserSearchHint(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const text = m.parts
      .filter(
        (p): p is Extract<typeof p, { type: "text" }> => p.type === "text",
      )
      .map((p) => p.text)
      .join(" ")
      .trim();
    if (text && text !== IMG_PLACEHOLDER) {
      return text.slice(0, 140);
    }
  }
  return "";
}

const transport = new DefaultChatTransport({ api: "/api/chat" });

export default function ChatModal() {
  const { client } = useContext(AuthContext);
  const isOpen = useChatStore((s) => s.isOpen);
  const initialTurnEpoch = useChatStore((s) => s.initialTurnEpoch);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [pendingImages, setPendingImages] = useState<
    { url: string; file: File }[]
  >([]);
  const [presetThinking, setPresetThinking] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const speechSupported = typeof window !== "undefined" && !!getSpeechRecognitionCtor();

  const { messages, sendMessage, setMessages, status } = useChat({
    transport,
    onError: () => {
      // Reset status so the UI doesn't stay stuck on "thinking"
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const composerBusy = isLoading || presetThinking;
  const hasConversation = messages.length > 0;
  const orbState: OrbState =
    presetThinking || status === "submitted"
      ? "thinking"
      : status === "streaming"
        ? "streaming"
        : "idle";

  const greetingName = client?.name?.trim();
  const welcomeTitle = greetingName
    ? `Hola, ${greetingName.split(/\s+/)[0]}`
    : "Hola!";

  const catalogSearchHint = useMemo(
    () => getLastUserSearchHint(messages),
    [messages],
  );
  const catalogHref =
    catalogSearchHint.length > 0
      ? `/catalogo?search=${encodeURIComponent(catalogSearchHint)}`
      : "/catalogo";

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const state = useChatStore.getState();
    const msg = state.initialMessage;
    if (!msg) return;

    const preset = state.initialPresetAssistant;
    const capturedEpoch = state.initialTurnEpoch;

    if (preset) {
      if (state.presetDelayActive) return;
      useChatStore.setState({ presetDelayActive: true });
      setPresetThinking(true);

      const userId = crypto.randomUUID();
      const assistantId = crypto.randomUUID();
      const userMsg = {
        id: userId,
        role: "user" as const,
        parts: [{ type: "text" as const, text: msg }],
      };
      const assistantMsg = {
        id: assistantId,
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: preset }],
      };

      setMessages([userMsg]);

      const timer = window.setTimeout(() => {
        useChatStore.setState({
          presetDelayActive: false,
          initialMessage: null,
          initialPresetAssistant: null,
        });
        if (useChatStore.getState().initialTurnEpoch !== capturedEpoch) {
          setPresetThinking(false);
          return;
        }
        setMessages([userMsg, assistantMsg]);
        setPresetThinking(false);
      }, 3000);

      return () => {
        window.clearTimeout(timer);
        useChatStore.setState({ presetDelayActive: false });
        setPresetThinking(false);
      };
    }

    useChatStore.setState({
      initialMessage: null,
      initialPresetAssistant: null,
    });
    sendMessage({ text: msg });
  }, [isOpen, initialTurnEpoch, sendMessage, setMessages]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const toggleMic = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    if (isListening) {
      stopListening();
      return;
    }

    const rec = new Ctor();
    rec.lang = "es-AR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          transcript += e.results[i][0].transcript;
        }
      }
      if (transcript.trim()) {
        setInputValue((prev) =>
          prev.trim() ? `${prev.trim()} ${transcript.trim()}` : transcript.trim(),
        );
      }
    };
    rec.onerror = () => stopListening();
    rec.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
    } catch {
      stopListening();
    }
  }, [isListening, stopListening]);

  async function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list?.length) return;
    const added: { url: string; file: File }[] = [];
    for (let i = 0; i < Math.min(list.length, 4); i++) {
      const raw = list[i];
      if (!raw.type.startsWith("image/")) continue;
      try {
        const file = await compressImageFile(raw);
        added.push({ url: URL.createObjectURL(file), file });
      } catch {
        added.push({ url: URL.createObjectURL(raw), file: raw });
      }
    }
    setPendingImages((prev) => [...prev, ...added].slice(0, 4));
    e.target.value = "";
  }

  function removePendingAt(index: number) {
    setPendingImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return next;
    });
  }

  function submitMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if (composerBusy) return;

    const text = inputValue.trim();
    const hasFiles = pendingImages.length > 0;
    if (!text && !hasFiles) return;

    if (hasFiles) {
      const dt = new DataTransfer();
      pendingImages.forEach((p) => dt.items.add(p.file));
      sendMessage({
        text: text || IMG_PLACEHOLDER,
        files: dt.files,
      });
      pendingImages.forEach((p) => URL.revokeObjectURL(p.url));
      setPendingImages([]);
    } else {
      sendMessage({ text: text });
    }
    setInputValue("");
  }

  function handleSuggestionSend(label: string) {
    if (composerBusy) return;
    sendMessage({ text: label.trim() });
  }

  const canSend =
    (inputValue.trim().length > 0 || pendingImages.length > 0) && !composerBusy;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 backdrop-blur-md"
            onClick={useChatStore.getState().close}
          />

          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed bottom-24 left-1/2 z-50 flex w-[calc(100%-1.25rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-3xl border border-white/50 bg-white/75 shadow-2xl shadow-black/10 backdrop-blur-xl sm:bottom-24"
            style={{ maxHeight: "min(680px, 85vh)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <AnimatePresence>
                {hasConversation && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2.5"
                  >
                    <div className="flex h-9 w-9 items-center justify-center">
                      <AiOrb state={orbState} size={28} />
                    </div>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="text-sm font-semibold tracking-tight text-foreground"
                    >
                      Asistente Diezypunto
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                type="button"
                onClick={useChatStore.getState().close}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.06] text-foreground/70 transition-colors hover:bg-black/10 hover:text-foreground"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-white/50 mx-2 px-4 pt-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {!hasConversation ? (
                  <div className="flex flex-col items-center pt-2 pb-4 text-center">
                    <AiOrb state={orbState} size={200} className="mx-auto" />

                    <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
                      {welcomeTitle}
                    </h2>
                    <p className="mt-1.5 text-sm text-muted">
                      En qué te puedo ayudar hoy?
                    </p>

                    <div className="mt-6 flex w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => handleSuggestionSend(s.label)}
                          disabled={composerBusy}
                          className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-black/[0.08] bg-white/90 px-3.5 py-2.5 text-left text-xs font-medium text-foreground/85 shadow-sm transition-all hover:border-accent/40 hover:bg-accent-light/80 hover:text-accent disabled:opacity-50"
                        >
                          <s.icon className="h-3.5 w-3.5 shrink-0 text-accent" />
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    {messages.map((message, index) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        deferAssistantContent={
                          message.role === "assistant" &&
                          isLoading &&
                          index === messages.length - 1
                        }
                      />
                    ))}
                    {(isLoading || presetThinking) &&
                      messages[messages.length - 1]?.role !== "assistant" &&
                      (presetThinking ? (
                        <AssistantStreamingPlaceholder />
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <SpinnerGap className="h-3 w-3 animate-spin" />
                          Pensando...
                        </div>
                      ))}
                    {messages.some((m) => m.role === "assistant") && (
                      <div className="pt-2">
                        <Link
                          href={catalogHref}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent underline-offset-2 hover:underline"
                          onClick={() => useChatStore.getState().close()}
                        >
                          Ver más opciones en el catálogo
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="relative border-t border-white/40 bg-white/50 px-3 pb-3 pt-1.5 mt-2">
                {pendingImages.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {pendingImages.map((p, i) => (
                      <div
                        key={p.url + i}
                        className="relative h-14 w-14 overflow-hidden rounded-lg border border-border bg-surface"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePendingAt(i)}
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-white shadow"
                          aria-label="Quitar imagen"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={submitMessage}>
                  <div className="rounded-2xl border border-black/[0.08] bg-white/90 p-3 shadow-inner">
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (canSend) submitMessage();
                        }
                      }}
                      placeholder="Contame tu evento o pedido..."
                      disabled={composerBusy}
                      rows={hasConversation ? 2 : 3}
                      className="w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted/70 disabled:opacity-60"
                    />

                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-black/[0.06] pt-2">
                      <div className="flex items-center gap-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={onPickImages}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={composerBusy || pendingImages.length >= 4}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-black/[0.06] hover:text-foreground disabled:opacity-40"
                          aria-label="Adjuntar imagen"
                          title="Adjuntar imagen"
                        >
                          <ImageSquare className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={toggleMic}
                          disabled={composerBusy || !speechSupported}
                          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                            isListening
                              ? "bg-red-500/15 text-red-600"
                              : "text-foreground/60 hover:bg-black/[0.06] hover:text-foreground"
                          } disabled:opacity-40`}
                          aria-label={
                            speechSupported
                              ? isListening
                                ? "Detener dictado"
                                : "Dictar con el micrófono"
                              : "Dictado no disponible en este navegador"
                          }
                          title={
                            speechSupported
                              ? "Dictado (es-AR)"
                              : "Probá con Chrome o Edge"
                          }
                        >
                          <Microphone className={`h-5 w-5 ${isListening ? "animate-pulse" : ""}`} />
                        </button>
                        <button
                          type="submit"
                          disabled={!canSend}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#3BB5E8] text-white shadow-md shadow-accent/30 transition-all hover:opacity-95 disabled:opacity-35"
                          aria-label="Enviar"
                        >
                          {isLoading ? (
                            <SpinnerGap className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowUp className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                <div className="mt-2 flex items-center justify-center gap-2">
                  <Sparkle className="h-3 w-3 text-accent/50" />
                  <a
                    href={telegramUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-muted transition-colors hover:text-accent"
                  >
                    Prefiero hablar con una persona
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


function AssistantStreamingPlaceholder() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setIdx((j) => (j + 1) % ROTATING_STATUS.length),
      2200,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[90%] items-center gap-3 rounded-2xl rounded-bl-md border border-border/60 bg-surface px-3 py-3">
        <div className="shrink-0">
          <AiOrb state="thinking" size={32} />
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-medium text-foreground/90"
          >
            {ROTATING_STATUS[idx]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ChatMessage({
  message,
  deferAssistantContent = false,
}: {
  message: UIMessage;
  deferAssistantContent?: boolean;
}) {
  const isUser = message.role === "user";

  const textContent = message.parts
    .filter(
      (part): part is Extract<typeof part, { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join("");

  const fileParts = message.parts.filter(
    (part): part is { type: "file"; url: string; mediaType: string } =>
      part.type === "file",
  );

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] space-y-2">
          {fileParts.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1.5">
              {fileParts.map((fp, i) =>
                fp.mediaType.startsWith("image/") ? (
                  <div
                    key={i}
                    className="max-h-40 overflow-hidden rounded-xl border border-white/30 bg-white/20"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fp.url}
                      alt="Adjunto"
                      className="max-h-40 w-auto max-w-[200px] object-contain"
                    />
                  </div>
                ) : (
                  <div
                    key={i}
                    className="rounded-lg border border-white/20 bg-accent/15 px-2 py-1 text-[10px] text-white/90"
                  >
                    Archivo
                  </div>
                ),
              )}
            </div>
          )}
          {textContent ? (
            <div className="rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm text-white">
              {textContent === IMG_PLACEHOLDER
                ? "Foto adjunta — ayudame con el pedido"
                : textContent}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (deferAssistantContent) {
    return <AssistantStreamingPlaceholder />;
  }

  const parsed = parseProductTags(textContent);

  return (
    <motion.div
      className="flex justify-start"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="max-w-[96%] space-y-2.5">
        {parsed.map((part, i) => {
          if (part.type === "text" && part.text.trim()) {
            return (
              <div
                key={i}
                className="rounded-2xl rounded-bl-md bg-surface px-4 py-2.5 text-sm whitespace-pre-wrap text-foreground"
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
    </motion.div>
  );
}

interface ProductProps {
  id: string;
  title: string;
  price: string;
  image: string;
  category: string;
  suggested_qty?: string;
}

function InlineProductCard({
  id,
  title,
  price,
  image,
  category,
  suggested_qty: suggestedQtyStr,
}: ProductProps) {
  const addItem = useQuoteStore((s) => s.addItem);
  const product = getLocalProduct(id);
  const minQty = 1;
  const suggestedNum = suggestedQtyStr ? parseInt(suggestedQtyStr, 10) : NaN;
  const initialQty =
    Number.isFinite(suggestedNum) && suggestedNum >= minQty ? suggestedNum : minQty;
  const [qty, setQty] = useState<number | "">(initialQty);

  const listPrice = product?.list_price ?? product?.price_max ?? product?.price ?? null;
  const provider = product?.source ?? "zecat";
  const cat = product?.subcategory || product?.category || category;

  const unitFinal = useMemo(() => {
    if (product && listPrice != null && listPrice > 0) {
      return getPriceForQuantity(listPrice, qty || minQty, cat, provider).finalPrice;
    }
    if (price && price !== "Consultar" && !isNaN(Number(price))) {
      return Number(price);
    }
    return null;
  }, [product, listPrice, qty, cat, price, provider]);

  function handleAdd() {
    if (!product) return;
    addItem(product, qty || minQty);
  }

  function bump(delta: number) {
    setQty((current) => Math.max(minQty, (current || minQty) + delta));
  }

  const productHref = id ? `/producto/${encodeURIComponent(id)}` : "";
  const productHeader = (
    <>
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/60 bg-white/70 backdrop-blur-sm">
        {image ? (
          <img
            src={image}
            alt=""
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted/30">
            <Tote className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-accent group-hover:underline">
          {title}
        </p>
        {unitFinal != null ? (
          <p className="mt-1 text-base font-bold text-foreground">
            ${unitFinal.toLocaleString("es-AR")}{" "}
            <span className="font-normal text-muted">c/u + IVA</span>
          </p>
        ) : price === "Consultar" ? (
          <p className="text-xs font-medium text-muted">Consultar precio</p>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="w-full rounded-2xl border border-white/65 bg-white/62 p-3 shadow-[0_10px_26px_rgba(15,23,42,0.1)] backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        {productHref ? (
          <Link
            href={productHref}
            className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => useChatStore.getState().close()}
            aria-label={`Ver ficha: ${title}`}
          >
            {productHeader}
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">{productHeader}</div>
        )}
      </div>
      <div className="mt-2.5 flex items-center justify-end gap-2">
        <div className="relative z-10 flex items-center rounded-xl border border-white/65 bg-white/75 backdrop-blur-sm">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              bump(-1);
            }}
            className="min-h-[44px] px-3 py-1.5 text-muted transition-colors hover:bg-white"
            aria-label="Disminuir cantidad"
            disabled={(qty || minQty) <= minQty}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={qty}
            onChange={(e) => {
              e.stopPropagation();
              const raw = e.target.value;
              if (raw === "") { setQty(""); return; }
              const v = parseInt(raw);
              if (!isNaN(v) && v >= minQty) setQty(v);
            }}
            onBlur={() => { if (qty === "" || qty < minQty) setQty(minQty); }}
            onClick={(e) => e.stopPropagation()}
            className="w-8 border-x border-white/65 bg-transparent py-1.5 text-center text-sm font-semibold tabular-nums outline-none"
            aria-label="Cantidad"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              bump(1);
            }}
            className="min-h-[44px] px-3 py-1.5 text-muted transition-colors hover:bg-white"
            aria-label="Aumentar cantidad"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAdd();
          }}
          disabled={!product}
          className="relative z-10 inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-white/35 bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-[0_8px_18px_rgba(89,198,242,0.35)] disabled:opacity-40"
          title="Agregar al carrito"
        >
          <Tote className="h-4 w-4" />
          Agregar
        </button>
      </div>
    </div>
  );
}

type ParsedPart =
  | { type: "text"; text: string }
  | { type: "product"; props: ProductProps };

function parseProductTags(content: string): ParsedPart[] {
  const parts: ParsedPart[] = [];
  const regex = /<product\s+([\s\S]*?)\/>/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        text: content.slice(lastIndex, match.index),
      });
    }

    const attrs = match[1];
    const id = attrs.match(/id="([^"]*)"/)?.[1] || "";
    const title = attrs.match(/title="([^"]*)"/)?.[1] || "";
    const price = attrs.match(/price="([^"]*)"/)?.[1] || "";
    const image = attrs.match(/image="([^"]*)"/)?.[1] || "";
    const category = attrs.match(/category="([^"]*)"/)?.[1] || "";
    const suggested_qty = attrs.match(/suggested_qty="([^"]*)"/)?.[1];

    parts.push({
      type: "product",
      props: {
        id,
        title,
        price,
        image,
        category,
        ...(suggested_qty ? { suggested_qty } : {}),
      },
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", text: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", text: content }];
}
