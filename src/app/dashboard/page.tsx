import Link from "next/link";

import { Aurora } from "@/components/landing/aurora";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import {
  formatAaplAmount,
  formatBurnAmount,
  loadAirdropSnapshot,
  type AirdropRow,
  type TokenBurnDrop,
} from "@/lib/airdrops";
import { DashboardLive } from "@/components/dashboard/live";
import { TokenAvatar } from "@/components/token-avatar";
import { fetchMarketStats } from "@/lib/dex-stats";
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

function dropLabel(file: string | null, withYear = true): string | null {
  if (!file) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(file);
  if (!match) return file.replace(/\.csv$/, "");
  return new Date(`${match[1]}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" as const } : {}),
    timeZone: "UTC",
  });
}

export default async function DashboardPage() {
  const [tokensLaunched, launches, airdrops] = await Promise.all([
    fetchTokensLaunched(),
    fetchLaunches(),
    loadAirdropSnapshot(),
  ]);
  const [burnMeta, sourceMeta, market] = await Promise.all([
    airdrops.burnTokenAddress ? fetchDexScreenerToken(airdrops.burnTokenAddress) : null,
    airdrops.sourceTokenAddress ? fetchDexScreenerToken(airdrops.sourceTokenAddress) : null,
    fetchMarketStats(launches.map((l) => l.tokenAddress)),
  ]);
  const latestWhen = dropLabel(airdrops.latestFile);
  const latestShort = dropLabel(airdrops.latestFile, false);
  const burnSymbol = burnMeta?.symbol ?? "TOKEN";
  const sourceName = sourceMeta?.name ?? "Source token";
  const sourceSymbol = sourceMeta?.symbol ?? "TOKEN";

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
            Every coin launched from iMessage, live, plus tokenized AAPL sent to holders and the
            matching buy/burn after each local drop.
          </p>
        </header>

        <DashboardLive
          initialLaunches={launches}
          initialTokensLaunched={tokensLaunched}
          initialMarket={market}
          drops={airdrops.drops}
          burnSymbol={burnSymbol}
          tokenBurns={airdrops.tokenBurns}
          tokenBurnSymbol={sourceSymbol}
          airdropStats={
            <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
              <StatCard
                label="AAPL airdropped"
                value={airdrops.totalAapl.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                note={
                  airdrops.dropCount > 0
                    ? `${airdrops.recipientCount} recipient${airdrops.recipientCount === 1 ? "" : "s"} · ${airdrops.dropCount} drop${airdrops.dropCount === 1 ? "" : "s"}`
                    : "After the next send"
                }
              />
              <StatCard
                label={`${burnSymbol} burned`}
                value={airdrops.totalBurned > 0 ? formatBurnAmount(airdrops.totalBurned) : "—"}
                note={airdrops.latestBuyBurn ? "From leftover AAPL" : "After the next 50/50 send"}
                token={{ src: burnMeta?.imageUrl, symbol: burnSymbol }}
              />
              <StatCard
                label={`${sourceSymbol} burned`}
                value={airdrops.totalTokenBurned > 0 ? formatBurnAmount(airdrops.totalTokenBurned) : "—"}
                note={
                  airdrops.tokenBurns.length > 0
                    ? `${sourceName} · ${airdrops.tokenBurns.length} burn${airdrops.tokenBurns.length === 1 ? "" : "s"}`
                    : "Sent to the dead address"
                }
                token={{ src: sourceMeta?.imageUrl, symbol: sourceSymbol }}
              />
              <StatCard
                label="Latest drop"
                value={latestShort ?? "—"}
                note={
                  airdrops.latest.length > 0
                    ? `${airdrops.latest.length} wallet${airdrops.latest.length === 1 ? "" : "s"} paid`
                    : "No sent airdrops yet"
                }
              />
            </div>
          }
          airdropList={
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">
                  Latest drop · recipients{" "}
                  {airdrops.latest.length > 0 ? (
                    <span className="font-normal text-faint">· {airdrops.latest.length}</span>
                  ) : null}
                </h3>
                {latestWhen ? <span className="text-xs text-faint">{latestWhen}</span> : null}
              </div>
              <div className="glass flex flex-col overflow-hidden rounded-[16px]">
                {airdrops.latest.length === 0 ? (
                  <div className="px-4 py-6 text-[13px] text-muted">
                    No sent airdrops yet. After <span className="font-mono">npm run send</span>, run{" "}
                    <span className="font-mono">npm run publish-csv</span> in aapl-holder-drop.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 py-2.5 text-[11px] uppercase tracking-[0.06em] text-faint">
                      <span className="w-8">#</span>
                      <span>Wallet</span>
                      <span className="text-right">AAPL</span>
                      <span className="text-right">Tx</span>
                    </div>
                    {/* Scrolls inside the panel so it sits beside the launch feed. */}
                    <div className="max-h-[560px] overflow-y-auto">
                      {airdrops.latest.map((row) => (
                        <DropRow key={row.txHash} row={row} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {airdrops.latestBuyBurn ? (
                <div className="glass flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[16px] px-4 py-3 text-[13px] text-muted">
                  <span className="inline-flex items-center gap-2 text-foreground">
                    <TokenAvatar src={burnMeta?.imageUrl} symbol={burnSymbol} size={18} />
                    {formatBurnAmount(airdrops.latestBuyBurn.tokenOut)} ${burnSymbol} burned this drop
                  </span>
                  {airdrops.latestBuyBurn.swapTxHash ? (
                    <a
                      href={`https://basescan.org/tx/${airdrops.latestBuyBurn.swapTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary hover:text-primary-hover"
                    >
                      Swap tx
                    </a>
                  ) : null}
                  <a
                    href={`https://basescan.org/tx/${airdrops.latestBuyBurn.burnTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:text-primary-hover"
                  >
                    Burn tx
                  </a>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
                    <TokenAvatar src={sourceMeta?.imageUrl} symbol={sourceSymbol} size={18} />
                    ${sourceSymbol} burned
                    {airdrops.tokenBurns.length > 0 ? (
                      <span className="font-normal text-faint">· {airdrops.tokenBurns.length}</span>
                    ) : null}
                  </h3>
                  <span className="text-xs text-faint">
                    {airdrops.totalTokenBurned > 0
                      ? `${formatBurnAmount(airdrops.totalTokenBurned)} total`
                      : `${sourceName} sent to the dead address`}
                  </span>
                </div>
                <div className="glass flex flex-col overflow-hidden rounded-[16px]">
                  {airdrops.tokenBurns.length === 0 ? (
                    <div className="px-4 py-6 text-[13px] text-muted">
                      No source-token burns yet. After{" "}
                      <span className="font-mono">npm run burn-token</span>, run{" "}
                      <span className="font-mono">npm run publish-csv</span>.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2.5 text-[11px] uppercase tracking-[0.06em] text-faint">
                        <span>When</span>
                        <span className="text-right">Amount</span>
                        <span className="text-right">Tx</span>
                      </div>
                      {airdrops.tokenBurns
                        .slice()
                        .reverse()
                        .map((row) => (
                          <TokenBurnRow key={row.burnTxHash} row={row} />
                        ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          }
        />

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

function TokenBurnRow({ row }: { row: TokenBurnDrop }) {
  const when = dropLabel(row.file) ?? row.file.replace(/\.tokenburn\.json$/i, "");
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-hairline px-4 py-3">
      <span className="text-[13px] text-foreground/80">{when}</span>
      <span className="text-right font-mono text-[13px] tabular">{formatBurnAmount(row.amount)}</span>
      <a
        href={`https://basescan.org/tx/${row.burnTxHash}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-end gap-1 text-[13px] text-primary hover:text-primary-hover"
      >
        Tx
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

function DropRow({ row }: { row: AirdropRow }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-t border-hairline px-4 py-3">
      <span className="w-8 font-mono text-[13px] text-muted tabular">{row.rank}</span>
      <span className="font-mono text-[13px] text-foreground/80">{shortAddr(row.wallet)}</span>
      <span className="text-right font-mono text-[13px] tabular">
        {formatAaplAmount(row.aapl)}
      </span>
      <a
        href={`https://basescan.org/tx/${row.txHash}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-end gap-1 text-[13px] text-primary hover:text-primary-hover"
      >
        Tx
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
