import { NextResponse } from "next/server";

import { fetchLaunches, fetchTokensLaunched } from "@/lib/launch-stats";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

/** Public launch feed for the dashboard poller. No auth — the upstream route is public too. */
export async function GET() {
  const [items, tokensLaunched] = await Promise.all([fetchLaunches(), fetchTokensLaunched()]);
  return NextResponse.json(
    { items, tokensLaunched, fetchedAt: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}
