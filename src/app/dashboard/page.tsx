import Link from "next/link";

import { Aurora } from "@/components/landing/aurora";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import {
  formatAaplAmount,
  formatBurnAmount,
  loadAirdropSnapshot,
  type AirdropRow,
} from "@/lib/airdrops";
import { DashboardLive } from "@/components/dashboard/live";
import { TokenAvatar } from "@/components/token-avatar";
import { fetchDexScreenerToken } from "@/lib/dex-token";
import { fetchLaunches, fetchTokensLaunched } from "@/lib/launch-stats";
import { shortAddr } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Dashboard",
  description: "Tokens launched by iStonk, AAPL airdropped to holders, and leftover AAPL bought and burned.",
  path: "/dashboard",
});

function dropLabel(file: string | null): string | null {
  if (!file) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(file);
  if (!match) return file.replace(/\.csv$/, "");
  return new Date(`${match[1]}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function DashboardPage() {
  const [tokensLaunched, launches, airdrops] = await Promise.all([
    fetchTokensLaunched(),
    fetchLaunches(),
    loadAirdropSnapshot(),
  ]);
  const burnMeta = airdrops.burnTokenAddress
    ? await fetchDexScreenerToken(airdrops.burnTokenAddress)
    : null;
  const latestWhen = dropLabel(airdrops.latestFile);
  const burnName = burnMeta?.name ?? "Buy/burn token";
  const burnSymbol = burnMeta?.symbol ?? "TOKEN";

  return (
    <>
      <Aurora />
      <Nav />
      <main className="relative z-10 mx-auto flex w-full max-w-[1040px] flex-col gap-10 px-5 pb-20 pt-32">
        <header className="flex flex-col gap-2">
          <span className="text-[13px] text-muted">iStonk · public stats</span>
          <h1 className="text-[34px] font-extrabold leading-none tracking-[-0.035em] sm:text-[44px]">
            Dashboard
          </h1>
          <p className="max-w-[520px] text-[15px] leading-relaxed text-muted">
            Every coin launched from iMessage, live, plus tokenized AAPL sent to holders and the
            matching buy/burn after each local drop.
          </p>
        </header>

        <DashboardLive
          initialLaunches={launches}
          initialTokensLaunched={tokensLaunched}
          drops={airdrops.drops}
          burnSymbol={burnSymbol}
        />

        <section className="grid gap-6 md:grid-cols-3">
          <StatCard
            label="AAPL airdropped"
            value={airdrops.totalAapl.toLocaleString("en-US", { maximumFractionDigits: 4 })}
            note={
              airdrops.dropCount > 0
                ? `AAPL · ${airdrops.recipientCount} recipient${airdrops.recipientCount === 1 ? "" : "s"} · ${airdrops.dropCount} drop${airdrops.dropCount === 1 ? "" : "s"}`
                : "Copy a leaderboard CSV after the next send"
            }
          />
          <StatCard
            label={`${burnName} burned`}
            value={airdrops.totalBurned > 0 ? formatBurnAmount(airdrops.totalBurned) : "—"}
            note={
              airdrops.latestBuyBurn
                ? `$${burnSymbol} · buy/burn from leftover AAPL`
                : "Published after the next 50/50 send"
            }
            token={{ src: burnMeta?.imageUrl, symbol: burnSymbol }}
          />
          <StatCard
            label="Latest drop"
            value={latestWhen ?? "—"}
            note={
              airdrops.latest.length > 0
                ? `${airdrops.latest.length} wallet${airdrops.latest.length === 1 ? "" : "s"} paid`
                : "No sent airdrops yet"
            }
          />
        </section>

        <section className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-sm font-semibold">Latest drop · recipients</h2>
            {latestWhen ? <span className="text-xs text-faint">{latestWhen}</span> : null}
          </div>
          <div className="glass flex flex-col overflow-hidden rounded-[16px]">
            {airdrops.latest.length === 0 ? (
              <div className="px-5 py-6 text-[13px] text-muted">
                No sent airdrops yet. After{" "}
                <span className="font-mono">npm run send</span>, run{" "}
                <span className="font-mono">npm run publish-csv</span> in aapl-holder-drop.
              </div>
            ) : (
              <>
                <div className="hidden grid-cols-[auto_1fr_auto_auto] gap-3 px-5 py-2.5 text-[11px] uppercase tracking-[0.06em] text-faint sm:grid">
                  <span>Rank</span>
                  <span>Wallet</span>
                  <span className="text-right">AAPL</span>
                  <span className="text-right">Tx</span>
                </div>
                {airdrops.latest.map((row) => (
                  <DropRow key={row.txHash} row={row} />
                ))}
              </>
            )}
          </div>
          {airdrops.latestBuyBurn ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
              <span className="inline-flex items-center gap-2">
                <TokenAvatar src={burnMeta?.imageUrl} symbol={burnSymbol} size={18} />
                {formatBurnAmount(airdrops.latestBuyBurn.tokenOut)} ${burnSymbol} burned
              </span>
              {airdrops.latestBuyBurn.swapTxHash ? (
                <a
                  href={`https://basescan.org/tx/${airdrops.latestBuyBurn.swapTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:text-primary-hover"
                >
                  Swap
                </a>
              ) : null}
              <a
                href={`https://basescan.org/tx/${airdrops.latestBuyBurn.burnTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:text-primary-hover"
              >
                Burn
              </a>
            </div>
          ) : null}
        </section>

        <p className="text-[13px] text-muted">
          Want to launch the next one?{" "}
          <a href={site.bot.smsHref} className="font-medium text-primary hover:text-primary-hover">
            Text iStonk
          </a>
          {" · "}
          <Link href={site.links.app} className="font-medium text-primary hover:text-primary-hover">
            Open wallet
          </Link>
        </p>
      </main>
      <div className="relative z-10">
        <Footer />
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
    <div className="glass flex flex-col gap-2 rounded-[16px] px-5 py-6">
      <span className="inline-flex items-center gap-2 text-[13px] text-muted">
        {token ? <TokenAvatar src={token.src} symbol={token.symbol} size={20} /> : null}
        {label}
      </span>
      <span className="text-[32px] font-semibold leading-none tracking-[-0.03em] sm:text-[40px]">{value}</span>
      <span className="text-xs text-faint">{note}</span>
    </div>
  );
}

function DropRow({ row }: { row: AirdropRow }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-hairline px-5 py-3.5 sm:grid-cols-[auto_1fr_auto_auto]">
      <span className="w-8 font-mono text-[13px] text-muted tabular">{row.rank}</span>
      <span className="font-mono text-[13px] text-foreground/80">{shortAddr(row.wallet)}</span>
      <span className="text-right font-mono text-[13px] tabular">
        {formatAaplAmount(row.aapl)}
      </span>
      <a
        href={`https://basescan.org/tx/${row.txHash}`}
        target="_blank"
        rel="noreferrer"
        className="hidden items-center justify-end gap-1 text-[13px] text-primary hover:text-primary-hover sm:inline-flex"
      >
        Basescan
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M9 2h5v5" />
          <path d="M14 2 7 9" />
        </svg>
      </a>
    </div>
  );
}
