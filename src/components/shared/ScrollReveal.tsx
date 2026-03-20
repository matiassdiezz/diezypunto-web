"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

const directionOffset = {
  up: { y: 30 },
  down: { y: -30 },
  left: { x: 30 },
  right: { x: -30 },
  none: {},
};

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const needsClip = direction === "left" || direction === "right";

  const motionClass = needsClip
    ? "min-w-0"
    : [className, "min-w-0"].filter(Boolean).join(" ");

  const inner = (
    <motion.div
      initial={{ opacity: 0, ...directionOffset[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={motionClass}
    >
      {children}
    </motion.div>
  );

  if (needsClip) {
    return (
      <div className={["min-w-0 overflow-x-clip", className].filter(Boolean).join(" ")}>
        {inner}
      </div>
    );
  }

  return inner;
}
