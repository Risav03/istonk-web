import { NextResponse } from "next/server";

import { splitBurnsByToken } from "@/lib/burn-series";
import { fetchFeeCronBurns, feeCronBaseCandidates } from "@/lib/fee-cron";
import { fetchOnchainBurns } from "@/lib/onchain-burns";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  const [remote, chain] = await Promise.all([fetchFeeCronBurns(), fetchOnchainBurns()]);
  const split = splitBurnsByToken(
    [...remote.buyBurns, ...chain.feeBurns],
    [...remote.tokenBurns, ...chain.tokenBurns],
  );
  return NextResponse.json(
    {
      configured: feeCronBaseCandidates().length > 0,
      source: remote.source ?? "onchain",
      feeBurns: split.buyburns,
      tokenBurns: split.tokenBurns,
      fetchedAt: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
