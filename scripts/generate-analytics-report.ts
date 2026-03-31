/**
 * generate-analytics-report.ts
 * Genera un PDF de análisis competitivo de precios para Diezypunto.
 * Usa analytics/latest.json como fuente de datos.
 * Output: analytics/reports/YYYY-MM-DD-analytics-report.pdf
 *
 * Uso: npx tsx scripts/generate-analytics-report.ts
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as fs from "fs";
import * as path from "path";

// ─── Types (subset de competitor-snapshot.ts) ─────────────────────────────────

type PriceStatus = "priced" | "hidden" | "placeholder" | "unknown";

interface AnalyticsCategoryBenchmark {
  siteId: string;
  siteName: string;
  normalizedCategory: string;
  ownProductCount: number;
  competitorProductCount: number;
  catalogOverlapPct: number | null;
  pricedMatchCount: number;
  ownMedianPrice: number | null;
  competitorMedianPrice: number | null;
  medianPriceGapArs: number | null;
  medianPriceGapPct: number | null;
  cheaperMatchCount: number;
  alignedMatchCount: number;
  pricierMatchCount: number;
}

interface AnalyticsMatch {
  siteId: string;
  siteName: string;
  ourTitle: string;
  ourPriceArs: number | null;
  competitorPriceArs: number | null;
  competitorPriceStatus: PriceStatus;
  priceGapArs: number | null;
  priceGapPct: number | null;
  ourNormalizedCategory: string;
}

interface CompetitorAnalyticsSnapshot {
  generatedAt: string;
  snapshotDate: string;
  notes: string[];
  categoryBenchmarks?: AnalyticsCategoryBenchmark[];
  matches: AnalyticsMatch[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtARS(n: number | null): string {
  if (n === null) return "—";
  return `$${Math.round(n).toLocaleString("es-AR")}`;
}

function fmtPct(n: number | null): string {
  if (n === null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function checkPageBreak(doc: jsPDF, y: number, minSpace = 30): number {
  if (y > doc.internal.pageSize.getHeight() - minSpace) {
    doc.addPage();
    return 20;
  }
  return y;
}

function drawSectionHeader(doc: jsPDF, title: string, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  doc.setFillColor(30, 58, 95); // #1e3a5f
  doc.rect(margin, y, pageWidth - margin * 2, 9, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(title, margin + 4, y + 6.5);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  return y + 14;
}

function drawHeader(doc: jsPDF, snapshotDate: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 18;

  // Título principal
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 95);
  doc.text("Reporte de Análisis de Precios", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Diezypunto · Snapshot: ${snapshotDate} · Generado: ${new Date().toLocaleDateString("es-AR")}`, pageWidth / 2, y, { align: "center" });
  y += 6;

  // Línea divisoria
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setTextColor(0, 0, 0);

  return y + 8;
}

function drawFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Generado por Claude · Diezypunto · Merchandising corporativo B2B`,
      pageWidth / 2,
      pageHeight - 7,
      { align: "center" }
    );
    doc.text(`Pág. ${i} / ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: "right" });
  }
}

// ─── Análisis ─────────────────────────────────────────────────────────────────

function analyzeOportunidades(benchmarks: AnalyticsCategoryBenchmark[]) {
  // Categorías donde D&P es más barato que el competidor (gap > 15%)
  return benchmarks
    .filter((b) => b.medianPriceGapPct !== null && b.medianPriceGapPct > 15)
    .sort((a, b) => (b.medianPriceGapPct ?? 0) - (a.medianPriceGapPct ?? 0));
}

function analyzeHallazgos(benchmarks: AnalyticsCategoryBenchmark[], matches: AnalyticsMatch[]) {
  const competitors = [...new Set(benchmarks.map((b) => b.siteName))];

  return competitors.map((siteName) => {
    const siteMatches = matches.filter((m) => m.siteName === siteName);
    const siteBenchmarks = benchmarks.filter((b) => b.siteName === siteName);

    const cheaper = siteMatches.filter((m) => m.priceGapPct !== null && m.priceGapPct > 5).length;
    const aligned = siteMatches.filter((m) => m.priceGapPct !== null && Math.abs(m.priceGapPct) <= 5).length;
    const pricier = siteMatches.filter((m) => m.priceGapPct !== null && m.priceGapPct < -5).length;
    const hidden = siteMatches.filter((m) => m.competitorPriceStatus !== "priced").length;

    const compCategories = siteBenchmarks.length;
    const competitiveCategories = siteBenchmarks.filter(
      (b) => b.cheaperMatchCount >= b.pricierMatchCount
    ).length;

    return {
      siteName,
      totalMatches: siteMatches.length,
      cheaper,
      aligned,
      pricier,
      hidden,
      compCategories,
      competitiveCategories,
      pctCompetitive: compCategories > 0 ? Math.round((competitiveCategories / compCategories) * 100) : 0,
    };
  });
}

function analyzeDesvios(matches: AnalyticsMatch[]) {
  const extremes = matches
    .filter((m) => m.priceGapPct !== null && Math.abs(m.priceGapPct) > 30)
    .sort((a, b) => Math.abs(b.priceGapPct ?? 0) - Math.abs(a.priceGapPct ?? 0))
    .slice(0, 15);

  return {
    masBaratos: extremes.filter((m) => (m.priceGapPct ?? 0) > 0),
    masCaros: extremes.filter((m) => (m.priceGapPct ?? 0) < 0),
  };
}

function analyzeCosasLlamativas(
  benchmarks: AnalyticsCategoryBenchmark[],
  matches: AnalyticsMatch[],
  notes: string[]
): string[] {
  const items: string[] = [];

  // Categorías con muy bajo solapamiento
  const lowOverlap = benchmarks.filter(
    (b) => b.catalogOverlapPct !== null && b.catalogOverlapPct < 20
  );
  if (lowOverlap.length > 0) {
    const cats = [...new Set(lowOverlap.map((b) => b.normalizedCategory))];
    items.push(`Bajo solapamiento de catálogo (<20%) en: ${cats.slice(0, 4).join(", ")}. Difícil comparar precios en estas categorías.`);
  }

  // Competidores con muchos precios ocultos
  const hiddenByComp = matches.reduce<Record<string, number>>((acc, m) => {
    if (m.competitorPriceStatus !== "priced") {
      acc[m.siteName] = (acc[m.siteName] ?? 0) + 1;
    }
    return acc;
  }, {});
  const highHidden = Object.entries(hiddenByComp)
    .filter(([, count]) => count > 5)
    .sort((a, b) => b[1] - a[1]);
  if (highHidden.length > 0) {
    const list = highHidden.map(([name, count]) => `${name} (${count})`).join(", ");
    items.push(`Precios ocultos o sin mostrar en: ${list}. Puede ser estrategia deliberada de opacidad.`);
  }

  // Categorías sin ningún match
  const allCategories = [...new Set(benchmarks.map((b) => b.normalizedCategory))];
  const matchedCategories = [...new Set(matches.map((m) => m.ourNormalizedCategory))];
  const unmatchedCats = allCategories.filter((c) => !matchedCategories.includes(c));
  if (unmatchedCats.length > 0) {
    items.push(`Categorías sin matches comparables: ${unmatchedCats.slice(0, 3).join(", ")}. D&P puede estar operando en nichos sin competencia directa visible.`);
  }

  // Notas del snapshot
  notes.forEach((note) => {
    if (note.length > 10 && !note.toLowerCase().includes("diez y punto se toma")) {
      items.push(`Nota del snapshot: ${note}`);
    }
  });

  // Si hay pocas observaciones
  if (items.length === 0) {
    items.push("No se detectaron anomalías significativas en este snapshot.");
  }

  return items;
}

// ─── Secciones del PDF ────────────────────────────────────────────────────────

function renderResumenEjecutivo(
  doc: jsPDF,
  hallazgos: ReturnType<typeof analyzeHallazgos>,
  y: number
): number {
  y = drawSectionHeader(doc, "RESUMEN EJECUTIVO", y);

  const rows = hallazgos.map((h) => [
    h.siteName,
    String(h.totalMatches),
    String(h.cheaper),
    String(h.aligned),
    String(h.pricier),
    `${h.pctCompetitive}%`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Competidor", "Total matches", "D&P más barato", "Alineados", "D&P más caro", "% Categorías competitivas"]],
    body: rows,
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const val = parseInt(data.cell.text[0]);
        if (val >= 60) data.cell.styles.textColor = [22, 163, 74];
        else if (val <= 40) data.cell.styles.textColor = [220, 38, 38];
      }
    },
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
}

function renderOportunidades(
  doc: jsPDF,
  oportunidades: AnalyticsCategoryBenchmark[],
  y: number
): number {
  y = checkPageBreak(doc, y);
  y = drawSectionHeader(doc, "OPORTUNIDADES", y);

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text("Categorías donde D&P tiene ventaja de precio vs la competencia (gap mediano > 15%). Potencial para comunicar mejor este diferencial.", 15, y);
  y += 8;

  if (oportunidades.length === 0) {
    doc.setTextColor(120, 120, 120);
    doc.text("No se encontraron oportunidades con gap > 15% en este snapshot.", 15, y);
    doc.setTextColor(0, 0, 0);
    return y + 10;
  }

  const rows = oportunidades.map((b) => [
    capitalize(b.normalizedCategory),
    b.siteName,
    `${fmtARS(b.ownMedianPrice)} + IVA`,
    `${fmtARS(b.competitorMedianPrice)} + IVA`,
    fmtPct(b.medianPriceGapPct),
    String(b.pricedMatchCount),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Categoría", "Competidor", "Mediana D&P", "Mediana Comp.", "Ventaja %", "Matches"]],
    body: rows,
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        data.cell.styles.textColor = [22, 163, 74];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
}

function renderHallazgos(
  doc: jsPDF,
  hallazgos: ReturnType<typeof analyzeHallazgos>,
  y: number
): number {
  y = checkPageBreak(doc, y);
  y = drawSectionHeader(doc, "HALLAZGOS CLAVE", y);

  const rows = hallazgos.map((h) => [
    h.siteName,
    String(h.totalMatches),
    `${h.cheaper} (${h.totalMatches > 0 ? Math.round((h.cheaper / h.totalMatches) * 100) : 0}%)`,
    `${h.aligned} (${h.totalMatches > 0 ? Math.round((h.aligned / h.totalMatches) * 100) : 0}%)`,
    `${h.pricier} (${h.totalMatches > 0 ? Math.round((h.pricier / h.totalMatches) * 100) : 0}%)`,
    String(h.hidden),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Competidor", "Matches", "D&P más barato", "Alineados (±5%)", "D&P más caro", "Precios ocultos"]],
    body: rows,
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    didParseCell: (data) => {
      if (data.section === "body") {
        if (data.column.index === 2) data.cell.styles.textColor = [22, 163, 74];
        if (data.column.index === 4) data.cell.styles.textColor = [220, 38, 38];
      }
    },
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
}

function renderDesvios(
  doc: jsPDF,
  desvios: ReturnType<typeof analyzeDesvios>,
  y: number
): number {
  y = checkPageBreak(doc, y);
  y = drawSectionHeader(doc, "DESVÍOS", y);

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text("Productos individuales con brechas de precio extremas (>30%). Requieren atención o ajuste estratégico.", 15, y);
  y += 8;

  // D&P más barato
  if (desvios.masBaratos.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74);
    doc.text("D&P significativamente más barato", 15, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    y += 6;

    const rows = desvios.masBaratos.map((m) => [
      m.ourTitle.length > 45 ? m.ourTitle.slice(0, 42) + "..." : m.ourTitle,
      m.siteName,
      `${fmtARS(m.ourPriceArs)} + IVA`,
      `${fmtARS(m.competitorPriceArs)} + IVA`,
      fmtPct(m.priceGapPct),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Producto", "Competidor", "Precio D&P", "Precio Comp.", "Ventaja"]],
      body: rows,
      margin: { left: 15, right: 15 },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 4) {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // D&P más caro
  if (desvios.masCaros.length > 0) {
    y = checkPageBreak(doc, y);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    doc.text("D&P significativamente más caro", 15, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    y += 6;

    const rows = desvios.masCaros.map((m) => [
      m.ourTitle.length > 45 ? m.ourTitle.slice(0, 42) + "..." : m.ourTitle,
      m.siteName,
      `${fmtARS(m.ourPriceArs)} + IVA`,
      `${fmtARS(m.competitorPriceArs)} + IVA`,
      fmtPct(m.priceGapPct),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Producto", "Competidor", "Precio D&P", "Precio Comp.", "Diferencia"]],
      body: rows,
      margin: { left: 15, right: 15 },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 4) {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  }

  if (desvios.masBaratos.length === 0 && desvios.masCaros.length === 0) {
    doc.setTextColor(120, 120, 120);
    doc.text("No se encontraron desvíos mayores al 30% en este snapshot.", 15, y);
    doc.setTextColor(0, 0, 0);
    y += 10;
  }

  return y;
}

function renderCosasLlamativas(doc: jsPDF, items: string[], y: number): number {
  y = checkPageBreak(doc, y);
  y = drawSectionHeader(doc, "COSAS QUE LLAMAN LA ATENCIÓN", y);

  doc.setFontSize(9);
  const pageWidth = doc.internal.pageSize.getWidth();

  items.forEach((item) => {
    y = checkPageBreak(doc, y, 20);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 95);
    doc.text("•", 18, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);

    const lines = doc.splitTextToSize(item, pageWidth - 40);
    doc.text(lines, 24, y);
    y += lines.length * 5 + 3;
  });

  return y + 8;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const snapshotPath = path.join(projectRoot, "analytics", "latest.json");
  const reportsDir = path.join(projectRoot, "analytics", "reports");

  if (!fs.existsSync(snapshotPath)) {
    console.error(`❌ No se encontró analytics/latest.json en ${snapshotPath}`);
    process.exit(1);
  }

  console.log("📊 Leyendo snapshot...");
  const raw = fs.readFileSync(snapshotPath, "utf-8");
  const snapshot: CompetitorAnalyticsSnapshot = JSON.parse(raw);

  const benchmarks = snapshot.categoryBenchmarks ?? [];
  const matches = snapshot.matches ?? [];

  console.log(`   → ${benchmarks.length} benchmarks, ${matches.length} matches`);
  console.log(`   → Snapshot: ${snapshot.snapshotDate}`);

  // Análisis
  console.log("🔍 Analizando datos...");
  const oportunidades = analyzeOportunidades(benchmarks);
  const hallazgos = analyzeHallazgos(benchmarks, matches);
  const desvios = analyzeDesvios(matches);
  const cosasLlamativas = analyzeCosasLlamativas(benchmarks, matches, snapshot.notes);

  console.log(`   → ${oportunidades.length} oportunidades`);
  console.log(`   → ${desvios.masBaratos.length + desvios.masCaros.length} desvíos extremos`);
  console.log(`   → ${cosasLlamativas.length} observaciones`);

  // Generar PDF
  console.log("📄 Generando PDF...");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let y = drawHeader(doc, snapshot.snapshotDate);
  y = renderResumenEjecutivo(doc, hallazgos, y);
  y = renderOportunidades(doc, oportunidades, y);
  y = renderHallazgos(doc, hallazgos, y);
  y = renderDesvios(doc, desvios, y);
  renderCosasLlamativas(doc, cosasLlamativas, y);
  drawFooter(doc);

  // Guardar
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const outputName = `${snapshot.snapshotDate}-analytics-report.pdf`;
  const outputPath = path.join(reportsDir, outputName);
  const buf = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync(outputPath, buf);

  console.log(`\n✅ PDF generado: analytics/reports/${outputName}`);
  console.log(`\n📋 Resumen:`);
  console.log(`   Oportunidades: ${oportunidades.length} categorías donde D&P tiene ventaja >15%`);
  console.log(`   Desvíos positivos (D&P más barato): ${desvios.masBaratos.length} productos`);
  console.log(`   Desvíos negativos (D&P más caro): ${desvios.masCaros.length} productos`);
  console.log(`   Observaciones llamativas: ${cosasLlamativas.length}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
