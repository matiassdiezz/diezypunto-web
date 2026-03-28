import fs from "node:fs/promises";
import path from "node:path";
import type { CompetitorAnalyticsSnapshot } from "./competitor-snapshot";

const SNAPSHOT_PATH = path.join(process.cwd(), "analytics", "latest.json");

export async function loadCompetitorSnapshot(): Promise<CompetitorAnalyticsSnapshot | null> {
  try {
    const raw = await fs.readFile(SNAPSHOT_PATH, "utf8");
    return JSON.parse(raw) as CompetitorAnalyticsSnapshot;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }

    throw error;
  }
}
