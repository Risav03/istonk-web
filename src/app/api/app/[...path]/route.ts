import { NextRequest, NextResponse } from "next/server";

import { agentHost, getAppSession } from "@/lib/app-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function corePath(segments: string[]): string {
  return `/api/app/${segments.join("/")}`;
}

async function forward(req: NextRequest, segments: string[], method: "GET" | "POST") {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const host = agentHost();
  if (!host) {
    return NextResponse.json({ error: "API is not configured (set AGENT_API_HOST)." }, { status: 500 });
  }

  const endpoint = new URL(corePath(segments), host.replace(/\/$/, ""));
  endpoint.searchParams.set("user", session.user);
  endpoint.searchParams.set("token", session.token);
  req.nextUrl.searchParams.forEach((v, k) => {
    if (k !== "user" && k !== "token") endpoint.searchParams.set(k, v);
  });

  try {
    const init: RequestInit = {
      method,
      cache: "no-store",
      headers: { accept: "application/json" },
    };
    if (method === "POST") {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      init.headers = { ...init.headers, "content-type": "application/json" };
      // Session auth is already on the query string. Never overwrite `token` —
      // /stonks/transfer uses that field for the asset ("eth" or an ERC-20).
      const payload: Record<string, unknown> = { ...body, user: session.user };
      if (typeof payload.token !== "string" || payload.token.length === 0) {
        payload.token = session.token;
      }
      init.body = JSON.stringify(payload);
    }
    const res = await fetch(endpoint, init);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status, headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: "Couldn't reach the iStonk API.", detail: err instanceof Error ? err.message : String(err) },
      { status: 503 },
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path, "GET");
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path, "POST");
}
