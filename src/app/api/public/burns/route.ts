import { NextResponse } from "next/server";

import { fetchFeeCronBurns, feeCronBaseCandidates } from "@/lib/fee-cron";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  const remote = await fetchFeeCronBurns();
  return NextResponse.json(
    {
      configured: feeCronBaseCandidates().length > 0,
      source: remote.source,
      feeBurns: remote.buyBurns,
      tokenBurns: remote.tokenBurns,
      fetchedAt: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
