import { NextRequest, NextResponse } from "next/server";

const VAULT_API_URL = process.env.VAULT_API_URL || "http://localhost:8001";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const res = await fetch(`${VAULT_API_URL}/api/v1/quotes/`, {
    headers: { Cookie: `session=${session}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  const res = await fetch(`${VAULT_API_URL}/api/v1/quotes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `session=${session}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Failed to create quote");
    return NextResponse.json({ error: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
