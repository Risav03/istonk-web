"use client";

import { useId, useMemo, useState, type ReactNode } from "react";

/*
 * Small inline-SVG charts for the public dashboard.
 * One hue (primary blue) — every chart here compares magnitude, so identity colour
 * isn't needed. Marks: <=24px columns with 4px rounded caps, hairline solid grid,
 * text in text tokens, per-mark hover tooltip.
 */

const INK = "var(--foreground)";
const MUTED = "var(--muted)";
const FAINT = "var(--faint)";
const GRID = "rgba(20, 26, 70, 0.08)";
const BAR = "var(--primary)";
const BAR_DIM = "rgba(47, 91, 255, 0.28)";

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function ticks(max: number, count = 4): number[] {
  // Integer steps when the data is counts so the axis never reads 3.75.
  let steps = count;
  if (Number.isInteger(max)) {
    if (max <= count) steps = max;
    else steps = [4, 5, 3, 2].find((n) => max % n === 0) ?? count;
  }
  const out: number[] = [];
  for (let i = 0; i <= steps; i += 1) out.push((max / steps) * i);
  return out;
}

function fmt(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString("en-US");
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function ChartCard({
  title,
  subtitle,
  children,
  aside,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <figure className="glass flex flex-col gap-4 rounded-[16px] px-5 pb-4 pt-5">
      <figcaption className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{title}</span>
          {subtitle ? <span className="text-xs text-muted">{subtitle}</span> : null}
        </div>
        {aside}
      </figcaption>
      {children}
    </figure>
  );
}

function Tooltip({ x, y, w, children }: { x: number; y: number; w: number; children: ReactNode }) {
  // Flip to the left near the right edge so it never leaves the SVG.
  const flip = x > w - 140;
  return (
    <foreignObject x={flip ? x - 150 : x + 10} y={Math.max(0, y - 44)} width={140} height={44}>
      <div className="glass pointer-events-none inline-flex flex-col rounded-lg px-2.5 py-1.5 text-[11.5px] leading-tight">
        {children}
      </div>
    </foreignObject>
  );
}

/* ---------- Column chart (time series) ---------- */

export type ColumnDatum = { key: string; label: string; value: number; hint?: string };

export function ColumnChart({
  data,
  height = 180,
  valueLabel,
  emptyText = "No data yet",
}: {
  data: ColumnDatum[];
  height?: number;
  valueLabel: string;
  emptyText?: string;
}) {
  const uid = useId();
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = height;
  const pad = { top: 12, right: 8, bottom: 26, left: 34 };
  const iw = W - pad.left - pad.right;
  const ih = H - pad.top - pad.bottom;
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const n = Math.max(1, data.length);
  const slot = iw / n;
  const bw = Math.min(24, Math.max(3, slot - 2));
  const total = data.reduce((s, d) => s + d.value, 0);
  const peak = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? -1) ? i : best), 0);

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center text-[13px] text-muted">{emptyText}</div>
    );
  }

  // Label roughly every Nth column so the axis stays readable.
  const every = Math.max(1, Math.ceil(n / 6));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full select-none"
      role="img"
      aria-labelledby={`${uid}-t`}
      onMouseLeave={() => setHover(null)}
    >
      <title id={`${uid}-t`}>{`${valueLabel} over time`}</title>
      {ticks(max).map((t) => {
        const y = pad.top + ih - (t / max) * ih;
        return (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke={GRID} strokeWidth="1" />
            <text x={pad.left - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill={FAINT}>
              {fmt(t)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = pad.left + i * slot + (slot - bw) / 2;
        const h = (d.value / max) * ih;
        const y = pad.top + ih - h;
        const r = Math.min(4, bw / 2, h);
        const active = hover === i;
        const path =
          h <= 0
            ? ""
            : `M${x},${pad.top + ih} v${-(h - r)} a${r},${r} 0 0 1 ${r},${-r} h${bw - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - r} z`;
        return (
          <g key={d.key}>
            {/* hit target wider than the mark */}
            <rect
              x={pad.left + i * slot}
              y={pad.top}
              width={slot}
              height={ih}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
            {path ? <path d={path} fill={active || hover === null ? BAR : BAR_DIM} /> : null}
            {i % every === 0 || i === n - 1 ? (
              <text
                x={x + bw / 2}
                y={H - 8}
                textAnchor="middle"
                fontSize="10"
                fill={FAINT}
              >
                {d.label}
              </text>
            ) : null}
            {i === peak && d.value > 0 && hover === null ? (
              <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="10.5" fontWeight="600" fill={INK}>
                {fmt(d.value)}
              </text>
            ) : null}
          </g>
        );
      })}
      {hover !== null && data[hover] ? (
        <Tooltip
          x={pad.left + hover * slot + slot / 2}
          y={pad.top + ih - (data[hover].value / max) * ih}
          w={W}
        >
          <span style={{ color: MUTED }}>{data[hover].hint ?? data[hover].label}</span>
          <span style={{ color: INK, fontWeight: 600 }}>
            {fmt(data[hover].value)} {valueLabel}
          </span>
        </Tooltip>
      ) : null}
    </svg>
  );
}

/* ---------- Horizontal bar chart (ranked categories) ---------- */

export type BarDatum = { key: string; label: string; value: number };

export function BarChart({
  data,
  valueLabel,
  emptyText = "No data yet",
}: {
  data: BarDatum[];
  valueLabel: string;
  emptyText?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center text-[13px] text-muted">{emptyText}</div>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5" onMouseLeave={() => setHover(null)}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const share = total > 0 ? Math.round((d.value / total) * 100) : 0;
        const active = hover === i;
        return (
          <li
            key={d.key}
            className="grid grid-cols-[72px_1fr_auto] items-center gap-3"
            onMouseEnter={() => setHover(i)}
            title={`${d.label}: ${fmt(d.value)} ${valueLabel} (${share}%)`}
          >
            <span className="truncate font-mono text-[12px] text-foreground/80">{d.label}</span>
            <span className="relative h-[14px] w-full">
              <span
                className="absolute inset-y-0 left-0 rounded-r-[4px] transition-[width,background-color] duration-500"
                style={{
                  width: `${pct}%`,
                  background: active || hover === null ? BAR : BAR_DIM,
                }}
              />
            </span>
            <span className="w-16 text-right font-mono text-[12px] tabular text-muted">
              {fmt(d.value)}
              <span className="text-faint"> · {share}%</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- helpers for the dashboard ---------- */

export function useDailySeries(
  dates: Array<string | null>,
  days: number,
): ColumnDatum[] {
  return useMemo(() => {
    const now = new Date();
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const counts = new Map<string, number>();
    for (const iso of dates) {
      if (!iso) continue;
      const k = dayKey(new Date(iso));
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const out: ColumnDatum[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      const k = dayKey(d);
      out.push({
        key: k,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
        hint: d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }),
        value: counts.get(k) ?? 0,
      });
    }
    return out;
  }, [dates, days]);
}
