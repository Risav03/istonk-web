import { Fragment, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

import { Badge, Button, type BadgeState } from "./core";
import { TokenLogo } from "./token-logo";

/* ── Figure ──────────────────────────────────────────────
   A number that means money. Tabular always. */

type FigureSize = "hero" | "xl" | "lg" | "md" | "sm";
type FigureTone = "ink" | "up" | "down" | "muted";

const FIGURE_SIZES: Record<FigureSize, number> = {
  hero: 56,
  xl: 34,
  lg: 24,
  md: 17,
  sm: 14,
};

const FIGURE_TONES: Record<FigureTone, string> = {
  ink: "var(--text-primary)",
  up: "var(--up)",
  down: "var(--down)",
  muted: "var(--text-secondary)",
};

export function Figure({
  value,
  prefix = "",
  suffix,
  size = "hero",
  tone = "ink",
  mono = false,
  style,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & {
  value: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  size?: FigureSize;
  tone?: FigureTone;
  mono?: boolean;
}) {
  const px = FIGURE_SIZES[size] ?? FIGURE_SIZES.md;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: px > 30 ? 3 : 2,
        font: `500 ${px}px/1 ${mono ? "var(--font-mono)" : "var(--font-text)"}`,
        letterSpacing: px > 30 ? "var(--track-display)" : "var(--track-tight)",
        fontVariantNumeric: "var(--numeric-tabular)",
        color: FIGURE_TONES[tone],
        ...style,
      }}
      {...rest}
    >
      {prefix ? <span>{prefix}</span> : null}
      {value}
      {suffix ? (
        <span
          style={{
            marginLeft: 5,
            font: `500 ${Math.max(12, Math.round(px * 0.38))}px/1 var(--font-text)`,
            color: "var(--text-secondary)",
          }}
        >
          {suffix}
        </span>
      ) : null}
    </span>
  );
}

/* ── DataRow ─────────────────────────────────────────────
   A row on the trading floor: mark, name, note, value.
   Hairline above, never a box. */

export function DataRow({
  leading,
  title,
  note,
  value,
  meta,
  trailing,
  onClick,
  style,
  ...rest
}: Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  leading?: ReactNode;
  title: ReactNode;
  note?: ReactNode;
  value?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
}) {
  const interactive = typeof onClick === "function";
  return (
    <div
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        minHeight: 60,
        padding: "12px 20px",
        borderTop: "1px solid var(--border-hairline)",
        cursor: interactive ? "pointer" : "default",
        background: "transparent",
        ...style,
      }}
      {...rest}
    >
      {leading}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minWidth: 0,
          flex: 1,
        }}
      >
        <span
          style={{
            font: "var(--type-h3)",
            letterSpacing: "var(--track-tight)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </span>
        {note ? (
          <span
            style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
          >
            {note}
          </span>
        ) : null}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 2,
          flexShrink: 0,
        }}
      >
        {value}
        {meta ? (
          <span
            style={{
              font: "var(--type-body-sm)",
              color: "var(--text-tertiary)",
              fontVariantNumeric: "var(--numeric-tabular)",
            }}
          >
            {meta}
          </span>
        ) : null}
      </div>
      {trailing}
    </div>
  );
}

/* ── ClaimRow ────────────────────────────────────────────
   Creator fees waiting to be pulled in. The one row allowed to feel eager. */

export function ClaimRow({
  symbol,
  logoSrc,
  amount,
  usd,
  state = "pending",
  onClaim,
  claiming = false,
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  symbol: string;
  logoSrc?: string | null;
  amount: ReactNode;
  usd?: ReactNode;
  state?: BadgeState;
  onClaim?: () => void;
  claiming?: boolean;
}) {
  const ready = state === "pending";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 20px",
        borderTop: "1px solid var(--border-hairline)",
        background: ready
          ? "linear-gradient(90deg, var(--up-tint), transparent 60%)"
          : "transparent",
        ...style,
      }}
      {...rest}
    >
      <TokenLogo src={logoSrc} symbol={symbol} size={34} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          flex: 1,
          minWidth: 0,
        }}
      >
        <span style={{ font: "var(--type-h3)", letterSpacing: "var(--track-tight)" }}>
          {symbol}
        </span>
        <Badge state={state}>{ready ? "ready to collect" : undefined}</Badge>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 2,
        }}
      >
        <Figure
          value={amount}
          prefix="+"
          size="md"
          tone={ready ? "up" : "ink"}
          mono
        />
        {usd ? (
          <span
            style={{
              font: "var(--type-body-sm)",
              color: "var(--text-tertiary)",
              fontVariantNumeric: "var(--numeric-tabular)",
            }}
          >
            {usd}
          </span>
        ) : null}
      </div>
      {onClaim ? (
        <Button
          size="sm"
          variant={ready ? "primary" : "outline"}
          busy={claiming}
          disabled={!ready}
          onClick={onClaim}
        >
          {claiming ? "Collecting" : "Collect"}
        </Button>
      ) : null}
    </div>
  );
}

/* ── Receipt ─────────────────────────────────────────────
   The brand's core object. Money moved, here is the proof: squircle body,
   perforated top and bottom edge, mono values, one iris hairline when a
   launch is confirmed live. */

