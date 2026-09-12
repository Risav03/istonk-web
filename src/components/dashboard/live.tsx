"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, ExternalLink, Flame, Rocket } from "lucide-react";

import type { AirdropDrop, TokenBurnDrop } from "@/lib/airdrops";
import type { MarketStats } from "@/lib/dex-stats";
import { shortAddr, timeAgo } from "@/lib/format";
import { stonksTokenUrl, type PublicLaunch } from "@/lib/launches";

import { BarChart, ChartCard, ColumnChart, useDailySeries, type ColumnDatum } from "./charts";

const POLL_MS = 15_000;
const PAGE = 25;

type Feed = {
  items: PublicLaunch[];
  tokensLaunched: number | null;
  market?: MarketStats;
  fetchedAt: string;
};
type Panel = "launches" | "airdrops";

export function DashboardLive({
  initialLaunches,
  initialTokensLaunched,
  initialMarket,
  drops,
  burnSymbol = "TOKEN",
  tokenBurns = [],
  tokenBurnSymbol = "TOKEN",
  airdropStats,
  airdropList,
}: {
  initialLaunches: PublicLaunch[];
  initialTokensLaunched: number | null;
  initialMarket?: MarketStats | null;
  drops: AirdropDrop[];
  burnSymbol?: string;
  tokenBurns?: TokenBurnDrop[];
  tokenBurnSymbol?: string;
  /** Server-rendered stat cards for the airdrop panel. */
  airdropStats?: ReactNode;
  /** Server-rendered latest-drop recipients + burn links. */
  airdropList?: ReactNode;
}) {
  const [panel, setPanel] = useState<Panel>("launches");
  const [launches, setLaunches] = useState<PublicLaunch[]>(initialLaunches);
  const [tokensLaunched, setTokensLaunched] = useState<number | null>(initialTokensLaunched);
  const [market, setMarket] = useState<MarketStats | null>(initialMarket ?? null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [fresh, setFresh] = useState<Set<number>>(() => new Set());
  const [status, setStatus] = useState<"live" | "stale">("live");
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

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void poll();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll]);

  // Chart inputs derived from the same feed so they move together.
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
  const dropSeries = useMemo<ColumnDatum[]>(
    () =>
      drops.map((d) => {
        const m = /^(\d{4}-\d{2}-\d{2})/.exec(d.file);
        const label = m
          ? new Date(`${m[1]}T00:00:00Z`).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })
          : d.file.replace(/\.csv$/, "");
        return {
          key: d.file,
          label,
          hint: `${label} · ${d.recipientCount} recipient${d.recipientCount === 1 ? "" : "s"}`,
          value: Number(d.totalAapl.toFixed(4)),
        };
      }),
    [drops],
  );
  const burnSeries = useMemo<ColumnDatum[]>(
    () =>
      drops
        .filter((d) => d.totalBurned > 0)
        .map((d) => {
          const m = /^(\d{4}-\d{2}-\d{2})/.exec(d.file);
          const label = m
            ? new Date(`${m[1]}T00:00:00Z`).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              })
            : d.file.replace(/\.csv$/, "");
          return {
            key: `${d.file}-burn`,
            label,
            hint: `${label} · burned`,
            value: Number(d.totalBurned.toFixed(4)),
          };
        }),
    [drops],
  );
  const tokenBurnSeries = useMemo<ColumnDatum[]>(
    () =>
      tokenBurns.map((d) => {
        const m = /^(\d{4}-\d{2}-\d{2})/.exec(d.file);
        const label = m
          ? new Date(`${m[1]}T00:00:00Z`).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })
          : d.file.replace(/\.tokenburn\.json$/i, "");
        return {
          key: d.burnTxHash,
          label,
          hint: `${label} · burned`,
          value: Number(d.amount.toFixed(4)),
        };
      }),
    [tokenBurns],
  );

  const last7 = daily.slice(-7).reduce((s, d) => s + d.value, 0);
  const prev7 = daily.slice(-14, -7).reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Narrow screens: switch panels instead of scrolling past one to reach the other. */}
      <div className="sticky top-[76px] z-20 flex justify-center lg:hidden">
        <div className="glass inline-flex rounded-full p-1">
          {(
            [
              { id: "launches", label: "Launches", Icon: Rocket },
              { id: "airdrops", label: "Airdrops & burns", Icon: Flame },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPanel(t.id)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors ${
                panel === t.id ? "bg-primary text-white" : "text-muted hover:text-foreground"
              }`}
            >
              <t.Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-2">
        {/* ---------- Launches ---------- */}
        <section
          className={`flex-col gap-5 ${panel === "launches" ? "flex" : "hidden lg:flex"}`}
          aria-label="Launches"
        >
          <PanelHeader
            icon={<Rocket className="h-4 w-4" />}
            title="Launches"
            sub={
              <LiveDot status={status} fetchedAt={fetchedAt} />
            }
          />

          <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
            <Stat
              label="Launched"
              value={tokensLaunched == null ? "—" : tokensLaunched.toLocaleString("en-US")}
              note="On Stonks Exchange"
            />
            <Stat
              label="Last 7 days"
              value={last7.toLocaleString("en-US")}
              note={
                prev7 === 0
                  ? "vs 0 prior week"
                  : `${last7 >= prev7 ? "+" : ""}${last7 - prev7} vs prior week`
              }
            />
            <Stat
              label="24h volume"
              value={market ? formatUsdCompact(market.volume24hUsd) : "—"}
              note={
                market
                  ? `${market.activeTokens} of ${market.coveredTokens} coin${market.coveredTokens === 1 ? "" : "s"} traded`
                  : "Loading from DexScreener"
              }
            />
            <Stat
              label="24h trades"
              value={market ? market.trades24h.toLocaleString("en-US") : "—"}
              note="Buys + sells, all coins"
            />
          </div>

          <ChartCard title="Launches per day" subtitle="Last 30 days, UTC">
            <ColumnChart data={daily} valueLabel="launches" emptyText="No launches in the last 30 days" />
          </ChartCard>
          <ChartCard title="Launches by pair" subtitle={`Of the latest ${launches.length}`}>
            <BarChart data={byPair} valueLabel="launches" />
          </ChartCard>

          <LaunchFeed launches={launches} fresh={fresh} />
        </section>

        {/* ---------- Airdrops & buy/burn ---------- */}
        <section
          className={`flex-col gap-5 ${panel === "airdrops" ? "flex" : "hidden lg:flex"}`}
          aria-label="Airdrops and buy/burn"
        >
          <PanelHeader
            icon={<Flame className="h-4 w-4" />}
            title="Airdrops & burns"
            sub={<span className="text-xs text-faint">AAPL to holders, leftover AAPL buy/burn, and source-token burns</span>}
          />

          <div>{airdropStats}</div>

          {dropSeries.length > 0 ? (
            <ChartCard title="AAPL airdropped per drop" subtitle="Sent to holders">
              <ColumnChart data={dropSeries} valueLabel="AAPL" height={150} />
            </ChartCard>
          ) : null}
          {burnSeries.length > 0 ? (
            <ChartCard title={`${burnSymbol} burned per drop`} subtitle="Bought with leftover AAPL, then burned">
              <ColumnChart data={burnSeries} valueLabel={burnSymbol} height={150} />
            </ChartCard>
          ) : null}
          {tokenBurnSeries.length > 0 ? (
            <ChartCard title={`${tokenBurnSymbol} burned`} subtitle="Sent to the dead address per drop">
              <ColumnChart data={tokenBurnSeries} valueLabel={tokenBurnSymbol} height={150} />
            </ChartCard>
          ) : null}

          <div>{airdropList}</div>
        </section>
      </div>
    </div>
  );
}

function PanelHeader({ icon, title, sub }: { icon: ReactNode; title: string; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="inline-flex items-center gap-2 text-[17px] font-bold tracking-tight">
        <span className="glass inline-flex h-7 w-7 items-center justify-center rounded-full text-primary">{icon}</span>
        {title}
      </h2>
      {sub}
    </div>
  );
}

function LiveDot({ status, fetchedAt }: { status: "live" | "stale"; fetchedAt: string | null }) {
  return (
    <span className="flex items-center gap-2 text-xs text-faint">
      <span className="relative flex h-1.5 w-1.5">
        {status === "live" ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
        ) : null}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${status === "live" ? "bg-primary" : "bg-faint"}`} />
      </span>
      {status === "live"
        ? `Live · refreshes every ${POLL_MS / 1000}s${fetchedAt ? ` · updated ${timeAgo(fetchedAt) ?? "just now"}` : ""}`
        : "Couldn't reach the API · retrying"}
    </span>
  );
}

