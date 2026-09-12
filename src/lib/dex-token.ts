import { isAddress } from "@/lib/format";

const FETCH_MS = 8_000;

type DexPair = {
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; name?: string; symbol?: string };
  info?: { imageUrl?: string | null };
  liquidity?: { usd?: number | null } | null;
};

export type DexTokenMeta = {
  address: string;
  name: string;
  symbol: string;
  imageUrl: string | null;
};

function liquidityUsd(pair: DexPair): number {
  return pair.liquidity?.usd ?? 0;
}

function tokenFromPair(pair: DexPair, address: string): { name: string; symbol: string } | null {
  const lower = address.toLowerCase();
  const base = pair.baseToken?.address?.toLowerCase();
  const quote = pair.quoteToken?.address?.toLowerCase();
  const match =
    base === lower ? pair.baseToken : quote === lower ? pair.quoteToken : undefined;
  if (!match?.name && !match?.symbol) return null;
  return {
    name: match.name?.trim() || match.symbol?.trim() || "Token",
    symbol: match.symbol?.trim() || match.name?.trim() || "TOKEN",
  };
}

export async function fetchDexScreenerToken(address: string): Promise<DexTokenMeta | null> {
  if (!isAddress(address)) return null;
  const lower = address.toLowerCase();
  try {
    const res = await fetch(`https://api.dexscreener.com/tokens/v1/base/${lower}`, {
      headers: { accept: "application/json" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(FETCH_MS),
    });
    if (!res.ok) return null;
    const pairs = (await res.json()) as DexPair[];
    if (!Array.isArray(pairs) || pairs.length === 0) return null;
    const matching = pairs.filter(
      (pair) =>
        pair.baseToken?.address?.toLowerCase() === lower ||
        pair.quoteToken?.address?.toLowerCase() === lower,
    );
    if (matching.length === 0) return null;
    const best = matching.sort((a, b) => liquidityUsd(b) - liquidityUsd(a))[0]!;
    const token = tokenFromPair(best, lower);
    if (!token) return null;
    return {
      address: lower,
      name: token.name,
      symbol: token.symbol,
      imageUrl: best.info?.imageUrl ?? null,
    };
  } catch {
    return null;
  }
}
