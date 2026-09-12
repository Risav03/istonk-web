"use client";

import { formatEthAmount, formatTokenAmount, formatUsd, tinyDecimalParts } from "@/lib/format";

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

export function AmountWithUsd({
  value,
  usd,
  className,
  prefix = "",
  as = "token",
  usdClassName = "font-mono text-xs text-muted tabular",
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
      {usdLabel ? <span className={usdClassName}>{usdLabel}</span> : null}
    </span>
  );
}
