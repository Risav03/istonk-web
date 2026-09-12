"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, ExternalLink } from "lucide-react";

import type { AirdropDrop } from "@/lib/airdrops";
import { shortAddr, timeAgo } from "@/lib/format";
import { stonksTokenUrl, type PublicLaunch } from "@/lib/launches";

import { BarChart, ChartCard, ColumnChart, useDailySeries, type ColumnDatum } from "./charts";

const POLL_MS = 15_000;
const PAGE = 25;

type Feed = { items: PublicLaunch[]; tokensLaunched: number | null; fetchedAt: string };

export function DashboardLive({
  initialLaunches,
  initialTokensLaunched,
  drops,
}: {
  initialLaunches: PublicLaunch[];
  initialTokensLaunched: number | null;
  drops: AirdropDrop[];
}) {
  const [launches, setLaunches] = useState<PublicLaunch[]>(initialLaunches);
  const [tokensLaunched, setTokensLaunched] = useState<number | null>(initialTokensLaunched);
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

  const last7 = daily.slice(-7).reduce((s, d) => s + d.value, 0);
  const prev7 = daily.slice(-14, -7).reduce((s, d) => s + d.value, 0);

  return (
    <>
      <section className="grid gap-6 md:grid-cols-3">
        <Stat
          label="Tokens launched"
          value={tokensLaunched == null ? "—" : tokensLaunched.toLocaleString("en-US")}
          note="Successful launches on Stonks Exchange"
        />
        <Stat
          label="Last 7 days"
          value={last7.toLocaleString("en-US")}
          note={
            prev7 === 0
              ? "vs 0 the week before"
              : `${last7 >= prev7 ? "+" : ""}${last7 - prev7} vs the week before`
          }
        />
        <Stat
          label="Pairs in use"
          value={byPair.filter((p) => p.key !== "other").length.toLocaleString("en-US")}
          note={byPair[0] ? `Most paired: ${byPair[0].label}` : "No launches yet"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Launches per day" subtitle="Last 30 days, UTC">
          <ColumnChart data={daily} valueLabel="launches" emptyText="No launches in the last 30 days" />
        </ChartCard>
        <ChartCard title="Launches by pair" subtitle={`Of the latest ${launches.length}`}>
          <BarChart data={byPair} valueLabel="launches" />
        </ChartCard>
      </section>

      {dropSeries.length > 0 ? (
        <section>
          <ChartCard title="AAPL airdropped per drop" subtitle="Sent to holders after each local drop">
            <ColumnChart data={dropSeries} valueLabel="AAPL" height={150} />
          </ChartCard>
        </section>
      ) : null}

      <LaunchFeed launches={launches} fresh={fresh} status={status} fetchedAt={fetchedAt} />
    </>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="glass flex flex-col gap-2 rounded-[16px] px-5 py-6">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="text-[32px] font-semibold leading-none tracking-[-0.03em] sm:text-[40px]">{value}</span>
      <span className="text-xs text-faint">{note}</span>
    </div>
  );
}

/* ---------- Launch feed ---------- */

function LaunchFeed({
  launches,
  fresh,
  status,
  fetchedAt,
}: {
  launches: PublicLaunch[];
  fresh: Set<number>;
  status: "live" | "stale";
  fetchedAt: string | null;
}) {
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
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold">Launched tokens</h2>
          <span className="flex items-center gap-2 text-xs text-faint">
            <span className="relative flex h-1.5 w-1.5">
              {status === "live" ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              ) : null}
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${status === "live" ? "bg-primary" : "bg-faint"}`}
              />
            </span>
            {status === "live"
              ? `Live · refreshes every ${POLL_MS / 1000}s${fetchedAt ? ` · updated ${timeAgo(fetchedAt) ?? "just now"}` : ""}`
              : "Couldn't reach the API · retrying"}
          </span>
        </div>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShown(PAGE);
          }}
          placeholder="Search name, ticker, pair, address"
          className="h-9 w-full rounded-full border border-border-strong bg-white/70 px-3.5 text-[13px] outline-none transition-colors focus:border-primary sm:w-[280px]"
        />
      </div>

      <div className="glass flex flex-col overflow-hidden rounded-[16px]">
        <div className="hidden grid-cols-[1fr_90px_150px_120px] gap-3 px-5 py-2.5 text-[11px] uppercase tracking-[0.06em] text-faint md:grid">
          <span>Token</span>
          <span>Pair</span>
          <span>Contract</span>
          <span className="text-right">Links</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-5 py-6 text-[13px] text-muted">
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
            className="border-t border-hairline px-5 py-3 text-[13px] font-medium text-primary transition-colors hover:bg-white/50"
          >
            Show {Math.min(PAGE, filtered.length - shown)} more · {filtered.length - shown} left
          </button>
        ) : null}
      </div>
    </section>
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
      className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 border-t border-hairline px-5 py-3.5 md:grid-cols-[1fr_90px_150px_120px]"
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

      <span className="order-3 font-mono text-[12.5px] text-foreground/80 md:order-none">
        {launch.pairSymbol ? `vs ${launch.pairSymbol}` : "·"}
      </span>

      <button
        type="button"
        onClick={copy}
        disabled={!addr}
        title={addr ?? undefined}
        className="order-4 inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-white/60 px-2.5 py-1 font-mono text-[12px] text-foreground/80 transition-colors hover:bg-white disabled:opacity-50 md:order-none"
      >
        {addr ? shortAddr(addr) : "pending"}
        {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3 text-faint" />}
      </button>

      <span className="order-2 flex items-center justify-end gap-3 text-[12.5px] md:order-none">
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
            className="hidden items-center gap-1 text-muted hover:text-foreground sm:inline-flex"
          >
            Tx <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </span>
    </motion.div>
  );
}
