"use client";

import { TokenLogo } from "@/components/ui";

export function TokenAvatar({
  src,
  symbol,
  size = 20,
}: {
  src?: string | null;
  symbol: string;
  size?: number;
}) {
  return <TokenLogo src={src} symbol={symbol} size={size} />;
}
