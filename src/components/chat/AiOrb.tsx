"use client";

import { motion } from "framer-motion";

export type OrbState = "idle" | "thinking" | "streaming";

/* ── Shape keyframes — subtle undulation near circle ─────────────── */
/* Values stay close to 50% (circle) for organic feel */

const SHAPES = [
  "52% 48% 46% 54% / 53% 47% 53% 47%",
  "47% 53% 52% 48% / 48% 54% 46% 52%",
  "54% 46% 48% 52% / 46% 52% 54% 48%",
  "48% 52% 53% 47% / 52% 47% 48% 53%",
  "51% 49% 47% 53% / 49% 53% 51% 49%",
  "52% 48% 46% 54% / 53% 47% 53% 47%",
];

const SHAPES_ALT = [
  "49% 51% 53% 47% / 47% 52% 48% 53%",
  "53% 47% 48% 52% / 52% 48% 53% 47%",
  "47% 53% 51% 49% / 54% 46% 49% 51%",
  "51% 49% 47% 53% / 48% 53% 52% 48%",
  "49% 51% 53% 47% / 47% 52% 48% 53%",
];

/* ── State configs ───────────────────────────────────────────────── */

const STATE_CFG: Record<
  OrbState,
  { morphDur: number; rotateDur: number; scale: number[]; scaleDur: number }
> = {
  idle: {
    morphDur: 10,
    rotateDur: 14,
    scale: [1, 1.015, 0.99, 1.01, 1],
    scaleDur: 8,
  },
  thinking: {
    morphDur: 5,
    rotateDur: 7,
    scale: [1, 1.03, 0.97, 1.02, 0.98, 1],
    scaleDur: 3.5,
  },
  streaming: {
    morphDur: 3,
    rotateDur: 4,
    scale: [1, 1.05, 0.95, 1.04, 0.97, 1.03, 1],
    scaleDur: 2,
  },
};

/* ── Main Component ──────────────────────────────────────────────── */