function formatUsdCompact(n: number): string {
  if (n >= 10_000) return `$${n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 })}`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: n >= 100 ? 0 : 2 })}`;
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="glass flex min-w-0 flex-col gap-1.5 rounded-[16px] px-4 py-4">
      <span className="truncate text-[12px] text-muted">{label}</span>
      <span className="text-[26px] font-semibold leading-none tracking-[-0.03em] sm:text-[30px]">{value}</span>
      <span className="truncate text-[11px] text-faint">{note}</span>
    </div>
  );
}

/* ---------- Launch feed ---------- */

function LaunchFeed({ launches, fresh }: { launches: PublicLaunch[]; fresh: Set<number> }) {
  const [shown, setShown] = useState(PAGE);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return launches;
    return launches.filter(
      (l) =>
        (l.tokenName ?? "").toLowerCase().includes(q) ||
        (l.tokenSymbol ?? "").toLowerCase().includes(q) ||
        (l.pairSymbol ?? "").toLowerCase().includes(q) ||
        (l.tokenAddress ?? "").toLowerCase().includes(q),
    );
  }, [launches, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">
          Launched tokens <span className="font-normal text-faint">· {launches.length}</span>
        </h3>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShown(PAGE);
          }}
          placeholder="Search name, ticker, pair, 0x"
          className="h-9 w-[200px] rounded-full border border-border-strong bg-white/70 px-3.5 text-[13px] outline-none transition-colors focus:border-primary sm:w-[240px]"
        />
      </div>

      <div className="glass flex flex-col overflow-hidden rounded-[16px]">
        <div className="hidden grid-cols-[1fr_84px_128px_auto] gap-3 px-4 py-2.5 text-[11px] uppercase tracking-[0.06em] text-faint sm:grid">
          <span>Token</span>
          <span>Pair</span>
          <span>Contract</span>
          <span className="text-right">Links</span>
        </div>
        {/* Scrolls inside the panel so the airdrop column stays in view beside it. */}
        <div className="max-h-[560px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-[13px] text-muted">
              {launches.length === 0 ? "No launches yet. Text iStonk and say launch." : "Nothing matches that search."}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.slice(0, shown).map((l) => (
                <LaunchRow key={l.id} launch={l} isNew={fresh.has(l.id)} />
              ))}
            </AnimatePresence>
          )}
          {filtered.length > shown ? (
            <button
              type="button"
              onClick={() => setShown((s) => s + PAGE)}
              className="w-full border-t border-hairline px-4 py-3 text-[13px] font-medium text-primary transition-colors hover:bg-white/50"
            >
              Show {Math.min(PAGE, filtered.length - shown)} more · {filtered.length - shown} left
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LaunchRow({ launch, isNew }: { launch: PublicLaunch; isNew: boolean }) {
  const [copied, setCopied] = useState(false);
  const addr = launch.tokenAddress;
  const when = timeAgo(launch.createdAt);

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
      initial={{ opacity: 0, y: -12, backgroundColor: "rgba(47,91,255,0.12)" }}
      animate={{ opacity: 1, y: 0, backgroundColor: isNew ? "rgba(47,91,255,0.08)" : "rgba(47,91,255,0)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 border-t border-hairline px-4 py-3 sm:grid-cols-[1fr_84px_128px_auto]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="h-8 w-8 shrink-0 rounded-full bg-[linear-gradient(135deg,var(--iris-blue),var(--iris-magenta),var(--iris-peach))]" />
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2">
            <span className="truncate text-[14px] font-semibold">{launch.tokenName ?? "Unnamed"}</span>
            {launch.tokenSymbol ? (
              <span className="shrink-0 font-mono text-[12px] text-muted">${launch.tokenSymbol}</span>
            ) : null}
            {isNew ? (
              <span className="shrink-0 rounded-full bg-primary-dim px-1.5 py-[1px] text-[10px] font-semibold text-primary">
                NEW
              </span>
            ) : null}
          </span>
          <span className="text-[12px] text-faint">
            {when ?? "·"} · by {shortAddr(launch.launcher)}
          </span>
        </div>
      </div>

      <span className="order-3 font-mono text-[12px] text-foreground/80 sm:order-none">
        {launch.pairSymbol ? `vs ${launch.pairSymbol}` : "·"}
      </span>

      <button
        type="button"
        onClick={copy}
        disabled={!addr}
        title={addr ?? undefined}
        className="order-4 inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-white/60 px-2.5 py-1 font-mono text-[12px] text-foreground/80 transition-colors hover:bg-white disabled:opacity-50 sm:order-none"
      >
        {addr ? shortAddr(addr) : "pending"}
        {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3 text-faint" />}
      </button>

      <span className="order-2 flex items-center justify-end gap-2.5 text-[12px] sm:order-none">
        {addr ? (
          <a
            href={stonksTokenUrl(addr)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary-hover"
          >
            Stonks <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
        {launch.explorerUrl ? (
          <a
            href={launch.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-muted hover:text-foreground"
          >
            Tx <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </span>
    </motion.div>
  );
}