export type ReceiptRow = {
  label: ReactNode;
  value: ReactNode;
  mono?: boolean;
  tone?: "up" | "down";
};

export function Receipt({
  kicker,
  title,
  rows = [],
  total,
  footer,
  tone = "paper",
  accent = false,
  style,
  children,
  ...rest
}: Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  kicker?: ReactNode;
  title?: ReactNode;
  rows?: ReceiptRow[];
  total?: { label: ReactNode; value: ReactNode };
  footer?: ReactNode;
  tone?: "paper" | "night";
  accent?: boolean;
}) {
  const night = tone === "night";
  const perf = `repeating-linear-gradient(90deg, ${
    night ? "var(--night-rule)" : "var(--rule-strong)"
  } 0 6px, transparent 6px 12px)`;
  return (
    <div
      className={accent ? "istonk-iris-edge" : undefined}
      style={{
        position: "relative",
        background: night ? "var(--night-2)" : "var(--surface)",
        color: night ? "var(--night-ink)" : "var(--text-primary)",
        borderRadius: "var(--r-receipt)",
        boxShadow: night ? "var(--shadow-night)" : "var(--shadow-card)",
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      <div style={{ height: 6, background: perf }} />
      <div style={{ padding: "16px 18px 18px" }}>
        {kicker ? (
          <div
            style={{
              font: "var(--type-micro)",
              letterSpacing: "var(--track-caps)",
              textTransform: "uppercase",
              color: night ? "var(--night-slate)" : "var(--text-tertiary)",
              marginBottom: 8,
            }}
          >
            {kicker}
          </div>
        ) : null}
        {title ? (
          <div
            style={{
              font: "var(--type-h2)",
              letterSpacing: "var(--track-tight)",
              marginBottom: 14,
            }}
          >
            {title}
          </div>
        ) : null}
        {rows.length ? (
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "9px 16px",
              margin: 0,
            }}
          >
            {rows.map((r, i) => (
              <Fragment key={i}>
                <dt
                  style={{
                    font: "var(--type-body-sm)",
                    color: night ? "var(--night-slate)" : "var(--text-secondary)",
                  }}
                >
                  {r.label}
                </dt>
                <dd
                  style={{
                    margin: 0,
                    textAlign: "right",
                    font:
                      r.mono === false ? "var(--type-body-sm)" : "var(--type-mono)",
                    fontVariantNumeric: "var(--numeric-tabular)",
                    color:
                      r.tone === "up"
                        ? "var(--up)"
                        : r.tone === "down"
                          ? "var(--down)"
                          : "inherit",
                    wordBreak: "break-word",
                  }}
                >
                  {r.value}
                </dd>
              </Fragment>
            ))}
          </dl>
        ) : null}
        {children}
        {total ? (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginTop: 14,
              paddingTop: 13,
              borderTop: `1px solid ${
                night ? "var(--night-rule)" : "var(--border-hairline)"
              }`,
            }}
          >
            <span
              style={{
                font: "var(--type-label)",
                color: night ? "var(--night-slate)" : "var(--text-secondary)",
              }}
            >
              {total.label}
            </span>
            <span
              style={{
                font: "500 22px/1 var(--font-text)",
                letterSpacing: "var(--track-tight)",
                fontVariantNumeric: "var(--numeric-tabular)",
              }}
            >
              {total.value}
            </span>
          </div>
        ) : null}
        {footer ? (
          <div
            style={{
              marginTop: 12,
              font: "var(--type-legal)",
              color: night ? "var(--night-slate)" : "var(--text-tertiary)",
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
      <div style={{ height: 6, background: perf }} />
    </div>
  );
}

/* ── TickerTape ──────────────────────────────────────────
   Square, hairline-ruled, mono. Paused for reduced motion. */

export type TapeItem = { symbol: string; value?: string; change?: string };

export function TickerTape({
  items = [],
  speed = 42,
  tone = "paper",
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  items?: TapeItem[];
  speed?: number;
  tone?: "paper" | "night";
}) {
  const night = tone === "night";
  const loop = [...items, ...items];
  const rule = night ? "var(--night-rule)" : "var(--border-hairline)";
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: night ? "var(--night)" : "var(--surface)",
        borderTop: `1px solid ${rule}`,
        borderBottom: `1px solid ${rule}`,
        ...style,
      }}
      {...rest}
    >
      <div
        className="istonk-tape-track"
        style={
          {
            display: "flex",
            width: "max-content",
            "--tape-speed": `${speed}s`,
          } as CSSProperties
        }
      >
        {loop.map((it, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "0 18px",
              height: 40,
              borderRight: `1px solid ${rule}`,
              font: "var(--type-mono)",
              color: night ? "var(--night-ink)" : "var(--text-primary)",
              fontVariantNumeric: "var(--numeric-tabular)",
              whiteSpace: "nowrap",
            }}
          >
            <span>{it.symbol}</span>
            {it.value ? (
              <span
                style={{
                  color: night ? "var(--night-slate)" : "var(--text-secondary)",
                }}
              >
                {it.value}
              </span>
            ) : null}
            {it.change ? (
              <span
                style={{
                  color: String(it.change).trim().startsWith("-")
                    ? "var(--down)"
                    : "var(--up)",
                }}
              >
                {it.change}
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}
