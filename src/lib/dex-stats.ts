import { isAddress } from "@/lib/format";

/*
 * 24h market stats across every launched token, from DexScreener.
 * Batched 30 addresses per call; each batch is cached for a minute so the
 * dashboard poller (15s per viewer) never hammers DexScreener's rate limit.
 */

const BATCH = 30;
const FETCH_MS = 8_000;
const REVALIDATE_S = 60;

type DexPair = {
  baseToken?: { address?: string };
  quoteToken?: { address?: string };
  volume?: { h24?: number | null } | null;
  txns?: { h24?: { buys?: number; sells?: number } | null } | null;
  liquidity?: { usd?: number | null } | null;
};

export type TokenMarket = {
  address: string;
  volume24hUsd: number;
  trades24h: number;
  liquidityUsd: number;
};

export type MarketStats = {
  /** Sum of 24h USD volume across all launched tokens. */
  volume24hUsd: number;
  /** Buys + sells in the last 24h across all launched tokens. */
  trades24h: number;
  /** Launched tokens with any 24h volume. */
  activeTokens: number;
  /** Tokens DexScreener returned a pair for. */
  coveredTokens: number;
  /** Per-token rows, keyed by lowercase address. */
  byToken: Record<string, TokenMarket>;
};

async function fetchBatch(addresses: string[]): Promise<DexPair[]> {
  try {
    const res = await fetch(`https://api.dexscreener.com/tokens/v1/base/${addresses.join(",")}`, {
      headers: { accept: "application/json" },
      next: { revalidate: REVALIDATE_S },
      signal: AbortSignal.timeout(FETCH_MS),
    });
    if (!res.ok) return [];
    const body = (await res.json()) as unknown;
    return Array.isArray(body) ? (body as DexPair[]) : [];
  } catch {
    return [];
  }
}

export async function fetchMarketStats(addresses: Array<string | null | undefined>): Promise<MarketStats> {
  const unique = [...new Set(addresses.filter((a): a is string => !!a && isAddress(a)).map((a) => a.toLowerCase()))];
  const batches: string[][] = [];
  for (let i = 0; i < unique.length; i += BATCH) batches.push(unique.slice(i, i + BATCH));

  const pairs = (await Promise.all(batches.map(fetchBatch))).flat();
  const wanted = new Set(unique);
  const byToken: Record<string, TokenMarket> = {};

  // A token can have several pairs; sum volume + trades across them, keep the deepest liquidity.
  for (const pair of pairs) {
    const base = pair.baseToken?.address?.toLowerCase();
    const quote = pair.quoteToken?.address?.toLowerCase();
    // Our launched coins are always the base token; the quote is the stock / ETH it's paired to.
    const address = base && wanted.has(base) ? base : quote && wanted.has(quote) ? quote : null;
    if (!address) continue;
    const row = (byToken[address] ??= { address, volume24hUsd: 0, trades24h: 0, liquidityUsd: 0 });
    row.volume24hUsd += pair.volume?.h24 ?? 0;
    row.trades24h += (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0);
    row.liquidityUsd = Math.max(row.liquidityUsd, pair.liquidity?.usd ?? 0);
  }

  const rows = Object.values(byToken);
  return {
    volume24hUsd: rows.reduce((s, r) => s + r.volume24hUsd, 0),
    trades24h: rows.reduce((s, r) => s + r.trades24h, 0),
    activeTokens: rows.filter((r) => r.volume24hUsd > 0).length,
    coveredTokens: rows.length,
    byToken,
  };
}
