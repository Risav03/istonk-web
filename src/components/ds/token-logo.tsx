"use client";

import { useState, type CSSProperties } from "react";

export const ETH_LOGO_URL =
  "https://coin-images.coingecko.com/coins/images/279/small/ethereum.png";

export const USDC_LOGO_URL =
  "https://coin-images.coingecko.com/coins/images/6319/small/usdc.png";

function letters(symbol: string): string {
  return symbol.replace(/^\$/, "").slice(0, 3).toUpperCase();
}

/**
 * Asset mark. A squircle, not a circle — a token is an object you hold, and the
 * shape hierarchy reserves pills for conversation. Falls back to a tape-square
 * with the ticker's first letters rather than a generated pastel blob.
 */
export function TokenLogo({
  src,
  symbol = "",
  size = 32,
  style,
}: {
  src?: string | null;
  symbol?: string;
  size?: number;
  style?: CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "var(--r-sm)",
        overflow: "hidden",
        background: "var(--bg-sunk)",
        border: "1px solid var(--border-hairline)",
        font: "var(--type-mono-sm)",
        color: "var(--text-secondary)",
        flexShrink: 0,
        ...style,
      }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? undefined}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        letters(symbol)
      )}
    </span>
  );
}
