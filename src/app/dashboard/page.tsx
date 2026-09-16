import Link from "next/link";

import { Aurora } from "@/components/landing/aurora";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { DashboardLive } from "@/components/dashboard/live";
import { TokenAvatar } from "@/components/token-avatar";
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
      <Aurora />
      <Nav signedIn={signedIn} />
      <main className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-10 px-5 pb-20 pt-32">
        <header className="flex flex-col gap-2">
          <span className="text-[13px] text-muted">iStonk · public stats</span>
          <h1 className="text-[34px] font-extrabold leading-none tracking-[-0.035em] sm:text-[44px]">
            Dashboard
          </h1>
          <p className="max-w-[520px] text-[15px] leading-relaxed text-muted">
            Every coin launched from iMessage, live, plus {tokenBurnSymbol} bought and burned —
            supply gone.
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

        <p className="text-[13px] text-muted">
          Want to send a stock?{" "}
          <Link href="/app?send=imessage" className="font-medium text-primary hover:text-primary-hover">
            Send from your account
          </Link>
        </p>
      </main>
      <div className="relative z-10">
        <Footer signedIn={signedIn} />
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  note,
  token,
}: {
  label: string;
  value: string;
  note: string;
  token?: { src?: string | null; symbol: string };
}) {
  return (
    <div className="glass flex min-w-0 flex-col gap-1.5 rounded-[16px] px-4 py-4">
      <span className="inline-flex items-center gap-1.5 truncate text-[12px] text-muted">
        {token ? <TokenAvatar src={token.src} symbol={token.symbol} size={16} /> : null}
        {label}
      </span>
      <span className="truncate text-[26px] font-semibold leading-none tracking-[-0.03em] sm:text-[30px]">
        {value}
      </span>
      <span className="truncate text-[11px] text-faint">{note}</span>
    </div>
  );
}
