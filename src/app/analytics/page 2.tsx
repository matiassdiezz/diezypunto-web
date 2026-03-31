import type { Metadata } from "next";
import { loadCompetitorSnapshot } from "@/lib/analytics/load-competitor-snapshot";
import CompetitorAnalyticsDashboard from "./CompetitorAnalyticsDashboard";

export const metadata: Metadata = {
  title: "Analytics | Benchmark Competitivo | diezypunto",
  description:
    "Dashboard interactivo para comparar surtido y precios entre Diez y Punto y sus principales competidores.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AnalyticsPage() {
  const snapshot = await loadCompetitorSnapshot();

  if (!snapshot) {
    return (
      <div className="px-6 pb-24 pt-32 lg:px-16">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200 bg-amber-50 p-8">
          <h1 className="text-3xl font-semibold text-slate-950">Snapshot no disponible</h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Falta `analytics/latest.json`. Ejecutá el generador del benchmark para poblar el
            dashboard.
          </p>
          <pre className="mt-5 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">
            npx tsx scripts/build-competitor-analytics.ts
          </pre>
        </div>
      </div>
    );
  }

  return <CompetitorAnalyticsDashboard snapshot={snapshot} />;
}
