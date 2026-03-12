"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useAdvisorStore } from "@/lib/stores/advisor-store";

const EVENT_TYPES = [
  "Evento corporativo",
  "Kits de bienvenida",
  "Regalos empresariales",
  "Branding / Merchandising",
  "Otro",
];

const AUDIENCE_SIZES = ["10-50", "50-200", "200-500", "+500", "No se"];

const BUDGET_RANGES = [
  "< $2,000",
  "$2,000 - $5,000",
  "$5,000 - $10,000",
  "+ $10,000",
  "Flexible",
];

function ChipGroup({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
            selected === opt
              ? "border-accent bg-accent text-white"
              : "border-border bg-white text-foreground hover:border-accent/40 hover:text-accent"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function AdvisorIntake() {
  const { step, context, setContext, setStep } = useAdvisorStore();
  const [extraText, setExtraText] = useState("");

  const handleNext = (nextStep: "audience" | "budget" | "extra" | "submit") => {
    if (nextStep === "submit") {
      setContext({ extra: extraText });
      // Trigger search — handled by AdvisorChat
      setStep("loading");
      return;
    }
    setStep(nextStep);
  };

  const questions: Record<string, { label: string; sublabel: string }> = {
    event: {
      label: "Que tipo de evento o proyecto tenes?",
      sublabel: "Esto nos ayuda a elegir los productos ideales",
    },
    audience: {
      label: "Para cuantas personas?",
      sublabel: "Asi ajustamos cantidades y presupuesto",
    },
    budget: {
      label: "Presupuesto por persona?",
      sublabel: "Para filtrar por rango de precio",
    },
    extra: {
      label: "Algo mas que debamos saber?",
      sublabel: "Colores, materiales, estilo, lo que quieras",
    },
  };

  const currentQ = questions[step];
  if (!currentQ) return null;

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div>
        <p className="font-semibold text-foreground">{currentQ.label}</p>
        <p className="text-sm text-muted">{currentQ.sublabel}</p>
      </div>

      {step === "event" && (
        <ChipGroup
          options={EVENT_TYPES}
          selected={context.event_type}
          onSelect={(v) => {
            setContext({ event_type: v });
            handleNext("audience");
          }}
        />
      )}

      {step === "audience" && (
        <ChipGroup
          options={AUDIENCE_SIZES}
          selected={context.audience_size}
          onSelect={(v) => {
            setContext({ audience_size: v });
            handleNext("budget");
          }}
        />
      )}

      {step === "budget" && (
        <ChipGroup
          options={BUDGET_RANGES}
          selected={context.budget_range}
          onSelect={(v) => {
            setContext({ budget_range: v });
            handleNext("extra");
          }}
        />
      )}

      {step === "extra" && (
        <div className="space-y-3">
          <textarea
            value={extraText}
            onChange={(e) => setExtraText(e.target.value)}
            placeholder="Ej: Preferimos colores neutros, queremos algo sustentable..."
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleNext("submit")}
              className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-hover"
            >
              {extraText ? "Buscar" : "Buscar sin mas detalles"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
