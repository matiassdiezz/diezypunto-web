/**
 * Server-side vault-api client.
 * Only import from server components / route handlers.
 */

const VAULT_API_URL = process.env.VAULT_API_URL || "http://localhost:8001";

export class VaultApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function vaultFetch<T>(
  path: string,
  options?: {
    cookies?: string;
    method?: string;
    body?: unknown;
  },
): Promise<T> {
  const url = `${VAULT_API_URL}/api/v1${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.cookies) {
    headers["Cookie"] = options.cookies;
  }

  const res = await fetch(url, {
    method: options?.method || "GET",
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new VaultApiError(res.status, text);
  }

  return res.json();
}
