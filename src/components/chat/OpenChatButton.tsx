"use client";

import Image from "next/image";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** FAB / carrito flotante: misma base visual, tamaño mayor en desktop */
export const FLOATING_GLASS_BTN =
  "z-50 flex items-center rounded-full border border-black/10 bg-white/45 font-semibold text-foreground shadow-lg shadow-black/10 backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/55 hover:shadow-xl hover:shadow-black/10 active:scale-95 gap-2 px-4 py-3 text-sm md:gap-3 md:px-7 md:py-4 md:text-base";

/** Botón enviar búsqueda AI (esquina del textarea) */
export const OPEN_CHAT_SUBMIT_BTN_CLASS =
  "flex h-11 items-center gap-1 rounded-xl border border-black/10 bg-white/50 px-2.5 text-accent shadow-md shadow-black/5 backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/65 disabled:pointer-events-none disabled:opacity-20 md:h-12 md:gap-1.5 md:px-3.5";

type Variant = "glass" | "glassOnAccent";

const variants: Record<Variant, string> = {
  glass:
    "border-black/10 bg-white/45 text-foreground shadow-lg shadow-black/10 hover:bg-white/55 hover:shadow-xl",
  glassOnAccent:
    "border-white/35 bg-white/15 text-white shadow-lg shadow-black/20 hover:bg-white/25 hover:shadow-xl",
};

export function OpenChatSubmitOrb({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span
      className={`relative h-6 w-6 shrink-0 overflow-hidden rounded-full md:h-7 md:w-7 ${className}`}
    >
      <Image
        src="/orbe-diezypunto.png"
        alt=""
        fill
        className="object-cover object-center"
        sizes="28px"
      />
    </span>
  );
}

export type OpenChatButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  /** Orbe más chico (chips, CTAs secundarios) */
  compact?: boolean;
  children?: ReactNode;
};

/**
 * CTA consistente para abrir el asistente: vidrio + orbe Diezypunto.
 */
export function OpenChatButton({
  variant = "glass",
  compact = false,
  children,
  className = "",
  ...rest
}: OpenChatButtonProps) {
  const v = variants[variant];
  const orbBox = compact
    ? "h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]"
    : "h-5 w-5 md:h-6 md:w-6";

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-semibold backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35 cursor-pointer ${v} px-5 py-3 text-sm md:px-7 md:py-3.5 md:text-base ${className}`}
      {...rest}
    >
      <span className={`relative shrink-0 overflow-hidden rounded-full ${orbBox}`}>
        <Image
          src="/orbe-diezypunto.png"
          alt=""
          fill
          className="object-cover object-center"
          sizes="32px"
        />
      </span>
      {children}
    </button>
  );
}
