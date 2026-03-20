/**
 * Client-side analytics — sends events to /api/analytics/track.
 * Lightweight, no Node.js dependencies. Fire-and-forget.
 */

let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  // Try to recover from sessionStorage
  try {
    sessionId = sessionStorage.getItem("dp_session_id");
  } catch { /* SSR or blocked */ }
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    try {
      sessionStorage.setItem("dp_session_id", sessionId);
    } catch { /* ignored */ }
  }
  return sessionId;
}

let buffer: Record<string, unknown>[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, 3000);
}

function flush() {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0);
  try {
    // Use sendBeacon for reliability (survives page unload)
    const ok = navigator.sendBeacon(
      "/api/analytics/track",
      new Blob([JSON.stringify({ events: batch })], { type: "application/json" }),
    );
    if (!ok) {
      // Fallback to fetch
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      }).catch(() => { /* lost — acceptable */ });
    }
  } catch {
    // lost — acceptable for analytics
  }
}

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

export function trackEvent(
  type: string,
  data: Record<string, unknown>,
) {
  buffer.push({
    type,
    ts: new Date().toISOString(),
    session_id: getSessionId(),
    client_id: null,
    source: "web",
    data,
  });
  if (buffer.length >= 10) {
    flush();
  } else {
    scheduleFlush();
  }
}
