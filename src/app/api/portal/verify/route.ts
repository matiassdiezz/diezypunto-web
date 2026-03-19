import { NextRequest, NextResponse } from "next/server";

const VAULT_API_URL = process.env.VAULT_API_URL || "http://localhost:8001";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { client_id, token } = body;

  if (!client_id || !token) {
    return NextResponse.json(
      { error: "Missing client_id or token" },
      { status: 400 },
    );
  }

  const res = await fetch(`${VAULT_API_URL}/api/v1/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id, token }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "Verification failed");
    return NextResponse.json({ error: detail }, { status: res.status });
  }

  const data = await res.json();
  const jwtToken = data.token;

  if (!jwtToken) {
    return NextResponse.json(
      { error: "No token in response" },
      { status: 500 },
    );
  }

  const response = NextResponse.json({
    success: true,
    client_id: data.client_id,
  });

  response.cookies.set("session", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 72 * 3600, // 3 days
    path: "/",
  });

  return response;
}
