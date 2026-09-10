import { NextRequest, NextResponse } from "next/server";

import { agentHost, applyAppSessionCookie, clearAppSessionCookie } from "@/lib/app-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const accessToken = typeof body?.accessToken === "string" ? body.accessToken : "";
  if (!accessToken) {
    return NextResponse.json({ error: "Missing access token." }, { status: 400 });
  }

  const host = agentHost();
  if (!host) {
    return NextResponse.json({ error: "Sign-in is not configured (set AGENT_API_HOST)." }, { status: 500 });
  }

  try {
    const agentRes = await fetch(new URL("/api/agent/app/session", host.replace(/\/$/, "")), {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ accessToken }),
    });
    const data = await agentRes.json().catch(() => ({}));
    if (!agentRes.ok) {
      return NextResponse.json({ error: data?.error ?? "Sign-in failed." }, { status: agentRes.status });
    }
    const session = { user: data.user, token: data.token, address: data.address };
    const res = NextResponse.json({ ok: true, address: data.address });
    applyAppSessionCookie(res, session);
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: "Couldn't reach the sign-in service.", detail: err instanceof Error ? err.message : String(err) },
      { status: 503 },
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearAppSessionCookie(res);
  return res;
}