export default function AiOrb({
  state = "idle",
  size = 200,
  className,
}: {
  state?: OrbState;
  size?: number;
  className?: string;
}) {
  if (size < 50) {
    return <AiOrbMini state={state} size={size} className={className} />;
  }

  const cfg = STATE_CFG[state];
  const blur = Math.round(size * 0.13);

  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {/* Main morphing container */}
      <motion.div
        animate={{
          borderRadius: SHAPES,
          scale: cfg.scale,
        }}
        transition={{
          borderRadius: {
            duration: cfg.morphDur,
            repeat: Infinity,
            ease: "easeInOut",
          },
          scale: {
            duration: cfg.scaleDur,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius: SHAPES[0] }}
      >
        {/* Base gradient */}
        <div
          className="absolute"
          style={{
            inset: -size * 0.05,
            background: `radial-gradient(circle at 50% 50%,
              rgba(250,253,255,0.95) 0%,
              rgba(230,247,255,0.88) 45%,
              rgba(150,215,248,0.4) 80%,
              rgba(89,198,242,0.3) 100%)`,
          }}
        />

        {/* Primary rotating layer */}
        <motion.div
          animate={{
            rotate: 360,
            borderRadius: SHAPES_ALT,
          }}
          transition={{
            rotate: {
              duration: cfg.rotateDur,
              repeat: Infinity,
              ease: "linear",
            },
            borderRadius: {
              duration: cfg.morphDur * 1.3,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="absolute"
          style={{
            inset: -size * 0.22,
            background: `conic-gradient(from 0deg,
              rgba(89,198,242,0.4),
              rgba(130,210,245,0.3),
              transparent 38%,
              rgba(59,181,232,0.35),
              transparent 68%,
              rgba(120,200,240,0.28),
              rgba(89,198,242,0.4))`,
            filter: `blur(${blur}px)`,
          }}
        />

        {/* Secondary counter-rotating layer */}
        <motion.div
          animate={{
            rotate: -360,
          }}
          transition={{
            rotate: {
              duration: cfg.rotateDur * 1.6,
              repeat: Infinity,
              ease: "linear",
            },
          }}
          className="absolute"
          style={{
            inset: -size * 0.18,
            background: `conic-gradient(from 150deg,
              transparent,
              rgba(59,181,232,0.25),
              transparent 28%,
              rgba(100,195,240,0.2),
              transparent 58%,
              rgba(89,198,242,0.18),
              transparent 82%)`,
            filter: `blur(${blur * 1.3}px)`,
          }}
        />

        {/* White center overlay */}
        <div
          className="absolute"
          style={{
            inset: size * 0.03,
            borderRadius: "inherit",
            background: `radial-gradient(circle at 43% 40%,
              rgba(255,255,255,0.93) 0%,
              rgba(255,255,255,0.75) 35%,
              rgba(255,255,255,0.28) 60%,
              transparent 78%)`,
          }}
        />

        {/* Specular highlight — glass shine top-left */}
        <div
          className="absolute"
          style={{
            inset: size * 0.08,
            borderRadius: "inherit",
            background: `radial-gradient(ellipse 55% 40% at 32% 28%,
              rgba(255,255,255,0.85) 0%,
              rgba(255,255,255,0.4) 30%,
              transparent 65%)`,
          }}
        />

        {/* Refraction band — diagonal light passing through */}
        <div
          className="absolute"
          style={{
            inset: 0,
            borderRadius: "inherit",
            background: `linear-gradient(
              135deg,
              transparent 30%,
              rgba(255,255,255,0.18) 42%,
              rgba(255,255,255,0.08) 52%,
              transparent 60%)`,
          }}
        />

        {/* Bottom caustic — focused light underneath */}
        <div
          className="absolute"
          style={{
            inset: size * 0.1,
            borderRadius: "inherit",
            background: `radial-gradient(ellipse 45% 30% at 62% 75%,
              rgba(200,235,255,0.3) 0%,
              transparent 70%)`,
          }}
        />

        {/* Edge fresnel — brighter rim for glass depth */}
        <div
          className="absolute"
          style={{
            inset: 0,
            borderRadius: "inherit",
            background: `radial-gradient(circle at 50% 50%,
              transparent 60%,
              rgba(180,225,248,0.15) 78%,
              rgba(140,210,245,0.25) 90%,
              rgba(89,198,242,0.2) 100%)`,
          }}
        />
      </motion.div>

      {/* Rim — follows morphing shape */}
      <motion.div
        animate={{
          borderRadius: SHAPES,
          scale: cfg.scale,
        }}
        transition={{
          borderRadius: {
            duration: cfg.morphDur,
            repeat: Infinity,
            ease: "easeInOut",
          },
          scale: {
            duration: cfg.scaleDur,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: SHAPES[0],
          border: `${Math.max(1, size * 0.006)}px solid rgba(89,198,242,0.25)`,
          boxShadow: `
            inset 0 0 ${size * 0.04}px rgba(89,198,242,0.1),
            0 0 ${size * 0.1}px rgba(89,198,242,0.08)`,
        }}
      />
    </div>
  );
}

/* ── Mini variant (< 50px) ───────────────────────────────────────── */

const MINI_SHAPES = [
  "52% 48% 47% 53% / 53% 47% 52% 48%",
  "48% 52% 53% 47% / 47% 53% 48% 52%",
  "53% 47% 48% 52% / 52% 48% 53% 47%",
  "52% 48% 47% 53% / 53% 47% 52% 48%",
];

function AiOrbMini({
  state = "idle",
  size = 32,
  className,
}: {
  state?: OrbState;
  size?: number;
  className?: string;
}) {
  const intensity =
    state === "streaming" ? 0.4 : state === "thinking" ? 0.25 : 0.12;
  const morphDur =
    state === "streaming" ? 2 : state === "thinking" ? 4 : 7;
  const scaleDur =
    state === "streaming" ? 1.2 : state === "thinking" ? 2 : 4;

  return (
    <motion.div
      animate={{
        borderRadius: MINI_SHAPES,
        scale:
          state === "streaming"
            ? [1, 1.06, 0.96, 1.04, 1]
            : state === "thinking"
              ? [1, 1.04, 0.97, 1.02, 1]
              : [1, 1.02, 0.99, 1],
      }}
      transition={{
        borderRadius: {
          duration: morphDur,
          repeat: Infinity,
          ease: "easeInOut",
        },
        scale: {
          duration: scaleDur,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
      className={`${className ?? ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: MINI_SHAPES[0],
        background: `
          radial-gradient(ellipse 50% 40% at 34% 30%,
            rgba(255,255,255,0.8) 0%,
            transparent 55%),
          radial-gradient(circle at 38% 32%,
            rgba(255,255,255,0.95) 0%,
            rgba(225,245,255,0.8) 40%,
            rgba(120,200,245,0.45) 70%,
            rgba(89,198,242,0.3) 100%)`,
        boxShadow: `
          0 0 ${5 + intensity * 16}px rgba(89,198,242,${intensity}),
          inset 0 -2px 4px rgba(89,198,242,0.1),
          inset 0 2px 4px rgba(255,255,255,0.45)`,
        border: "0.5px solid rgba(89,198,242,0.25)",
      }}
    />
  );
}
