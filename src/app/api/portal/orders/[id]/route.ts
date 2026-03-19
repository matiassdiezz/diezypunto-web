import { NextRequest, NextResponse } from "next/server";

const VAULT_API_URL = process.env.VAULT_API_URL || "http://localhost:8001";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = req.cookies.get("session")?.value;
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const res = await fetch(`${VAULT_API_URL}/api/v1/orders/${id}`, {
    headers: { Cookie: `session=${session}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Order not found" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
