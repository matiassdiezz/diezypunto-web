/* Shared proxy helper for API routes */

const MERCH_CORE_URL = process.env.MERCH_CORE_URL || "http://localhost:8000";

export async function proxyToCore(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${MERCH_CORE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = await res.text();
  return new Response(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
