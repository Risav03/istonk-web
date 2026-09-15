import { isAddress } from "@/lib/format";

/*
 * 24h market stats across every launched token, from DexScreener.
 * Batched 30 addresses per call; each batch is cached for a minute so the
 * dashboard poller (15s per viewer) never hammers DexScreener's rate limit.
 * Token images prefer the Stonks Exchange index (the art used at launch).
 */

const BATCH = 30;
const FETCH_MS = 8_000;
const REVALIDATE_S = 60;
const STONKS_COINS_URL = "https://thestonks.exchange/api/coins";

type DexPair = {
  baseToken?: { address?: string };
  quoteToken?: { address?: string };
  volume?: { h24?: number | null } | null;
  txns?: { h24?: { buys?: number; sells?: number } | null } | null;
  liquidity?: { usd?: number | null } | null;
  info?: { imageUrl?: string | null } | null;
};

export type TokenMarket = {
  address: string;
  volume24hUsd: number;
  trades24h: number;
  liquidityUsd: number;
  imageUrl: string | null;
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

/** Pinata / HTTP image URLs from the Stonks coins index, keyed by lowercase token. */
async function fetchStonksImages(): Promise<Record<string, string>> {
  try {
    const res = await fetch(STONKS_COINS_URL, {
      headers: { accept: "application/json" },
      next: { revalidate: REVALIDATE_S },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return {};
    const body = (await res.json()) as { coins?: unknown };
    const coins = Array.isArray(body.coins) ? body.coins : [];
    const out: Record<string, string> = {};
    for (const item of coins) {
      if (!item || typeof item !== "object") continue;
      const row = item as { token?: unknown; image?: unknown };
      if (typeof row.token !== "string" || typeof row.image !== "string") continue;
      if (!/^https?:\/\//i.test(row.image)) continue;
      out[row.token.toLowerCase()] = row.image;
    }
    return out;
  } catch {
    return {};
  }
}

function emptyRow(address: string, imageUrl: string | null): TokenMarket {
  return { address, volume24hUsd: 0, trades24h: 0, liquidityUsd: 0, imageUrl };
}

export async function fetchMarketStats(addresses: Array<string | null | undefined>): Promise<MarketStats> {
  const unique = [...new Set(addresses.filter((a): a is string => !!a && isAddress(a)).map((a) => a.toLowerCase()))];
  const batches: string[][] = [];
  for (let i = 0; i < unique.length; i += BATCH) batches.push(unique.slice(i, i + BATCH));

  const [pairLists, images] = await Promise.all([Promise.all(batches.map(fetchBatch)), fetchStonksImages()]);
  const pairs = pairLists.flat();
  const wanted = new Set(unique);
  const byToken: Record<string, TokenMarket> = {};
  for (const address of unique) {
    byToken[address] = emptyRow(address, images[address] ?? null);
  }

  // A token can have several pairs; sum volume + trades across them, keep the deepest liquidity.
  for (const pair of pairs) {
    const base = pair.baseToken?.address?.toLowerCase();
    const quote = pair.quoteToken?.address?.toLowerCase();
    // Our launched coins are always the base token; the quote is the stock / ETH it's paired to.
    const address = base && wanted.has(base) ? base : quote && wanted.has(quote) ? quote : null;
    if (!address) continue;
    const row = (byToken[address] ??= emptyRow(address, images[address] ?? null));
    row.volume24hUsd += pair.volume?.h24 ?? 0;
    row.trades24h += (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0);
    const liq = pair.liquidity?.usd ?? 0;
    const img = pair.info?.imageUrl?.trim() || null;
    if (liq >= row.liquidityUsd) row.liquidityUsd = liq;
    if (!row.imageUrl && img) row.imageUrl = img;
  }

  const rows = Object.values(byToken);
  return {
    volume24hUsd: rows.reduce((s, r) => s + r.volume24hUsd, 0),
    trades24h: rows.reduce((s, r) => s + r.trades24h, 0),
    activeTokens: rows.filter((r) => r.volume24hUsd > 0).length,
    coveredTokens: rows.filter((r) => r.liquidityUsd > 0 || r.volume24hUsd > 0 || r.trades24h > 0).length,
    byToken,
  };
}
