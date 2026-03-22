#!/usr/bin/env npx tsx
/**
 * Merge Zecat + Promoproductos + X-Trade catalogs into a single catalog.json
 *
 * Usage:
 *   1. Run sync-catalog.ts (Zecat), sync-promoproductos.ts, and sync-xtrade.ts first
 *   2. Then run this script to merge all into catalog.json
 *
 * Or run all at once:
 *   ZECAT_API_TOKEN=xxx npx tsx scripts/sync-all.ts --sync
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";

const DATA_DIR = fileURLToPath(new URL("../src/data", import.meta.url));
const ZECAT_PATH = `${DATA_DIR}/catalog.json`;
const PROMO_PATH = `${DATA_DIR}/promoproductos-catalog.json`;
const XTRADE_PATH = `${DATA_DIR}/xtrade-catalog.json`;
const CDO_PATH = `${DATA_DIR}/cdo-catalog.json`;
const OUTPUT_PATH = `${DATA_DIR}/catalog.json`;

interface CatalogProduct {
  product_id: string;
  external_id: string;
  title: string;
  description: string;
  category: string;
  materials: string[];
  colors: string[];
  personalization_methods: string[];
  eco_friendly: boolean;
  price: number | null;
  price_max: number | null;
  currency: string;
  min_qty: number;
  image_urls: string[];
  source?: string;
}

interface CatalogFile {
  synced_at: string;
  total: number;
  products: CatalogProduct[];
  source?: string;
  usd_rate?: number;
}

function loadCatalog(path: string): CatalogFile | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

async function main() {
  const scriptDir = fileURLToPath(new URL(".", import.meta.url));
  const runSync = process.argv.includes("--sync");

  if (runSync) {
    console.log("=== Syncing Zecat ===\n");
    try {
      execSync(`npx tsx ${scriptDir}/sync-catalog.ts`, {
        stdio: "inherit",
        env: process.env,
      });
    } catch {
      console.error("Zecat sync failed, using existing catalog.json if available");
    }

    console.log("\n=== Syncing Promoproductos ===\n");
    try {
      execSync(`npx tsx ${scriptDir}/sync-promoproductos.ts`, {
        stdio: "inherit",
        env: process.env,
      });
    } catch {
      console.error("Promoproductos sync failed, using existing file if available");
    }

    console.log("\n=== Syncing X-Trade ===\n");
    try {
      execSync(`npx tsx ${scriptDir}/sync-xtrade.ts`, {
        stdio: "inherit",
        env: process.env,
      });
    } catch {
      console.error("X-Trade sync failed, using existing file if available");
    }

    console.log("\n=== Syncing CDO ===\n");
    try {
      execSync(`npx tsx ${scriptDir}/sync-cdo.ts`, {
        stdio: "inherit",
        env: process.env,
      });
    } catch {
      console.error("CDO sync failed, using existing file if available");
    }
    console.log("\n=== Merging catalogs ===\n");
  }

  // Load all catalogs
  const zecat = loadCatalog(ZECAT_PATH);
  const promo = loadCatalog(PROMO_PATH);
  const xtrade = loadCatalog(XTRADE_PATH);
  const cdo = loadCatalog(CDO_PATH);

  if (!zecat && !promo && !xtrade && !cdo) {
    console.error("No catalog files found. Run with --sync to fetch first.");
    process.exit(1);
  }

  // Tag products with source
  const zecatProducts: CatalogProduct[] = (zecat?.products || []).map((p) => ({
    ...p,
    source: p.source || "zecat",
  }));

  const promoProducts: CatalogProduct[] = (promo?.products || []).map((p) => ({
    ...p,
    source: p.source || "promoproductos",
  }));

  const xtradeProducts: CatalogProduct[] = (xtrade?.products || []).map((p) => ({
    ...p,
    source: p.source || "xtrade",
  }));

  const cdoProducts: CatalogProduct[] = (cdo?.products || []).map((p) => ({
    ...p,
    source: p.source || "cdo",
  }));

  console.log(`Zecat: ${zecatProducts.length} products`);
  console.log(`Promoproductos: ${promoProducts.length} products`);
  console.log(`X-Trade: ${xtradeProducts.length} products`);
  console.log(`CDO: ${cdoProducts.length} products`);

  // Merge — Zecat first (primary), then Promoproductos, then X-Trade, then CDO
  const all = [...zecatProducts, ...promoProducts, ...xtradeProducts, ...cdoProducts];

  // Deduplicate by product_id
  const seen = new Set<string>();
  const unique = all.filter((p) => {
    if (seen.has(p.product_id)) return false;
    seen.add(p.product_id);
    return true;
  });

  console.log(`Merged: ${unique.length} unique products`);

  // Stats
  const bySource: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const p of unique) {
    const src = p.source || "unknown";
    bySource[src] = (bySource[src] || 0) + 1;
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
  }

  console.log("\nBy source:");
  Object.entries(bySource)
    .sort(([, a], [, b]) => b - a)
    .forEach(([src, count]) => console.log(`  ${src}: ${count}`));

  console.log(`\nCategories: ${Object.keys(byCategory).length}`);
  Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

  // Write merged catalog
  const output = {
    synced_at: new Date().toISOString(),
    total: unique.length,
    sources: {
      zecat: { count: bySource["zecat"] || 0, synced_at: zecat?.synced_at },
      promoproductos: {
        count: bySource["promoproductos"] || 0,
        synced_at: promo?.synced_at,
        usd_rate: promo?.usd_rate,
      },
      xtrade: {
        count: bySource["xtrade"] || 0,
        synced_at: xtrade?.synced_at,
        usd_rate: xtrade?.usd_rate,
      },
      cdo: {
        count: bySource["cdo"] || 0,
        synced_at: cdo?.synced_at,
        usd_rate: cdo?.usd_rate,
      },
    },
    products: unique,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  const sizeKB =
    Math.round((Buffer.byteLength(JSON.stringify(output)) / 1024) * 10) / 10;
  console.log(`\nWritten to ${OUTPUT_PATH} (${sizeKB} KB)`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
