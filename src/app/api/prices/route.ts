import { NextRequest, NextResponse } from "next/server";

import { fetchUsdPrices, isPriceId, normalizePriceId } from "@/lib/prices";

export const runtime = "nodejs";

/**
 * Accounts accumulate a coin per fee collection, so 40 silently dropped the
 * tail of a real holdings list — and an unpriced row is indistinguishable from
 * a worthless one. DexScreener is batched 30 at a time underneath.
 */
const MAX_IDS = 120;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = [
    ...new Set(
      raw
        .split(",")
        .map(normalizePriceId)
        .filter(isPriceId),
    ),
  ].slice(0, MAX_IDS);

  if (ids.length === 0) {
    return NextResponse.json({ prices: {} as Record<string, number> });
  }

  try {
    const prices = await fetchUsdPrices(ids);
    return NextResponse.json(
      { prices },
      {
        headers: {
          "cache-control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { prices: {}, error: "Couldn't load prices." },
      { status: 502 },
    );
  }
}
