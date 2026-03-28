"use client";

import { Minus, Plus } from "@phosphor-icons/react";
import { MAX_QTY } from "@/lib/stores/quote-store";

type StepperSize = "xs" | "sm" | "md";

interface QuantityStepperProps {
  value: number | "";
  onChange: (v: number | "") => void;
  min: number;
  max?: number;
  size?: StepperSize;
  glass?: boolean;
  className?: string;
}

const sizes = {
  xs: {
    bL: "rounded-l-lg px-1.5 py-1",
    bR: "rounded-r-lg px-1.5 py-1",
    ico: "h-3 w-3",
    inp: "w-7 py-1 text-[11px]",
    wrap: "rounded-lg",
  },
  sm: {
    bL: "rounded-l-xl px-2 py-1.5 sm:px-2.5 sm:py-2",
    bR: "rounded-r-xl px-2 py-1.5 sm:px-2.5 sm:py-2",
    ico: "h-3 w-3 sm:h-3.5 sm:w-3.5",
    inp: "w-8 py-1.5 text-xs sm:w-10 sm:py-2 sm:text-sm",
    wrap: "rounded-xl",
  },
  md: {
    bL: "rounded-l-xl px-3 py-2.5",
    bR: "rounded-r-xl px-3 py-2.5",
    ico: "h-4 w-4",
    inp: "w-16 py-2.5 text-sm",
    wrap: "rounded-xl",
  },
};

export default function QuantityStepper({
  value,
  onChange,
  min,
  max = MAX_QTY,
  size = "md",
  glass = false,
  className = "",
}: QuantityStepperProps) {
  const s = sizes[size];
  const effective = value || min;
  const border = glass ? "border-white/60" : "border-border";
  const wrapBg = glass ? "bg-white/70 backdrop-blur-sm" : "";
  const inputBg = glass ? "bg-transparent" : "bg-white";
  const hover = glass ? "hover:bg-white/80" : "hover:bg-surface";

  return (
    <div
      className={`flex items-center ${s.wrap} border ${border} ${wrapBg} ${className}`}
      role="group"
      aria-label="Cantidad"
    >
      <button
        onClick={() => onChange(Math.max(min, effective - 1))}
        className={`${s.bL} text-muted transition-colors ${hover}`}
        aria-label="Disminuir cantidad"
      >
        <Minus className={s.ico} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") { onChange(""); return; }
          const v = parseInt(raw);
          // Allow intermediate values (e.g. typing "5" when min=50) — min enforced on blur
          if (!isNaN(v) && v >= 1 && v <= max) onChange(v);
        }}
        onKeyDown={(e) => {
          // Prevent Cmd+Backspace from triggering browser back navigation
          if (e.key === "Backspace" && (e.metaKey || e.ctrlKey)) e.preventDefault();
        }}
        onBlur={() => { if (value === "" || value < min) onChange(min); }}
        className={`border-x ${border} ${inputBg} ${s.inp} text-center font-medium tabular-nums outline-none`}
        aria-label="Cantidad"
      />
      <button
        onClick={() => {
          const next = effective + 1;
          if (next > max) return;
          onChange(next);
        }}
        className={`${s.bR} text-muted transition-colors ${hover}`}
        aria-label="Aumentar cantidad"
      >
        <Plus className={s.ico} />
      </button>
    </div>
  );
}
