"use client";

import {
  formatEthAmount,
  formatTokenAmount,
  formatTokenCount,
  formatUsd,
  tinyDecimalParts,
} from "@/lib/format";

/** DexScreener-style 0.0ₙxxxx. Falls back to the plain token/ETH formatter. */
export function CompactDecimal({
  value,
  className,
  prefix = "",
  as = "token",
}: {
  value: number;
  className?: string;
  prefix?: string;
  as?: "token" | "eth";
}) {
  const parts = tinyDecimalParts(value);
  if (!parts) {
    return (
      <span className={className}>
        {prefix}
        {as === "eth" ? formatEthAmount(value) : formatTokenAmount(value)}
      </span>
    );
  }
  return (
    <span className={className} title={String(value)}>
      {prefix}
      {parts.sign}0.0
      <sub className="ds-sub">{parts.zeros}</sub>
      {parts.digits}
    </span>
  );
}

/**
 * Dollar value first, token count under it — the inverse of `AmountWithUsd`.
 * Balance lists answer "what is this worth", and a raw token count with six
 * leading zeros answers nothing. `usd` of null means we have no quote for the
 * token, which is not the same as it being worthless, so say so rather than
 * printing $0.00.
 */
export function UsdWithAmount({
  usd,
  value,
  symbol,
  prefix = "",
}: {
  usd: number | null;
  value: number;
  symbol: string;
  prefix?: string;
}) {
  const usdLabel = formatUsd(usd);
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <span className="istonk-tabular" style={{ font: "var(--type-label)" }}>
        {usdLabel ? `${prefix}${usdLabel}` : "No quote"}
      </span>
      <span className="type-mono-sm istonk-tabular" style={{ color: "var(--text-tertiary)" }}>
        {formatTokenCount(value)} {symbol}
      </span>
    </span>
  );
}

export function AmountWithUsd({
  value,
  usd,
  className,
  prefix = "",
  as = "token",
  usdClassName = "type-mono-sm",
}: {
  value: number;
  usd?: number | null;
  className?: string;
  prefix?: string;
  as?: "token" | "eth";
  usdClassName?: string;
}) {
  const usdLabel = formatUsd(usd);
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <CompactDecimal as={as} className={className} prefix={prefix} value={value} />
      {usdLabel ? (
        <span className={usdClassName} style={{ color: "var(--text-tertiary)" }}>
          {usdLabel}
        </span>
      ) : null}
    </span>
  );
}
