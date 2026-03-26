import { NextRequest, NextResponse } from "next/server";

const VAULT_API_URL = process.env.VAULT_API_URL || "http://localhost:8001";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Dev bypass: return mock client without calling vault-api
  if (process.env.DEV_PORTAL_BYPASS === "true" && session === "dev") {
    return NextResponse.json({
      client_id: "test",
      name: "Usuario de Prueba",
    });
  }

  const res = await fetch(`${VAULT_API_URL}/api/v1/auth/me`, {
    headers: { Cookie: `session=${session}`, "Ngrok-Skip-Browser-Warning": "true" },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const data = await res.json();

  // Also fetch client profile for name
  let name: string | undefined;
  try {
    const profileRes = await fetch(
      `${VAULT_API_URL}/api/v1/clients/me`,
      { headers: { Cookie: `session=${session}`, "Ngrok-Skip-Browser-Warning": "true" } },
    );
    if (profileRes.ok) {
      const profile = await profileRes.json();
      name = profile.name || profile.frontmatter?.name;
    }
  } catch {
    // Name is optional
  }

  return NextResponse.json({
    client_id: data.client_id,
    name,
  });
}
