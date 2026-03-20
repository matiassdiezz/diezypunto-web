"use client";

import { motion } from "framer-motion";
import { Truck, Gift, Check } from "@phosphor-icons/react";

interface CartMilestoneProps {
  total: number;
}

const MILESTONES = [
  { threshold: 25000, icon: Truck, label: "Envio bonificado" },
  { threshold: 50000, icon: Gift, label: "Packaging personalizado" },
];

export default function CartMilestone({ total }: CartMilestoneProps) {
  if (total <= 0) return null;

  // Determine active milestone
  if (total >= 50000) {
    return (
      <div className="mb-4 rounded-xl border border-eco/30 bg-eco/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-eco">
          <Check className="h-4 w-4" />
          Envio bonificado + packaging personalizado incluidos
        </div>
      </div>
    );
  }

  const nextMilestone = total < 25000 ? MILESTONES[0] : MILESTONES[1];
  const remaining = nextMilestone.threshold - total;
  const progress = (total / nextMilestone.threshold) * 100;
  const Icon = nextMilestone.icon;

  const message =
    total < 25000
      ? `Agrega $${remaining.toLocaleString("es-AR")} mas y te bonificamos el envio`
      : `Pedidos de +$50,000 incluyen packaging personalizado — faltan $${remaining.toLocaleString("es-AR")}`;

  return (
    <div className="mb-4 rounded-xl border border-border bg-surface/50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Icon className="h-4 w-4 shrink-0 text-accent" />
        <span>{message}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
