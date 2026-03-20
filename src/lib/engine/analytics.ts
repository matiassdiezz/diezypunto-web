/**
 * Analytics module — track events and send to vault-api.
 *
 * Server-side: trackServerEvent(), trackAICost()
 * Client-side: trackClientEvent() (calls /api/analytics/track proxy)
 */

import { createHash, randomUUID } from "crypto";

// ---------- Types ----------

export type EventType =
  | "search"
  | "search_refine"
  | "chat_message"
  | "chat_tool_call"
  | "product_view"
  | "cart_add"
  | "cart_remove"
  | "cart_clear"
  | "cart_review"
  | "checkout_start"
  | "ai_cost";

export interface AnalyticsEvent {
  type: EventType;
  ts: string;
  session_id: string;
  client_id: string | null;
  ip_hash: string;
  source: "web" | "bot";
  data: Record<string, unknown>;
}

// ---------- Config ----------

const VAULT_API_URL = process.env.VAULT_API_URL || "http://localhost:8001";
const ANALYTICS_SECRET = process.env.ANALYTICS_SECRET || "";

// ---------- Helpers ----------

export function hashIP(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export function getIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}

// ---------- Server-side tracking ----------

/** Buffer for batching — flush every 5s or 20 events */
let buffer: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 5000;
const FLUSH_SIZE = 20;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL);
}

async function flush() {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0);

  if (!ANALYTICS_SECRET) {
    console.warn("[analytics] ANALYTICS_SECRET not set, dropping", batch.length, "events");
    return;
  }

  try {
    const res = await fetch(`${VAULT_API_URL}/api/v1/analytics/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANALYTICS_SECRET}`,
      },
      body: JSON.stringify({ events: batch }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error("[analytics] ingest failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("[analytics] ingest error:", e);
    // Events are lost — acceptable for analytics (fire-and-forget)
  }
}

/**
 * Track an event from a server-side API route.
 * Fire-and-forget: never blocks the response.
 */
export function trackServerEvent(
  type: EventType,
  data: Record<string, unknown>,
  opts: {
    ip?: string;
    session_id?: string;
    client_id?: string | null;
    source?: "web" | "bot";
  } = {},
) {
  const event: AnalyticsEvent = {
    type,
    ts: new Date().toISOString(),
    session_id: opts.session_id || randomUUID(),
    client_id: opts.client_id ?? null,
    ip_hash: opts.ip ? hashIP(opts.ip) : "",
    source: opts.source || "web",
    data,
  };

  buffer.push(event);
  if (buffer.length >= FLUSH_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}

/**
 * Convenience: track AI cost event from any API route.
 */
export function trackAICost(
  feature: "search" | "chat" | "picks" | "cart_review",
  usage: { inputTokens: number; outputTokens: number },
  opts: {
    model?: string;
    latency_ms?: number;
    ip?: string;
    session_id?: string;
  } = {},
) {
  // Pricing: Haiku = $0.80/1M in, $4/1M out; Sonnet = $3/1M in, $15/1M out
  const model = opts.model || "claude-haiku-4-5";
  const isHaiku = model.includes("haiku");
  const costIn = (usage.inputTokens / 1_000_000) * (isHaiku ? 0.8 : 3);
  const costOut = (usage.outputTokens / 1_000_000) * (isHaiku ? 4 : 15);

  trackServerEvent("ai_cost", {
    model,
    feature,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cost_usd: Math.round((costIn + costOut) * 1_000_000) / 1_000_000,
    latency_ms: opts.latency_ms ?? 0,
  }, {
    ip: opts.ip,
    session_id: opts.session_id,
  });
}

// ---------- Client-side tracking (for use in track route) ----------

/**
 * Process a client-side event received by /api/analytics/track.
 * Adds ip_hash from the server side.
 */
export function trackClientEvent(
  event: Omit<AnalyticsEvent, "ip_hash">,
  ip: string,
) {
  const full: AnalyticsEvent = {
    ...event,
    ip_hash: hashIP(ip),
  };
  buffer.push(full);
  if (buffer.length >= FLUSH_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}
