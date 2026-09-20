import Link from "next/link";

import { Eyebrow } from "@/components/ds";
import { DashboardLive, StatCard } from "@/components/dashboard/live";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { formatBurnAmount, loadAirdropSnapshot } from "@/lib/airdrops";
import { fetchMarketStats } from "@/lib/dex-stats";
import { fetchDexScreenerToken } from "@/lib/dex-token";
import { fetchLaunches, fetchTokensLaunched } from "@/lib/launch-stats";
import { getAppSession } from "@/lib/app-session";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = pageMetadata({
  title: "Dashboard",
  description: "Tokens launched by iStonk, live on Stonks Exchange, plus ISTONKS burned on-chain.",
  path: "/dashboard",
});

export default async function DashboardPage() {
  const [tokensLaunched, launches, airdrops, session] = await Promise.all([
    fetchTokensLaunched(),
    fetchLaunches(),
    loadAirdropSnapshot(),
    getAppSession(),
  ]);
  const signedIn = Boolean(session);
  const [sourceMeta, market] = await Promise.all([
    airdrops.sourceTokenAddress ? fetchDexScreenerToken(airdrops.sourceTokenAddress) : null,
    fetchMarketStats(launches.map((l) => l.tokenAddress)),
  ]);
  const tokenBurnSymbol = sourceMeta?.symbol ?? "TOKEN";
  const sourceName = sourceMeta?.name ?? "Source token";

  return (
    <>
      <Nav signedIn={signedIn} />
      <main
        className="mx-auto flex w-full max-w-[var(--container-wide)] flex-col gap-8 px-[var(--gutter-mobile)] pt-8 pb-20 md:px-7"
      >
        <header className="flex flex-col gap-2">
          <Eyebrow>iStonk · public board</Eyebrow>
          <h1 className="type-d3">Every coin launched from a text</h1>
          <p
            className="max-w-[520px]"
            style={{ font: "var(--type-body)", color: "var(--text-secondary)" }}
          >
            Markets and charts live on Stonks Exchange; iStonk does not trade. {tokenBurnSymbol}{" "}
            bought and burned is supply gone.
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
          burnStats={
            <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
              <StatCard
                label={`${tokenBurnSymbol} burned`}
                value={airdrops.totalTokenBurned > 0 ? formatBurnAmount(airdrops.totalTokenBurned) : "—"}
                note={
                  airdrops.tokenBurns.length > 0
                    ? `${sourceName} · ${airdrops.tokenBurns.length} burn${airdrops.tokenBurns.length === 1 ? "" : "s"}`
                    : "Sent to the dead address"
                }
                token={{ src: sourceMeta?.imageUrl, symbol: tokenBurnSymbol }}
              />
            </div>
          }
        />

        <p style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
          Want to send a stock?{" "}
          <Link href="/app?send=imessage">Send from your account</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
