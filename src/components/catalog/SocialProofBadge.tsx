"use client";

import type { ProductResult } from "@/lib/types";
import { getSocialProofLabel } from "@/lib/engine/social-proof";

interface SocialProofBadgeProps {
  product: ProductResult;
  size?: "sm" | "md";
}

export default function SocialProofBadge({ product, size = "sm" }: SocialProofBadgeProps) {
  const label = getSocialProofLabel(product);
  if (!label) return null;

  const sizeClasses =
    size === "sm"
      ? "text-[10px] px-1.5 py-0.5 sm:px-2 sm:text-xs"
      : "text-xs px-2.5 py-1 sm:px-3 sm:text-sm";

  return (
    <span
      className={`rounded-full bg-foreground/5 font-medium text-foreground/70 ${sizeClasses}`}
    >
      {label}
    </span>
  );
}
