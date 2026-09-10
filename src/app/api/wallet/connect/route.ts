import { NextRequest, NextResponse } from "next/server";

import { agentHost, agentUnreachableError } from "@/lib/app-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("s")?.trim() ?? "";
  const host = agentHost();
  if (!host) {
    return NextResponse.json({ error: "Wallet setup is not configured (set AGENT_API_HOST)." }, { status: 500 });
  }
  try {
    const endpoint = new URL("/api/app/wallet/connect", host.replace(/\/$/, ""));
    endpoint.searchParams.set("s", token);
    const res = await fetch(endpoint, { cache: "no-store", headers: { accept: "application/json" } });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status, headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json(agentUnreachableError(err, "Couldn't reach wallet setup."), { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const host = agentHost();
  if (!host) {
    return NextResponse.json({ error: "Wallet setup is not configured (set AGENT_API_HOST)." }, { status: 500 });
  }
  try {
    const res = await fetch(new URL("/api/app/wallet/connect/complete", host.replace(/\/$/, "")), {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sessionToken: body?.sessionToken ?? body?.token,
        accessToken: body?.accessToken,
        delegationId: body?.delegationId,
        expiresAt: body?.expiresAt,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Couldn't finish wallet setup.", detail: err instanceof Error ? err.message : String(err) },
      { status: 503 },
    );
  }
}
