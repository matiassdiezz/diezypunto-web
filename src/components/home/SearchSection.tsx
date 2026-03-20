"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkle,
  ArrowUp,
  ArrowRight,
  ImageSquare,
  Microphone,
  X,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import ScrollReveal from "../shared/ScrollReveal";
import {
  getSpeechRecognitionCtor,
  type SpeechRecognitionLike,
} from "@/lib/speech-recognition";
import { compressImageFile } from "@/lib/chat-image";
import { telegramUrl } from "@/lib/telegram";

const EXAMPLES = [
  "100 botellas termicas eco para un evento corporativo",
  "kits de bienvenida premium para nuevos empleados",
  "mochilas con bordado para el equipo de ventas",
  "regalos ejecutivos para fin de ano, presupuesto alto",
];

// Offset dot-grid — looks like a neural network / constellation
function buildAsciiGrid(): string {
  const rows: string[] = [];
  for (let i = 0; i < 18; i++) {
    const offset = i % 2 === 0 ? "" : "      ";
    rows.push(offset + "·           ".repeat(10));
  }
  return rows.join("\n");
}
const ASCII_BG = buildAsciiGrid();

export default function SearchSection() {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [pendingImages, setPendingImages] = useState<
    { url: string; file: File }[]
  >([]);
  const [isListening, setIsListening] = useState(false);
  const router = useRouter();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  useEffect(() => {
    setSpeechSupported(!!getSpeechRecognitionCtor());
  }, []);

  function navigateToSearch(query: string) {
    router.push(`/catalogo?search=${encodeURIComponent(query)}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    pendingImages.forEach((p) => URL.revokeObjectURL(p.url));
    setPendingImages([]);
    navigateToSearch(q);
    setInput("");
  }

  function handleExample(example: string) {
    navigateToSearch(example);
  }

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
        setInput((prev) =>
          prev.trim()
            ? `${prev.trim()} ${transcript.trim()}`
            : transcript.trim(),
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

  return (
    <section
      id="ai-search"
      className="relative scroll-mt-20 overflow-hidden bg-white py-16"
    >
      {/* ASCII background texture */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        aria-hidden="true"
      >
        <pre className="whitespace-pre font-mono text-[11px] leading-[2.2] text-foreground/[0.05]">
          {ASCII_BG}
        </pre>
      </div>

      <div className="relative z-10 px-6 lg:px-16">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-accent">
              <Sparkle className="h-4 w-4" />
              Busqueda inteligente
            </div>
            <h2 className="mt-3 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Pedi con <span className="gradient-text-accent">AI</span>
            </h2>
            <p className="mt-3 text-center text-muted">
              Escribi lo que necesitas como si le hablaras a una persona
              <br className="hidden sm:block" />y te mostramos las mejores
              opciones al instante
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mx-auto mt-8 max-w-2xl">
            <form onSubmit={handleSubmit} className="relative">
              <motion.div
                className="search-glow-wrapper"
                animate={{
                  scale: focused ? 1.02 : 1,
                  boxShadow: focused
                    ? "0 8px 40px rgba(89,198,242,0.2)"
                    : "0 4px 24px rgba(89,198,242,0.08)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div className="relative z-10 rounded-2xl border border-border bg-white">
                  {/* Pending images preview */}
                  {pendingImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-4 pt-4">
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

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    rows={3}
                    placeholder="Describe lo que necesitas..."
                    className="w-full resize-none bg-transparent px-5 py-4 text-base text-foreground outline-none focus:outline-none focus:ring-0 placeholder:text-gray-300 sm:text-lg"
                  />

                  {/* Controls row */}
                  <div className="flex items-center justify-between gap-2 border-t border-black/[0.06] px-4 py-2">
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
                        disabled={pendingImages.length >= 4}
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
                        disabled={!speechSupported}
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
                        <Microphone
                          className={`h-5 w-5 ${isListening ? "animate-pulse" : ""}`}
                        />
                      </button>
                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#3BB5E8] text-white shadow-md shadow-accent/30 transition-all hover:opacity-95 disabled:opacity-35"
                        aria-label="Enviar"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </form>

            {/* Example chips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-8"
            >
              <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-gray-400">
                Proba con algo como
              </p>
              <div className="grid grid-cols-2 gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => handleExample(ex)}
                    className="group flex items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2.5 text-left text-xs leading-relaxed text-foreground/80 shadow-sm transition-all hover:border-accent/40 hover:bg-accent-light hover:text-accent hover:shadow-md md:px-4 md:py-3 md:text-sm"
                  >
                    <span className="flex-1">{ex}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:opacity-60" />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Telegram fallback link */}
            <div className="mt-4 flex items-center justify-center gap-2">
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
        </ScrollReveal>
      </div>
    </section>
  );
}
