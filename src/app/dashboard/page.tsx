import Link from "next/link";

import { Aurora } from "@/components/landing/aurora";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { DashboardLive } from "@/components/dashboard/live";
import { formatBurnAmount, loadAirdropSnapshot } from "@/lib/airdrops";
import { fetchMarketStats } from "@/lib/dex-stats";
import { fetchDexScreenerToken } from "@/lib/dex-token";
import { fetchLaunches, fetchTokensLaunched } from "@/lib/launch-stats";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = pageMetadata({
  title: "Dashboard",
  description: "Tokens launched by iStonk, live on Stonks Exchange.",
  path: "/dashboard",
});

export default async function DashboardPage() {
  const [tokensLaunched, launches, airdrops] = await Promise.all([
    fetchTokensLaunched(),
    fetchLaunches(),
    loadAirdropSnapshot(),
  ]);
  const [sourceMeta, market] = await Promise.all([
    airdrops.sourceTokenAddress ? fetchDexScreenerToken(airdrops.sourceTokenAddress) : null,
    fetchMarketStats(launches.map((l) => l.tokenAddress)),
  ]);
  const tokenBurnSymbol = sourceMeta?.symbol ?? "TOKEN";
  const sourceName = sourceMeta?.name ?? "Source token";

  return (
    <>
      <Aurora />
      <Nav />
      <main className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-10 px-5 pb-20 pt-32">
        <header className="flex flex-col gap-2">
          <span className="text-[13px] text-muted">iStonk · public stats</span>
          <h1 className="text-[34px] font-extrabold leading-none tracking-[-0.035em] sm:text-[44px]">
            Dashboard
          </h1>
          <p className="max-w-[520px] text-[15px] leading-relaxed text-muted">
            Every coin launched from iMessage, live.
          </p>
        </header>

        <DashboardLive
          initialLaunches={launches}
          initialTokensLaunched={tokensLaunched}
          initialMarket={market}
          tokenBurns={airdrops.tokenBurns}
          tokenBurnSymbol={tokenBurnSymbol}
          sourceTokenImage={sourceMeta?.imageUrl}
          sourceName={sourceName}
          tokenBurnTotal={
            airdrops.totalTokenBurned > 0 ? formatBurnAmount(airdrops.totalTokenBurned) : "—"
          }
        />

        <p className="text-[13px] text-muted">
          Want to send a stock?{" "}
          <Link href="/app?send=imessage" className="font-medium text-primary hover:text-primary-hover">
            Send from your account
          </Link>
        </p>
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </>
  );
}
