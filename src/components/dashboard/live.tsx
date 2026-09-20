"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { TokenBurnDrop } from "@/lib/airdrop-format";
import { formatBurnAmount, formatDropStamp } from "@/lib/airdrop-format";
import { Eyebrow, ExternalIcon, Figure, Panel, TokenLogo } from "@/components/ds";
import type { MarketStats, TokenMarket } from "@/lib/dex-stats";
import { shortAddr, timeAgo } from "@/lib/format";
import { stonksTokenUrl, type PublicLaunch } from "@/lib/launches";

import { BarChart, ChartCard, ColumnChart, useDailyAmountSeries, useDailySeries } from "./charts";

const POLL_MS = 15_000;
const PAGE = 10;

type Feed = {
  items: PublicLaunch[];
  tokensLaunched: number | null;
  market?: MarketStats;
  fetchedAt: string;
};

type BurnsFeed = {
  tokenBurns?: TokenBurnDrop[];
};

function mergeByTx<T extends { burnTxHash: string; at?: string }>(base: T[], extra: T[]): T[] {
  const map = new Map(base.map((row) => [row.burnTxHash, row]));
  for (const row of extra) {
    const prev = map.get(row.burnTxHash);
    map.set(row.burnTxHash, prev ? { ...prev, ...row, at: row.at ?? prev.at } : row);
  }
  return [...map.values()];
}

type PanelId = "launches" | "burns";

