/**
 * POST /api/analytics/track — Proxy for client-side analytics events.
 *
 * Receives events from the browser, adds ip_hash, forwards to vault-api.
 * Returns 202 immediately (fire-and-forget).
 */

import { NextRequest, NextResponse } from "next/server";
import { trackClientEvent, getIP, type EventType } from "@/lib/engine/analytics";

interface ClientEvent {
  type: EventType;
  ts: string;
  session_id: string;
  client_id: string | null;
  source: "web" | "bot";
  data: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events: ClientEvent[] = Array.isArray(body.events) ? body.events : [body];
    const ip = getIP(req);

    for (const event of events.slice(0, 20)) {
      trackClientEvent(
        {
          type: event.type,
          ts: event.ts || new Date().toISOString(),
          session_id: event.session_id || "unknown",
          client_id: event.client_id ?? null,
          source: event.source || "web",
          data: event.data || {},
        },
        ip,
      );
    }

    return NextResponse.json({ accepted: events.length }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
