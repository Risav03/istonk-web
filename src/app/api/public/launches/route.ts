import { NextResponse } from "next/server";

import { fetchMarketStats } from "@/lib/dex-stats";
import { fetchLaunches, fetchTokensLaunched } from "@/lib/launch-stats";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

/** Public launch feed for the dashboard poller. No auth — the upstream route is public too. */
export async function GET() {
  const [items, tokensLaunched] = await Promise.all([fetchLaunches(), fetchTokensLaunched()]);
  const market = await fetchMarketStats(items.map((l) => l.tokenAddress));
  return NextResponse.json(
    { items, tokensLaunched, market, fetchedAt: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}