export function DashboardLive({
  initialLaunches,
  initialTokensLaunched,
  initialMarket,
  tokenBurns = [],
  tokenBurnSymbol = "TOKEN",
  sourceTokenImage = null,
  sourceName = "Source token",
  burnStats,
}: {
  initialLaunches: PublicLaunch[];
  initialTokensLaunched: number | null;
  initialMarket?: MarketStats | null;
  tokenBurns?: TokenBurnDrop[];
  tokenBurnSymbol?: string;
  sourceTokenImage?: string | null;
  sourceName?: string;
  burnStats?: ReactNode;
}) {
  const [panel, setPanel] = useState<PanelId>("launches");
  const [launches, setLaunches] = useState<PublicLaunch[]>(initialLaunches);
  const [tokensLaunched, setTokensLaunched] = useState<number | null>(initialTokensLaunched);
  const [market, setMarket] = useState<MarketStats | null>(initialMarket ?? null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [fresh, setFresh] = useState<Set<number>>(() => new Set());
  const [status, setStatus] = useState<"live" | "stale">("live");
  const [liveTokenBurns, setLiveTokenBurns] = useState<TokenBurnDrop[]>(tokenBurns);
  const seen = useRef<Set<number>>(new Set(initialLaunches.map((l) => l.id)));

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/public/launches", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as Feed;
      const arrivals = body.items.filter((l) => !seen.current.has(l.id)).map((l) => l.id);
      for (const id of arrivals) seen.current.add(id);
      if (arrivals.length) {
        setFresh((prev) => new Set([...prev, ...arrivals]));
        setTimeout(() => {
          setFresh((prev) => {
            const next = new Set(prev);
            for (const id of arrivals) next.delete(id);
            return next;
          });
        }, 8000);
      }
      setLaunches(body.items);
      if (typeof body.tokensLaunched === "number") setTokensLaunched(body.tokensLaunched);
      if (body.market) setMarket(body.market);
      setFetchedAt(body.fetchedAt);
      setStatus("live");
    } catch {
      setStatus("stale");
    }
  }, []);

  const pollBurns = useCallback(async () => {
    try {
      const res = await fetch("/api/public/burns", { cache: "no-store" });
      if (!res.ok) return;
      const body = (await res.json()) as BurnsFeed;
      if (Array.isArray(body.tokenBurns)) {
        setLiveTokenBurns((prev) => mergeByTx(prev, body.tokenBurns ?? []));
      }
    } catch {
      /* keep last good burns */
    }
  }, []);

  useEffect(() => {
    void pollBurns();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        void poll();
        void pollBurns();
      }
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void poll();
        void pollBurns();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll, pollBurns]);

  const dates = useMemo(() => launches.map((l) => l.createdAt), [launches]);
  const daily = useDailySeries(dates, 30);
  const byPair = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of launches) {
      const k = l.pairSymbol ?? "unknown";
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 6).map(([label, value]) => ({ key: label, label, value }));
    const rest = sorted.slice(6).reduce((s, [, v]) => s + v, 0);
    if (rest > 0) top.push({ key: "other", label: "Other", value: rest });
    return top;
  }, [launches]);
  const tokenBurnPoints = useMemo(
    () => liveTokenBurns.map((d) => ({ file: d.file, value: d.amount })),
    [liveTokenBurns],
  );
  const tokenBurnSeries = useDailyAmountSeries(tokenBurnPoints, 14);

  const last7 = daily.slice(-7).reduce((s, d) => s + d.value, 0);
  const prev7 = daily.slice(-14, -7).reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center xl:hidden">
        <Segmented
          value={panel}
          onChange={setPanel}
          options={[
            { id: "launches", label: "Launches" },
            { id: "burns", label: `${tokenBurnSymbol} burns` },
          ]}
        />
      </div>

      <div className="grid items-start gap-9 xl:grid-cols-2">
        <section
          className={`flex-col gap-5 ${panel === "launches" ? "flex" : "hidden xl:flex"}`}
          aria-label="Launches"
        >
          <BoardHead title="Launches" sub={<LiveDot status={status} fetchedAt={fetchedAt} />} />

          <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
            <StatCard
              label="Launched"
              value={tokensLaunched == null ? "—" : tokensLaunched.toLocaleString("en-US")}
              note="On Stonks Exchange"
            />
            <StatCard
              label="Last 7 days"
              value={last7.toLocaleString("en-US")}
              note={
                prev7 === 0
                  ? "vs 0 prior week"
                  : `${last7 >= prev7 ? "+" : ""}${last7 - prev7} vs prior week`
              }
              tone={prev7 === 0 ? "ink" : last7 >= prev7 ? "up" : "down"}
            />
            <StatCard
              label="24h volume"
              value={market ? formatUsdCompact(market.volume24hUsd) : "—"}
              note={
                market
                  ? `${market.activeTokens} of ${market.coveredTokens} coin${market.coveredTokens === 1 ? "" : "s"} traded`
                  : "Loading from DexScreener"
              }
            />
            <StatCard
              label="24h trades"
              value={market ? market.trades24h.toLocaleString("en-US") : "—"}
              note="Buys + sells, all coins"
            />
          </div>

          <LaunchFeed launches={launches} fresh={fresh} market={market} />
          <ChartCard title="Launches per day" subtitle="Last 30 days, UTC">
            <ColumnChart data={daily} valueLabel="launches" emptyText="No launches in the last 30 days" />
          </ChartCard>
          <ChartCard title="Launches by pair" subtitle={`Of the latest ${launches.length}`}>
            <BarChart data={byPair} valueLabel="launches" />
          </ChartCard>
        </section>

        <section
          className={`flex-col gap-5 ${panel === "burns" ? "flex" : "hidden xl:flex"}`}
          aria-label={`${tokenBurnSymbol} burns`}
        >
          <BoardHead
            title={`${tokenBurnSymbol} burns`}
            sub={
              <span style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
                {tokenBurnSymbol} bought and burned — supply gone
              </span>
            }
          />

          <div>{burnStats}</div>

          {tokenBurnSeries.some((d) => d.value > 0) ? (
            <ChartCard title={`${tokenBurnSymbol} burned`} subtitle="Per UTC day · sent to the dead address">
              <ColumnChart data={tokenBurnSeries} valueLabel={tokenBurnSymbol} height={150} />
            </ChartCard>
          ) : null}

          {liveTokenBurns.length > 0 ? (
            <BurnList
              title={`$${tokenBurnSymbol} burned`}
              note={`${sourceName} sent to the dead address`}
              image={sourceTokenImage}
              symbol={tokenBurnSymbol}
              rows={liveTokenBurns.map((row) => ({
                key: row.burnTxHash,
                when: row.file,
                at: row.at,
                amount: row.amount,
                burnTx: row.burnTxHash,
              }))}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: Array<{ id: T; label: string }>;
}) {
  return (
    <div
      className="inline-flex gap-1 border border-rule p-1"
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--r-pill)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className="istonk-press inline-flex h-8 items-center px-4"
            style={{
              borderRadius: "var(--r-pill)",
              border: 0,
              background: on ? "var(--action-primary)" : "transparent",
              color: on ? "var(--text-on-ink)" : "var(--text-secondary)",
              font: "var(--type-label)",
              letterSpacing: "var(--track-tight)",
              cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Table head: uppercase micro, on paper, above the card. */
function TableHead({ cols, className }: { cols: ReactNode[]; className: string }) {
  return (
    <div className={className}>
      {cols.map((c, i) => (
        <Eyebrow key={i} style={{ color: "var(--text-tertiary)" }}>
          {c}
        </Eyebrow>
      ))}
    </div>
  );
}

function BurnList({
  title,
  note,
  image,
  symbol,
  rows,
}: {
  title: string;
  note: string;
  image?: string | null;
  symbol: string;
  rows: Array<{ key: string; when: string; at?: string; amount: number; burnTx: string }>;
}) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 font-text-face" style={{ font: "var(--type-h3)" }}>
          <TokenLogo src={image} symbol={symbol} size={18} />
          {title}
          <span style={{ font: "var(--type-body-sm)", color: "var(--text-tertiary)" }}>
            · {rows.length}
          </span>
        </h3>
        <span style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
          {total > 0 ? `${formatBurnAmount(total)} total` : note}
        </span>
      </div>
      <Panel>
        <TableHead
          className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2.5 [&>*:not(:first-child)]:text-right"
          cols={["When", "Amount", "Tx"]}
        />
        {rows
          .slice()
          .reverse()
          .map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-rule px-4 py-3"
            >
              <span style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
                {formatDropStamp(row.when, { withYear: true, withTime: "auto", at: row.at })}
              </span>
              <span className="type-mono istonk-tabular text-right">{formatBurnAmount(row.amount)}</span>
              <a
                href={`https://basescan.org/tx/${row.burnTx}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 no-underline"
                style={{ font: "var(--type-label)" }}
              >
                Burn <ExternalIcon />
              </a>
            </div>
          ))}
      </Panel>
    </div>
  );
}

function BoardHead({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="type-h1 font-text-face">{title}</h2>
      {sub}
    </div>
  );
}

/** Status is a 6px dot plus a word. Never a coloured icon, never a pulse. */
function LiveDot({ status, fetchedAt }: { status: "live" | "stale"; fetchedAt: string | null }) {
  const live = status === "live";
  return (
    <span
      className="inline-flex items-center gap-2"
      style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
      suppressHydrationWarning
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: "var(--r-pill)",
          background: live ? "var(--live)" : "var(--pending)",
        }}
      />
      {live
        ? `Live · refreshes every ${POLL_MS / 1000}s${fetchedAt ? ` · updated ${timeAgo(fetchedAt) ?? "just now"}` : ""}`
        : "Couldn't reach the API · retrying"}
    </span>
  );
}

function formatUsdCompact(n: number): string {
  if (n >= 10_000) return `$${n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 })}`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: n >= 100 ? 0 : 2 })}`;
}

export function StatCard({
  label,
  value,
  note,
  tone = "ink",
  token,
}: {
  label: string;
  value: string;
  note: string;
  tone?: "ink" | "up" | "down";
  token?: { src?: string | null; symbol: string };
}) {
  return (
    <Panel className="flex min-w-0 flex-col gap-1.5 px-4 py-4">
      <span
        className="inline-flex min-w-0 items-center gap-2 truncate"
        style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
      >
        {token ? <TokenLogo src={token.src} symbol={token.symbol} size={18} /> : null}
        {label}
      </span>
      <Figure value={value} size="lg" />
      <span
        className="truncate"
        style={{
          font: "var(--type-legal)",
          color: tone === "ink" ? "var(--text-tertiary)" : `var(--${tone})`,
        }}
      >
        {note}
      </span>
    </Panel>
  );
}

function marketFor(market: MarketStats | null, address: string | null): TokenMarket | null {
  if (!market || !address) return null;
  return market.byToken[address.toLowerCase()] ?? null;
}

function LaunchFeed({
  launches,
  fresh,
  market,
}: {
  launches: PublicLaunch[];
  fresh: Set<number>;
  market: MarketStats | null;
}) {
  const [shown, setShown] = useState(PAGE);
  const [query, setQuery] = useState("");

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? launches.filter(
          (l) =>
            (l.tokenName ?? "").toLowerCase().includes(q) ||
            (l.tokenSymbol ?? "").toLowerCase().includes(q) ||
            (l.pairSymbol ?? "").toLowerCase().includes(q) ||
            (l.tokenAddress ?? "").toLowerCase().includes(q),
        )
      : launches;
    return [...rows].sort((a, b) => {
      const volA = marketFor(market, a.tokenAddress)?.volume24hUsd ?? 0;
      const volB = marketFor(market, b.tokenAddress)?.volume24hUsd ?? 0;
      if (volB !== volA) return volB - volA;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
  }, [launches, market, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-text-face" style={{ font: "var(--type-h3)" }}>
          Volume leaderboard{" "}
          <span style={{ font: "var(--type-body-sm)", color: "var(--text-tertiary)" }}>
            · 24h · {launches.length}
          </span>
        </h3>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShown(PAGE);
          }}
          placeholder="Search name, ticker, pair, 0x"
          className="h-10 w-full border border-rule-strong px-3.5 sm:w-[248px]"
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--r-field)",
            boxShadow: "var(--shadow-flat)",
            font: "var(--type-body-sm)",
            outline: "none",
          }}
        />
      </div>

      <TableHead
        className="hidden grid-cols-[minmax(0,1fr)_88px_140px] gap-3 px-4 sm:grid [&>*:not(:first-child)]:text-right"
        cols={["Token", "24h vol", "Links"]}
      />
      <Panel>
        <div>
          {ranked.length === 0 ? (
            <div className="px-4 py-6" style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
              {launches.length === 0 ? "No launches yet. Text iStonk and say launch." : "Nothing matches that search."}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {ranked.slice(0, shown).map((l, i) => (
                <LaunchRow
                  key={l.id}
                  launch={l}
                  rank={i + 1}
                  isNew={fresh.has(l.id)}
                  stats={marketFor(market, l.tokenAddress)}
                />
              ))}
            </AnimatePresence>
          )}
          {ranked.length > shown ? (
            <button
              type="button"
              onClick={() => setShown((s) => s + PAGE)}
              className="w-full px-4 py-3.5"
              style={{
                background: "transparent",
                border: 0,
                borderTop: "1px solid var(--rule)",
                font: "var(--type-label)",
                color: "var(--text-accent)",
                cursor: "pointer",
              }}
            >
              Show {Math.min(PAGE, ranked.length - shown)} more · {ranked.length - shown} left
            </button>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

function LaunchRow({
  launch,
  rank,
  isNew,
  stats,
}: {
  launch: PublicLaunch;
  rank: number;
  isNew: boolean;
  stats: TokenMarket | null;
}) {
  const [copied, setCopied] = useState(false);
  const addr = launch.tokenAddress;
  const when = timeAgo(launch.createdAt);
  const volume = stats?.volume24hUsd ?? 0;

  async function copy() {
    if (!addr) return;
    try {
      await navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; nothing to do */
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, backgroundColor: "rgba(255,90,20,0.10)" }}
      animate={{ opacity: 1, y: 0, backgroundColor: isNew ? "rgba(255,90,20,0.06)" : "rgba(255,90,20,0)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-t border-rule px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_88px_140px]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="type-mono-sm istonk-tabular w-5 shrink-0 text-right" style={{ color: "var(--text-tertiary)" }}>
          {rank}
        </span>
        <TokenLogo src={stats?.imageUrl} symbol={launch.tokenSymbol ?? "TOKEN"} size={32} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="min-w-0 truncate" style={{ font: "var(--type-label)" }}>
              {launch.tokenName ?? "Unnamed"}
            </span>
            {launch.tokenSymbol ? (
              <span className="type-mono-sm max-w-full truncate" style={{ color: "var(--text-secondary)" }}>
                ${launch.tokenSymbol}
              </span>
            ) : null}
            {isNew ? <NewTag /> : null}
          </span>
          <span
            className="truncate"
            style={{ font: "var(--type-legal)", color: "var(--text-tertiary)" }}
            suppressHydrationWarning
          >
            {when ?? "·"}
            {launch.pairSymbol ? ` · vs ${launch.pairSymbol}` : ""} · by{" "}
            {shortAddr(launch.launcher)}
          </span>
        </div>
      </div>

      {/* Mobile: volume sits top-right beside the identity so the name keeps the width. */}
      <span className="flex flex-col items-end gap-0.5 sm:hidden">
        <Figure value={stats ? formatUsdCompact(volume) : "—"} size="sm" mono />
        <Eyebrow style={{ color: "var(--text-tertiary)" }}>24h vol</Eyebrow>
      </span>

      {/* Mobile: links get a second full-width row; on sm+ `contents` flattens
          volume and links into the two trailing grid cells. */}
      <div className="col-span-2 flex min-w-0 items-center justify-end gap-3 sm:contents">
        <span className="hidden justify-end sm:flex">
          <Figure value={stats ? formatUsdCompact(volume) : "—"} size="sm" mono tone="muted" />
        </span>

        <span className="flex shrink-0 items-center justify-end gap-3 sm:gap-2.5">
          {addr ? (
            <a
              href={stonksTokenUrl(addr)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 no-underline"
              style={{ font: "var(--type-micro)" }}
            >
              Stonks <ExternalIcon />
            </a>
          ) : null}
          {launch.explorerUrl ? (
            <a
              href={launch.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 no-underline"
              style={{ font: "var(--type-micro)", color: "var(--text-secondary)" }}
            >
              Tx <ExternalIcon />
            </a>
          ) : null}
          {addr ? (
            <button
              type="button"
              onClick={copy}
              title={addr}
              style={{
                background: "transparent",
                border: 0,
                padding: 0,
                cursor: "pointer",
                font: "var(--type-micro)",
                color: copied ? "var(--up)" : "var(--text-secondary)",
              }}
            >
              {copied ? "Copied" : "Copy"}
              <span className="sr-only"> contract address</span>
            </button>
          ) : null}
        </span>
      </div>
    </motion.div>
  );
}

function NewTag() {
  return (
    <span
      className="istonk-caps shrink-0 px-1.5 py-[1px]"
      style={{
        background: "var(--tang-50)",
        color: "var(--text-accent)",
        borderRadius: "var(--r-xs)",
      }}
    >
      New
    </span>
  );
}
