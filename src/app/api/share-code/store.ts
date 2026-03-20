/* In-memory store for share-code payloads — shared between route handlers */

import crypto from "crypto";

interface StoreEntry {
  payload: Record<string, unknown>;
  expiresAt: number;
}

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const store = new Map<string, StoreEntry>();

function generateCode(): string {
  return crypto.randomBytes(4).toString("hex"); // 8 hex chars
}

// Cleanup expired entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) store.delete(key);
  }
}, 60 * 60 * 1000);

export const cartStore = {
  set(payload: Record<string, unknown>): string {
    const code = generateCode();
    store.set(code, {
      payload: { ...payload, created_at: new Date().toISOString() },
      expiresAt: Date.now() + TTL_MS,
    });
    return code;
  },

  get(code: string): Record<string, unknown> | null {
    const entry = store.get(code);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(code);
      return null;
    }
    return entry.payload;
  },
};
