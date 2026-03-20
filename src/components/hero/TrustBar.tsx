"use client";

import { Package, Clock, Trophy } from "@phosphor-icons/react";

const stats = [
  { icon: Package, label: "+1,400 productos", sub: "en catalogo" },
  { icon: Clock, label: "+10 anios", sub: "de experiencia" },
  { icon: Trophy, label: "Personalizacion", sub: "a medida" },
];

export default function TrustBar() {
  return (
    <div className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-3 text-muted">
          <s.icon className="h-5 w-5 text-accent" />
          <div>
            <p className="text-sm font-semibold text-foreground">{s.label}</p>
            <p className="text-xs">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
