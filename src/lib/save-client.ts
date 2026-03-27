/**
 * Fire-and-forget: save client billing data to vault via vault-api.
 * Called after successful checkout (both MP and transfer).
 */

const VAULT_API_URL = process.env.VAULT_API_URL || "http://localhost:8001";
const CHECKOUT_SECRET = process.env.CHECKOUT_SECRET || "";

type SaveClientData = {
  first_name: string;
  last_name: string;
  company?: string;
  email: string;
  phone: string;
  document_type?: string;
  document_number?: string;
  street_address?: string;
  city?: string;
  province?: string;
  logo_url?: string;
  instructions?: string;
  payment_method: string;
  order_total: number;
};

export function saveClientToVault(data: SaveClientData): void {
  if (!CHECKOUT_SECRET) {
    console.warn("CHECKOUT_SECRET not set — skipping client save");
    return;
  }

  fetch(`${VAULT_API_URL}/api/v1/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHECKOUT_SECRET}`,
      "Ngrok-Skip-Browser-Warning": "true",
    },
    body: JSON.stringify(data),
  }).catch((err) => console.error("Save client to vault error:", err));
}
