"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useAdvisorStore } from "@/lib/stores/advisor-store";
import { getProduct } from "@/lib/api";
import type { AdvisorResponse, ProductResult } from "@/lib/types";
import AdvisorIntake from "./AdvisorIntake";
import AdvisorResults from "./AdvisorResults";

const LOADING_PHASES = [
  "Analizando tu brief...",
  "Buscando productos...",
  "Armando tu seleccion...",
];

function LoadingPhases() {
  const phaseRef = useRef(0);
  const [phase, setPhase] = React.useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      phaseRef.current = Math.min(phaseRef.current + 1, LOADING_PHASES.length - 1);
      setPhase(phaseRef.current);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="h-6 w-6 text-accent" />
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-sm text-muted"
        >
          {LOADING_PHASES[phase]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// Need React import for LoadingPhases useState
import React from "react";

export default function AdvisorChat() {
  const { step, context, setResults, setError, reset } = useAdvisorStore();
  const fetchedRef = useRef(false);

  // Trigger API call when step becomes "loading"
  useEffect(() => {
    if (step !== "loading" || fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchAdvisor() {
      try {
        const res = await fetch("/api/advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error al buscar");
        }

        const data: AdvisorResponse = await res.json();

        // Fetch full product data for selected IDs
        const products = await Promise.all(
          data.selected.map(async (s) => {
            try {
              return await getProduct(s.id);
            } catch {
              return null;
            }
          })
        );

        const validProducts = products.filter(Boolean) as ProductResult[];
        setResults(data, validProducts);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Error al generar recomendaciones"
        );
      }
    }

    fetchAdvisor();
  }, [step, context, setResults, setError]);

  // Reset fetchedRef when step changes away from loading
  useEffect(() => {
    if (step !== "loading") {
      fetchedRef.current = false;
    }
  }, [step]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-accent" />
        <h2 className="font-semibold text-lg">Arma tu pedido con AI</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {(step === "event" ||
          step === "audience" ||
          step === "budget" ||
          step === "extra") && <AdvisorIntake />}

        {step === "loading" && <LoadingPhases />}

        {step === "results" && <AdvisorResults />}
      </div>

      {/* Reset button (visible after results) */}
      {step === "results" && (
        <button
          onClick={reset}
          className="mt-4 text-sm text-muted underline hover:text-foreground"
        >
          Empezar de nuevo
        </button>
      )}
    </div>
  );
}
