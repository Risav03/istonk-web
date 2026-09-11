"use client";

import { formatEthAmount, formatTokenAmount, tinyDecimalParts } from "@/lib/format";

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
